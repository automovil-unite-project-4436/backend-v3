import { BadRequestException } from '@nestjs/common';

// Validador para imágenes (jpg, jpeg, png)
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    return callback(
      new BadRequestException('Solo se permiten archivos de imagen (jpg, jpeg, png)'),
      false,
    );
  }
  callback(null, true);
};

// Validador para documentos PDF
export const pdfFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(pdf)$/i)) {
    return callback(
      new BadRequestException('Solo se permiten archivos PDF'),
      false,
    );
  }
  callback(null, true);
};

// Validador para tamaño máximo (en bytes)
export const maxFileSizeFilter = (maxSize: number) => (req, file, callback) => {
  const fileSize = parseInt(req.headers['content-length']);
  
  if (fileSize > maxSize) {
    return callback(
      new BadRequestException(`El archivo es demasiado grande. Tamaño máximo: ${maxSize / (1024 * 1024)} MB`),
      false,
    );
  }
  callback(null, true);
};