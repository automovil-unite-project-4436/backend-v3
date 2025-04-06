// src/infrastructure/aws/s3.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ImageCategory } from '../../core/domain/enums/image-category.enum';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    // Inicializar el cliente S3 con las credenciales y región
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region') || 'sa-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || '',
      },
    });
    
    this.bucketName = this.configService.get<string>('aws.s3.bucketName') || 'car-rental-app';
  }

  async uploadFile(
    file: Express.Multer.File,
    category: ImageCategory,
    userId: string,
  ): Promise<string> {
    try {
      // Generar un nombre único para el archivo
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${category}/${userId}/${uuidv4()}.${fileExtension}`;
      
      // Configuración de la carga
      const params = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      
      // Subir el archivo a S3 usando el nuevo API
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
      
      // Construir la URL de S3 manualmente
      const s3Url = `https://${this.bucketName}.s3.${this.configService.get<string>('aws.region')}.amazonaws.com/${fileName}`;
      this.logger.log(`Archivo subido correctamente: ${s3Url}`);
      
      return s3Url;
    } catch (error) {
      this.logger.error(`Error al subir archivo a S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extraer la clave (key) del URL
      const key = this.extractKeyFromUrl(fileUrl);
      
      // Configuración para eliminar el archivo
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };
      
      // Eliminar el archivo de S3 usando el nuevo API
      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);
      
      this.logger.log(`Archivo eliminado correctamente: ${key}`);
    } catch (error) {
      this.logger.error(`Error al eliminar archivo de S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  private extractKeyFromUrl(fileUrl: string): string {
    // Ejemplo: https://bucket-name.s3.region.amazonaws.com/category/userId/file.jpg
    const urlParts = fileUrl.split('/');
    return urlParts.slice(3).join('/');
  }
}