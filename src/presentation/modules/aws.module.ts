// src/infrastructure/aws/aws.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from 'src/infrastructure/aws/s3.service';


@Module({
  imports: [ConfigModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class AwsModule {}