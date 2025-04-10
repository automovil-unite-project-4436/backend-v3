import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorAuthDto {
  @ApiProperty({
    description: 'Token de autenticación de dos factores',
    example: '123456',
  })
  @IsNotEmpty({ message: 'El token es obligatorio' })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @Length(6, 6, { message: 'El token debe tener 6 dígitos' })
  token: string;
}