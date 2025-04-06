// src/core/domain/repositories/vehicle.repository.ts

import { Vehicle } from '../entities/vehicle.entity';

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByOwnerId(ownerId: string, page?: number, limit?: number): Promise<{ vehicles: Vehicle[]; count: number; totalPages: number }>;
  findAvailable(
    filters: {
      brand?: string; 
      model?: string; 
      minYear?: number; 
      maxYear?: number;
      seats?: number;
      transmission?: string;
      fuelType?: string;
      minDailyRate?: number;
      maxDailyRate?: number;
    },
    page?: number,
    limit?: number,
  ): Promise<{ vehicles: Vehicle[]; count: number; totalPages: number }>;
  findMostRented(limit?: number): Promise<Vehicle[]>;
  getPopularBrands(limit?: number): Promise<{ brand: string; count: number }[]>;
  create(vehicle: Vehicle): Promise<Vehicle>;
  update(vehicle: Vehicle): Promise<Vehicle>;
  updateAvailability(id: string, isAvailable: boolean): Promise<void>;
  incrementRentalCount(id: string): Promise<void>;
  updateRating(id: string, newRating: number): Promise<void>;
  updateLastRentalDate(id: string, endDate: Date): Promise<void>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  delete(id: string): Promise<void>;
}