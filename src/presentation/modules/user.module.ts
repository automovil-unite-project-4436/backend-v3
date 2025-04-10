import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from 'src/core/domain/services/user.service';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { UserMapper } from 'src/infrastructure/database/mappers/user.mapper';
import { TypeOrmUserRepository } from 'src/infrastructure/database/repositories/typeorm-user.repository';
import { UserController } from '../controllers/user.controller';
import { AwsModule } from './aws.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    AwsModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    TypeOrmUserRepository,
    UserMapper,
    {
      provide: 'UserRepository',
      useExisting: TypeOrmUserRepository,
    },
  ],
  exports: [UserService, 'UserRepository'],
})
export class UserModule {}