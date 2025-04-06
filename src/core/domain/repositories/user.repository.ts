// src/core/domain/repositories/user.repository.ts

import { User } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  updateRating(userId: string, newRating: number): Promise<void>;
  incrementReportCount(userId: string): Promise<void>;
  blockUser(userId: string, days: number): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  findAdmins(): Promise<User[]>;
  delete(id: string): Promise<void>;
}