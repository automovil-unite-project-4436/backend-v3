// src/infrastructure/database/entities/vehicle.entity.ts

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { VehicleStatus } from '../../../core/domain/enums/vehicle-status.enum';
import { FuelType } from '../../../core/domain/enums/fuel-type.enum';
import { TransmissionType } from '../../../core/domain/enums/transmission-type.enum';
import { UserEntity } from './user.entity';
import { RentalEntity } from './rental.entity';
import { ReviewEntity } from './review.entity';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ length: 50 })
  brand: string;

  @Column({ length: 50 })
  model: string;

  @Column()
  year: number;

  @Column({ name: 'license_plate', length: 20 })
  licensePlate: string;

  @Column({ length: 50 })
  color: string;

  @Column({
    name: 'fuel_type',
    type: 'enum',
    enum: FuelType,
  })
  fuelType: FuelType;

  @Column({
    type: 'enum',
    enum: TransmissionType,
  })
  transmission: TransmissionType;

  @Column()
  seats: number;

  @Column({ name: 'daily_rate', type: 'decimal', precision: 10, scale: 2 })
  dailyRate: number;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.PENDING_VERIFICATION,
  })
  status: VehicleStatus;

  @Column({ name: 'is_available', default: false })
  isAvailable: boolean;

  @Column({ name: 'main_image_url' })
  mainImageUrl: string;

  @Column({ name: 'additional_images_urls', type: 'json', nullable: true })
  additionalImagesUrls: string[];

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 5.0 })
  rating: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column({ name: 'rental_count', default: 0 })
  rentalCount: number;

  @Column({ name: 'last_rental_end_date', nullable: true })
  lastRentalEndDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // Relaciones
  @ManyToOne(() => UserEntity, user => user.vehicles)
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @OneToMany(() => RentalEntity, rental => rental.vehicle)
  rentals: RentalEntity[];

  @OneToMany(() => ReviewEntity, review => review.vehicle)
  reviews: ReviewEntity[];

  // Hook que se ejecuta antes de insertar el registro
  @BeforeInsert()
  initializeDefaultValues() {
    // Inicializar el array vacío para additionalImagesUrls si no está definido
    if (!this.additionalImagesUrls) {
      this.additionalImagesUrls = [];
    }
  }
}