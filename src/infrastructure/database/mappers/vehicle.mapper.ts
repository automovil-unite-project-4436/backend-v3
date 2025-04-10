import { Injectable } from '@nestjs/common';
import { Vehicle } from '../../../core/domain/entities/vehicle.entity';
import { VehicleEntity } from '../entities/vehicle.entity';

@Injectable()
export class VehicleMapper {
  toDomain(entity: VehicleEntity): Vehicle {
    const vehicle = new Vehicle({
      id: entity.id,
      ownerId: entity.ownerId,
      brand: entity.brand,
      model: entity.model,
      year: entity.year,
      licensePlate: entity.licensePlate,
      color: entity.color,
      fuelType: entity.fuelType,
      transmission: entity.transmission,
      seats: entity.seats,
      dailyRate: Number(entity.dailyRate),
      description: entity.description,
      status: entity.status,
      isAvailable: entity.isAvailable,
      mainImageUrl: entity.mainImageUrl,
      additionalImagesUrls: entity.additionalImagesUrls || [],
      rating: Number(entity.rating),
      ratingCount: entity.ratingCount,
      rentalCount: entity.rentalCount,
      lastRentalEndDate: entity.lastRentalEndDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
    
    return vehicle;
  }

  toPersistence(domain: Vehicle): VehicleEntity {
    const entity = new VehicleEntity();
    
    entity.id = domain.id;
    entity.ownerId = domain.ownerId;
    entity.brand = domain.brand;
    entity.model = domain.model;
    entity.year = domain.year;
    entity.licensePlate = domain.licensePlate;
    entity.color = domain.color;
    entity.fuelType = domain.fuelType;
    entity.transmission = domain.transmission;
    entity.seats = domain.seats;
    entity.dailyRate = domain.dailyRate;
    entity.description = domain.description;
    entity.status = domain.status;
    entity.isAvailable = domain.isAvailable;
    entity.mainImageUrl = domain.mainImageUrl;
    entity.additionalImagesUrls = domain.additionalImagesUrls || [];
    entity.rating = domain.rating;
    entity.ratingCount = domain.ratingCount;
    entity.rentalCount = domain.rentalCount;
    entity.lastRentalEndDate = domain.lastRentalEndDate;
    
    // Estos campos se gestionan automáticamente por TypeORM si no se proporcionan
    if (domain.createdAt) {
      entity.createdAt = domain.createdAt;
    }
    
    if (domain.updatedAt) {
      entity.updatedAt = domain.updatedAt;
    }
    
    if (domain.deletedAt) {
      entity.deletedAt = domain.deletedAt;
    }
    
    return entity;
  }
}