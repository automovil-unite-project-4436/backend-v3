import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';


import { RegisterDto } from '../../core/application/dto/auth/register.dto';
import { LoginDto } from '../../core/application/dto/auth/login.dto';
import { VerifyTwoFactorDto } from '../../core/application/dto/auth/verify-two-factor.dto';
import { ResetPasswordDto } from '../../core/application/dto/auth/reset-password.dto';
import { ChangePasswordDto } from '../../core/application/dto/auth/change-password.dto';
import { TwoFactorAuthDto } from '../../core/application/dto/auth/two-factor-auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { AuthUser } from '../decorators/auth-user.decorator';
import { TwoFactorAuthService } from '../../infrastructure/security/two-factor-auth.service';
import { AuthService } from 'src/core/domain/services/auth.service';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuario registrado correctamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El email ya está registrado',
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);

    // Para seguridad, no devolvemos el código de verificación directamente
    // Solo devolvemos el ID del usuario para que sea utilizado en la verificación
    return {
      message:
        'Se ha enviado un código de verificación a tu correo electrónico',
      userId: result.userId,
      // Generamos un hash del código para verificar posteriormente
      hashedCode: this.twoFactorAuthService.hashVerificationCode(
        result.verificationCode,
        registerDto.email,
      ),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inicio de sesión exitoso',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    if (result.requiresTwoFactor) {
      // Si requiere 2FA, devolver información para la verificación
      return {
        message: 'Se requiere verificación de dos factores',
        requiresTwoFactor: true,
        userId: result.userId,
        hashedCode: this.twoFactorAuthService.hashVerificationCode(
          result.verificationCode!,
          loginDto.email,
        ),
      };
    }

    // Si no requiere 2FA, devolver tokens
    return {
      message: 'Inicio de sesión exitoso',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.userId,
    };
  }

  @Post('verify-two-factor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar código de autenticación de dos factores',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verificación exitosa' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Código inválido',
  })
  async verifyTwoFactor(@Body() verifyTwoFactorDto: VerifyTwoFactorDto) {
    const result = await this.authService.verifyTwoFactor(verifyTwoFactorDto);

    return {
      message: 'Verificación exitosa',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refrescado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
    },
  })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);

    return {
      message: 'Token refrescado exitosamente',
      accessToken: result.accessToken,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Solicitud procesada' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
      },
    },
  })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.requestPasswordReset(email);

    return {
      message:
        'Se ha enviado un correo con instrucciones para restablecer tu contraseña',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contraseña restablecida',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);

    return {
      message: 'Contraseña restablecida exitosamente',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña (usuario autenticado)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Contraseña cambiada' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Contraseña actual incorrecta',
  })
  async changePassword(
    @AuthUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, changePasswordDto);

    return {
      message: 'Contraseña cambiada exitosamente',
    };
  }

  @Get('setup-two-factor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configurar autenticación de dos factores' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información para configurar 2FA',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado',
  })
  async setupTwoFactor(@AuthUser('id') userId: string) {
    const result = await this.authService.setupTwoFactorAuth(userId);

    return {
      message: 'Escanea el código QR con tu aplicación de autenticación',
      qrCodeDataUrl: result.qrCodeDataUrl,
      secret: result.secret,
    };
  }

  @Post('enable-two-factor')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar autenticación de dos factores' })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA activado' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado o código inválido',
  })
  async enableTwoFactor(
    @AuthUser('id') userId: string,
    @Body() twoFactorAuthDto: TwoFactorAuthDto,
  ) {
    await this.authService.enableTwoFactorAuth(userId, twoFactorAuthDto.token);

    return {
      message: 'Autenticación de dos factores activada correctamente',
    };
  }

  @Post('disable-two-factor')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar autenticación de dos factores' })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA desactivado' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado o código inválido',
  })
  async disableTwoFactor(
    @AuthUser('id') userId: string,
    @Body() twoFactorAuthDto: TwoFactorAuthDto,
  ) {
    await this.authService.disableTwoFactorAuth(userId, twoFactorAuthDto.token);

    return {
      message: 'Autenticación de dos factores desactivada correctamente',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información del usuario',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado',
  })
  getProfile(@AuthUser() user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }
}
