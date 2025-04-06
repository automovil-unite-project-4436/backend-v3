import { RentalStatus } from "../enums/rental-status.enum";

export class Rental {
  id: string;
  vehicleId: string;
  renterId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  originalEndDate: Date;
  actualReturnDate?: Date;
  basePrice: number;
  discountPercentage: number;
  additionalChargePercentage: number;
  finalPrice: number;
  status: RentalStatus;
  verificationCode: string;
  paymentVerified: boolean;
  notes?: string;
  counterofferAmount?: number;
  counterofferStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  isLateReturn: boolean;
  rentalDuration: number; // en días
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Rental>) {

    if (!partial.startDate || !partial.endDate) {
        throw new Error("startDate and endDate are required");
      }

    Object.assign(this, partial);
    
    // Valores por defecto
    this.status = partial.status || RentalStatus.PENDING;
    this.paymentVerified = partial.paymentVerified || false;
    this.discountPercentage = partial.discountPercentage || 0;
    this.additionalChargePercentage = partial.additionalChargePercentage || 0;
    this.isLateReturn = partial.isLateReturn || false;
    this.originalEndDate = partial.originalEndDate || partial.endDate;
    
    // Calcular duración del alquiler en días
    if (partial.startDate && partial.endDate) {
      const diffTime = partial.endDate.getTime() - partial.startDate.getTime();
      this.rentalDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      this.rentalDuration = 0;
    }
    
    // Calcular precio final
    this.calculateFinalPrice();
    
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }

  private calculateFinalPrice(): void {
    let price = this.basePrice;
    
    // Aplicar descuento si existe
    if (this.discountPercentage > 0) {
      price = price * (1 - (this.discountPercentage / 100));
    }
    
    // Aplicar cargo adicional si existe
    if (this.additionalChargePercentage > 0) {
      price = price * (1 + (this.additionalChargePercentage / 100));
    }
    
    // Si hay una contraoferta aceptada, usar ese precio
    if (this.counterofferAmount && this.counterofferStatus === 'ACCEPTED') {
      price = this.counterofferAmount;
    }
    
    this.finalPrice = Math.round(price * 100) / 100; // Redondear a 2 decimales
  }

  public verifyPayment(code: string): boolean {
    if (this.verificationCode === code) {
      this.paymentVerified = true;
      this.status = RentalStatus.ACTIVE;
      return true;
    }
    return false;
  }

  public extendRental(newEndDate: Date): void {
    this.originalEndDate = this.endDate;
    this.endDate = newEndDate;
    
    // Recalcular duración
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    this.rentalDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Recalcular precio
    this.basePrice = this.rentalDuration * (this.basePrice / this.rentalDuration);
    this.calculateFinalPrice();
  }

  public completeRental(returnDate: Date): void {
    this.actualReturnDate = returnDate;
    this.status = RentalStatus.COMPLETED;
    
    // Verificar si es una devolución tardía (más de 30 minutos)
    const thirtyMinutesInMs = 30 * 60 * 1000;
    if (returnDate.getTime() - this.endDate.getTime() > thirtyMinutesInMs) {
      this.isLateReturn = true;
    }
  }

  public cancelRental(): void {
    this.status = RentalStatus.CANCELLED;
  }

  public submitCounteroffer(amount: number): void {
    this.counterofferAmount = amount;
    this.counterofferStatus = 'PENDING';
  }

  public acceptCounteroffer(): void {
    if (this.counterofferStatus === 'PENDING' && this.counterofferAmount) {
      this.counterofferStatus = 'ACCEPTED';
      this.calculateFinalPrice();
    }
  }

  public rejectCounteroffer(): void {
    if (this.counterofferStatus === 'PENDING') {
      this.counterofferStatus = 'REJECTED';
      this.counterofferAmount = undefined;
    }
  }

  public isActive(): boolean {
    return this.status === RentalStatus.ACTIVE;
  }

  public isPending(): boolean {
    return this.status === RentalStatus.PENDING;
  }

  public isCompleted(): boolean {
    return this.status === RentalStatus.COMPLETED;
  }

  public isCancelled(): boolean {
    return this.status === RentalStatus.CANCELLED;
  }
}