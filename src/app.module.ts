import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';


import configuration from './config/configuration';
import { AuthModule } from './presentation/modules/auth.module';
import { AwsModule } from './presentation/modules/aws.module';
import { DatabaseModule } from './presentation/modules/database.module';
import { EmailModule } from './presentation/modules/email.module';
import { NotificationModule } from './presentation/modules/notification.module';
import { RentalModule } from './presentation/modules/rental.module';
import { ReportModule } from './presentation/modules/report.module';
import { ReviewModule } from './presentation/modules/review.module';
import { SecurityModule } from './presentation/modules/security.module';
import { UserModule } from './presentation/modules/user.module';
import { VehicleModule } from './presentation/modules/vehicle.module';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    
    // Base de datos
    DatabaseModule,
    
    // Protección contra ataques de fuerza bruta
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60),
          limit: configService.get<number>('throttle.limit', 10),
        },
      ],
    }),
    
    // Tareas programadas
    ScheduleModule.forRoot(),
    
    // Módulos de la aplicación
    UserModule,
    AuthModule,
    VehicleModule,
    RentalModule,
    NotificationModule,
    ReviewModule,
    ReportModule,
    
    // Módulos de infraestructura
    AwsModule,
    EmailModule,
    SecurityModule,
  ],
  providers: [
    // Guard global para protección contra ataques de fuerza bruta
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}