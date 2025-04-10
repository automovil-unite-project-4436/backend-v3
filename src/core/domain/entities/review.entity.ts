import { ReviewType } from '../enums/review-type.enum';

export class Review {
  id: string;
  rentalId: string;
  type: ReviewType;
  vehicleId?: string;
  renterId: string;
  ownerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Review>) {
    Object.assign(this, partial);
    
    // Valores por defecto
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }

  public isVehicleReview(): boolean {
    return this.type === ReviewType.VEHICLE;
  }

  public isRenterReview(): boolean {
    return this.type === ReviewType.RENTER;
  }

  public updateRating(newRating: number): void {
    // Aseguramos que el rating esté entre 1 y 5
    if (newRating < 1) newRating = 1;
    if (newRating > 5) newRating = 5;
    
    this.rating = newRating;
    this.updatedAt = new Date();
  }

  public updateComment(newComment: string): void {
    this.comment = newComment;
    this.updatedAt = new Date();
  }
}