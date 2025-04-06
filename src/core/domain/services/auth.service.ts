// src/core/application/services/auth.service.ts

import { Injectable, Logger, UnauthorizedException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { UserRepository } from '../../domain/repositories/user.repository';
import { EmailService } from '../../../infrastructure/emails/email.service';
import { TwoFactorAuthService } from '../../../infrastructure/security/two-factor-auth.service';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { ChangePasswordDto } from 'src/core/application/dto/auth/change-password.dto';
import { LoginDto } from 'src/core/application/dto/auth/login.dto';
import { RegisterDto } from 'src/core/application/dto/auth/register.dto';
import { ResetPasswordDto } from 'src/core/application/dto/auth/reset-password.dto';
import { VerifyTwoFactorDto } from 'src/core/application/dto/auth/verify-two-factor.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly bcryptSaltRounds: number;

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {
    this.bcryptSaltRounds = this.configService.get<number>('security.bcryptSaltRounds') || 10;
  }

  // El resto del código del servicio se mantiene igual...
  
  /**
   * Registra un nuevo usuario
   */
  async register(registerDto: RegisterDto): Promise<{ userId: string; verificationCode: string }> {
    // Verificar si ya existe un usuario con el mismo correo
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, this.bcryptSaltRounds);
    
    // Crear el nuevo usuario
    const newUser = new User({
      id: uuidv4(),
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phoneNumber,
      role: registerDto.role || UserRole.RENTER, // Por defecto, es un arrendatario
      status: UserStatus.PENDING_VERIFICATION,
      twoFactorAuthEnabled: false,
    });
    
    // Generar código de verificación para enviar por email
    const verificationCode = await this.twoFactorAuthService.sendVerificationCode(registerDto.email);
    
    // Guardar el usuario en la base de datos
    await this.userRepository.create(newUser);
    
    // Enviar correo de bienvenida
    await this.emailService.sendWelcomeEmail(newUser);
    
    return { 
      userId: newUser.id,
      verificationCode 
    };
  }

  /**
   * Inicia sesión de un usuario
   */
  async login(loginDto: LoginDto): Promise<{ 
    accessToken?: string; 
    refreshToken?: string; 
    requiresTwoFactor: boolean;
    userId: string;
    verificationCode?: string;
  }> {
    // Buscar el usuario por email
    const user = await this.userRepository.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    // Verificar si la cuenta está bloqueada
    if (user.isBlocked) {
      if (user.blockedUntil && user.blockedUntil > new Date()) {
        throw new UnauthorizedException(`Cuenta bloqueada hasta ${user.blockedUntil.toLocaleString('es-PE')}`);
      } else {
        // Si ya pasó la fecha de bloqueo, desbloqueamos la cuenta
        user.unblock();
        await this.userRepository.update(user);
      }
    }
    
    // Si tiene habilitado 2FA, enviar código de verificación
    if (user.twoFactorAuthEnabled) {
      const verificationCode = await this.twoFactorAuthService.sendVerificationCode(user.email);
      
      // Actualizar la fecha de último login
      user.lastLoginAt = new Date();
      await this.userRepository.update(user);
      
      return {
        requiresTwoFactor: true,
        userId: user.id,
        verificationCode,
      };
    }
    
    // Si no tiene 2FA, generar tokens directamente
    const tokens = this.generateTokens(user, false);
    
    // Actualizar la fecha de último login
    user.lastLoginAt = new Date();
    await this.userRepository.update(user);
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      requiresTwoFactor: false,
      userId: user.id,
    };
  }

  /**
   * Verifica el código de dos factores
   */
  async verifyTwoFactor(verifyTwoFactorDto: VerifyTwoFactorDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findById(verifyTwoFactorDto.userId);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    // Verificar el código 2FA
    const isCodeValid = this.twoFactorAuthService.verifyEmailCode(
      verifyTwoFactorDto.code,
      verifyTwoFactorDto.hashedCode,
      user.email,
    );
    
    if (!isCodeValid) {
      throw new UnauthorizedException('Código de verificación inválido');
    }
    
    // Generar tokens con 2FA completado
    return this.generateTokens(user, true);
  }

  /**
   * Genera tokens JWT para autenticación
   */
  private generateTokens(user: User, isTwoFactorAuthenticated: boolean): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      isTwoFactorAuthenticated,
    };
    
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    };
  }

  /**
   * Refresca el token de acceso
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verificar y decodificar el token de refresco
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      }) as JwtPayload;
      
      // Buscar el usuario
      const user = await this.userRepository.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('Usuario no válido');
      }
      
      // Generar nuevo token de acceso
      const accessToken = this.jwtService.sign(
        {
          email: user.email,
          sub: user.id,
          role: user.role,
          isTwoFactorAuthenticated: payload.isTwoFactorAuthenticated,
        },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: this.configService.get<string>('jwt.expiresIn'),
        },
      );
      
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }

  /**
   * Solicita un restablecimiento de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    
    // Aunque el usuario no exista, no revelamos esto por seguridad
    if (!user) {
      return;
    }
    
    // Generar token de restablecimiento (válido por 1 hora)
    const resetToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: '1h',
      },
    );
    
    // Enviar correo con instrucciones
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * Restablece la contraseña de un usuario
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      // Verificar y decodificar el token
      const payload = this.jwtService.verify(resetPasswordDto.token, {
        secret: this.configService.get<string>('jwt.secret'),
      }) as { sub: string };
      
      // Buscar el usuario
      const user = await this.userRepository.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('Token no válido');
      }
      
      // Actualizar contraseña
      user.password = await bcrypt.hash(resetPasswordDto.newPassword, this.bcryptSaltRounds);
      await this.userRepository.update(user);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Cambia la contraseña de un usuario autenticado
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }
    
    // Actualizar contraseña
    user.password = await bcrypt.hash(changePasswordDto.newPassword, this.bcryptSaltRounds);
    await this.userRepository.update(user);
  }

  /**
   * Configura la autenticación de dos factores para un usuario
   */
  async setupTwoFactorAuth(userId: string): Promise<{ secret: string; qrCodeDataUrl: string }> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    // Generar secreto y QR para 2FA
    const { secret, qrCodeDataUrl } = await this.twoFactorAuthService.generateSecret(user.email);
    
    // Guardar el secreto en el usuario (pero aún no habilitamos 2FA)
    user.twoFactorAuthSecret = secret;
    await this.userRepository.update(user);
    
    return { secret, qrCodeDataUrl };
  }

  /**
   * Activa la autenticación de dos factores para un usuario
   */
  async enableTwoFactorAuth(userId: string, token: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user || !user.twoFactorAuthSecret) {
      throw new UnauthorizedException('Usuario no encontrado o 2FA no configurado');
    }
    
    // Verificar el token proporcionado
    const isTokenValid = this.twoFactorAuthService.verifyToken(token, user.twoFactorAuthSecret);
    
    if (!isTokenValid) {
      throw new UnauthorizedException('Código inválido');
    }
    
    // Activar 2FA para el usuario
    user.twoFactorAuthEnabled = true;
    await this.userRepository.update(user);
  }

  /**
   * Desactiva la autenticación de dos factores para un usuario
   */
  async disableTwoFactorAuth(userId: string, token: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user || !user.twoFactorAuthSecret || !user.twoFactorAuthEnabled) {
      throw new UnauthorizedException('Usuario no encontrado o 2FA no habilitado');
    }
    
    // Verificar el token proporcionado
    const isTokenValid = this.twoFactorAuthService.verifyToken(token, user.twoFactorAuthSecret);
    
    if (!isTokenValid) {
      throw new UnauthorizedException('Código inválido');
    }
    
    // Desactivar 2FA para el usuario
    user.twoFactorAuthEnabled = false;
    await this.userRepository.update(user);
  }
}