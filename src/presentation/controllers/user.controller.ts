import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { UpdateUserDto } from '../../core/application/dto/user/update-user.dto';
import { ChangePasswordDto } from '../../core/application/dto/auth/change-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AuthUser } from '../decorators/auth-user.decorator';
import { UserRole } from '../../core/domain/enums/user-role.enum';
import { ImageCategory } from '../../core/domain/enums/image-category.enum';
import {
  imageFileFilter,
  pdfFileFilter,
  maxFileSizeFilter,
} from '../validators/file-validators';
import { UserService } from 'src/core/domain/services/user.service';

@ApiTags('Usuarios')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de un usuario' })
  @ApiResponse({ status: 200, description: 'Información del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async getUserById(@Param('id') id: string, @AuthUser() currentUser) {
    // Verificar permisos: solo el propio usuario o un administrador pueden ver los detalles
    if (id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new BadRequestException('No tienes permiso para ver este perfil');
    }

    const user = await this.userService.getUserById(id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        documentImageUrl: user.documentImageUrl,
        criminalRecordImageUrl: user.criminalRecordImageUrl,
        profileImageUrl: user.profileImageUrl,
        driverLicenseImageUrl: user.driverLicenseImageUrl,
        rating: user.rating,
        reportCount: user.reportCount,
        isBlocked: user.isBlocked,
        blockedUntil: user.blockedUntil,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar información de usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @AuthUser() currentUser,
  ) {
    // Verificar permisos: solo el propio usuario puede actualizar su perfil
    if (id !== currentUser.id) {
      throw new BadRequestException(
        'No tienes permiso para actualizar este perfil',
      );
    }

    const updatedUser = await this.userService.updateUser(id, updateUserDto);

    return {
      message: 'Usuario actualizado correctamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        profileImageUrl: updatedUser.profileImageUrl,
      },
    };
  }

  @Post(':id/change-password')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o contraseña actual incorrecta',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @AuthUser() currentUser,
  ) {
    // Verificar permisos: solo el propio usuario puede cambiar su contraseña
    if (id !== currentUser.id) {
      throw new BadRequestException(
        'No tienes permiso para cambiar la contraseña de este usuario',
      );
    }

    await this.userService.updatePassword(
      id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Contraseña actualizada correctamente',
    };
  }

  @Post(':id/document')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        // Combinar validadores
        const validators = [
          imageFileFilter,
          maxFileSizeFilter(5 * 1024 * 1024), // 5MB máximo
        ];

        // Aplicar validadores en secuencia
        for (const validator of validators) {
          try {
            validator(req, file, callback);
          } catch (error) {
            return callback(error, false);
          }
        }

        callback(null, true);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen de documento de identidad',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Subir documento de identidad' })
  @ApiResponse({ status: 200, description: 'Documento subido' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() currentUser,
  ) {
    // Verificar permisos: solo el propio usuario puede subir sus documentos
    if (id !== currentUser.id) {
      throw new BadRequestException(
        'No tienes permiso para subir documentos de este usuario',
      );
    }

    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const documentUrl = await this.userService.uploadUserDocument(
      id,
      file,
      ImageCategory.DOCUMENT,
    );

    return {
      message: 'Documento subido correctamente',
      documentUrl,
    };
  }

  @Post(':id/criminal-record')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        // Combinar validadores
        const validators = [
          pdfFileFilter,
          maxFileSizeFilter(5 * 1024 * 1024), // 5MB máximo
        ];

        // Aplicar validadores en secuencia
        for (const validator of validators) {
          try {
            validator(req, file, callback);
          } catch (error) {
            return callback(error, false);
          }
        }

        callback(null, true);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen de antecedentes penales',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Subir certificado de antecedentes penales' })
  @ApiResponse({ status: 200, description: 'Certificado subido' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async uploadCriminalRecord(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() currentUser,
  ) {
    // Verificar permisos: solo el propio usuario puede subir sus documentos
    if (id !== currentUser.id) {
      throw new BadRequestException(
        'No tienes permiso para subir documentos de este usuario',
      );
    }

    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const documentUrl = await this.userService.uploadUserDocument(
      id,
      file,
      ImageCategory.CRIMINAL_RECORD,
    );

    return {
      message: 'Certificado de antecedentes penales subido correctamente',
      documentUrl,
    };
  }

  @Post(':id/driver-license')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen de la licencia de conducir',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Subir licencia de conducir' })
  @ApiResponse({ status: 200, description: 'Licencia subida' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async uploadDriverLicense(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() currentUser,
  ) {
    // Verificar permisos: solo el propio usuario puede subir sus documentos
    if (id !== currentUser.id) {
      throw new BadRequestException(
        'No tienes permiso para subir documentos de este usuario',
      );
    }

    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const documentUrl = await this.userService.uploadUserDocument(
      id,
      file,
      ImageCategory.DRIVER_LICENSE,
    );

    return {
      message: 'Licencia de conducir subida correctamente',
      documentUrl,
    };
  }

  @Post(':id/profile-image')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen de perfil',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Subir imagen de perfil' })
  @ApiResponse({ status: 200, description: 'Imagen subida' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async uploadProfileImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() currentUser,
  ) {
    // Verificar permisos: solo el propio usuario puede subir sus documentos
    if (id !== currentUser.id) {
      throw new BadRequestException(
        'No tienes permiso para subir documentos de este usuario',
      );
    }

    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const documentUrl = await this.userService.uploadUserDocument(
      id,
      file,
      ImageCategory.PROFILE,
    );

    return {
      message: 'Imagen de perfil subida correctamente',
      documentUrl,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TwoFactorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar cuenta de usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async deleteUser(@Param('id') id: string, @AuthUser() currentUser) {
    // Verificar permisos: solo el propio usuario o un administrador pueden eliminar la cuenta
    if (id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        'No tienes permiso para eliminar este usuario',
      );
    }

    await this.userService.deleteUser(id);

    return {
      message: 'Usuario eliminado correctamente',
    };
  }

  // Rutas de administración
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar usuario (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario verificado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async verifyUser(@Param('id') id: string) {
    const user = await this.userService.verifyUser(id);

    return {
      message: 'Usuario verificado correctamente',
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
      },
    };
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspender usuario (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario suspendido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async suspendUser(@Param('id') id: string) {
    const user = await this.userService.suspendUser(id);

    return {
      message: 'Usuario suspendido correctamente',
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
      },
    };
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bloquear usuario temporalmente (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario bloqueado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async blockUser(@Param('id') id: string, @Body('days') days: number) {
    if (!days || days <= 0) {
      throw new BadRequestException(
        'Se debe proporcionar un número de días válido',
      );
    }

    await this.userService.blockUser(id, days);

    return {
      message: `Usuario bloqueado correctamente por ${days} días`,
    };
  }

  @Post(':id/unblock')
  @UseGuards(JwtAuthGuard, TwoFactorGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desbloquear usuario (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario desbloqueado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No es administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  async unblockUser(@Param('id') id: string) {
    await this.userService.unblockUser(id);

    return {
      message: 'Usuario desbloqueado correctamente',
    };
  }
}
