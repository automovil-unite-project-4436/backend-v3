// src/infrastructure/database/repositories/typeorm-rental.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Raw, FindOptionsWhere, In } from 'typeorm';
import { RentalRepository } from '../../../core/domain/repositories/rental.repository';
import { Rental } from '../../../core/domain/entities/rental.entity';
import { RentalEntity } from '../entities/rental.entity';
import { RentalMapper } from '../mappers/rental.mapper';
import { RentalStatus } from '../../../core/domain/enums/rental-status.enum';

@Injectable()
export class TypeOrmRentalRepository implements RentalRepository {
  constructor(
    @InjectRepository(RentalEntity)
    private readonly rentalRepository: Repository<RentalEntity>,
    private readonly rentalMapper: RentalMapper,
  ) {}

  async findById(id: string): Promise<Rental | null> {
    const rentalEntity = await this.rentalRepository.findOne({ 
      where: { id },
      relations: ['vehicle', 'renter', 'owner'],
    });
    
    if (!rentalEntity) {
      return null;
    }
    
    return this.rentalMapper.toDomain(rentalEntity);
  }

  async findByUser(
    userId: string, 
    role: 'renter' | 'owner' | null = null,
    status: string = '',
    page: number = 1, 
    limit: number = 10
  ): Promise<{ rentals: Rental[]; count: number; totalPages: number }> {
    // Construir la condición WHERE
    const where: FindOptionsWhere<RentalEntity> = {};
    
    if (role === 'renter') {
      where.renterId = userId;
    } else if (role === 'owner') {
      where.ownerId = userId;
    } else {
      // Si no se especifica el rol, buscar en ambos
      where.renterId = userId;
      // No podemos usar OR directo en FindOptionsWhere, lo manejaremos con query builder
    }
    
    if (status) {
      where.status = status as RentalStatus;
    }
    
    let query = this.rentalRepository.createQueryBuilder('rental')
      .leftJoinAndSelect('rental.vehicle', 'vehicle')
      .leftJoinAndSelect('rental.renter', 'renter')
      .leftJoinAndSelect('rental.owner', 'owner');
    
    if (role === 'renter') {
      query = query.where('rental.renterId = :userId', { userId });
    } else if (role === 'owner') {
      query = query.where('rental.ownerId = :userId', { userId });
    } else {
      query = query.where('(rental.renterId = :userId OR rental.ownerId = :userId)', { userId });
    }
    
    if (status) {
      query = query.andWhere('rental.status = :status', { status });
    }
    
    query = query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('rental.createdAt', 'DESC');
    
    const [rentalEntities, count] = await query.getManyAndCount();
    
    const rentals = rentalEntities.map(entity => this.rentalMapper.toDomain(entity));
    const totalPages = Math.ceil(count / limit);
    
    return { rentals, count, totalPages };
  }

  async findActiveRentalsByVehicleId(vehicleId: string): Promise<Rental[]> {
    const rentalEntities = await this.rentalRepository.find({
      where: {
        vehicleId,
        status: In([RentalStatus.PENDING, RentalStatus.ACTIVE]),
      },
      relations: ['vehicle', 'renter', 'owner'],
    });
    
    return rentalEntities.map(entity => this.rentalMapper.toDomain(entity));
  }

  async findByVehicleAndDateRange(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Rental[]> {
    // Buscar alquileres que se superpongan con el rango de fechas proporcionado
    // Un alquiler se superpone si:
    // - Su fecha de inicio está dentro del rango solicitado, o
    // - Su fecha de fin está dentro del rango solicitado, o
    // - Abarca todo el rango solicitado (inicio antes y fin después)
    const rentalEntities = await this.rentalRepository.find({
      where: [
        {
          vehicleId,
          status: In([RentalStatus.PENDING, RentalStatus.ACTIVE]),
          startDate: Between(startDate, endDate),
        },
        {
          vehicleId,
          status: In([RentalStatus.PENDING, RentalStatus.ACTIVE]),
          endDate: Between(startDate, endDate),
        },
        {
          vehicleId,
          status: In([RentalStatus.PENDING, RentalStatus.ACTIVE]),
          startDate: Raw(alias => `${alias} <= :startDate`, { startDate }),
          endDate: Raw(alias => `${alias} >= :endDate`, { endDate }),
        },
      ],
    });
    
    return rentalEntities.map(entity => this.rentalMapper.toDomain(entity));
  }

  async create(rental: Rental): Promise<Rental> {
    const rentalEntity = this.rentalMapper.toPersistence(rental);
    const savedEntity = await this.rentalRepository.save(rentalEntity);
    
    return this.rentalMapper.toDomain(savedEntity);
  }

  async update(rental: Rental): Promise<Rental> {
    const rentalEntity = this.rentalMapper.toPersistence(rental);
    const updatedEntity = await this.rentalRepository.save(rentalEntity);
    
    return this.rentalMapper.toDomain(updatedEntity);
  }

  async verifyPayment(id: string, code: string): Promise<boolean> {
    const rental = await this.findById(id);
    
    if (!rental) {
      return false;
    }
    
    const isVerified = rental.verifyPayment(code);
    
    if (isVerified) {
      await this.update(rental);
    }
    
    return isVerified;
  }

  async extendRental(id: string, newEndDate: Date): Promise<Rental> {
    const rental = await this.findById(id);
    
    if (!rental) {
      throw new NotFoundException(`Alquiler con ID ${id} no encontrado`);
    }
    
    
    rental.extendRental(newEndDate);
    return this.update(rental);
  }

  async completeRental(id: string, returnDate: Date): Promise<Rental> {
    const rental = await this.findById(id);
    
    if (!rental) {
      throw new NotFoundException(`Alquiler con ID ${id} no encontrado`);
    }
    
    
    rental.completeRental(returnDate);
    return this.update(rental);
  }

  async cancelRental(id: string): Promise<void> {
    const rental = await this.findById(id);
    
    if (!rental) {
      return;
    }
    
    rental.cancelRental();
    await this.update(rental);
  }

  async submitCounterOffer(id: string, amount: number): Promise<void> {
    const rental = await this.findById(id);
    
    if (!rental) {
      return;
    }
    
    rental.submitCounteroffer(amount);
    await this.update(rental);
  }

  async acceptCounterOffer(id: string): Promise<void> {
    const rental = await this.findById(id);
    
    if (!rental) {
      return;
    }
    
    rental.acceptCounteroffer();
    await this.update(rental);
  }

  async rejectCounterOffer(id: string): Promise<void> {
    const rental = await this.findById(id);
    
    if (!rental) {
      return;
    }
    
    rental.rejectCounteroffer();
    await this.update(rental);
  }
}