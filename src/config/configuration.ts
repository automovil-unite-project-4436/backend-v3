export default () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '3306', 10),
      username: process.env.DATABASE_USERNAME || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      name: process.env.DATABASE_NAME || '',
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
      logging: process.env.DATABASE_LOGGING === 'true' || false,
    },
    
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      refreshSecret: process.env.JWT_REFRESH_SECRET || '',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10),
    },
    
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1', // Región de Sudamérica (cercana a Perú)
      s3: {
        bucketName: process.env.AWS_S3_BUCKET_NAME || '',
      },
    },
    
    email: {
      service: process.env.EMAIL_SERVICE || 'gmail',
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || '',
      from: process.env.EMAIL_FROM || 'Autmovil Unite App <noreply@automoviluniteapp.com>',
    },
    
    twoFactorAuth: {
      appName: process.env.TWO_FACTOR_APP_NAME || 'Autmovil-Unite-App',
      expiresIn: parseInt(process.env.TWO_FACTOR_EXPIRES_IN ?? '300', 10),
    },
  
    security: {
      bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
      csrfSecret: process.env.CSRF_SECRET || '',
    },
  
    peruvianSettings: {
      phoneNumberLength: 9,
      documentNumberLength: 8, // DNI
    }
  });