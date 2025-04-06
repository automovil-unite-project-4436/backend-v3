// src/infrastructure/emails/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '../../core/domain/entities/user.entity';
import { Rental } from '../../core/domain/entities/rental.entity';
import { Vehicle } from '../../core/domain/entities/vehicle.entity';
import { Review } from '../../core/domain/entities/review.entity';
import { Report } from '../../core/domain/entities/report.entity';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('email.service'),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
      secure: true,
    });
    
    
    this.from = this.configService.get<string>('email.from') as string;
  }

  async sendTwoFactorAuthCode(email: string, code: string): Promise<void> {
    const subject = 'Código de verificación - Car Rental App';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Código de verificación</h2>
        <p>Utiliza el siguiente código para verificar tu cuenta:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${code}
        </div>
        <p>Este código expirará en 5 minutos.</p>
        <p>Si no solicitaste este código, puedes ignorar este correo.</p>
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Correo enviado a ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Error al enviar correo a ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Recuperación de contraseña - Car Rental App';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recuperación de contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="${resetLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    const subject = 'Bienvenido a Car Rental App';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Bienvenido a Car Rental App, ${user.firstName}!</h2>
        <p>Gracias por registrarte en nuestra plataforma.</p>
        <p>Para completar tu perfil, no olvides subir los siguientes documentos:</p>
        <ul>
          <li>Foto de tu DNI</li>
          <li>Certificado de antecedentes penales</li>
          ${user.isRenter() ? '<li>Licencia de conducir</li>' : ''}
          <li>Foto de perfil</li>
        </ul>
        <p>Una vez verificada tu cuenta, podrás comenzar a ${user.isRenter() ? 'alquilar vehículos' : 'publicar tus vehículos para alquiler'}.</p>
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(user.email, subject, html);
  }

  async sendRentalPaymentReminderEmail(rental: Rental, renter: User, vehicle: Vehicle): Promise<void> {
    const subject = 'Recordatorio de pago - Car Rental App';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recordatorio de pago</h2>
        <p>Estimado/a ${renter.firstName},</p>
        <p>Te recordamos que tienes un alquiler pendiente por pagar:</p>
        
        <h3>Detalles del alquiler:</h3>
        <ul>
          <li><strong>Vehículo:</strong> ${vehicle.brand} ${vehicle.model} (${vehicle.year})</li>
          <li><strong>Fecha de inicio:</strong> ${rental.startDate.toLocaleDateString('es-PE')}</li>
          <li><strong>Fecha de fin:</strong> ${rental.endDate.toLocaleDateString('es-PE')}</li>
          <li><strong>Precio final:</strong> S/ ${rental.finalPrice.toFixed(2)}</li>
        </ul>
        
        <p>Por favor, coordina con el propietario para realizar el pago lo antes posible.</p>
        
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(renter.email, subject, html);
  }

  async sendRentalReturnReminderEmail(rental: Rental, renter: User, vehicle: Vehicle): Promise<void> {
    const subject = 'Recordatorio de devolución - Car Rental App';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recordatorio de devolución</h2>
        <p>Estimado/a ${renter.firstName},</p>
        <p>Te recordamos que el alquiler del vehículo ${vehicle.brand} ${vehicle.model} está por finalizar:</p>
        
        <h3>Detalles del alquiler:</h3>
        <ul>
          <li><strong>Fecha de fin:</strong> ${rental.endDate.toLocaleDateString('es-PE')} a las ${rental.endDate.toLocaleTimeString('es-PE')}</li>
        </ul>
        
        <p>Por favor, asegúrate de devolver el vehículo a tiempo para evitar cargos adicionales y restricciones en futuros alquileres.</p>
        
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(renter.email, subject, html);
  }

  async sendReviewRequestEmail(rental: Rental, renter: User, vehicle: Vehicle): Promise<void> {
    const subject = 'Valora tu experiencia - Car Rental App';
    const reviewLink = `${process.env.FRONTEND_URL}/rentals/${rental.id}/review`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Valora tu experiencia</h2>
        <p>Estimado/a ${renter.firstName},</p>
        <p>Esperamos que hayas disfrutado de tu alquiler del vehículo ${vehicle.brand} ${vehicle.model}.</p>
        <p>Nos encantaría conocer tu opinión sobre esta experiencia. Tu valoración ayuda a otros usuarios a tomar mejores decisiones.</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${reviewLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Dejar una reseña</a>
        </p>
        
        <p>Gracias por utilizar nuestra plataforma.</p>
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(renter.email, subject, html);
  }

  async sendNotificationEmail(user: User, title: string, message: string): Promise<void> {
    const subject = `${title} - Car Rental App`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        <p>Estimado/a ${user.firstName},</p>
        <p>${message}</p>
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(user.email, subject, html);
  }

  async sendRentalConfirmation(rental: Rental, renter: User, vehicle: Vehicle, owner: User): Promise<void> {
    const subject = 'Confirmación de Alquiler - Car Rental App';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Confirmación de Alquiler</h2>
        <p>Estimado/a ${renter.firstName},</p>
        <p>Tu solicitud de alquiler ha sido registrada correctamente.</p>
        
        <h3>Detalles del alquiler:</h3>
        <ul>
          <li><strong>Vehículo:</strong> ${vehicle.brand} ${vehicle.model} (${vehicle.year})</li>
          <li><strong>Placa:</strong> ${vehicle.licensePlate}</li>
          <li><strong>Fecha de inicio:</strong> ${rental.startDate.toLocaleDateString('es-PE')}</li>
          <li><strong>Fecha de fin:</strong> ${rental.endDate.toLocaleDateString('es-PE')}</li>
          <li><strong>Precio base:</strong> S/ ${rental.basePrice.toFixed(2)}</li>
          <li><strong>Precio final:</strong> S/ ${rental.finalPrice.toFixed(2)}</li>
        </ul>
        
        <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0;">
          <p><strong>Código de verificación del alquiler:</strong></p>
          <p style="font-size: 24px; text-align: center; letter-spacing: 5px;">${rental.verificationCode}</p>
          <p>Este código deberá ser proporcionado al dueño del vehículo al momento de recogerlo para confirmar el pago.</p>
        </div>
        
        <h3>Datos de contacto del propietario:</h3>
        <p><strong>Nombre:</strong> ${owner.firstName} ${owner.lastName}</p>
        <p><strong>Teléfono:</strong> ${owner.phoneNumber}</p>
        <p><strong>Email:</strong> ${owner.email}</p>
        
        <p>Recuerda que debes coordinar directamente con el propietario para el pago y la entrega del vehículo.</p>
        
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(renter.email, subject, html);
    
    // También enviar email al propietario
    const ownerSubject = 'Nueva solicitud de alquiler - Car Rental App';
    const ownerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nueva solicitud de alquiler</h2>
        <p>Estimado/a ${owner.firstName},</p>
        <p>Has recibido una nueva solicitud de alquiler para tu vehículo.</p>
        
        <h3>Detalles del alquiler:</h3>
        <ul>
          <li><strong>Vehículo:</strong> ${vehicle.brand} ${vehicle.model} (${vehicle.year})</li>
          <li><strong>Placa:</strong> ${vehicle.licensePlate}</li>
          <li><strong>Fecha de inicio:</strong> ${rental.startDate.toLocaleDateString('es-PE')}</li>
          <li><strong>Fecha de fin:</strong> ${rental.endDate.toLocaleDateString('es-PE')}</li>
          <li><strong>Precio base:</strong> S/ ${rental.basePrice.toFixed(2)}</li>
          <li><strong>Precio final:</strong> S/ ${rental.finalPrice.toFixed(2)}</li>
        </ul>
        
        <h3>Datos de contacto del arrendatario:</h3>
        <p><strong>Nombre:</strong> ${renter.firstName} ${renter.lastName}</p>
        <p><strong>Teléfono:</strong> ${renter.phoneNumber}</p>
        <p><strong>Email:</strong> ${renter.email}</p>
        
        <p>Recuerda solicitar el código de verificación al arrendatario al momento de entregar el vehículo para confirmar el pago.</p>
        
        <p>Saludos,<br>El equipo de Car Rental App</p>
      </div>
    `;
    
    await this.sendEmail(owner.email, ownerSubject, ownerHtml);
  }
}