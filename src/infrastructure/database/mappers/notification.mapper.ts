import { Injectable } from '@nestjs/common';
import { Notification } from '../../../core/domain/entities/notification.entity';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationMapper {
  toDomain(entity: NotificationEntity): Notification {
    const notification = new Notification({
      id: entity.id,
      userId: entity.userId,
      title: entity.title,
      message: entity.message,
      relatedId: entity.relatedId,
      isRead: entity.isRead,
      createdAt: entity.createdAt,
    });
    
    return notification;
  }

  toPersistence(domain: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.title = domain.title;
    entity.message = domain.message;
    entity.relatedId = domain.relatedId;
    entity.isRead = domain.isRead;
    entity.createdAt = domain.createdAt;
    
    return entity;
  }
}