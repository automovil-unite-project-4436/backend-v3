import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewRepository } from '../../../core/domain/repositories/review.repository';
import { Review } from '../../../core/domain/entities/review.entity';
import { ReviewEntity } from '../entities/review.entity';
import { ReviewMapper } from '../mappers/review.mapper';
import { ReviewType } from '../../../core/domain/enums/review-type.enum';

@Injectable()
export class TypeOrmReviewRepository implements ReviewRepository {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    private readonly reviewMapper: ReviewMapper,
  ) {}

  async getReviewByRentalId(rentalId: string): Promise<Review | null> {
    const reviewEntity = await this.reviewRepository.findOne({ 
      where: { 
        rentalId,
        type: ReviewType.VEHICLE,
      },
      relations: ['rental', 'vehicle', 'renter', 'owner'],
    });
    
    if (!reviewEntity) {
      return null;
    }
    
    return this.reviewMapper.toDomain(reviewEntity);
  }

  async getRenterReviewByRentalId(rentalId: string): Promise<Review | null> {
    const reviewEntity = await this.reviewRepository.findOne({ 
      where: { 
        rentalId,
        type: ReviewType.RENTER,
      },
      relations: ['rental', 'renter', 'owner'],
    });
    
    if (!reviewEntity) {
      return null;
    }
    
    return this.reviewMapper.toDomain(reviewEntity);
  }

  async getVehicleReviews(
    vehicleId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: Review[]; count: number; totalPages: number }> {
    const [reviewEntities, count] = await this.reviewRepository.findAndCount({
      where: { 
        vehicleId,
        type: ReviewType.VEHICLE,
      },
      relations: ['rental', 'vehicle', 'renter', 'owner'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    
    const reviews = reviewEntities.map(entity => this.reviewMapper.toDomain(entity));
    const totalPages = Math.ceil(count / limit);
    
    return { reviews, count, totalPages };
  }

  async getRenterReviews(
    renterId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: Review[]; count: number; totalPages: number }> {
    const [reviewEntities, count] = await this.reviewRepository.findAndCount({
      where: { 
        renterId,
        type: ReviewType.RENTER,
      },
      relations: ['rental', 'renter', 'owner'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    
    const reviews = reviewEntities.map(entity => this.reviewMapper.toDomain(entity));
    const totalPages = Math.ceil(count / limit);
    
    return { reviews, count, totalPages };
  }

  async createVehicleReview(review: Review): Promise<Review> {
    const reviewEntity = this.reviewMapper.toPersistence(review);
    reviewEntity.type = ReviewType.VEHICLE;
    
    const savedEntity = await this.reviewRepository.save(reviewEntity);
    
    return this.reviewMapper.toDomain(savedEntity);
  }

  async createRenterReview(review: Review): Promise<Review> {
    const reviewEntity = this.reviewMapper.toPersistence(review);
    reviewEntity.type = ReviewType.RENTER;
    
    const savedEntity = await this.reviewRepository.save(reviewEntity);
    
    return this.reviewMapper.toDomain(savedEntity);
  }

  async getReviewById(id: string): Promise<Review | null> {
    const reviewEntity = await this.reviewRepository.findOne({ 
      where: { id },
      relations: ['rental', 'vehicle', 'renter', 'owner'],
    });
    
    if (!reviewEntity) {
      return null;
    }
    
    return this.reviewMapper.toDomain(reviewEntity);
  }

  async update(review: Review): Promise<Review> {
    const reviewEntity = this.reviewMapper.toPersistence(review);
    const updatedEntity = await this.reviewRepository.save(reviewEntity);
    
    return this.reviewMapper.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.reviewRepository.delete(id);
  }
}