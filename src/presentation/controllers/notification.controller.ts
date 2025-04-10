import {
    Controller,
    Get,
    Post,
    Param,
    Delete,
    UseGuards,
    Query,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
  } from '@nestjs/swagger';
  

  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  import { TwoFactorGuard } from '../guards/two-factor.guard';
  import { AuthUser } from '../decorators/auth-user.decorator';
import { NotificationService } from 'src/core/domain/services/notification.service';
  
  @ApiTags('Notificaciones')
  @Controller('notifications')
  export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener notificaciones del usuario' })
    @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de elementos por página' })
    @ApiQuery({ name: 'onlyUnread', required: false, type: Boolean, description: 'Solo notificaciones no leídas' })
    async getUserNotifications(
      @AuthUser('id') userId: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('onlyUnread') onlyUnread: boolean = false,
    ) {
      const { notifications, count, totalPages } = await this.notificationService.getUserNotifications(
        userId,
        page,
        limit,
        onlyUnread,
      );
      
      return {
        notifications,
        count,
        totalPages,
        currentPage: page,
      };
    }
  
    @Get('unread-count')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener cantidad de notificaciones no leídas' })
    @ApiResponse({ status: 200, description: 'Cantidad de notificaciones no leídas' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    async getUnreadCount(@AuthUser('id') userId: string) {
      const count = await this.notificationService.getUnreadCount(userId);
      
      return {
        count,
      };
    }
  
    @Post(':id/read')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Marcar notificación como leída' })
    @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Prohibido - No es el destinatario' })
    @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
    @ApiParam({ name: 'id', description: 'ID de la notificación' })
    async markAsRead(@Param('id') id: string, @AuthUser('id') userId: string) {
      try {
        const notification = await this.notificationService.markAsRead(id, userId);
        
        return {
          message: 'Notificación marcada como leída',
          notification,
        };
      } catch (error) {
        if (error.message === 'Notificación no encontrada') {
          throw new NotFoundException(error.message);
        }
        if (error.message === 'No tienes permiso para acceder a esta notificación') {
          throw new ForbiddenException(error.message);
        }
        throw error;
      }
    }
  
    @Post('mark-all-read')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
    @ApiResponse({ status: 200, description: 'Todas las notificaciones marcadas como leídas' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    async markAllAsRead(@AuthUser('id') userId: string) {
      await this.notificationService.markAllAsRead(userId);
      
      return {
        message: 'Todas las notificaciones han sido marcadas como leídas',
      };
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard, TwoFactorGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar una notificación' })
    @ApiResponse({ status: 200, description: 'Notificación eliminada' })
    @ApiResponse({ status: 401, description: 'No autorizado' })
    @ApiResponse({ status: 403, description: 'Prohibido - No es el destinatario' })
    @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
    @ApiParam({ name: 'id', description: 'ID de la notificación' })
    async deleteNotification(@Param('id') id: string, @AuthUser('id') userId: string) {
      try {
        await this.notificationService.deleteNotification(id, userId);
        
        return {
          message: 'Notificación eliminada correctamente',
        };
      } catch (error) {
        if (error.message === 'Notificación no encontrada') {
          throw new NotFoundException(error.message);
        }
        if (error.message === 'No tienes permiso para eliminar esta notificación') {
          throw new ForbiddenException(error.message);
        }
        throw error;
      }
    }
  }