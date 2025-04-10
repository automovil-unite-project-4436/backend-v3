import { Injectable } from '@nestjs/common';
import { Report } from '../../../core/domain/entities/report.entity';
import { ReportEntity } from '../entities/report.entity';

@Injectable()
export class ReportMapper {
  toDomain(entity: ReportEntity): Report {
    const report = new Report({
      id: entity.id,
      rentalId: entity.rentalId,
      renterId: entity.renterId,
      ownerId: entity.ownerId,
      adminId: entity.adminId,
      reason: entity.reason,
      description: entity.description,
      severity: entity.severity,
      status: entity.status,
      resolution: entity.resolution,
      penaltyApplied: entity.penaltyApplied,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      processedAt: entity.processedAt,
    });
    
    return report;
  }

  toPersistence(domain: Report): ReportEntity {
    const entity = new ReportEntity();
    
    entity.id = domain.id;
    entity.rentalId = domain.rentalId;
    entity.renterId = domain.renterId;
    entity.ownerId = domain.ownerId;
    entity.adminId = domain.adminId;
    entity.reason = domain.reason;
    entity.description = domain.description;
    entity.severity = domain.severity;
    entity.status = domain.status;
    entity.resolution = domain.resolution;
    entity.penaltyApplied = domain.penaltyApplied;
    entity.processedAt = domain.processedAt;
    
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