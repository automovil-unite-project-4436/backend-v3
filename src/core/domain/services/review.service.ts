// src/core/application/services/review.service.ts

import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ReviewRepository } from '../../domain/repositories/review.repository';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RentalRepository } from '../../domain/repositories/rental.repository';
import { Review } from '../../domain/entities/review.entity';
import { ReviewType } from '../../domain/enums/review-type.enum';
import { EmailService } from '../../../infrastructure/emails/email.service';

@Injectable()
export class ReviewService {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
    @Inject('VehicleRepository')
    private readonly vehicleRepository: VehicleRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('RentalRepository')
    private readonly rentalRepository: RentalRepository,
    private readonly emailService: EmailService,
  ) {}

  async createVehicleReview(data: {
    rentalId: string;
    vehicleId: string;
    renterId: string;
    ownerId: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    // Verificar si ya existe una reseña para este alquiler
    const existingReview = await this.reviewRepository.getReviewByRentalId(data.rentalId);
    
    if (existingReview) {
      throw new BadRequestException('Ya existe una reseña para este alquiler');
    }
    
    // Validar calificación
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('La calificación debe estar entre 1 y 5');
    }
    
    // Crear la reseña
    const review = new Review({
      id: uuidv4(),
      rentalId: data.rentalId,
      type: ReviewType.VEHICLE,
      vehicleId: data.vehicleId,
      renterId: data.renterId,
      ownerId: data.ownerId,
      rating: data.rating,
      comment: data.comment,
    });
    
    const savedReview = await this.reviewRepository.createVehicleReview(review);
    
    // Actualizar la calificación del vehículo
    await this.vehicleRepository.updateRating(data.vehicleId, data.rating);
    
    // Notificar al propietario
    const owner = await this.userRepository.findById(data.ownerId);
    const vehicle = await this.vehicleRepository.findById(data.vehicleId);
    
    if (owner && vehicle) {
      await this.emailService.sendNotificationEmail(
        owner,
        'Nueva reseña recibida',
        `Has recibido una nueva reseña para tu vehículo ${vehicle.brand} ${vehicle.model} con una calificación de ${data.rating} estrellas.`,
      );
    }
    
    return savedReview;
  }

  async createRenterReview(data: {
    rentalId: string;
    renterId: string;
    ownerId: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    // Verificar si ya existe una reseña para este arrendatario en este alquiler
    const existingReview = await this.reviewRepository.getRenterReviewByRentalId(data.rentalId);
    
    if (existingReview) {
      throw new BadRequestException('Ya existe una reseña para este arrendatario en este alquiler');
    }
    
    // Validar calificación
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('La calificación debe estar entre 1 y 5');
    }
    
    // Crear la reseña
    const review = new Review({
      id: uuidv4(),
      rentalId: data.rentalId,
      type: ReviewType.RENTER,
      renterId: data.renterId,
      ownerId: data.ownerId,
      rating: data.rating,
      comment: data.comment,
    });
    
    const savedReview = await this.reviewRepository.createRenterReview(review);
    
    // Actualizar la calificación del arrendatario
    await this.userRepository.updateRating(data.renterId, data.rating);
    
    // Notificar al arrendatario
    const renter = await this.userRepository.findById(data.renterId);
    
    if (renter) {
      await this.emailService.sendNotificationEmail(
        renter,
        'Has recibido una reseña',
        `Has recibido una reseña con calificación de ${data.rating} estrellas por un alquiler reciente.`,
      );
    }
    
    return savedReview;
  }

  async getReviewByRentalId(rentalId: string): Promise<Review | null> {
    return this.reviewRepository.getReviewByRentalId(rentalId);
  }

  async getRenterReviewByRentalId(rentalId: string): Promise<Review | null> {
    return this.reviewRepository.getRenterReviewByRentalId(rentalId);
  }

  async getVehicleReviews(
    vehicleId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    reviews: Review[];
    count: number;
    totalPages: number;
  }> {
    // Verificar si el vehículo existe
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    return this.reviewRepository.getVehicleReviews(vehicleId, page, limit);
  }

  async getRenterReviews(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    reviews: Review[];
    count: number;
    totalPages: number;
  }> {
    // Verificar si el usuario existe
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    
    return this.reviewRepository.getRenterReviews(userId, page, limit);
  }
}