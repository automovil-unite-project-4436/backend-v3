import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { CreateVehicleDto } from '../../core/application/dto/vehicle/create-vehicle.dto';
import { UpdateVehicleDto } from '../../core/application/dto/vehicle/update-vehicle.dto';
import { SearchVehicleDto } from '../../core/application/dto/vehicle/search-vehicle.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthUser } from '../decorators/auth-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../core/domain/enums/user-role.enum';
import { ImageCategory } from '../../core/domain/enums/image-category.enum';
import { imageFileFilter } from '../validators/file-validators';
import { VehicleService } from 'src/core/domain/services/vehicle.service';

@ApiTags('Vehículos')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tiene el rol adecuado',
  })
  async createVehicle(
    @Body() createVehicleDto: CreateVehicleDto,
    @AuthUser('id') ownerId: string,
  ) {
    const vehicle = await this.vehicleService.createVehicle({
      ...createVehicleDto,
      ownerId,
    });

    return {
      message: 'Vehículo creado correctamente',
      vehicle,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Buscar vehículos disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos' })
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
  async findVehicles(@Query() searchVehicleDto: SearchVehicleDto) {
    const { vehicles, count, totalPages } =
      await this.vehicleService.searchVehicles(searchVehicleDto);

    return {
      vehicles,
      count,
      totalPages,
      currentPage: searchVehicleDto.page || 1,
    };
  }

  @Get('popular-brands')
  @ApiOperation({ summary: 'Obtener las marcas más populares' })
  @ApiResponse({ status: 200, description: 'Lista de marcas populares' })
  async getPopularBrands() {
    const brands = await this.vehicleService.getPopularBrands();

    return {
      brands,
    };
  }

  @Get('most-rented')
  @ApiOperation({ summary: 'Obtener los vehículos más alquilados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de vehículos más alquilados',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de elementos',
  })
  async getMostRentedVehicles(@Query('limit') limit: number = 10) {
    const vehicles = await this.vehicleService.getMostRentedVehicles(limit);

    return {
      vehicles,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por ID' })
  @ApiResponse({ status: 200, description: 'Detalles del vehículo' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async getVehicleById(@Param('id') id: string) {
    const vehicle = await this.vehicleService.getVehicleById(id);

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return {
      vehicle,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async updateVehicle(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @AuthUser('id') userId: string,
    @AuthUser('role') userRole: string,
  ) {
    // Verificar si el vehículo existe
    const vehicle = await this.vehicleService.getVehicleById(id);

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    // Verificar si es el propietario o un administrador
    if (vehicle.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este vehículo',
      );
    }

    const updatedVehicle = await this.vehicleService.updateVehicle(
      id,
      updateVehicleDto,
    );

    return {
      message: 'Vehículo actualizado correctamente',
      vehicle: updatedVehicle,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async deleteVehicle(
    @Param('id') id: string,
    @AuthUser('id') userId: string,
    @AuthUser('role') userRole: string,
  ) {
    // Verificar si el vehículo existe
    const vehicle = await this.vehicleService.getVehicleById(id);

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    // Verificar si es el propietario o un administrador
    if (vehicle.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este vehículo',
      );
    }

    await this.vehicleService.deleteVehicle(id);

    return {
      message: 'Vehículo eliminado correctamente',
    };
  }

  @Post(':id/availability')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar disponibilidad de un vehículo' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async toggleAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
    @AuthUser('id') userId: string,
  ) {
    // Verificar si el vehículo existe
    const vehicle = await this.vehicleService.getVehicleById(id);

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    // Verificar si es el propietario
    if (vehicle.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este vehículo',
      );
    }

    // Verificar si el vehículo puede cambiar su disponibilidad
    if (!vehicle.canBeRented() && isAvailable) {
      throw new BadRequestException(
        'Este vehículo no puede ser marcado como disponible actualmente',
      );
    }

    await this.vehicleService.updateVehicleAvailability(id, isAvailable);

    return {
      message: `Vehículo marcado como ${isAvailable ? 'disponible' : 'no disponible'} correctamente`,
    };
  }

  @Post(':id/main-image')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen principal del vehículo',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Subir imagen principal del vehículo' })
  @ApiResponse({ status: 200, description: 'Imagen subida' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async uploadMainImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthUser('id') userId: string,
  ) {
    // Verificar si el vehículo existe
    const vehicle = await this.vehicleService.getVehicleById(id);

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    // Verificar si es el propietario
    if (vehicle.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este vehículo',
      );
    }

    if (!file) {
      throw new BadRequestException('No se ha proporcionado ninguna imagen');
    }

    const imageUrl = await this.vehicleService.uploadVehicleImage(
      id,
      file,
      ImageCategory.VEHICLE_MAIN,
    );

    return {
      message: 'Imagen principal subida correctamente',
      imageUrl,
    };
  }

  @Post(':id/additional-images')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @UseInterceptors(
    FilesInterceptor('file', 5, {
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo por archivo
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imágenes adicionales del vehículo',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Subir imágenes adicionales del vehículo' })
  @ApiResponse({ status: 200, description: 'Imágenes subidas' })
  @ApiResponse({ status: 400, description: 'Archivos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async uploadAdditionalImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthUser('id') userId: string,
  ) {
    // Verificar si el vehículo existe
    const vehicle = await this.vehicleService.getVehicleById(id);

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    // Verificar si es el propietario
    if (vehicle.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este vehículo',
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No se han proporcionado imágenes');
    }

    const imageUrls = await this.vehicleService.uploadVehicleAdditionalImages(
      id,
      files,
    );

    return {
      message: 'Imágenes adicionales subidas correctamente',
      imageUrls,
    };
  }

  @Get('owner/:ownerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener vehículos de un propietario' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No es el propietario o administrador',
  })
  @ApiParam({ name: 'ownerId', description: 'ID del propietario' })
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
  async getOwnerVehicles(
    @Param('ownerId') ownerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @AuthUser('id') userId: string,
    @AuthUser('role') userRole: string,
  ) {
    // Verificar si es el propietario o un administrador
    if (ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para ver estos vehículos',
      );
    }

    const { vehicles, count, totalPages } =
      await this.vehicleService.getVehiclesByOwnerId(ownerId, page, limit);

    return {
      vehicles,
      count,
      totalPages,
      currentPage: page,
    };
  }

  @Get('check-availability/:id')
  @ApiOperation({
    summary: 'Verificar disponibilidad de un vehículo para fechas específicas',
  })
  @ApiResponse({ status: 200, description: 'Información de disponibilidad' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Fecha de inicio (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Fecha de fin (YYYY-MM-DD)',
  })
  async checkAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Convertir fechas de string a Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validar fechas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    if (start >= end) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    const availability = await this.vehicleService.checkVehicleAvailability(
      id,
      start,
      end,
    );

    return {
      vehicleId: id,
      startDate,
      endDate,
      isAvailable: availability.isAvailable,
      conflictingDates: availability.conflictingDates,
    };
  }
  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar un vehículo (solo admin)' })
  @ApiResponse({ status: 200, description: 'Vehículo verificado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es administrador' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  async verifyVehicle(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
    @Body('notes') notes?: string,
  ) {
    if (approved) {
      const vehicle = await this.vehicleService.verifyVehicle(id);
      return {
        message: 'Vehículo verificado correctamente',
        vehicle: {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          status: vehicle.status,
        },
      };
    } else {
      const vehicle = await this.vehicleService.rejectVehicle(id, notes);
      return {
        message: 'Vehículo rechazado',
        vehicle: {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          status: vehicle.status,
          rejectionNotes: notes,
        },
      };
    }
  }

  @Patch(':id/availability')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar disponibilidad de un vehículo' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada' })
  @ApiResponse({
    status: 400,
    description: 'No se puede cambiar la disponibilidad',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del vehículo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isAvailable: {
          type: 'boolean',
          description: 'Indica si el vehículo está disponible para alquilar',
        },
      },
      required: ['isAvailable'],
    },
  })
  async setAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
    @AuthUser('id') userId: string,
  ) {
    // Verificar si el vehículo existe
    const vehicle = await this.vehicleService.getVehicleById(id);

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    // Verificar si es el propietario
    if (vehicle.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este vehículo',
      );
    }

    // Verificar si el vehículo puede cambiar su disponibilidad
    if (isAvailable && !vehicle.canBeRented()) {
      throw new BadRequestException(
        'Este vehículo no puede ser marcado como disponible actualmente porque:' +
          (!vehicle.isVerified() ? ' No está verificado.' : '') +
          (vehicle.lastRentalEndDate &&
          this.isWithin24Hours(vehicle.lastRentalEndDate)
            ? ' Debe pasar al menos 24 horas desde el último alquiler.'
            : ''),
      );
    }

    await this.vehicleService.updateVehicleAvailability(id, isAvailable);

    return {
      message: `Vehículo marcado como ${isAvailable ? 'disponible' : 'no disponible'} correctamente`,
    };
  }

  // Método auxiliar
  private isWithin24Hours(date: Date): boolean {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours < 24;
  }
}
