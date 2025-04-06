// src/infrastructure/database/entities/review.entity.ts

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

  import { UserEntity } from './user.entity';
  import { VehicleEntity } from './vehicle.entity';
  import { RentalEntity } from './rental.entity';
import { ReviewType } from 'src/core/domain/enums/review-type.enum';
  
  @Entity('reviews')
  export class ReviewEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'rental_id' })
    rentalId: string;
  
    @Column({ name: 'review_type', type: 'enum', enum: ReviewType })
    type: ReviewType;
  
    @Column({ name: 'vehicle_id', nullable: true })
    vehicleId?: string;
  
    @Column({ name: 'renter_id' })
    renterId: string;
  
    @Column({ name: 'owner_id' })
    ownerId: string;
  
    @Column({ type: 'decimal', precision: 3, scale: 1 })
    rating: number;
  
    @Column({ type: 'text' })
    comment: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    // Relaciones
    @OneToOne(() => RentalEntity, rental => rental.vehicleReview)
    @JoinColumn({ name: 'rental_id' })
    rental: RentalEntity;
  
    @OneToOne(() => RentalEntity, rental => rental.renterReview)
    rentalForRenter: RentalEntity;
  
    @ManyToOne(() => VehicleEntity, vehicle => vehicle.reviews, { nullable: true })
    @JoinColumn({ name: 'vehicle_id' })
    vehicle?: VehicleEntity;
  
    @ManyToOne(() => UserEntity, user => user.reviewsAsRenter)
    @JoinColumn({ name: 'renter_id' })
    renter: UserEntity;
  
    @ManyToOne(() => UserEntity, user => user.reviewsAsOwner)
    @JoinColumn({ name: 'owner_id' })
    owner: UserEntity;
  }