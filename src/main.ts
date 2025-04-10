import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { AllExceptionsFilter } from './presentation/filters/all-exceptions.filter';
import { TypeOrmModule } from '@nestjs/typeorm';

async function bootstrap() {
  // Crear la aplicación NestJS
  const app = await NestFactory.create(AppModule);
  
  // Obtener el servicio de configuración
  const configService = app.get(ConfigService);
  
  // Configurar middleware global
  app.use(helmet());
  // Aseguramos que compression se utilice correctamente como una función
  app.use(compression());
  app.enableCors();
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');
  
  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Configurar filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Configurar Swagger
  setupSwagger(app);


  
  // Obtener el puerto de la configuración
  const port = configService.get<number>('port') || 3000;
  
  // Iniciar la aplicación
  await app.listen(port);
}

bootstrap();