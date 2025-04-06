// src/core/application/dto/review/create-review.dto.ts

import { 
    IsNotEmpty, 
    IsString, 
    IsNumber, 
    Min, 
    Max, 
    MinLength, 
    MaxLength 
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  import { Type } from 'class-transformer';
  
  export class CreateReviewDto {
    @ApiProperty({
      description: 'Calificación (1-5)',
      example: 4.5,
      minimum: 1,
      maximum: 5,
    })
    @IsNotEmpty({ message: 'La calificación es obligatoria' })
    @Type(() => Number)
    @IsNumber({}, { message: 'La calificación debe ser un número' })
    @Min(1, { message: 'La calificación mínima es 1' })
    @Max(5, { message: 'La calificación máxima es 5' })
    rating: number;
  
    @ApiProperty({
      description: 'Comentario de la reseña',
      example: 'Excelente experiencia, el vehículo estaba en perfecto estado y el proceso fue muy sencillo.',
    })
    @IsNotEmpty({ message: 'El comentario es obligatorio' })
    @IsString({ message: 'El comentario debe ser una cadena de texto' })
    @MinLength(10, { message: 'El comentario debe tener al menos 10 caracteres' })
    @MaxLength(500, { message: 'El comentario no puede exceder los 500 caracteres' })
    comment: string;
  }