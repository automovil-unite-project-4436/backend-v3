// src/core/application/services/vehicle.service.ts

import { Injectable, Inject, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RentalRepository } from '../../domain/repositories/rental.repository';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { User } from '../../domain/entities/user.entity';

import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { UserRole } from '../../domain/enums/user-role.enum';
import { S3Service } from '../../../infrastructure/aws/s3.service';
import { ImageCategory } from '../../domain/enums/image-category.enum';
import { CreateVehicleDto } from 'src/core/application/dto/vehicle/create-vehicle.dto';
import { SearchVehicleDto } from 'src/core/application/dto/vehicle/search-vehicle.dto';
import { UpdateVehicleDto } from 'src/core/application/dto/vehicle/update-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(
    @Inject('VehicleRepository')
    private readonly vehicleRepository: VehicleRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('RentalRepository')
    private readonly rentalRepository: RentalRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createVehicle(createVehicleDto: CreateVehicleDto & { ownerId: string }): Promise<Vehicle> {
    // Verificar si el usuario existe y es propietario
    const owner = await this.userRepository.findById(createVehicleDto.ownerId);
    
    if (!owner) {
      throw new NotFoundException('Propietario no encontrado');
    }
    
    if (owner.role !== UserRole.OWNER) {
      throw new BadRequestException('El usuario no tiene el rol de propietario');
    }
    
    // Verificar si ya existe un vehículo con la misma placa
    const existingVehicle = await this.vehicleRepository.findByLicensePlate(createVehicleDto.licensePlate);
    
    if (existingVehicle) {
      throw new ConflictException('Ya existe un vehículo con esa placa');
    }
    
    // Crear el nuevo vehículo
    const newVehicle = new Vehicle({
      id: uuidv4(),
      ownerId: createVehicleDto.ownerId,
      brand: createVehicleDto.brand,
      model: createVehicleDto.model,
      year: createVehicleDto.year,
      licensePlate: createVehicleDto.licensePlate,
      color: createVehicleDto.color,
      fuelType: createVehicleDto.fuelType,
      transmission: createVehicleDto.transmission,
      seats: createVehicleDto.seats,
      dailyRate: createVehicleDto.dailyRate,
      description: createVehicleDto.description,
      status: VehicleStatus.PENDING_VERIFICATION, // Por defecto, requiere verificación
      isAvailable: false, // Por defecto, no está disponible hasta ser verificado
      mainImageUrl: '', // Se debe subir la imagen después
      additionalImagesUrls: [],
    });
    
    return this.vehicleRepository.create(newVehicle);
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(id);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    return vehicle;
  }

  async updateVehicle(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(id);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    // Verificar placa si se está actualizando
    if (updateVehicleDto.licensePlate && updateVehicleDto.licensePlate !== vehicle.licensePlate) {
      const existingVehicle = await this.vehicleRepository.findByLicensePlate(updateVehicleDto.licensePlate);
      
      if (existingVehicle && existingVehicle.id !== id) {
        throw new ConflictException('Ya existe un vehículo con esa placa');
      }
    }
    
    // Actualizar campos
    const updatedVehicle = new Vehicle({
      ...vehicle,
      ...updateVehicleDto,
    });
    
    return this.vehicleRepository.update(updatedVehicle);
  }

  async deleteVehicle(id: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(id);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    // Verificar si el vehículo tiene alquileres activos
    const activeRentals = await this.rentalRepository.findActiveRentalsByVehicleId(id);
    
    if (activeRentals.length > 0) {
      throw new BadRequestException('No se puede eliminar un vehículo con alquileres activos');
    }
    
    // Eliminar imágenes de S3 si existen
    if (vehicle.mainImageUrl) {
      await this.s3Service.deleteFile(vehicle.mainImageUrl);
    }
    
    if (vehicle.additionalImagesUrls && vehicle.additionalImagesUrls.length > 0) {
      for (const imageUrl of vehicle.additionalImagesUrls) {
        await this.s3Service.deleteFile(imageUrl);
      }
    }
    
    await this.vehicleRepository.delete(id);
  }

  async searchVehicles(searchDto: SearchVehicleDto): Promise<{
    vehicles: Vehicle[];
    count: number;
    totalPages: number;
  }> {
    return this.vehicleRepository.findAvailable(
      {
        brand: searchDto.brand,
        model: searchDto.model,
        minYear: searchDto.minYear,
        maxYear: searchDto.maxYear,
        seats: searchDto.seats,
        transmission: searchDto.transmission,
        fuelType: searchDto.fuelType,
        minDailyRate: searchDto.minDailyRate,
        maxDailyRate: searchDto.maxDailyRate,
      },
      searchDto.page,
      searchDto.limit,
    );
  }

  async getVehiclesByOwnerId(
    ownerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    vehicles: Vehicle[];
    count: number;
    totalPages: number;
  }> {
    return this.vehicleRepository.findByOwnerId(ownerId, page, limit);
  }

  async updateVehicleAvailability(id: string, isAvailable: boolean): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(id);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    // Verificar si el vehículo puede cambiar su disponibilidad
    if (isAvailable && !vehicle.canBeRented()) {
      throw new BadRequestException('Este vehículo no puede ser marcado como disponible');
    }
    
    await this.vehicleRepository.updateAvailability(id, isAvailable);
  }

  async uploadVehicleImage(
    vehicleId: string,
    file: Express.Multer.File,
    category: ImageCategory,
  ): Promise<string> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    // Eliminar imagen anterior si existe
    if (category === ImageCategory.VEHICLE_MAIN && vehicle.mainImageUrl) {
      await this.s3Service.deleteFile(vehicle.mainImageUrl);
    }
    
    // Subir nueva imagen
    const imageUrl = await this.s3Service.uploadFile(file, category, vehicleId);
    
    // Actualizar URL en el vehículo
    if (category === ImageCategory.VEHICLE_MAIN) {
      vehicle.mainImageUrl = imageUrl;
      await this.vehicleRepository.update(vehicle);
    }
    
    return imageUrl;
  }

  async uploadVehicleAdditionalImages(
    vehicleId: string,
    files: Express.Multer.File[],
  ): Promise<string[]> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    const imageUrls: string[] = [];
    
    // Subir cada imagen
    for (const file of files) {
      const imageUrl = await this.s3Service.uploadFile(
        file,
        ImageCategory.VEHICLE_ADDITIONAL,
        vehicleId,
      );
      imageUrls.push(imageUrl);
    }
    
    // Actualizar URLs en el vehículo
    vehicle.additionalImagesUrls = [
      ...(vehicle.additionalImagesUrls || []),
      ...imageUrls,
    ];
    
    await this.vehicleRepository.update(vehicle);
    
    return imageUrls;
  }

  async getMostRentedVehicles(limit: number = 10): Promise<Vehicle[]> {
    return this.vehicleRepository.findMostRented(limit);
  }

  async getPopularBrands(limit: number = 10): Promise<{ brand: string; count: number }[]> {
    return this.vehicleRepository.getPopularBrands(limit);
  }

  async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ isAvailable: boolean; conflictingDates?: Date[][] }> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    // Verificar si el vehículo está verificado y marcado como disponible
    if (vehicle.status !== VehicleStatus.VERIFIED || !vehicle.isAvailable) {
      return { isAvailable: false };
    }
    
    // Verificar si el vehículo tiene fecha de último alquiler y no ha pasado 1 día
    if (vehicle.lastRentalEndDate) {
      const oneDayAfterLastRental = new Date(vehicle.lastRentalEndDate);
      oneDayAfterLastRental.setDate(oneDayAfterLastRental.getDate() + 1);
      
      if (new Date() < oneDayAfterLastRental) {
        return { isAvailable: false };
      }
    }
    
    // Buscar alquileres que se superpongan con las fechas solicitadas
    const conflictingRentals = await this.rentalRepository.findByVehicleAndDateRange(
      vehicleId,
      startDate,
      endDate,
    );
    
    if (conflictingRentals.length > 0) {
      const conflictingDates = conflictingRentals.map(rental => [
        rental.startDate,
        rental.endDate,
      ]);
      
      return {
        isAvailable: false,
        conflictingDates,
      };
    }
    
    return { isAvailable: true };
  }
}