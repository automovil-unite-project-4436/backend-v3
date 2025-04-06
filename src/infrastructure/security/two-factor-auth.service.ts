// src/infrastructure/security/two-factor-auth.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { EmailService } from '../emails/email.service';

@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);
  private readonly appName: string;
  private readonly expiresIn: number; // Tiempo de expiración en segundos

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.appName = this.configService.get<string>('twoFactorAuth.appName') || 'Automovil-Unite';
    this.expiresIn = this.configService.get<number>('twoFactorAuth.expiresIn') || 300; // 5 minutos por defecto
  }

  /**
   * Genera un secreto para la autenticación de dos factores
   */
  async generateSecret(userEmail: string): Promise<{ secret: string; otpAuthUrl: string; qrCodeDataUrl: string }> {
    try {
      // Generar un secreto para el usuario
      const secretResult = speakeasy.generateSecret({
        name: `${this.appName}:${userEmail}`,
        issuer: this.appName,
      });

      // Generar URL para la aplicación de autenticación
      const otpAuthUrl = secretResult.otpauth_url;
      
      // Generar código QR para facilitar la configuración
      const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
      
      return {
        secret: secretResult.base32, // Guardar este valor en la base de datos
        otpAuthUrl,
        qrCodeDataUrl,
      };
    } catch (error) {
      this.logger.error(`Error al generar secreto 2FA: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verifica un token de autenticación de dos factores
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      // Verificar el token con el secreto almacenado
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // Permite una ventana de tiempo pequeña (30 segundos adicionales)
      });
    } catch (error) {
      this.logger.error(`Error al verificar token 2FA: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Genera un código de verificación para enviar por email
   */
  generateEmailCode(): string {
    // Generar un código numérico de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Envía un código de verificación al email del usuario
   */
  async sendVerificationCode(email: string): Promise<string> {
    try {
      const code = this.generateEmailCode();
      
      // Enviar el código al email del usuario
      await this.emailService.sendTwoFactorAuthCode(email, code);
      
      return code;
    } catch (error) {
      this.logger.error(`Error al enviar código de verificación: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Crea un hash para almacenar temporalmente el código de verificación
   * (para no almacenarlo en texto plano)
   */
  hashVerificationCode(code: string, email: string): string {
    return speakeasy.hotp({
      secret: `${code}-${email}-${this.configService.get('jwt.secret')}`,
      counter: 0,
      encoding: 'ascii',
    });
  }

  /**
   * Verifica un código de verificación usando su hash
   */
  verifyEmailCode(inputCode: string, hashedCode: string, email: string): boolean {
    const generatedHash = this.hashVerificationCode(inputCode, email);
    return generatedHash === hashedCode;
  }
}