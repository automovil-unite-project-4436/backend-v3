import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalService } from 'src/core/domain/services/rental.service';
import { RentalEntity } from 'src/infrastructure/database/entities/rental.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { VehicleEntity } from 'src/infrastructure/database/entities/vehicle.entity';
import { RentalMapper } from 'src/infrastructure/database/mappers/rental.mapper';
import { UserMapper } from 'src/infrastructure/database/mappers/user.mapper';
import { VehicleMapper } from 'src/infrastructure/database/mappers/vehicle.mapper';
import { TypeOrmRentalRepository } from 'src/infrastructure/database/repositories/typeorm-rental.repository';
import { TypeOrmUserRepository } from 'src/infrastructure/database/repositories/typeorm-user.repository';
import { TypeOrmVehicleRepository } from 'src/infrastructure/database/repositories/typeorm-vehicle.repository';
import { RentalController } from '../controllers/rental.controller';
import { EmailModule } from './email.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([RentalEntity, VehicleEntity, UserEntity]),
    EmailModule,
  ],
  controllers: [RentalController],
  providers: [
    RentalService,
    TypeOrmRentalRepository,
    TypeOrmVehicleRepository,
    TypeOrmUserRepository,
    RentalMapper,
    VehicleMapper,
    UserMapper,
    {
      provide: 'RentalRepository',
      useExisting: TypeOrmRentalRepository,
    },
    {
      provide: 'VehicleRepository',
      useExisting: TypeOrmVehicleRepository,
    },
    {
      provide: 'UserRepository',
      useExisting: TypeOrmUserRepository,
    },
  ],
  exports: [RentalService, 'RentalRepository'],
})
export class RentalModule {}