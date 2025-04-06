// src/presentation/modules/report/report.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from 'src/core/domain/services/report.service';
import { RentalEntity } from 'src/infrastructure/database/entities/rental.entity';
import { ReportEntity } from 'src/infrastructure/database/entities/report.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { RentalMapper } from 'src/infrastructure/database/mappers/rental.mapper';
import { ReportMapper } from 'src/infrastructure/database/mappers/report.mapper';
import { UserMapper } from 'src/infrastructure/database/mappers/user.mapper';
import { TypeOrmRentalRepository } from 'src/infrastructure/database/repositories/typeorm-rental.repository';
import { TypeOrmReportRepository } from 'src/infrastructure/database/repositories/typeorm-report.repository';
import { TypeOrmUserRepository } from 'src/infrastructure/database/repositories/typeorm-user.repository';
import { ReportController } from '../controllers/report.controller';
import { EmailModule } from './email.module';
import { RentalModule } from './rental.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity, UserEntity, RentalEntity]),
    EmailModule,
    RentalModule
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    TypeOrmReportRepository,
    TypeOrmUserRepository,
    TypeOrmRentalRepository,
    ReportMapper,
    UserMapper,
    RentalMapper,
    {
      provide: 'ReportRepository',
      useExisting: TypeOrmReportRepository,
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
  exports: [ReportService, 'ReportRepository'],
})
export class ReportModule {}