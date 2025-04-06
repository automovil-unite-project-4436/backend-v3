// src/core/domain/entities/user.entity.ts

import { UserRole } from "../enums/user-role.enum";
import { UserStatus } from "../enums/user-status.enum";



export class User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  documentImageUrl?: string;
  criminalRecordImageUrl?: string;
  profileImageUrl?: string;
  driverLicenseImageUrl?: string;
  twoFactorAuthSecret?: string;
  twoFactorAuthEnabled: boolean;
  rating: number;
  reportCount: number;
  isBlocked: boolean;
  blockedUntil?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
    
    // Valores por defecto
    this.status = partial.status || UserStatus.PENDING_VERIFICATION;
    this.rating = partial.rating || 5.0;
    this.reportCount = partial.reportCount || 0;
    this.isBlocked = partial.isBlocked || false;
    this.twoFactorAuthEnabled = partial.twoFactorAuthEnabled || false;
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }

  public isVerified(): boolean {
    return this.status === UserStatus.VERIFIED;
  }

  public isRenter(): boolean {
    return this.role === UserRole.RENTER;
  }

  public isOwner(): boolean {
    return this.role === UserRole.OWNER;
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public isEligibleForDiscount(): boolean {
    return this.rating >= 4.7 && this.reportCount === 0;
  }

  public block(days: number): void {
    this.isBlocked = true;
    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + days);
    this.blockedUntil = blockedUntil;
  }

  public unblock(): void {
    this.isBlocked = false;
    this.blockedUntil = undefined;
  }

  public updateRating(newRating: number): void {
    // Aseguramos que el rating esté entre 1 y 5
    if (newRating < 1) newRating = 1;
    if (newRating > 5) newRating = 5;
    
    this.rating = newRating;
  }

  public increaseReportCount(): void {
    this.reportCount += 1;
  }
}