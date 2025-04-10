import { 
    IsNotEmpty, 
    IsUUID, 
    IsDateString, 
    IsOptional, 
    ValidateIf,
    IsString, 
    MinLength,
    MaxLength
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { Type } from 'class-transformer';
  
  export class CreateRentalDto {
    @ApiProperty({
      description: 'ID del vehículo',
      example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty({ message: 'El ID del vehículo es obligatorio' })
    @IsUUID(4, { message: 'El ID del vehículo debe ser un UUID válido' })
    vehicleId: string;
  
    @ApiProperty({
      description: 'Fecha de inicio del alquiler (YYYY-MM-DD)',
      example: '2023-06-15',
    })
    @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
    @IsDateString({}, { message: 'La fecha de inicio debe tener un formato válido (YYYY-MM-DD)' })
    startDate: string;
  
    @ApiProperty({
      description: 'Fecha de fin del alquiler (YYYY-MM-DD)',
      example: '2023-06-20',
    })
    @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
    @IsDateString({}, { message: 'La fecha de fin debe tener un formato válido (YYYY-MM-DD)' })
    endDate: string;
  
    @ApiPropertyOptional({
      description: 'Notas adicionales sobre el alquiler',
      example: 'Necesito el vehículo temprano en la mañana.',
    })
    @IsOptional()
    @IsString({ message: 'Las notas deben ser una cadena de texto' })
    @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
    notes?: string;
  
    @ApiPropertyOptional({
      description: 'Monto de contraoferta (en soles peruanos)',
      example: 120.50,
    })
    @IsOptional()
    @Type(() => Number)
    @ValidateIf(o => o.counterofferAmount !== undefined && o.counterofferAmount !== null)
    counterofferAmount?: number;
  }