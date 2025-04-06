// src/core/application/dto/user/update-user.dto.ts

import { 
    IsEmail, 
    IsString, 
    IsOptional, 
    MaxLength,
    Length,
    Matches
  } from 'class-validator';
  import { ApiPropertyOptional } from '@nestjs/swagger';
  
  export class UpdateUserDto {
    @ApiPropertyOptional({
      description: 'Correo electrónico del usuario',
      example: 'usuario@ejemplo.com',
    })
    @IsOptional()
    @IsEmail({}, { message: 'Ingrese un correo electrónico válido' })
    @MaxLength(100, { message: 'El correo electrónico no puede exceder los 100 caracteres' })
    email?: string;
  
    @ApiPropertyOptional({
      description: 'Nombre del usuario',
      example: 'Juan',
    })
    @IsOptional()
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres' })
    firstName?: string;
  
    @ApiPropertyOptional({
      description: 'Apellido del usuario',
      example: 'Pérez',
    })
    @IsOptional()
    @IsString({ message: 'El apellido debe ser una cadena de texto' })
    @MaxLength(50, { message: 'El apellido no puede exceder los 50 caracteres' })
    lastName?: string;
  
    @ApiPropertyOptional({
      description: 'Número de teléfono (formato peruano)',
      example: '987654321',
    })
    @IsOptional()
    @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
    @Length(9, 9, { message: 'El número de teléfono debe tener 9 dígitos (formato peruano)' })
    @Matches(/^9\d{8}$/, { message: 'El número de teléfono debe comenzar con 9 seguido de 8 dígitos (formato peruano)' })
    phoneNumber?: string;
  }