// src/infrastructure/database/repositories/typeorm-user.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../../core/domain/repositories/user.repository';
import { User } from '../../../core/domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { UserRole } from 'src/core/domain/enums/user-role.enum';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userMapper: UserMapper,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    
    if (!userEntity) {
      return null;
    }
    
    return this.userMapper.toDomain(userEntity);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { email } });
    
    if (!userEntity) {
      return null;
    }
    
    return this.userMapper.toDomain(userEntity);
  }

  async create(user: User): Promise<User> {
    const userEntity = this.userMapper.toPersistence(user);
    const savedEntity = await this.userRepository.save(userEntity);
    
    return this.userMapper.toDomain(savedEntity);
  }

  async update(user: User): Promise<User> {
    const userEntity = this.userMapper.toPersistence(user);
    const updatedEntity = await this.userRepository.save(userEntity);
    
    return this.userMapper.toDomain(updatedEntity);
  }

  async updateRating(userId: string, newRating: number): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      { rating: newRating }
    );
  }

  async incrementReportCount(userId: string): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        reportCount: () => 'report_count + 1',
      })
      .where('id = :id', { id: userId })
      .execute();
  }

  async blockUser(userId: string, days: number): Promise<void> {
    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + days);
    
    await this.userRepository.update(
      { id: userId },
      { 
        isBlocked: true,
        blockedUntil,
      }
    );
  }

  async unblockUser(userId: string): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      { 
        isBlocked: false,
        blockedUntil: '',
      }
    );
  }
  async findAdmins(): Promise<User[]> {
    const adminEntities = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });
    
    return adminEntities.map(entity => this.userMapper.toDomain(entity));
  }
  async delete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}