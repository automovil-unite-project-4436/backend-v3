import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { VehicleRepository } from '../../../core/domain/repositories/vehicle.repository';
import { Vehicle } from '../../../core/domain/entities/vehicle.entity';
import { VehicleEntity } from '../entities/vehicle.entity';
import { VehicleMapper } from '../mappers/vehicle.mapper';
import { VehicleStatus } from '../../../core/domain/enums/vehicle-status.enum';
import { User } from 'src/core/domain/entities/user.entity';

@Injectable()
export class TypeOrmVehicleRepository implements VehicleRepository {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    private readonly vehicleMapper: VehicleMapper,
  ) {}
  sendNotificationEmail(owner: User, arg1: string, arg2: string): unknown {
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<Vehicle | null> {
    const vehicleEntity = await this.vehicleRepository.findOne({ 
      where: { id },
      relations: ['owner'],
    });
    
    if (!vehicleEntity) {
      return null;
    }
    
    return this.vehicleMapper.toDomain(vehicleEntity);
  }

  async findByOwnerId(
    ownerId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ vehicles: Vehicle[]; count: number; totalPages: number }> {
    const [vehicleEntities, count] = await this.vehicleRepository.findAndCount({
      where: { ownerId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    
    const vehicles = vehicleEntities.map(entity => this.vehicleMapper.toDomain(entity));
    const totalPages = Math.ceil(count / limit);
    
    return { vehicles, count, totalPages };
  }

  async findAvailable(
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
    page: number = 1,
    limit: number = 10,
  ): Promise<{ vehicles: Vehicle[]; count: number; totalPages: number }> {
    const query = this.vehicleRepository.createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.owner', 'owner')
      .where('vehicle.status = :status', { status: VehicleStatus.VERIFIED })
      .andWhere('vehicle.isAvailable = :isAvailable', { isAvailable: true });
    
    // Aplicar filtros si existen
    if (filters.brand) {
      query.andWhere('vehicle.brand LIKE :brand', { brand: `%${filters.brand}%` });
    }
    
    if (filters.model) {
      query.andWhere('vehicle.model LIKE :model', { model: `%${filters.model}%` });
    }
    
    if (filters.minYear) {
      query.andWhere('vehicle.year >= :minYear', { minYear: filters.minYear });
    }
    
    if (filters.maxYear) {
      query.andWhere('vehicle.year <= :maxYear', { maxYear: filters.maxYear });
    }
    
    if (filters.seats) {
      query.andWhere('vehicle.seats = :seats', { seats: filters.seats });
    }
    
    if (filters.transmission) {
      query.andWhere('vehicle.transmission = :transmission', { transmission: filters.transmission });
    }
    
    if (filters.fuelType) {
      query.andWhere('vehicle.fuelType = :fuelType', { fuelType: filters.fuelType });
    }
    
    if (filters.minDailyRate) {
      query.andWhere('vehicle.dailyRate >= :minDailyRate', { minDailyRate: filters.minDailyRate });
    }
    
    if (filters.maxDailyRate) {
      query.andWhere('vehicle.dailyRate <= :maxDailyRate', { maxDailyRate: filters.maxDailyRate });
    }
    
    // Verificar si el vehículo no tiene una fecha de último alquiler o si ha pasado al menos un día
    query.andWhere('(vehicle.lastRentalEndDate IS NULL OR vehicle.lastRentalEndDate <= :minDate)', {
      minDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    
    // Paginación
    query.skip((page - 1) * limit)
      .take(limit)
      .orderBy('vehicle.createdAt', 'DESC');
    
    const [vehicleEntities, count] = await query.getManyAndCount();
    
    const vehicles = vehicleEntities.map(entity => this.vehicleMapper.toDomain(entity));
    const totalPages = Math.ceil(count / limit);
    
    return { vehicles, count, totalPages };
  }

  async findMostRented(limit: number = 10): Promise<Vehicle[]> {
    const vehicleEntities = await this.vehicleRepository.find({
      where: { status: VehicleStatus.VERIFIED },
      order: { rentalCount: 'DESC' },
      take: limit,
      relations: ['owner'],
    });
    
    return vehicleEntities.map(entity => this.vehicleMapper.toDomain(entity));
  }

  async getPopularBrands(limit: number = 10): Promise<{ brand: string; count: number }[]> {
    const result = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .select('vehicle.brand', 'brand')
      .addSelect('COUNT(vehicle.id)', 'count')
      .where('vehicle.status = :status', { status: VehicleStatus.VERIFIED })
      .groupBy('vehicle.brand')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
    
    return result.map(item => ({
      brand: item.brand,
      count: parseInt(item.count, 10),
    }));
  }

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const vehicleEntity = this.vehicleMapper.toPersistence(vehicle);
    const savedEntity = await this.vehicleRepository.save(vehicleEntity);
    
    return this.vehicleMapper.toDomain(savedEntity);
  }

  async update(vehicle: Vehicle): Promise<Vehicle> {
    const vehicleEntity = this.vehicleMapper.toPersistence(vehicle);
    const updatedEntity = await this.vehicleRepository.save(vehicleEntity);
    
    return this.vehicleMapper.toDomain(updatedEntity);
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<void> {
    await this.vehicleRepository.update(
      { id },
      { isAvailable }
    );
  }

  async incrementRentalCount(id: string): Promise<void> {
    await this.vehicleRepository
      .createQueryBuilder()
      .update(VehicleEntity)
      .set({
        rentalCount: () => 'rental_count + 1',
      })
      .where('id = :id', { id })
      .execute();
  }

  async updateRating(id: string, newRating: number): Promise<void> {
    await this.vehicleRepository
      .createQueryBuilder()
      .update(VehicleEntity)
      .set({
        rating: newRating,
        ratingCount: () => 'rating_count + 1',
      })
      .where('id = :id', { id })
      .execute();
  }

  async updateLastRentalDate(id: string, endDate: Date): Promise<void> {
    await this.vehicleRepository.update(
      { id },
      { 
        lastRentalEndDate: endDate,
        isAvailable: false,
      }
    );
  }

  async delete(id: string): Promise<void> {
    await this.vehicleRepository.softDelete(id);
  }
  
  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const vehicleEntity = await this.vehicleRepository.findOne({ 
      where: { licensePlate },
      relations: ['owner'],
    });
    
    if (!vehicleEntity) {
      return null;
    }
    
    return this.vehicleMapper.toDomain(vehicleEntity);
  }
}