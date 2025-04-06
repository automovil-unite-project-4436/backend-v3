// src/infrastructure/database/entities/rental.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ReportEntity } from './report.entity';
import { ReviewEntity } from './review.entity';
import { UserEntity } from './user.entity';
import { VehicleEntity } from './vehicle.entity';
import { RentalStatus } from 'src/core/domain/enums/rental-status.enum';


@Entity('rentals')
export class RentalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ name: 'renter_id' })
  renterId: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column({ name: 'original_end_date' })
  originalEndDate: Date;

  @Column({ name: 'actual_return_date', nullable: true })
  actualReturnDate?: Date;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({
    name: 'discount_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercentage: number;

  @Column({
    name: 'additional_charge_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  additionalChargePercentage: number;

  @Column({ name: 'final_price', type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number;

  @Column({
    type: 'enum',
    enum: RentalStatus,
    default: RentalStatus.PENDING,
  })
  status: RentalStatus;

  @Column({ name: 'verification_code', length: 6 })
  verificationCode: string;

  @Column({ name: 'payment_verified', default: false })
  paymentVerified: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    name: 'counteroffer_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  counterofferAmount?: number;

  @Column({
    name: 'counteroffer_status',
    type: 'enum',
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    nullable: true,
  })
  counterofferStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';

  @Column({ name: 'is_late_return', default: false })
  isLateReturn: boolean;

  @Column({ name: 'rental_duration' })
  rentalDuration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.rentals)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @ManyToOne(() => UserEntity, (user) => user.rentalsAsRenter)
  @JoinColumn({ name: 'renter_id' })
  renter: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.rentalsAsOwner)
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @OneToOne(() => ReviewEntity, (review) => review.rental, { nullable: true })
  vehicleReview: ReviewEntity;

  @OneToOne(() => ReviewEntity, (review) => review.rentalForRenter, {
    nullable: true,
  })
  renterReview: ReviewEntity;

  @OneToOne(() => ReportEntity, (report) => report.rental, { nullable: true })
  report: ReportEntity;
}
