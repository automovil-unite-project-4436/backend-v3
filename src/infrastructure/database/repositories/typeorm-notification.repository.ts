// src/infrastructure/database/repositories/typeorm-notification.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { NotificationRepository } from '../../../core/domain/repositories/notification.repository';
import { Notification } from '../../../core/domain/entities/notification.entity';
import { Rental } from '../../../core/domain/entities/rental.entity';
import { Vehicle } from '../../../core/domain/entities/vehicle.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { RentalEntity } from '../entities/rental.entity';
import { VehicleEntity } from '../entities/vehicle.entity';
import { NotificationMapper } from '../mappers/notification.mapper';
import { RentalMapper } from '../mappers/rental.mapper';
import { VehicleMapper } from '../mappers/vehicle.mapper';
import { RentalStatus } from '../../../core/domain/enums/rental-status.enum';

@Injectable()
export class TypeOrmNotificationRepository implements NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(RentalEntity)
    private readonly rentalRepository: Repository<RentalEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    private readonly notificationMapper: NotificationMapper,
    private readonly rentalMapper: RentalMapper,
    private readonly vehicleMapper: VehicleMapper,
  ) {}

  async create(notification: Notification): Promise<Notification> {
    const notificationEntity = this.notificationMapper.toPersistence(notification);
    const savedEntity = await this.notificationRepository.save(notificationEntity);
    
    return this.notificationMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Notification | null> {
    const notificationEntity = await this.notificationRepository.findOne({ where: { id } });
    
    if (!notificationEntity) {
      return null;
    }
    
    return this.notificationMapper.toDomain(notificationEntity);
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
    onlyUnread: boolean = false,
  ): Promise<{ notifications: Notification[]; count: number; totalPages: number }> {
    const whereCondition: any = { userId };
    
    if (onlyUnread) {
      whereCondition.isRead = false;
    }
    
    const [notificationEntities, count] = await this.notificationRepository.findAndCount({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    
    const notifications = notificationEntities.map(entity => this.notificationMapper.toDomain(entity));
    const totalPages = Math.ceil(count / limit);
    
    return { notifications, count, totalPages };
  }

  async update(notification: Notification): Promise<Notification> {
    const notificationEntity = this.notificationMapper.toPersistence(notification);
    const updatedEntity = await this.notificationRepository.save(notificationEntity);
    
    return this.notificationMapper.toDomain(updatedEntity);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async findRentalsEndingSoon(): Promise<Rental[]> {
    // Calcular fechas para búsqueda
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Buscar alquileres activos que terminan en las próximas 24 horas
    const rentalEntities = await this.rentalRepository.find({
      where: {
        status: RentalStatus.ACTIVE,
        endDate: Between(now, tomorrow),
      },
      relations: ['renter', 'vehicle', 'owner'],
    });
    
    return rentalEntities.map(entity => this.rentalMapper.toDomain(entity));
  }

  async findVehicleById(id: string): Promise<Vehicle | null> {
    const vehicleEntity = await this.vehicleRepository.findOne({ where: { id } });
    
    if (!vehicleEntity) {
      return null;
    }
    
    return this.vehicleMapper.toDomain(vehicleEntity);
  }
}