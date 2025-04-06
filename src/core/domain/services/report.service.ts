// src/core/application/services/report.service.ts

import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ReportRepository } from '../../domain/repositories/report.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RentalRepository } from '../../domain/repositories/rental.repository';
import { Report } from '../../domain/entities/report.entity';
import { ReportStatus } from '../../domain/enums/report-status.enum';
import { EmailService } from '../../../infrastructure/emails/email.service';

@Injectable()
export class ReportService {
  constructor(
    @Inject('ReportRepository')
    private readonly reportRepository: ReportRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('RentalRepository')
    private readonly rentalRepository: RentalRepository,
    private readonly emailService: EmailService,
  ) {}

  async createReport(data: {
    rentalId: string;
    renterId: string;
    ownerId: string;
    reason: string;
    description: string;
    severity: string;
  }): Promise<Report> {
    // Verificar si ya existe un reporte para este alquiler
    const existingReport = await this.reportRepository.getReportByRentalId(data.rentalId);
    
    if (existingReport) {
      throw new BadRequestException('Ya existe un reporte para este alquiler');
    }
    
    // Verificar si el alquiler existe
    const rental = await this.rentalRepository.findById(data.rentalId);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    // Crear el reporte
    const report = new Report({
      id: uuidv4(),
      rentalId: data.rentalId,
      renterId: data.renterId,
      ownerId: data.ownerId,
      reason: data.reason,
      description: data.description,
      severity: data.severity as any, // Cast necesario por el enum
      status: ReportStatus.PENDING,
      penaltyApplied: false,
    });
    
    const savedReport = await this.reportRepository.createReport(report);
    
    // Incrementar contador de reportes del arrendatario
    await this.userRepository.incrementReportCount(data.renterId);
    
    // Notificar al arrendatario
    const renter = await this.userRepository.findById(data.renterId);
    
    if (renter) {
      await this.emailService.sendNotificationEmail(
        renter,
        'Has sido reportado',
        `Has sido reportado por un reciente alquiler. Un administrador revisará el caso. Razón: ${data.reason}`,
      );
    }
    
    // Notificar a los administradores (en un caso real, se enviaría a una lista de administradores)
    // Esto es solo un ejemplo, en una implementación real se buscarían los usuarios con rol ADMIN
    const admins = await this.userRepository.findAdmins();
    
    if (admins.length > 0) {
      for (const admin of admins) {
        await this.emailService.sendNotificationEmail(
          admin,
          'Nuevo reporte para revisar',
          `Se ha creado un nuevo reporte que requiere revisión. ID del reporte: ${savedReport.id}`,
        );
      }
    }
    
    return savedReport;
  }

  async getReportByRentalId(rentalId: string): Promise<Report | null> {
    return this.reportRepository.getReportByRentalId(rentalId);
  }

  async getReportById(id: string): Promise<Report | null> {
    return this.reportRepository.getReportById(id);
  }

  async getReportsByOwnerId(
    ownerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    reports: Report[];
    count: number;
    totalPages: number;
  }> {
    return this.reportRepository.getReportsByOwnerId(ownerId, page, limit);
  }

  async getAllReports(
    status: string = '',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    reports: Report[];
    count: number;
    totalPages: number;
  }> {
    return this.reportRepository.getAllReports(status, page, limit);
  }

  async processReport(id: string, data: { 
    adminId: string; 
    resolution: string; 
    applyPenalty: boolean; 
  }): Promise<Report> {
    const report = await this.reportRepository.getReportById(id);
    
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }
    
    if (report.status !== ReportStatus.PENDING && report.status !== ReportStatus.IN_REVIEW) {
      throw new BadRequestException('Este reporte ya ha sido procesado');
    }
    
    const processedReport = await this.reportRepository.processReport(id, data);
    
    // Si se aplica penalización, bloquear al usuario
    if (data.applyPenalty) {
      const blockDays = 7; // Ejemplo: bloqueo por 7 días
      await this.userRepository.blockUser(report.renterId, blockDays);
      
      // Notificar al arrendatario
      const renter = await this.userRepository.findById(report.renterId);
      
      if (renter) {
        await this.emailService.sendNotificationEmail(
          renter,
          'Penalización aplicada',
          `Se ha procesado un reporte en tu contra y se ha aplicado una penalización. Tu cuenta ha sido bloqueada por ${blockDays} días. Resolución: ${data.resolution}`,
        );
      }
    } else {
      // Notificar al arrendatario sin penalización
      const renter = await this.userRepository.findById(report.renterId);
      
      if (renter) {
        await this.emailService.sendNotificationEmail(
          renter,
          'Reporte procesado',
          `Se ha procesado un reporte en tu contra. No se ha aplicado penalización. Resolución: ${data.resolution}`,
        );
      }
    }
    
    // Notificar al propietario
    const owner = await this.userRepository.findById(report.ownerId);
    
    if (owner) {
      await this.emailService.sendNotificationEmail(
        owner,
        'Reporte procesado',
        `Se ha procesado tu reporte. Resolución: ${data.resolution}. ${data.applyPenalty ? 'Se ha aplicado una penalización al arrendatario.' : 'No se ha aplicado penalización.'}`,
      );
    }
    
    return processedReport;
  }
}