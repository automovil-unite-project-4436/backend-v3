import {
    Controller,
    Get,
    Post,
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
  

  import { CreateReviewDto } from '../../core/application/dto/review/create-review.dto';
  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  import { TwoFactorGuard } from '../guards/two-factor.guard';
  import { RolesGuard } from '../guards/roles.guard';
  import { AuthUser } from '../decorators/auth-user.decorator';
  import { Roles } from '../decorators/roles.decorator';
  import { UserRole } from '../../core/domain/enums/user-role.enum';
import { RentalService } from 'src/core/domain/services/rental.service';
import { ReviewService } from 'src/core/domain/services/review.service';

  
  @ApiTags('Reseñas')
  @Controller('reviews')
  export class ReviewController {
    constructor(
      private readonly reviewService: ReviewService,
      private readonly rentalService: RentalService,
    ) {}
  
    @Post('vehicle/:rentalId')
    @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
    @Roles(UserRole.RENTER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear una reseña para un vehículo' })
    @ApiResponse({ status: 201, description: 'Reseña creada' })
    @ApiResponse({ status: 400, description: 'Datos inválidos o el alquiler no está completado' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Prohibido - No es el arrendatario' })
    @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
    @ApiParam({ name: 'rentalId', description: 'ID del alquiler' })
    async createVehicleReview(
      @Param('rentalId') rentalId: string,
      @Body() createReviewDto: CreateReviewDto,
      @AuthUser('id') userId: string,
    ) {
      // Verificar si el alquiler existe
      const rental = await this.rentalService.getRentalById(rentalId);
      
      if (!rental) {
        throw new NotFoundException('Alquiler no encontrado');
      }
      
      // Verificar si el usuario es el arrendatario
      if (rental.renterId !== userId) {
        throw new ForbiddenException('No tienes permiso para crear una reseña para este alquiler');
      }
      
      // Verificar si el alquiler está completado
      if (!rental.isCompleted()) {
        throw new BadRequestException('Solo se pueden crear reseñas para alquileres completados');
      }
      
      // Verificar si ya existe una reseña para este alquiler
      const existingReview = await this.reviewService.getReviewByRentalId(rentalId);
      
      if (existingReview) {
        throw new BadRequestException('Ya existe una reseña para este alquiler');
      }
      
      const review = await this.reviewService.createVehicleReview({
        rentalId,
        vehicleId: rental.vehicleId,
        renterId: userId,
        ownerId: rental.ownerId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      });
      
      return {
        message: 'Reseña creada correctamente',
        review,
      };
    }
  
    @Post('renter/:rentalId')
    @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
    @Roles(UserRole.OWNER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear una reseña para un arrendatario' })
    @ApiResponse({ status: 201, description: 'Reseña creada' })
    @ApiResponse({ status: 400, description: 'Datos inválidos o el alquiler no está completado' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
    @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
    @ApiParam({ name: 'rentalId', description: 'ID del alquiler' })
    async createRenterReview(
      @Param('rentalId') rentalId: string,
      @Body() createReviewDto: CreateReviewDto,
      @AuthUser('id') userId: string,
    ) {
      // Verificar si el alquiler existe
      const rental = await this.rentalService.getRentalById(rentalId);
      
      if (!rental) {
        throw new NotFoundException('Alquiler no encontrado');
      }
      
      // Verificar si el usuario es el propietario
      if (rental.ownerId !== userId) {
        throw new ForbiddenException('No tienes permiso para crear una reseña para este alquiler');
      }
      
      // Verificar si el alquiler está completado
      if (!rental.isCompleted()) {
        throw new BadRequestException('Solo se pueden crear reseñas para alquileres completados');
      }
      
      // Verificar si ya existe una reseña para este arrendatario en este alquiler
      const existingReview = await this.reviewService.getRenterReviewByRentalId(rentalId);
      
      if (existingReview) {
        throw new BadRequestException('Ya existe una reseña para este arrendatario en este alquiler');
      }
      
      const review = await this.reviewService.createRenterReview({
        rentalId,
        renterId: rental.renterId,
        ownerId: userId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      });
      
      return {
        message: 'Reseña creada correctamente',
        review,
      };
    }
  
    @Get('vehicle/:vehicleId')
    @ApiOperation({ summary: 'Obtener reseñas de un vehículo' })
    @ApiResponse({ status: 200, description: 'Lista de reseñas' })
    @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
    @ApiParam({ name: 'vehicleId', description: 'ID del vehículo' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de elementos por página' })
    async getVehicleReviews(
      @Param('vehicleId') vehicleId: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      const { reviews, count, totalPages } = await this.reviewService.getVehicleReviews(
        vehicleId,
        page,
        limit,
      );
      
      return {
        reviews,
        count,
        totalPages,
        currentPage: page,
      };
    }
  
    @Get('renter/:userId')
    @ApiOperation({ summary: 'Obtener reseñas de un arrendatario' })
    @ApiResponse({ status: 200, description: 'Lista de reseñas' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @ApiParam({ name: 'userId', description: 'ID del arrendatario' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de elementos por página' })
    async getRenterReviews(
      @Param('userId') userId: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      const { reviews, count, totalPages } = await this.reviewService.getRenterReviews(
        userId,
        page,
        limit,
      );
      
      return {
        reviews,
        count,
        totalPages,
        currentPage: page,
      };
    }
  }