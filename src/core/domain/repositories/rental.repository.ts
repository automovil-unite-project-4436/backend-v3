// src/core/domain/repositories/rental.repository.ts

import { Rental } from '../entities/rental.entity';

export interface RentalRepository {
  findById(id: string): Promise<Rental | null>;
  findByUser(
    userId: string, 
    role?: 'renter' | 'owner',
    status?: string,
    page?: number, 
    limit?: number
  ): Promise<{ rentals: Rental[]; count: number; totalPages: number }>;
  findByVehicleAndDateRange(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Rental[]>;
  create(rental: Rental): Promise<Rental>;
  update(rental: Rental): Promise<Rental>;
  verifyPayment(id: string, code: string): Promise<boolean>;
  extendRental(id: string, newEndDate: Date): Promise<Rental>;
  completeRental(id: string, returnDate: Date): Promise<Rental>;
  cancelRental(id: string): Promise<void>;
  submitCounterOffer(id: string, amount: number): Promise<void>;
  acceptCounterOffer(id: string): Promise<void>;
  findActiveRentalsByVehicleId(vehicleId: string): Promise<Rental[]>;
  rejectCounterOffer(id: string): Promise<void>;
}