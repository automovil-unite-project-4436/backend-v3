import { Injectable } from '@nestjs/common';
import { Review } from '../../../core/domain/entities/review.entity';
import { ReviewEntity } from '../entities/review.entity';

@Injectable()
export class ReviewMapper {
  toDomain(entity: ReviewEntity): Review {
    const review = new Review({
      id: entity.id,
      rentalId: entity.rentalId,
      type: entity.type,
      vehicleId: entity.vehicleId,
      renterId: entity.renterId,
      ownerId: entity.ownerId,
      rating: Number(entity.rating),
      comment: entity.comment,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    
    return review;
  }

  toPersistence(domain: Review): ReviewEntity {
    const entity = new ReviewEntity();
    
    entity.id = domain.id;
    entity.rentalId = domain.rentalId;
    entity.type = domain.type;
    entity.vehicleId = domain.vehicleId;
    entity.renterId = domain.renterId;
    entity.ownerId = domain.ownerId;
    entity.rating = domain.rating;
    entity.comment = domain.comment;
    
    // Estos campos se gestionan automáticamente por TypeORM si no se proporcionan
    if (domain.createdAt) {
      entity.createdAt = domain.createdAt;
    }
    
    if (domain.updatedAt) {
      entity.updatedAt = domain.updatedAt;
    }
    
    return entity;
  }
}