import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from 'src/core/domain/services/notification.service';
import { NotificationEntity } from 'src/infrastructure/database/entities/notification.entity';
import { RentalEntity } from 'src/infrastructure/database/entities/rental.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { VehicleEntity } from 'src/infrastructure/database/entities/vehicle.entity';
import { NotificationMapper } from 'src/infrastructure/database/mappers/notification.mapper';
import { RentalMapper } from 'src/infrastructure/database/mappers/rental.mapper';
import { UserMapper } from 'src/infrastructure/database/mappers/user.mapper';
import { VehicleMapper } from 'src/infrastructure/database/mappers/vehicle.mapper';
import { TypeOrmNotificationRepository } from 'src/infrastructure/database/repositories/typeorm-notification.repository';
import { TypeOrmUserRepository } from 'src/infrastructure/database/repositories/typeorm-user.repository';
import { NotificationController } from '../controllers/notification.controller';
import { EmailModule } from './email.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, UserEntity, RentalEntity, VehicleEntity]),
    ScheduleModule.forRoot(), // Para tareas programadas como recordatorios
    EmailModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    TypeOrmNotificationRepository,
    TypeOrmUserRepository,
    NotificationMapper,
    UserMapper,
    RentalMapper,
    VehicleMapper,
    {
      provide: 'NotificationRepository',
      useExisting: TypeOrmNotificationRepository,
    },
    {
      provide: 'UserRepository',
      useExisting: TypeOrmUserRepository,
    },
  ],
  exports: [NotificationService, 'NotificationRepository'],
})
export class NotificationModule {}