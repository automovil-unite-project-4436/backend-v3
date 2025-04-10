import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Vision Rent API')
    .setDescription('API para aplicación de alquiler de vehículos')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Autenticación', 'Endpoints para gestión de usuarios y autenticación')
    .addTag('Vehículos', 'Endpoints para gestión de vehículos')
    .addTag('Alquileres', 'Endpoints para gestión de alquileres')
    .addTag('Reseñas', 'Endpoints para gestión de reseñas')
    .addTag('Reportes', 'Endpoints para gestión de reportes')
    .addTag('Notificaciones', 'Endpoints para gestión de notificaciones')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  
  // Personalizar opciones de Swagger UI
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'Vision Rent API Docs',
  };
  
  SwaggerModule.setup('api/docs', app, document, customOptions);
}