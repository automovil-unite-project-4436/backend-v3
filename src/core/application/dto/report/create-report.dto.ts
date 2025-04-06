// src/core/application/dto/report/create-report.dto.ts

import { 
    IsNotEmpty, 
    IsString, 
    IsEnum, 
    MinLength, 
    MaxLength 
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  import { ReportSeverity } from '../../../domain/enums/report-severity.enum';
  
  export class CreateReportDto {
    @ApiProperty({
      description: 'Razón del reporte',
      example: 'Vehículo devuelto en mal estado',
    })
    @IsNotEmpty({ message: 'La razón es obligatoria' })
    @IsString({ message: 'La razón debe ser una cadena de texto' })
    @MinLength(5, { message: 'La razón debe tener al menos 5 caracteres' })
    @MaxLength(100, { message: 'La razón no puede exceder los 100 caracteres' })
    reason: string;
  
    @ApiProperty({
      description: 'Descripción detallada del reporte',
      example: 'El vehículo fue devuelto con rayones en la puerta del conductor y con el tanque de combustible vacío.',
    })
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
    @MaxLength(1000, { message: 'La descripción no puede exceder los 1000 caracteres' })
    description: string;
  
    @ApiProperty({
      description: 'Severidad del reporte',
      enum: ReportSeverity,
      example: ReportSeverity.MEDIUM,
    })
    @IsNotEmpty({ message: 'La severidad es obligatoria' })
    @IsEnum(ReportSeverity, { message: 'La severidad no es válida' })
    severity: ReportSeverity;
  }