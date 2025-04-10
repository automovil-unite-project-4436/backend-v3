import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteRentalDto {
  @ApiPropertyOptional({
    description: 'Fecha de devolución real del vehículo (YYYY-MM-DD)',
    example: '2023-06-20T15:30:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de devolución debe tener un formato válido (YYYY-MM-DDThh:mm:ssZ)' })
  returnDate?: string;
}