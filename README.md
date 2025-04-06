# Car Rental API - Backend

Backend para aplicación de alquiler de vehículos desarrollado con NestJS, MySQL y siguiendo los principios de Clean Architecture.

## Tecnologías Utilizadas

- **NestJS**: Framework de Node.js para construir aplicaciones del lado del servidor.
- **TypeScript**: Lenguaje de programación que añade tipado estático a JavaScript.
- **MySQL**: Sistema de gestión de bases de datos relacionales.
- **TypeORM**: ORM para TypeScript y JavaScript.
- **JWT**: JSON Web Tokens para autenticación.
- **AWS S3**: Servicio de almacenamiento para imágenes.
- **Swagger**: Documentación de la API.
- **Jest**: Framework de pruebas.

## Arquitectura

El proyecto sigue los principios de Clean Architecture, organizando el código en capas:

- **Core**: Contiene el dominio (entidades, repositorios, interfaces) y la aplicación (casos de uso).
- **Infrastructure**: Implementaciones concretas de bases de datos, servicios externos, etc.
- **Presentation**: Controladores, middlewares, validadores y otros componentes relacionados con la interfaz API.

## Características

- Autenticación con JWT y doble factor de autenticación (2FA)
- Gestión de usuarios (arrendatarios y propietarios)
- Gestión de vehículos
- Sistema de alquileres con estados
- Contraofertas de precios
- Reseñas y calificaciones
- Sistema de reportes
- Carga de imágenes a AWS S3
- Documentación de API con Swagger

## Requisitos previos

- Node.js v14 o superior
- MySQL 5.7 o superior
- Una cuenta de AWS para el servicio S3
- npm o yarn

## Configuración

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/car-rental-api.git
cd car-rental-api
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno:

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
# Aplicación
PORT=3000
NODE_ENV=development

# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=password
DATABASE_NAME=car_rental
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true

# JWT
JWT_SECRET=tu-secreto-jwt-123456789
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=tu-secreto-refresh-jwt-123456789
JWT_REFRESH_EXPIRES_IN=7d

# AWS
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=sa-east-1
AWS_S3_BUCKET_NAME=car-rental-app

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña
EMAIL_FROM=Car Rental App <noreply@carrentalapp.com>

# Seguridad
BCRYPT_SALT_ROUNDS=10
CSRF_SECRET=tu-csrf-secret-123456789

# Throttle (protección contra ataques de fuerza bruta)
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# 2FA
TWO_FACTOR_APP_NAME=CarRentalApp
TWO_FACTOR_EXPIRES_IN=300
```

4. Crear la base de datos en MySQL:

```sql
CREATE DATABASE car_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Ejecutar las migraciones:

```bash
npm run migration:run
```

## Ejecución

### Desarrollo

```bash
npm run start:dev
```

La API estará disponible en `http://localhost:3000/api`.
La documentación estará disponible en `http://localhost:3000/api/docs`.

### Producción

```bash
npm run build
npm run start:prod
```

## Pruebas

```bash
# Pruebas unitarias
npm run test

# Pruebas e2e
npm run test:e2e

# Cobertura de pruebas
npm run test:cov
```

## Estructura de Carpetas

```
car-rental-api/
├── src/
│   ├── config/                  # Configuraciones
│   ├── core/                    # Lógica de negocio
│   │   ├── domain/              # Entidades y reglas de negocio
│   │   │   ├── entities/        # Definición de entidades
│   │   │   ├── repositories/    # Interfaces de repositorios
│   │   │   ├── services/        # Servicios de dominio
│   │   │   └── value-objects/   # Objetos de valor
│   │   ├── application/         # Casos de uso
│   │   │   ├── dto/             # Objetos de transferencia de datos
│   │   │   ├── interfaces/      # Interfaces de servicios
│   │   │   └── use-cases/       # Implementación de casos de uso
│   ├── infrastructure/          # Implementaciones concretas
│   │   ├── database/            # Configuración de base de datos
│   │   │   ├── entities/        # Entidades ORM
│   │   │   ├── migrations/      # Migraciones
│   │   │   ├── repositories/    # Implementaciones de repositorios
│   │   │   └── seeders/         # Datos iniciales
│   │   ├── aws/                 # Configuración para AWS (S3)
│   │   ├── auth/                # Implementación de autenticación
│   │   ├── security/            # Implementación de seguridad
│   │   └── emails/              # Servicio de envío de emails
│   ├── presentation/            # Capa de presentación
│   │   ├── controllers/         # Controladores REST
│   │   ├── middlewares/         # Middlewares
│   │   ├── validators/          # Validadores de entrada
│   │   └── decorators/          # Decoradores personalizados
│   ├── shared/                  # Código compartido
│   │   ├── utils/               # Utilidades
│   │   ├── constants/           # Constantes
│   │   ├── exceptions/          # Excepciones personalizadas
│   │   └── interfaces/          # Interfaces compartidas
```

## Endpoints principales

### Autenticación

- `POST /api/auth/register` - Registrar un nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/verify-two-factor` - Verificar código de 2FA
- `POST /api/auth/refresh-token` - Refrescar token de acceso
- `POST /api/auth/forgot-password` - Solicitar restablecimiento de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña
- `GET /api/auth/me` - Obtener información del usuario autenticado

### Vehículos

- `POST /api/vehicles` - Crear un nuevo vehículo
- `GET /api/vehicles` - Buscar vehículos disponibles
- `GET /api/vehicles/:id` - Obtener detalles de un vehículo
- `PUT /api/vehicles/:id` - Actualizar un vehículo
- `DELETE /api/vehicles/:id` - Eliminar un vehículo
- `POST /api/vehicles/:id/main-image` - Subir imagen principal
- `POST /api/vehicles/:id/additional-images` - Subir imágenes adicionales

### Alquileres

- `POST /api/rentals` - Crear una solicitud de alquiler
- `GET /api/rentals` - Obtener historial de alquileres
- `GET /api/rentals/:id` - Obtener detalles de un alquiler
- `POST /api/rentals/:id/counter-offer` - Hacer una contraoferta
- `POST /api/rentals/:id/verify-payment` - Verificar pago
- `POST /api/rentals/:id/extend` - Extender alquiler
- `POST /api/rentals/:id/complete` - Completar alquiler

### Reseñas

- `POST /api/reviews/vehicle/:rentalId` - Crear reseña de vehículo
- `POST /api/reviews/renter/:rentalId` - Crear reseña de arrendatario
- `GET /api/reviews/vehicle/:vehicleId` - Obtener reseñas de un vehículo
- `GET /api/reviews/renter/:userId` - Obtener reseñas de un arrendatario

### Reportes

- `POST /api/reports/:rentalId` - Crear un reporte
- `GET /api/reports/owner` - Obtener reportes como propietario
- `GET /api/reports/admin` - Obtener todos los reportes (admin)
- `POST /api/reports/:id/process` - Procesar un reporte (admin)

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios importantes.

## Licencia

[MIT](LICENSE)