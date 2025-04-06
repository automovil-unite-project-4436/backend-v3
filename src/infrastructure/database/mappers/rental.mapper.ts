// src/infrastructure/database/mappers/rental.mapper.ts

import { Injectable } from '@nestjs/common';
import { Rental } from '../../../core/domain/entities/rental.entity';
import { RentalEntity } from '../entities/rental.entity';

@Injectable()
export class RentalMapper {
  toDomain(entity: RentalEntity): Rental {
    const rental = new Rental({
      id: entity.id,
      vehicleId: entity.vehicleId,
      renterId: entity.renterId,
      ownerId: entity.ownerId,
      startDate: entity.startDate,
      endDate: entity.endDate,
      originalEndDate: entity.originalEndDate,
      actualReturnDate: entity.actualReturnDate,
      basePrice: Number(entity.basePrice),
      discountPercentage: Number(entity.discountPercentage),
      additionalChargePercentage: Number(entity.additionalChargePercentage),
      finalPrice: Number(entity.finalPrice),
      status: entity.status,
      verificationCode: entity.verificationCode,
      paymentVerified: entity.paymentVerified,
      notes: entity.notes,
      counterofferAmount: entity.counterofferAmount ? Number(entity.counterofferAmount) : undefined,
      counterofferStatus: entity.counterofferStatus,
      isLateReturn: entity.isLateReturn,
      rentalDuration: entity.rentalDuration,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    
    return rental;
  }

  toPersistence(domain: Rental): RentalEntity {
    const entity = new RentalEntity();
    
    entity.id = domain.id;
    entity.vehicleId = domain.vehicleId;
    entity.renterId = domain.renterId;
    entity.ownerId = domain.ownerId;
    entity.startDate = domain.startDate;
    entity.endDate = domain.endDate;
    entity.originalEndDate = domain.originalEndDate;
    entity.actualReturnDate = domain.actualReturnDate;
    entity.basePrice = domain.basePrice;
    entity.discountPercentage = domain.discountPercentage;
    entity.additionalChargePercentage = domain.additionalChargePercentage;
    entity.finalPrice = domain.finalPrice;
    entity.status = domain.status;
    entity.verificationCode = domain.verificationCode;
    entity.paymentVerified = domain.paymentVerified;
    entity.notes = domain.notes;
    entity.counterofferAmount = domain.counterofferAmount;
    entity.counterofferStatus = domain.counterofferStatus;
    entity.isLateReturn = domain.isLateReturn;
    entity.rentalDuration = domain.rentalDuration;
    
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