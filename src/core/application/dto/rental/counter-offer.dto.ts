import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CounterOfferDto {
  @ApiProperty({
    description: 'Monto de contraoferta (en soles peruanos)',
    example: 120.50,
    minimum: 10,
  })
  @IsNotEmpty({ message: 'El monto de contraoferta es obligatorio' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser un valor positivo' })
  @Min(10, { message: 'El monto debe ser al menos 10 soles' })
  amount: number;
}