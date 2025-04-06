// src/presentation/controllers/report.controller.ts

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


import { CreateReportDto } from '../../core/application/dto/report/create-report.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthUser } from '../decorators/auth-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../core/domain/enums/user-role.enum';
import { RentalService } from 'src/core/domain/services/rental.service';
import { ReportService } from 'src/core/domain/services/report.service';


@ApiTags('Reportes')
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly rentalService: RentalService,
  ) {}

  @Post(':rentalId')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un reporte sobre un arrendatario' })
  @ApiResponse({ status: 201, description: 'Reporte creado' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el alquiler no está completado',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es el propietario' })
  @ApiResponse({ status: 404, description: 'Alquiler no encontrado' })
  @ApiParam({ name: 'rentalId', description: 'ID del alquiler' })
  async createReport(
    @Param('rentalId') rentalId: string,
    @Body() createReportDto: CreateReportDto,
    @AuthUser('id') userId: string,
  ) {
    // Verificar si el alquiler existe
    const rental = await this.rentalService.getRentalById(rentalId);

    if (!rental) {
      throw new NotFoundException('Alquiler no encontrado');
    }

    // Verificar si el usuario es el propietario
    if (rental.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para crear un reporte para este alquiler',
      );
    }

    // Verificar si el alquiler está completado
    if (!rental.isCompleted()) {
      throw new BadRequestException(
        'Solo se pueden crear reportes para alquileres completados',
      );
    }

    // Verificar si ya existe un reporte para este alquiler
    const existingReport =
      await this.reportService.getReportByRentalId(rentalId);

    if (existingReport) {
      throw new BadRequestException('Ya existe un reporte para este alquiler');
    }

    const report = await this.reportService.createReport({
      rentalId,
      renterId: rental.renterId,
      ownerId: userId,
      reason: createReportDto.reason,
      description: createReportDto.description,
      severity: createReportDto.severity,
    });

    return {
      message: 'Reporte creado correctamente',
      report,
    };
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener reportes creados por el propietario' })
  @ApiResponse({ status: 200, description: 'Lista de reportes' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
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
  async getOwnerReports(
    @AuthUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const { reports, count, totalPages } =
      await this.reportService.getReportsByOwnerId(userId, page, limit);

    return {
      reports,
      count,
      totalPages,
      currentPage: page,
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los reportes (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de reportes' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es administrador' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Estado de los reportes',
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
  async getAllReports(
    @Query('status') status: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const { reports, count, totalPages } =
      await this.reportService.getAllReports(status, page, limit);

    return {
      reports,
      count,
      totalPages,
      currentPage: page,
    };
  }

  @Post(':id/process')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Procesar un reporte (solo admin)' })
  @ApiResponse({ status: 200, description: 'Reporte procesado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es administrador' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  async processReport(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @Body('applyPenalty') applyPenalty: boolean,
    @AuthUser('id') adminId: string,
  ) {
    const report = await this.reportService.getReportById(id);

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (!resolution) {
      throw new BadRequestException(
        'Debe proporcionar una resolución para el reporte',
      );
    }

    await this.reportService.processReport(id, {
      adminId,
      resolution,
      applyPenalty,
    });

    return {
      message: 'Reporte procesado correctamente',
    };
  }
}
