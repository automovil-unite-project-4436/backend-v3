import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';


import { CreateRentalDto } from '../../core/application/dto/rental/create-rental.dto';
import { CounterOfferDto } from '../../core/application/dto/rental/counter-offer.dto';
import { ExtendRentalDto } from '../../core/application/dto/rental/extend-rental.dto';
import { CompleteRentalDto } from '../../core/application/dto/rental/complete-rental.dto';
import { VerifyPaymentDto } from '../../core/application/dto/rental/verify-payment.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthUser } from '../decorators/auth-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../core/domain/enums/user-role.enum';
import { RentalService } from 'src/core/domain/services/rental.service';

@ApiTags('Alquileres')
@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.RENTER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva solicitud de alquiler' })
  @ApiResponse({ status: 201, description: 'Solicitud de alquiler creada' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o vehículo no disponible',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tiene el rol adecuado',
  })
  async createRental(
    @Body() createRentalDto: CreateRentalDto,
    @AuthUser('id') renterId: string,
  ) {
    const rental = await this.rentalService.createRental({
      ...createRentalDto,
      renterId,
    });

    return {
      message: 'Solicitud de alquiler creada correctamente',
      rental,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalles de un alquiler' })
  @ApiResponse({ status: 200, description: 'Detalles del alquiler' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No es parte del alquiler',
  })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del alquiler' })
  async getRentalById(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @AuthUser('role') userRole: string,
  ) {
    const rental = await this.rentalService.getRentalById(id);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es parte del alquiler o es admin
    if (
      rental.renterId !== userId &&
      rental.ownerId !== userId &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('No tienes permiso para ver este alquiler');
    }

    return {
      rental,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de alquileres del usuario' })
  @ApiResponse({ status: 200, description: 'Historial de alquileres' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['renter', 'owner'],
    description: 'Rol para filtrar (para usuarios que son ambos)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Estado del alquiler para filtrar',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de elementos por página',
  })
  async getUserRentals(
    @AuthUser('id') userId: string,
    @Query('role') role?: 'renter' | 'owner',
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const { rentals, count, totalPages } =
      await this.rentalService.getUserRentals(
        userId,
        role,
        status,
        page,
        limit,
      );

    return {
      rentals,
      count,
      totalPages,
      currentPage: page,
    };
  }

  @Post(':id/counter-offer')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.RENTER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Realizar una contraoferta para el alquiler' })
  @ApiResponse({ status: 200, description: 'Contraoferta realizada' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o alquiler no está en estado pendiente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No es el arrendatario',
  })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del alquiler' })
  async submitCounterOffer(
    @Param('id') id: string,
    @Body() counterOfferDto: CounterOfferDto,
    @AuthUser('id') userId: string,
  ) {
    const rental = await this.rentalService.getRentalById(id);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es el arrendatario
    if (rental.renterId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para hacer una contraoferta en este alquiler',
      );
    }

    // Verificar si el alquiler está en estado pendiente
    if (!rental.isPending()) {
      throw new BadRequestException(
        'Solo se pueden hacer contraofertas en alquileres pendientes',
      );
    }

    await this.rentalService.submitCounterOffer(id, counterOfferDto.amount);

    return {
      message: 'Contraoferta enviada correctamente',
    };
  }

  @Post(':id/accept-counter-offer')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceptar una contraoferta' })
  @ApiResponse({ status: 200, description: 'Contraoferta aceptada' })
  @ApiResponse({ status: 400, description: 'No hay contraoferta pendiente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del alquiler' })
  async acceptCounterOffer(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
  ) {
    const rental = await this.rentalService.getRentalById(id);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es el propietario
    if (rental.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para aceptar una contraoferta en este alquiler',
      );
    }

    // Verificar si hay una contraoferta pendiente
    if (rental.counterofferStatus !== 'PENDING' || !rental.counterofferAmount) {
      throw new BadRequestException(
        'No hay contraoferta pendiente para este alquiler',
      );
    }

    await this.rentalService.acceptCounterOffer(id);

    return {
      message: 'Contraoferta aceptada correctamente',
    };
  }

  @Post(':id/reject-counter-offer')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar una contraoferta' })
  @ApiResponse({ status: 200, description: 'Contraoferta rechazada' })
  @ApiResponse({ status: 400, description: 'No hay contraoferta pendiente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del alquiler' })
  async rejectCounterOffer(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
  ) {
    const rental = await this.rentalService.getRentalById(id);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es el propietario
    if (rental.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para rechazar una contraoferta en este alquiler',
      );
    }

    // Verificar si hay una contraoferta pendiente
    if (rental.counterofferStatus !== 'PENDING' || !rental.counterofferAmount) {
      throw new BadRequestException(
        'No hay contraoferta pendiente para este alquiler',
      );
    }

    await this.rentalService.rejectCounterOffer(id);

    return {
      message: 'Contraoferta rechazada correctamente',
    };
  }

  @Post(':id/verify-payment')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar el pago de un alquiler' })
  @ApiResponse({ status: 200, description: 'Pago verificado' })
  @ApiResponse({ status: 400, description: 'Código de verificación inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del alquiler' })
  async verifyPayment(
    @Param('id') id: string,
    @Body() verifyPaymentDto: VerifyPaymentDto,
    @AuthUser('id') userId: string,
  ) {
    const rental = await this.rentalService.getRentalById(id);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es el propietario
    if (rental.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para verificar el pago de este alquiler',
      );
    }

    const isVerified = await this.rentalService.verifyPayment(
      id,
      verifyPaymentDto.verificationCode,
    );

    if (!isVerified) {
      throw new BadRequestException('Código de verificación inválido');
    }

    return {
      message: 'Pago verificado correctamente. El alquiler está ahora activo.',
    };
  }

  @Post(':id/extend')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.RENTER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extender la duración de un alquiler' })
  @ApiResponse({ status: 200, description: 'Alquiler extendido' })
  @ApiResponse({ status: 400, description: 'No se puede extender el alquiler' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No es el arrendatario',
  })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del alquiler' })
  async extendRental(
    @Param('id') id: string,
    @Body() extendRentalDto: ExtendRentalDto,
    @AuthUser('id') userId: string,
  ) {
    const rental = await this.rentalService.getRentalById(id);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es el arrendatario
    if (rental.renterId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para extender este alquiler',
      );
    }

    // Verificar si el alquiler está activo
    if (!rental.isActive()) {
      throw new BadRequestException(
        'Solo se pueden extender alquileres activos',
      );
    }

    const newEndDate = new Date(extendRentalDto.newEndDate);

    // Verificar que la nueva fecha sea posterior a la actual
    if (newEndDate <= rental.endDate) {
      throw new BadRequestException(
        'La nueva fecha de fin debe ser posterior a la fecha actual de fin',
      );
    }

    const extendedRental = await this.rentalService.extendRental(
      id,
      newEndDate,
    );

    return {
      message: 'Alquiler extendido correctamente',
      rental: extendedRental,
    };
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar un alquiler como completado' })
  @ApiResponse({ status: 200, description: 'Alquiler completado' })
  @ApiResponse({ status: 400, description: 'El alquiler no está activo' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del alquiler' })
  async completeRental(
    @Param('id') id: string,
    @Body() completeRentalDto: CompleteRentalDto,
    @AuthUser('id') userId: string,
  ) {
    const rental = await this.rentalService.getRentalById(id);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es el propietario
    if (rental.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para completar este alquiler',
      );
    }

    // Verificar si el alquiler está activo
    if (!rental.isActive()) {
      throw new BadRequestException(
        'Solo se pueden completar alquileres activos',
      );
    }

    const completedRental = await this.rentalService.completeRental(
      id,
      new Date(completeRentalDto.returnDate || new Date()),
    );

    return {
      message: 'Alquiler completado correctamente',
      rental: completedRental,
    };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar un alquiler' })
  @ApiResponse({ status: 200, description: 'Alquiler cancelado' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar el alquiler' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No es parte del alquiler',
  })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del alquiler' })
  async cancelRental(@Param('id') id: string, @AuthUser('id') userId: string) {
    const rental = await this.rentalService.getRentalById(id);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es parte del alquiler
    if (rental.renterId !== userId && rental.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para cancelar este alquiler',
      );
    }

    // Verificar si el alquiler está en estado que permite cancelación
    if (!rental.isPending() && !rental.isActive()) {
      throw new BadRequestException(
        'Este alquiler no puede ser cancelado en su estado actual',
      );
    }

    await this.rentalService.cancelRental(id);

    return {
      message: 'Alquiler cancelado correctamente',
    };
  }
}
