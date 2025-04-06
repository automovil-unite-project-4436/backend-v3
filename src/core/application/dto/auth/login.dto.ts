// src/core/application/dto/auth/login.dto.ts

import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'Ingrese un correo electrónico válido' })
  @MaxLength(100, { message: 'El correo electrónico no puede exceder los 100 caracteres' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}