import { Review } from "../entities/review.entity";

export interface ReviewRepository {
  getReviewByRentalId(rentalId: string): Promise<Review | null>;
  getRenterReviewByRentalId(rentalId: string): Promise<Review | null>;
  getVehicleReviews(
    vehicleId: string,
    page?: number,
    limit?: number
  ): Promise<{ reviews: Review[]; count: number; totalPages: number }>;
  getRenterReviews(
    renterId: string,
    page?: number,
    limit?: number
  ): Promise<{ reviews: Review[]; count: number; totalPages: number }>;
  createVehicleReview(review: Review): Promise<Review>;
  createRenterReview(review: Review): Promise<Review>;
  getReviewById(id: string): Promise<Review | null>;
  update(review: Review): Promise<Review>;
  delete(id: string): Promise<void>;
}