import { ReportStatus } from '../enums/report-status.enum';
import { ReportSeverity } from '../enums/report-severity.enum';

export class Report {
  id: string;
  rentalId: string;
  renterId: string;
  ownerId: string;
  adminId?: string;
  reason: string;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  resolution?: string;
  penaltyApplied: boolean;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;

  constructor(partial: Partial<Report>) {
    Object.assign(this, partial);
    
    // Valores por defecto
    this.status = partial.status || ReportStatus.PENDING;
    this.penaltyApplied = partial.penaltyApplied || false;
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }

  public isPending(): boolean {
    return this.status === ReportStatus.PENDING;
  }

  public isInReview(): boolean {
    return this.status === ReportStatus.IN_REVIEW;
  }

  public isResolved(): boolean {
    return this.status === ReportStatus.RESOLVED;
  }

  public isDismissed(): boolean {
    return this.status === ReportStatus.DISMISSED;
  }

  public markAsInReview(adminId: string): void {
    this.status = ReportStatus.IN_REVIEW;
    this.adminId = adminId;
    this.updatedAt = new Date();
  }

  public resolve(adminId: string, resolution: string, applyPenalty: boolean): void {
    this.status = ReportStatus.RESOLVED;
    this.adminId = adminId;
    this.resolution = resolution;
    this.penaltyApplied = applyPenalty;
    this.processedAt = new Date();
    this.updatedAt = new Date();
  }

  public dismiss(adminId: string, resolution: string): void {
    this.status = ReportStatus.DISMISSED;
    this.adminId = adminId;
    this.resolution = resolution;
    this.penaltyApplied = false;
    this.processedAt = new Date();
    this.updatedAt = new Date();
  }
}