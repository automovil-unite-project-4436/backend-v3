// src/core/domain/repositories/notification.repository.ts

import { Notification } from '../entities/notification.entity';
import { Rental } from '../entities/rental.entity';
import { Vehicle } from '../entities/vehicle.entity';

export interface NotificationRepository {
  create(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(
    userId: string,
    page?: number,
    limit?: number,
    onlyUnread?: boolean
  ): Promise<{ notifications: Notification[]; count: number; totalPages: number }>;
  update(notification: Notification): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  
  // Métodos para notificaciones automáticas
  findRentalsEndingSoon(): Promise<Rental[]>;
  findVehicleById(id: string): Promise<Vehicle | null>;
}