import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ReportStatus } from '../../../core/domain/enums/report-status.enum';
import { ReportSeverity } from '../../../core/domain/enums/report-severity.enum';
import { UserEntity } from './user.entity';
import { RentalEntity } from './rental.entity';

@Entity('reports')
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rental_id' })
  rentalId: string;

  @Column({ name: 'renter_id' })
  renterId: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'admin_id', nullable: true })
  adminId?: string;

  @Column({ length: 100 })
  reason: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportSeverity,
    default: ReportSeverity.MEDIUM,
  })
  severity: ReportSeverity;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ name: 'resolution', type: 'text', nullable: true })
  resolution?: string;

  @Column({ name: 'penalty_applied', default: false })
  penaltyApplied: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt?: Date;

  // Relaciones
  @OneToOne(() => RentalEntity, (rental) => rental.report)
  @JoinColumn({ name: 'rental_id' })
  rental: RentalEntity;

  @ManyToOne(() => UserEntity, (user) => user.reportsAsRenter)
  @JoinColumn({ name: 'renter_id' })
  renter: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.reportsAsOwner)
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin?: UserEntity;
}
