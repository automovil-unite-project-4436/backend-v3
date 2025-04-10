import { Report } from '../entities/report.entity';

export interface ReportRepository {
  getReportByRentalId(rentalId: string): Promise<Report | null>;
  getReportsByOwnerId(
    ownerId: string,
    page?: number,
    limit?: number
  ): Promise<{ reports: Report[]; count: number; totalPages: number }>;
  getAllReports(
    status?: string,
    page?: number,
    limit?: number
  ): Promise<{ reports: Report[]; count: number; totalPages: number }>;
  createReport(report: Report): Promise<Report>;
  getReportById(id: string): Promise<Report | null>;
  processReport(id: string, data: { 
    adminId: string; 
    resolution: string; 
    applyPenalty: boolean; 
  }): Promise<Report>;
  update(report: Report): Promise<Report>;
}