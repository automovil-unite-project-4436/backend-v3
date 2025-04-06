// src/core/application/dto/auth/register.dto.ts

import { 
    IsEmail, 
    IsEnum, 
    IsNotEmpty, 
    IsOptional, 
    IsString, 
    Length, 
    Matches, 
    MaxLength,
    MinLength 
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  import { UserRole } from '../../../domain/enums/user-role.enum';
  
  export class RegisterDto {
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
      minLength: 8,
    })
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @MaxLength(100, { message: 'La contraseña no puede exceder los 100 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial',
    })
    password: string;
  
    @ApiProperty({
      description: 'Nombre del usuario',
      example: 'Juan',
    })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres' })
    firstName: string;
  
    @ApiProperty({
      description: 'Apellido del usuario',
      example: 'Pérez',
    })
    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    @IsString({ message: 'El apellido debe ser una cadena de texto' })
    @MaxLength(50, { message: 'El apellido no puede exceder los 50 caracteres' })
    lastName: string;
  
    @ApiProperty({
      description: 'Número de teléfono (formato peruano)',
      example: '987654321',
    })
    @IsNotEmpty({ message: 'El número de teléfono es obligatorio' })
    @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
    @Length(9, 9, { message: 'El número de teléfono debe tener 9 dígitos (formato peruano)' })
    @Matches(/^9\d{8}$/, { message: 'El número de teléfono debe comenzar con 9 seguido de 8 dígitos (formato peruano)' })
    phoneNumber: string;
  
    @ApiProperty({
      description: 'Rol del usuario',
      enum: UserRole,
      default: UserRole.RENTER,
      required: false,
    })
    @IsOptional()
    @IsEnum(UserRole, { message: 'El rol debe ser RENTER u OWNER' })
    role?: UserRole;
  }