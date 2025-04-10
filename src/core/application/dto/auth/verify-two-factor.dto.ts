import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTwoFactorDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsUUID(4, { message: 'El ID del usuario debe ser un UUID válido' })
  userId: string;

  @ApiProperty({
    description: 'Código de verificación',
    example: '123456',
  })
  @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
  @IsString({ message: 'El código de verificación debe ser una cadena de texto' })
  @Length(6, 6, { message: 'El código de verificación debe tener 6 dígitos' })
  code: string;

  @ApiProperty({
    description: 'Hash del código de verificación (para verificación)',
    example: '123456abcde',
  })
  @IsNotEmpty({ message: 'El hash del código es obligatorio' })
  @IsString({ message: 'El hash del código debe ser una cadena de texto' })
  hashedCode: string;
}