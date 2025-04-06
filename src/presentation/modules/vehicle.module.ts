// src/presentation/modules/vehicle/vehicle.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleService } from 'src/core/domain/services/vehicle.service';
import { RentalEntity } from 'src/infrastructure/database/entities/rental.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { VehicleEntity } from 'src/infrastructure/database/entities/vehicle.entity';
import { RentalMapper } from 'src/infrastructure/database/mappers/rental.mapper';
import { UserMapper } from 'src/infrastructure/database/mappers/user.mapper';
import { VehicleMapper } from 'src/infrastructure/database/mappers/vehicle.mapper';
import { TypeOrmRentalRepository } from 'src/infrastructure/database/repositories/typeorm-rental.repository';
import { TypeOrmUserRepository } from 'src/infrastructure/database/repositories/typeorm-user.repository';
import { TypeOrmVehicleRepository } from 'src/infrastructure/database/repositories/typeorm-vehicle.repository';
import { VehicleController } from '../controllers/vehicle.controller';
import { AwsModule } from './aws.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleEntity, UserEntity, RentalEntity]),
    AwsModule,
  ],
  controllers: [VehicleController],
  providers: [
    VehicleService,
    TypeOrmVehicleRepository,
    TypeOrmUserRepository,
    TypeOrmRentalRepository,
    VehicleMapper,
    UserMapper,
    RentalMapper,
    {
      provide: 'VehicleRepository',
      useExisting: TypeOrmVehicleRepository,
    },
    {
      provide: 'UserRepository',
      useExisting: TypeOrmUserRepository,
    },
    {
      provide: 'RentalRepository',
      useExisting: TypeOrmRentalRepository,
    },
  ],
  exports: [VehicleService, 'VehicleRepository'],
})
export class VehicleModule {}