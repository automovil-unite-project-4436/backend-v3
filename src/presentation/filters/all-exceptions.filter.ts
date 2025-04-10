import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { QueryFailedError } from 'typeorm';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);
  
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      
      let status: number;
      let message: string | string[];
      let error: string;
  
      // Manejar excepciones HTTP de NestJS
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        
        if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
          message = (exceptionResponse as any).message;
          error = (exceptionResponse as any).error || exception.message;
        } else {
          message = exception.message;
          error = exception.name;
        }
      } 
      // Manejar errores de TypeORM
      else if (exception instanceof QueryFailedError) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Error en la base de datos';
        error = 'Database Error';
        
        // Identificar errores específicos de MySQL
        if ((exception as any).code === 'ER_DUP_ENTRY') {
          message = 'Ya existe un registro con esos datos';
        }
      } 
      // Manejar errores genéricos de JavaScript
      else if (exception instanceof Error) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
        error = exception.name;
      } 
      // Cualquier otro tipo de error
      else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Error interno del servidor';
        error = 'Internal Server Error';
      }
  
      // Registrar el error en los logs
      this.logger.error(
        `${request.method} ${request.url} - ${status}: ${error}`,
        exception instanceof Error ? exception.stack : undefined,
      );
  
      // Enviar respuesta al cliente
      response.status(status).json({
        statusCode: status,
        error,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }