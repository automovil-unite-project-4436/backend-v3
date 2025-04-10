import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwoFactorAuthService } from 'src/infrastructure/security/two-factor-auth.service';
import { EmailModule } from './email.module';


@Module({
  imports: [ConfigModule, EmailModule],
  providers: [TwoFactorAuthService],
  exports: [TwoFactorAuthService],
})
export class SecurityModule {}