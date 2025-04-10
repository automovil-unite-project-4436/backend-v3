import { 
    IsOptional, 
    IsString, 
    IsNumber, 
    IsEnum, 
    IsInt, 
    Min, 
    Max 
  } from 'class-validator';
  import { ApiPropertyOptional } from '@nestjs/swagger';
  import { Type } from 'class-transformer';
  import { FuelType } from '../../../domain/enums/fuel-type.enum';
  import { TransmissionType } from '../../../domain/enums/transmission-type.enum';
  
  export class SearchVehicleDto {
    @ApiPropertyOptional({
      description: 'Marca del vehículo',
      example: 'Toyota',
    })
    @IsOptional()
    @IsString({ message: 'La marca debe ser una cadena de texto' })
    brand?: string;
  
    @ApiPropertyOptional({
      description: 'Modelo del vehículo',
      example: 'Corolla',
    })
    @IsOptional()
    @IsString({ message: 'El modelo debe ser una cadena de texto' })
    model?: string;
  
    @ApiPropertyOptional({
      description: 'Año mínimo del vehículo',
      example: 2018,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El año mínimo debe ser un número entero' })
    @Min(2000, { message: 'El año mínimo debe ser mayor o igual a 2000' })
    minYear?: number;
  
    @ApiPropertyOptional({
      description: 'Año máximo del vehículo',
      example: 2023,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El año máximo debe ser un número entero' })
    @Max(new Date().getFullYear() + 1, { message: `El año máximo no puede ser mayor a ${new Date().getFullYear() + 1}` })
    maxYear?: number;
  
    @ApiPropertyOptional({
      description: 'Número de asientos',
      example: 5,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El número de asientos debe ser un número entero' })
    @Min(1, { message: 'El número de asientos debe ser al menos 1' })
    @Max(15, { message: 'El número de asientos no puede ser mayor a 15' })
    seats?: number;
  
    @ApiPropertyOptional({
      description: 'Tipo de transmisión',
      enum: TransmissionType,
      example: TransmissionType.AUTOMATIC,
    })
    @IsOptional()
    @IsEnum(TransmissionType, { message: 'El tipo de transmisión no es válido' })
    transmission?: TransmissionType;
  
    @ApiPropertyOptional({
      description: 'Tipo de combustible',
      enum: FuelType,
      example: FuelType.GASOLINE,
    })
    @IsOptional()
    @IsEnum(FuelType, { message: 'El tipo de combustible no es válido' })
    fuelType?: FuelType;
  
    @ApiPropertyOptional({
      description: 'Tarifa diaria mínima (en soles peruanos)',
      example: 50,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'La tarifa diaria mínima debe ser un número' })
    @Min(0, { message: 'La tarifa diaria mínima no puede ser negativa' })
    minDailyRate?: number;
  
    @ApiPropertyOptional({
      description: 'Tarifa diaria máxima (en soles peruanos)',
      example: 200,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'La tarifa diaria máxima debe ser un número' })
    @Min(0, { message: 'La tarifa diaria máxima no puede ser negativa' })
    maxDailyRate?: number;
  
    @ApiPropertyOptional({
      description: 'Número de página',
      example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El número de página debe ser un número entero' })
    @Min(1, { message: 'El número de página debe ser al menos 1' })
    page?: number;
  
    @ApiPropertyOptional({
      description: 'Límite de elementos por página',
      example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El límite debe ser un número entero' })
    @Min(1, { message: 'El límite debe ser al menos 1' })
    @Max(50, { message: 'El límite no puede ser mayor a 50' })
    limit?: number;
  }