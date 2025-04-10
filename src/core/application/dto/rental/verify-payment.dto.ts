import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Código de verificación del pago',
    example: '123456',
  })
  @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
  @IsString({ message: 'El código de verificación debe ser una cadena de texto' })
  @Length(6, 6, { message: 'El código de verificación debe tener 6 caracteres' })
  verificationCode: string;
}