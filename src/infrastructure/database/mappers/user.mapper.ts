// src/infrastructure/database/mappers/user.mapper.ts

import { Injectable } from '@nestjs/common';
import { User } from '../../../core/domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserMapper {
  toDomain(entity: UserEntity): User {
    const user = new User({
      id: entity.id,
      email: entity.email,
      password: entity.password,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phoneNumber: entity.phoneNumber,
      role: entity.role,
      status: entity.status,
      documentImageUrl: entity.documentImageUrl,
      criminalRecordImageUrl: entity.criminalRecordImageUrl,
      profileImageUrl: entity.profileImageUrl,
      driverLicenseImageUrl: entity.driverLicenseImageUrl,
      twoFactorAuthSecret: entity.twoFactorAuthSecret,
      twoFactorAuthEnabled: entity.twoFactorAuthEnabled,
      rating: entity.rating,
      reportCount: entity.reportCount,
      isBlocked: entity.isBlocked,
      blockedUntil: entity.blockedUntil,
      lastLoginAt: entity.lastLoginAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
    
    return user;
  }

  toPersistence(domain: User): UserEntity {
    const entity = new UserEntity();
    
    entity.id = domain.id;
    entity.email = domain.email;
    entity.password = domain.password;
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    entity.phoneNumber = domain.phoneNumber;
    entity.role = domain.role;
    entity.status = domain.status;
    entity.documentImageUrl = domain.documentImageUrl;
    entity.criminalRecordImageUrl = domain.criminalRecordImageUrl;
    entity.profileImageUrl = domain.profileImageUrl;
    entity.driverLicenseImageUrl = domain.driverLicenseImageUrl;
    entity.twoFactorAuthSecret = domain.twoFactorAuthSecret;
    entity.twoFactorAuthEnabled = domain.twoFactorAuthEnabled;
    entity.rating = domain.rating;
    entity.reportCount = domain.reportCount;
    entity.isBlocked = domain.isBlocked;
    entity.blockedUntil = domain.blockedUntil;
    entity.lastLoginAt = domain.lastLoginAt;
    
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