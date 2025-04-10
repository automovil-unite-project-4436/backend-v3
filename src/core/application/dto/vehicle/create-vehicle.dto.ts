import { 
    IsNotEmpty, 
    IsString, 
    IsNumber, 
    IsEnum, 
    IsPositive, 
    Min, 
    Max, 
    IsInt, 
    MinLength, 
    MaxLength,
    Matches
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  import { FuelType } from '../../../domain/enums/fuel-type.enum';
  import { TransmissionType } from '../../../domain/enums/transmission-type.enum';
  
  export class CreateVehicleDto {
    @ApiProperty({
      description: 'Marca del vehículo',
      example: 'Toyota',
    })
    @IsNotEmpty({ message: 'La marca es obligatoria' })
    @IsString({ message: 'La marca debe ser una cadena de texto' })
    @MaxLength(50, { message: 'La marca no puede exceder los 50 caracteres' })
    brand: string;
  
    @ApiProperty({
      description: 'Modelo del vehículo',
      example: 'Corolla',
    })
    @IsNotEmpty({ message: 'El modelo es obligatorio' })
    @IsString({ message: 'El modelo debe ser una cadena de texto' })
    @MaxLength(50, { message: 'El modelo no puede exceder los 50 caracteres' })
    model: string;
  
    @ApiProperty({
      description: 'Año del vehículo',
      example: 2020,
      minimum: 2000,
      maximum: new Date().getFullYear() + 1,
    })
    @IsNotEmpty({ message: 'El año es obligatorio' })
    @IsInt({ message: 'El año debe ser un número entero' })
    @Min(2000, { message: 'El año debe ser mayor o igual a 2000' })
    @Max(new Date().getFullYear() + 1, { message: `El año no puede ser mayor a ${new Date().getFullYear() + 1}` })
    year: number;
  
    @ApiProperty({
      description: 'Placa del vehículo (formato peruano)',
      example: 'ABC-123',
    })
    @IsNotEmpty({ message: 'La placa es obligatoria' })
    @IsString({ message: 'La placa debe ser una cadena de texto' })
    @MaxLength(20, { message: 'La placa no puede exceder los 20 caracteres' })
    @Matches(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/, { message: 'La placa debe tener el formato peruano (ABC-123)' })
    licensePlate: string;
  
    @ApiProperty({
      description: 'Color del vehículo',
      example: 'Rojo',
    })
    @IsNotEmpty({ message: 'El color es obligatorio' })
    @IsString({ message: 'El color debe ser una cadena de texto' })
    @MaxLength(50, { message: 'El color no puede exceder los 50 caracteres' })
    color: string;
  
    @ApiProperty({
      description: 'Tipo de combustible',
      enum: FuelType,
      example: FuelType.GASOLINE,
    })
    @IsNotEmpty({ message: 'El tipo de combustible es obligatorio' })
    @IsEnum(FuelType, { message: 'El tipo de combustible no es válido' })
    fuelType: FuelType;
  
    @ApiProperty({
      description: 'Tipo de transmisión',
      enum: TransmissionType,
      example: TransmissionType.AUTOMATIC,
    })
    @IsNotEmpty({ message: 'El tipo de transmisión es obligatorio' })
    @IsEnum(TransmissionType, { message: 'El tipo de transmisión no es válido' })
    transmission: TransmissionType;
  
    @ApiProperty({
      description: 'Número de asientos',
      example: 5,
      minimum: 1,
      maximum: 15,
    })
    @IsNotEmpty({ message: 'El número de asientos es obligatorio' })
    @IsInt({ message: 'El número de asientos debe ser un número entero' })
    @Min(1, { message: 'El número de asientos debe ser al menos 1' })
    @Max(15, { message: 'El número de asientos no puede ser mayor a 15' })
    seats: number;
  
    @ApiProperty({
      description: 'Tarifa diaria (en soles peruanos)',
      example: 150.50,
      minimum: 10,
    })
    @IsNotEmpty({ message: 'La tarifa diaria es obligatoria' })
    @IsNumber({}, { message: 'La tarifa diaria debe ser un número' })
    @IsPositive({ message: 'La tarifa diaria debe ser un valor positivo' })
    @Min(10, { message: 'La tarifa diaria debe ser al menos 10 soles' })
    dailyRate: number;
  
    @ApiProperty({
      description: 'Descripción del vehículo',
      example: 'Vehículo en excelente estado, con aire acondicionado y sistema de navegación.',
    })
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
    description: string;
  }