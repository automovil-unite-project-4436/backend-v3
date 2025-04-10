import { FuelType } from "../enums/fuel-type.enum";
import { TransmissionType } from "../enums/transmission-type.enum";
import { VehicleStatus } from "../enums/vehicle-status.enum";



export class Vehicle {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  dailyRate: number;
  description: string;
  status: VehicleStatus;
  isAvailable: boolean;
  mainImageUrl: string;
  additionalImagesUrls: string[];
  rating: number;
  ratingCount: number;
  rentalCount: number;
  lastRentalEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(partial: Partial<Vehicle>) {
    Object.assign(this, partial);
    
    // Valores por defecto
    this.status = partial.status || VehicleStatus.PENDING_VERIFICATION;
    this.isAvailable = partial.isAvailable || false;
    this.rating = partial.rating || 5.0;
    this.ratingCount = partial.ratingCount || 0;
    this.rentalCount = partial.rentalCount || 0;
    this.additionalImagesUrls = partial.additionalImagesUrls || [];
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }

  public isVerified(): boolean {
    return this.status === VehicleStatus.VERIFIED;
  }

  public canBeRented(): boolean {
    if (!this.isVerified() || !this.isAvailable) {
      return false;
    }

    // Verificar si ha pasado al menos un día desde el último alquiler
    if (this.lastRentalEndDate) {
      const oneDayAfterLastRental = new Date(this.lastRentalEndDate);
      oneDayAfterLastRental.setDate(oneDayAfterLastRental.getDate() + 1);
      
      return new Date() >= oneDayAfterLastRental;
    }

    return true;
  }

  public markAsRented(endDate: Date): void {
    this.isAvailable = false;
    this.lastRentalEndDate = endDate;
  }

  public markAsAvailable(): void {
    this.isAvailable = true;
  }

  public updateRating(newRating: number): void {
    // Calcular el nuevo rating promedio
    const totalRating = (this.rating * this.ratingCount) + newRating;
    this.ratingCount += 1;
    this.rating = totalRating / this.ratingCount;
    
    // Aseguramos que el rating esté entre 1 y 5
    if (this.rating < 1) this.rating = 1;
    if (this.rating > 5) this.rating = 5;
  }

  public incrementRentalCount(): void {
    this.rentalCount += 1;
  }
}