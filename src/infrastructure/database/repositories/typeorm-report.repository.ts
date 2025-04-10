import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportRepository } from '../../../core/domain/repositories/report.repository';
import { Report } from '../../../core/domain/entities/report.entity';
import { ReportEntity } from '../entities/report.entity';
import { ReportMapper } from '../mappers/report.mapper';
import { ReportStatus } from '../../../core/domain/enums/report-status.enum';

@Injectable()
export class TypeOrmReportRepository implements ReportRepository {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
    private readonly reportMapper: ReportMapper,
  ) {}

  async getReportByRentalId(rentalId: string): Promise<Report | null> {
    const reportEntity = await this.reportRepository.findOne({ 
      where: { rentalId },
      relations: ['rental', 'renter', 'owner', 'admin'],
    });
    
    if (!reportEntity) {
      return null;
    }
    
    return this.reportMapper.toDomain(reportEntity);
  }

  async getReportsByOwnerId(
    ownerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: Report[]; count: number; totalPages: number }> {
    const [reportEntities, count] = await this.reportRepository.findAndCount({
      where: { ownerId },
      relations: ['rental', 'renter', 'owner', 'admin'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    
    const reports = reportEntities.map(entity => this.reportMapper.toDomain(entity));
    const totalPages = Math.ceil(count / limit);
    
    return { reports, count, totalPages };
  }

  async getAllReports(
    status: string = '',
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: Report[]; count: number; totalPages: number }> {
    const query = this.reportRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.rental', 'rental')
      .leftJoinAndSelect('report.renter', 'renter')
      .leftJoinAndSelect('report.owner', 'owner')
      .leftJoinAndSelect('report.admin', 'admin');
    
    if (status) {
      query.where('report.status = :status', { status });
    }
    
    query.skip((page - 1) * limit)
      .take(limit)
      .orderBy('report.createdAt', 'DESC');
    
    const [reportEntities, count] = await query.getManyAndCount();
    
    const reports = reportEntities.map(entity => this.reportMapper.toDomain(entity));
    const totalPages = Math.ceil(count / limit);
    
    return { reports, count, totalPages };
  }

  async createReport(report: Report): Promise<Report> {
    const reportEntity = this.reportMapper.toPersistence(report);
    const savedEntity = await this.reportRepository.save(reportEntity);
    
    return this.reportMapper.toDomain(savedEntity);
  }

  async getReportById(id: string): Promise<Report | null> {
    const reportEntity = await this.reportRepository.findOne({ 
      where: { id },
      relations: ['rental', 'renter', 'owner', 'admin'],
    });
    
    if (!reportEntity) {
      return null;
    }
    
    return this.reportMapper.toDomain(reportEntity);
  }

  async processReport(id: string, data: { 
    adminId: string; 
    resolution: string; 
    applyPenalty: boolean; 
  }): Promise<Report> {
    const report = await this.getReportById(id);
    
    if (!report) {
      throw new NotFoundException(`Reporte con ID ${id} no encontrado`);
    }
    
    report.status = ReportStatus.RESOLVED;
    report.adminId = data.adminId;
    report.resolution = data.resolution;
    report.penaltyApplied = data.applyPenalty;
    report.processedAt = new Date();
    
    const reportEntity = this.reportMapper.toPersistence(report);
    const updatedEntity = await this.reportRepository.save(reportEntity);
    
    return this.reportMapper.toDomain(updatedEntity);
  }

  async update(report: Report): Promise<Report> {
    const reportEntity = this.reportMapper.toPersistence(report);
    const updatedEntity = await this.reportRepository.save(reportEntity);
    
    return this.reportMapper.toDomain(updatedEntity);
  }
}