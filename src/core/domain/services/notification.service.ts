import { Injectable, Inject } from '@nestjs/common';

import { UserRepository } from '../../domain/repositories/user.repository';
import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { Notification } from '../../domain/entities/notification.entity';
import { EmailService } from '../../../infrastructure/emails/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('NotificationRepository')
    private readonly notificationRepository: NotificationRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async createNotification(userId: string, title: string, message: string, relatedId?: string): Promise<Notification> {
    // Buscar el usuario
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // Crear la notificación
    const notification = new Notification({
      id: uuidv4(),
      userId,
      title,
      message,
      relatedId,
      isRead: false,
      createdAt: new Date(),
    });
    
    // Guardar en la base de datos
    const savedNotification = await this.notificationRepository.create(notification);
    
    // Enviar email de notificación
    await this.emailService.sendNotificationEmail(user, title, message);
    
    return savedNotification;
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
    onlyUnread: boolean = false,
  ): Promise<{
    notifications: Notification[];
    count: number;
    totalPages: number;
  }> {
    return this.notificationRepository.findByUserId(userId, page, limit, onlyUnread);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }
    
    // Verificar que la notificación pertenece al usuario
    if (notification.userId !== userId) {
      throw new Error('No tienes permiso para acceder a esta notificación');
    }
    
    // Marcar como leída
    notification.isRead = true;
    
    return this.notificationRepository.update(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }
    
    // Verificar que la notificación pertenece al usuario
    if (notification.userId !== userId) {
      throw new Error('No tienes permiso para eliminar esta notificación');
    }
    
    await this.notificationRepository.delete(id);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }

  async sendReminderNotifications(): Promise<void> {
    // Este método sería ejecutado por un cron job
    // Aquí implementaríamos la lógica para enviar notificaciones recordatorias
    // Por ejemplo, recordatorios de devolución de vehículos, etc.
    
    // 1. Buscar alquileres activos que estén por vencer (en las próximas 24 horas)
    const activeRentals = await this.notificationRepository.findRentalsEndingSoon();
    
    // 2. Enviar notificaciones a los arrendatarios
    for (const rental of activeRentals) {
      const user = await this.userRepository.findById(rental.renterId);
      const vehicle = await this.notificationRepository.findVehicleById(rental.vehicleId);
      
      if (user && vehicle) {
        // Crear notificación en la base de datos
        await this.createNotification(
          user.id,
          'Recordatorio de devolución',
          `Tu alquiler del vehículo ${vehicle.brand} ${vehicle.model} termina mañana.`,
          rental.id,
        );
        
        // Enviar correo de recordatorio
        await this.emailService.sendRentalReturnReminderEmail(rental, user, vehicle);
      }
    }
  }
}