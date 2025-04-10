import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../../core/domain/enums/user-role.enum';
import { UserStatus } from '../../../core/domain/enums/user-status.enum';
import { VehicleEntity } from './vehicle.entity';
import { RentalEntity } from './rental.entity';
import { ReviewEntity } from './review.entity';
import { ReportEntity } from './report.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 100 })
  password: string;

  @Column({ name: 'first_name', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', length: 50 })
  lastName: string;

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.RENTER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ name: 'document_image_url', nullable: true })
  documentImageUrl?: string;

  @Column({ name: 'criminal_record_image_url', nullable: true })
  criminalRecordImageUrl?: string;

  @Column({ name: 'profile_image_url', nullable: true })
  profileImageUrl?: string;

  @Column({ name: 'driver_license_image_url', nullable: true })
  driverLicenseImageUrl?: string;

  @Column({ name: 'two_factor_auth_secret', nullable: true })
  twoFactorAuthSecret?: string;

  @Column({ name: 'two_factor_auth_enabled', default: false })
  twoFactorAuthEnabled: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 5.0 })
  rating: number;

  @Column({ name: 'report_count', default: 0 })
  reportCount: number;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'blocked_until', nullable: true })
  blockedUntil?: Date;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // Relaciones
  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.owner)
  vehicles: VehicleEntity[];

  @OneToMany(() => RentalEntity, (rental) => rental.renter)
  rentalsAsRenter: RentalEntity[];

  @OneToMany(() => RentalEntity, (rental) => rental.owner)
  rentalsAsOwner: RentalEntity[];

  @OneToMany(() => ReviewEntity, (review) => review.renter)
  reviewsAsRenter: ReviewEntity[];

  @OneToMany(() => ReviewEntity, (review) => review.owner)
  reviewsAsOwner: ReviewEntity[];

  @OneToMany(() => ReportEntity, (report) => report.renter)
  reportsAsRenter: ReportEntity[];

  @OneToMany(() => ReportEntity, (report) => report.owner)
  reportsAsOwner: ReportEntity[];
}
