import { IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtendRentalDto {
  @ApiProperty({
    description: 'Nueva fecha de fin del alquiler (YYYY-MM-DD)',
    example: '2023-06-25',
  })
  @IsNotEmpty({ message: 'La nueva fecha de fin es obligatoria' })
  @IsDateString({}, { message: 'La nueva fecha de fin debe tener un formato válido (YYYY-MM-DD)' })
  newEndDate: string;
}