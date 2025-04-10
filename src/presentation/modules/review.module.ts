import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from 'src/core/domain/services/review.service';
import { RentalEntity } from 'src/infrastructure/database/entities/rental.entity';
import { ReviewEntity } from 'src/infrastructure/database/entities/review.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { VehicleEntity } from 'src/infrastructure/database/entities/vehicle.entity';
import { RentalMapper } from 'src/infrastructure/database/mappers/rental.mapper';
import { ReviewMapper } from 'src/infrastructure/database/mappers/review.mapper';
import { UserMapper } from 'src/infrastructure/database/mappers/user.mapper';
import { VehicleMapper } from 'src/infrastructure/database/mappers/vehicle.mapper';
import { TypeOrmRentalRepository } from 'src/infrastructure/database/repositories/typeorm-rental.repository';
import { TypeOrmReviewRepository } from 'src/infrastructure/database/repositories/typeorm-review.repository';
import { TypeOrmUserRepository } from 'src/infrastructure/database/repositories/typeorm-user.repository';
import { TypeOrmVehicleRepository } from 'src/infrastructure/database/repositories/typeorm-vehicle.repository';
import { ReviewController } from '../controllers/review.controller';
import { EmailModule } from './email.module';
import { RentalModule } from './rental.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, VehicleEntity, UserEntity, RentalEntity]),
    EmailModule,
    RentalModule
  ],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    TypeOrmReviewRepository,
    TypeOrmVehicleRepository,
    TypeOrmUserRepository,
    TypeOrmRentalRepository,
    ReviewMapper,
    VehicleMapper,
    UserMapper,
    RentalMapper,
    {
      provide: 'ReviewRepository',
      useExisting: TypeOrmReviewRepository,
    },
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
  exports: [ReviewService, 'ReviewRepository'],
})
export class ReviewModule {}