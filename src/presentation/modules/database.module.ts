import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RentalEntity } from 'src/infrastructure/database/entities/rental.entity';
import { ReportEntity } from 'src/infrastructure/database/entities/report.entity';
import { ReviewEntity } from 'src/infrastructure/database/entities/review.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { VehicleEntity } from 'src/infrastructure/database/entities/vehicle.entity';
import { UserMapper } from 'src/infrastructure/database/mappers/user.mapper';
import { TypeOrmRentalRepository } from 'src/infrastructure/database/repositories/typeorm-rental.repository';
import { TypeOrmUserRepository } from 'src/infrastructure/database/repositories/typeorm-user.repository';
import { TypeOrmVehicleRepository } from 'src/infrastructure/database/repositories/typeorm-vehicle.repository';
import { RentalMapper } from 'src/infrastructure/database/mappers/rental.mapper';
import { ReportMapper } from 'src/infrastructure/database/mappers/report.mapper';
import { ReviewMapper } from 'src/infrastructure/database/mappers/review.mapper';
import { VehicleMapper } from 'src/infrastructure/database/mappers/vehicle.mapper';
import { TypeOrmReportRepository } from 'src/infrastructure/database/repositories/typeorm-report.repository';
import { TypeOrmReviewRepository } from 'src/infrastructure/database/repositories/typeorm-review.repository';

import { NotificationMapper } from 'src/infrastructure/database/mappers/notification.mapper';
import { NotificationEntity } from 'src/infrastructure/database/entities/notification.entity';
import { TypeOrmNotificationRepository } from 'src/infrastructure/database/repositories/typeorm-notification.repository';


@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [
          UserEntity, 
          VehicleEntity, 
          RentalEntity, 
          ReviewEntity, 
          ReportEntity,
          NotificationEntity
        ],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
        timezone: '+00:00',
        charset: 'utf8mb4_unicode_ci',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      UserEntity, 
      VehicleEntity, 
      RentalEntity, 
      ReviewEntity, 
      ReportEntity,
      NotificationEntity,
    ]),
  ],
  providers: [
    UserMapper,
    VehicleMapper,
    RentalMapper,
    ReviewMapper,
    ReportMapper,
    NotificationMapper,

    TypeOrmUserRepository,
    TypeOrmVehicleRepository,
    TypeOrmRentalRepository,
    TypeOrmReviewRepository,
    TypeOrmReportRepository,
    TypeOrmNotificationRepository,
    {
      provide: 'NotificationRepository',
      useExisting: TypeOrmNotificationRepository,
    },
    {
      provide: 'UserRepository',
      useExisting: TypeOrmUserRepository,
    },
    {
      provide: 'VehicleRepository',
      useExisting: TypeOrmVehicleRepository,
    },
    {
      provide: 'RentalRepository',
      useExisting: TypeOrmRentalRepository,
    },
    {
      provide: 'ReviewRepository',
      useExisting: TypeOrmReviewRepository,
    },
    {
      provide: 'ReportRepository',
      useExisting: TypeOrmReportRepository,
    },
    
  ],
  exports: [
    TypeOrmModule,
    UserMapper,
    VehicleMapper,
    RentalMapper,
    ReviewMapper,
    ReportMapper,
    NotificationMapper,
    'NotificationRepository',
    'UserRepository',
    'VehicleRepository',
    'RentalRepository',
    'ReviewRepository',
    'ReportRepository',
  ],
})
export class DatabaseModule {}