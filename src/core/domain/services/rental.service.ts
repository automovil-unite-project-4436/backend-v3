// src/core/application/services/rental.service.ts

import { Injectable, Inject, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { RentalRepository } from '../../domain/repositories/rental.repository';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Rental } from '../../domain/entities/rental.entity';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { User } from '../../domain/entities/user.entity';
import { RentalStatus } from '../../domain/enums/rental-status.enum';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { UserRole } from '../../domain/enums/user-role.enum';
import { EmailService } from '../../../infrastructure/emails/email.service';
import { CreateRentalDto } from 'src/core/application/dto/rental/create-rental.dto';


@Injectable()
export class RentalService {
  constructor(
    @Inject('RentalRepository')
    private readonly rentalRepository: RentalRepository,
    @Inject('VehicleRepository')
    private readonly vehicleRepository: VehicleRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async createRental(createRentalDto: CreateRentalDto & { renterId: string }): Promise<Rental> {
    // Obtener vehículo
    const vehicle = await this.vehicleRepository.findById(createRentalDto.vehicleId);
    
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    
    // Verificar si el vehículo está disponible
    if (vehicle.status !== VehicleStatus.VERIFIED || !vehicle.isAvailable) {
      throw new BadRequestException('El vehículo no está disponible para alquiler');
    }
    
    // Obtener arrendatario
    const renter = await this.userRepository.findById(createRentalDto.renterId);
    
    if (!renter) {
      throw new NotFoundException('Arrendatario no encontrado');
    }
    
    if (renter.role !== UserRole.RENTER) {
      throw new BadRequestException('El usuario no tiene el rol de arrendatario');
    }
    
    // Verificar si el usuario está bloqueado
    if (renter.isBlocked) {
      if (renter.blockedUntil && renter.blockedUntil > new Date()) {
        throw new BadRequestException(`Usuario bloqueado hasta ${renter.blockedUntil.toLocaleString('es-PE')}`);
      } else {
        // Si ya pasó la fecha de bloqueo, desbloqueamos al usuario
        renter.unblock();
        await this.userRepository.update(renter);
      }
    }
    
    // Verificar si el arrendatario es distinto al propietario
    if (renter.id === vehicle.ownerId) {
      throw new BadRequestException('No puedes alquilar tu propio vehículo');
    }
    
    // Obtener propietario
    const owner = await this.userRepository.findById(vehicle.ownerId);
    
    if (!owner) {
      throw new NotFoundException('Propietario no encontrado');
    }
    
    // Convertir fechas de string a Date
    const startDate = new Date(createRentalDto.startDate);
    const endDate = new Date(createRentalDto.endDate);
    
    // Validar fechas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }
    
    if (startDate < new Date()) {
      throw new BadRequestException('La fecha de inicio no puede ser anterior a la fecha actual');
    }
    
    if (startDate >= endDate) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }
    
    // Verificar disponibilidad de fechas
    const availability = await this.checkVehicleAvailability(
      vehicle.id,
      startDate,
      endDate,
    );
    
    if (!availability.isAvailable) {
      throw new BadRequestException('El vehículo no está disponible para las fechas seleccionadas');
    }
    
    // Calcular duración del alquiler en días
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calcular precio base
    const basePrice = vehicle.dailyRate * diffDays;
    
    // Verificar si el usuario tiene descuento
    let discountPercentage = 0;
    if (renter.isEligibleForDiscount()) {
      discountPercentage = 10;
    }
    
    // Verificar si hay una contraoferta
    let counterofferAmount: number  | undefined = undefined;
    let counterofferStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' |  undefined = undefined ;
    
    
    if (createRentalDto.counterofferAmount) {
      counterofferAmount = createRentalDto.counterofferAmount;
      counterofferStatus = 'PENDING';
    }
    
    // Generar código de verificación (6 dígitos)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Crear el alquiler
    const rental = new Rental({
      id: uuidv4(),
      vehicleId: vehicle.id,
      renterId: renter.id,
      ownerId: owner.id,
      startDate,
      endDate,
      originalEndDate: endDate,
      basePrice,
      discountPercentage,
      additionalChargePercentage: 0,
      finalPrice: basePrice * (1 - (discountPercentage / 100)),
      status: RentalStatus.PENDING,
      verificationCode,
      paymentVerified: false,
      notes: createRentalDto.notes,
      counterofferAmount,
      counterofferStatus,
      isLateReturn: false,
      rentalDuration: diffDays,
    });
    
    // Guardar el alquiler
    const savedRental = await this.rentalRepository.create(rental);
    
    // Actualizar disponibilidad del vehículo
    // await this.vehicleRepository.updateAvailability(vehicle.id, false);
    
    // Enviar correo de confirmación
    await this.emailService.sendRentalConfirmation(savedRental, renter, vehicle, owner);
    
    return savedRental;
  }

  async getRentalById(id: string): Promise<Rental> {
    const rental = await this.rentalRepository.findById(id);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    return rental;
  }

  async getUserRentals(
    userId: string,
    role?: 'renter' | 'owner',
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    rentals: Rental[];
    count: number;
    totalPages: number;
  }> {
    return this.rentalRepository.findByUser(userId, role, status, page, limit);
  }

  async submitCounterOffer(id: string, amount: number): Promise<void> {
    const rental = await this.rentalRepository.findById(id);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    if (!rental.isPending()) {
      throw new BadRequestException('Solo se pueden hacer contraofertas en alquileres pendientes');
    }
    
    await this.rentalRepository.submitCounterOffer(id, amount);
  }

  async acceptCounterOffer(id: string): Promise<void> {
    const rental = await this.rentalRepository.findById(id);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    if (rental.counterofferStatus !== 'PENDING' || !rental.counterofferAmount) {
      throw new BadRequestException('No hay contraoferta pendiente para este alquiler');
    }
    
    await this.rentalRepository.acceptCounterOffer(id);
    
    // Notificar al arrendatario
    const renter = await this.userRepository.findById(rental.renterId);
    const vehicle = await this.vehicleRepository.findById(rental.vehicleId);
    
    if (renter && vehicle) {
      await this.emailService.sendNotificationEmail(
        renter,
        'Contraoferta aceptada',
        `Tu contraoferta de S/ ${rental.counterofferAmount.toFixed(2)} para el alquiler del vehículo ${vehicle.brand} ${vehicle.model} ha sido aceptada.`,
      );
    }
  }

  async rejectCounterOffer(id: string): Promise<void> {
    const rental = await this.rentalRepository.findById(id);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    if (rental.counterofferStatus !== 'PENDING' || !rental.counterofferAmount) {
      throw new BadRequestException('No hay contraoferta pendiente para este alquiler');
    }
    
    await this.rentalRepository.rejectCounterOffer(id);
    
    // Notificar al arrendatario
    const renter = await this.userRepository.findById(rental.renterId);
    const vehicle = await this.vehicleRepository.findById(rental.vehicleId);
    
    if (renter && vehicle) {
      await this.emailService.sendNotificationEmail(
        renter,
        'Contraoferta rechazada',
        `Tu contraoferta para el alquiler del vehículo ${vehicle.brand} ${vehicle.model} ha sido rechazada.`,
      );
    }
  }

  async verifyPayment(id: string, code: string): Promise<boolean> {
    const rental = await this.rentalRepository.findById(id);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    const isVerified = await this.rentalRepository.verifyPayment(id, code);
    
    if (isVerified) {
      // Marcar vehículo como no disponible
      const vehicle = await this.vehicleRepository.findById(rental.vehicleId);
      
      if (vehicle) {
        vehicle.markAsRented(rental.endDate);
        await this.vehicleRepository.update(vehicle);
      }
      
      // Notificar al arrendatario
      const renter = await this.userRepository.findById(rental.renterId);
      
      if (renter && vehicle) {
        await this.emailService.sendNotificationEmail(
          renter,
          'Pago verificado',
          `Tu pago para el alquiler del vehículo ${vehicle.brand} ${vehicle.model} ha sido verificado. El alquiler está ahora activo.`,
        );
      }
    }
    
    return isVerified;
  }

  async extendRental(id: string, newEndDate: Date): Promise<Rental> {
    const rental = await this.rentalRepository.findById(id);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    if (!rental.isActive()) {
      throw new BadRequestException('Solo se pueden extender alquileres activos');
    }
    
    // Verificar que la nueva fecha sea posterior a la actual
    if (newEndDate <= rental.endDate) {
      throw new BadRequestException('La nueva fecha de fin debe ser posterior a la fecha actual de fin');
    }
    
    // Verificar disponibilidad para las nuevas fechas
    const availability = await this.checkVehicleAvailability(
      rental.vehicleId,
      rental.endDate,
      newEndDate,
    );
    
    if (!availability.isAvailable) {
      throw new BadRequestException('El vehículo no está disponible para las fechas de extensión seleccionadas');
    }
    
    const extendedRental = await this.rentalRepository.extendRental(id, newEndDate);
    
    // Notificar al propietario
    const owner = await this.userRepository.findById(rental.ownerId);
    const vehicle = await this.vehicleRepository.findById(rental.vehicleId);
    
    if (owner && vehicle) {
      await this.emailService.sendNotificationEmail(
        owner,
        'Alquiler extendido',
        `El alquiler de tu vehículo ${vehicle.brand} ${vehicle.model} ha sido extendido hasta el ${newEndDate.toLocaleDateString('es-PE')}.`,
      );
    }
    
    return extendedRental;
  }

  async completeRental(id: string, returnDate: Date): Promise<Rental> {
    const rental = await this.rentalRepository.findById(id);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    if (!rental.isActive()) {
      throw new BadRequestException('Solo se pueden completar alquileres activos');
    }
    
    const completedRental = await this.rentalRepository.completeRental(id, returnDate);
    
    // Actualizar vehículo
    const vehicle = await this.vehicleRepository.findById(rental.vehicleId);
    
    if (vehicle) {
      // Incrementar contador de alquileres
      await this.vehicleRepository.incrementRentalCount(vehicle.id);
      
      // Actualizar fecha de último alquiler
      await this.vehicleRepository.updateLastRentalDate(vehicle.id, returnDate);
    }
    
    // Verificar si es una devolución tardía
    if (completedRental.isLateReturn) {
      const renter = await this.userRepository.findById(rental.renterId);
      
      if (renter) {
        // Bloquear usuario por 4 días
        await this.userRepository.blockUser(renter.id, 4);
        
        // Aplicar cargo adicional para el próximo alquiler (se manejará al crear el próximo alquiler)
        
        // Notificar al arrendatario
        await this.emailService.sendNotificationEmail(
          renter,
          'Penalización por devolución tardía',
          'Debido a la devolución tardía del vehículo, tu cuenta ha sido bloqueada por 4 días y se aplicará un cargo adicional del 15% en tu próximo alquiler.',
        );
      }
    }
    
    // Notificar a ambas partes
    const renter = await this.userRepository.findById(rental.renterId);
    const owner = await this.userRepository.findById(rental.ownerId);
    
    if (renter && owner && vehicle) {
      // Solicitar reseña al arrendatario
      await this.emailService.sendReviewRequestEmail(completedRental, renter, vehicle);
      
      // Notificar al propietario
      await this.emailService.sendNotificationEmail(
        owner,
        'Alquiler completado',
        `El alquiler de tu vehículo ${vehicle.brand} ${vehicle.model} ha sido marcado como completado.`,
      );
    }
    
    return completedRental;
  }

  async cancelRental(id: string): Promise<void> {
    const rental = await this.rentalRepository.findById(id);
    
    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }
    
    if (!rental.isPending() && !rental.isActive()) {
      throw new BadRequestException('Este alquiler no puede ser cancelado en su estado actual');
    }
    
    await this.rentalRepository.cancelRental(id);
    
    // Si el alquiler estaba activo, actualizar disponibilidad del vehículo
    if (rental.isActive()) {
      const vehicle = await this.vehicleRepository.findById(rental.vehicleId);
      
      if (vehicle) {
        await this.vehicleRepository.updateAvailability(vehicle.id, true);
      }
    }
    
    // Notificar a ambas partes
    const renter = await this.userRepository.findById(rental.renterId);
    const owner = await this.userRepository.findById(rental.ownerId);
    const vehicle = await this.vehicleRepository.findById(rental.vehicleId);
    
    if (renter && owner && vehicle) {
      // Notificar al arrendatario
      await this.emailService.sendNotificationEmail(
        renter,
        'Alquiler cancelado',
        `Tu alquiler del vehículo ${vehicle.brand} ${vehicle.model} ha sido cancelado.`,
      );
      
      // Notificar al propietario
      await this.emailService.sendNotificationEmail(
        owner,
        'Alquiler cancelado',
        `El alquiler de tu vehículo ${vehicle.brand} ${vehicle.model} ha sido cancelado.`,
      );
    }
  }

  private async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ isAvailable: boolean; conflictingDates?: Date[][] }> {
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