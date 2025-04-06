// src/presentation/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from 'src/core/domain/services/auth.service';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { UserMapper } from 'src/infrastructure/database/mappers/user.mapper';
import { TypeOrmUserRepository } from 'src/infrastructure/database/repositories/typeorm-user.repository';
import { JwtStrategy } from 'src/infrastructure/security/strategies/jwt.strategy';
import { AuthController } from '../controllers/auth.controller';
import { DatabaseModule } from './database.module';
import { EmailModule } from './email.module';
import { SecurityModule } from './security.module';



@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity]),
    EmailModule,
    SecurityModule,
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TypeOrmUserRepository,
    UserMapper,
    {
      provide: 'UserRepository',
      useClass: TypeOrmUserRepository,
    }
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}