import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserStatus } from '../../domain/enums/user-status.enum';

import { S3Service } from '../../../infrastructure/aws/s3.service';
import { ImageCategory } from '../../domain/enums/image-category.enum';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from 'src/core/application/dto/user/update-user.dto';

@Injectable()
export class UserService {
  private readonly bcryptSaltRounds: number;

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    const saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
    );
    if (saltRounds === undefined) {
      throw new Error(
        'security.bcryptSaltRounds no está definido en la configuración',
      );
    }
    this.bcryptSaltRounds = saltRounds;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si se está actualizando el email y si ya existe
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(
        updateUserDto.email,
      );

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    }

    // Actualizar campos
    const updatedUser = new User({
      ...user,
      ...updateUserDto,
    });

    return this.userRepository.update(updatedUser);
  }

  async updatePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(
      newPassword,
      this.bcryptSaltRounds,
    );

    // Actualizar contraseña
    user.password = hashedPassword;
    await this.userRepository.update(user);
  }

  async uploadUserDocument(
    userId: string,
    file: Express.Multer.File,
    category: ImageCategory,
  ): Promise<string> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Eliminar documento anterior si existe
    let previousUrl: string = '';

    switch (category) {
      case ImageCategory.DOCUMENT:
        previousUrl = user.documentImageUrl!;
        break;
      case ImageCategory.CRIMINAL_RECORD:
        previousUrl = user.criminalRecordImageUrl!;
        break;
      case ImageCategory.DRIVER_LICENSE:
        previousUrl = user.driverLicenseImageUrl!;
        break;
      case ImageCategory.PROFILE:
        previousUrl = user.profileImageUrl!;
        break;
    }

    if (previousUrl) {
      await this.s3Service.deleteFile(previousUrl);
    }

    // Subir nuevo documento
    const documentUrl = await this.s3Service.uploadFile(file, category, userId);

    // Actualizar URL en el usuario
    switch (category) {
      case ImageCategory.DOCUMENT:
        user.documentImageUrl = documentUrl;
        break;
      case ImageCategory.CRIMINAL_RECORD:
        user.criminalRecordImageUrl = documentUrl;
        break;
      case ImageCategory.DRIVER_LICENSE:
        user.driverLicenseImageUrl = documentUrl;
        break;
      case ImageCategory.PROFILE:
        user.profileImageUrl = documentUrl;
        break;
    }

    // Verificar si todos los documentos requeridos están subidos
    this.checkUserVerification(user);

    await this.userRepository.update(user);

    return documentUrl;
  }

  private checkUserVerification(user: User): void {
    // Requisitos para usuarios arrendatarios (RENTER)
    if (user.isRenter()) {
      if (
        user.documentImageUrl &&
        user.criminalRecordImageUrl &&
        user.driverLicenseImageUrl &&
        user.profileImageUrl
      ) {
        user.status = UserStatus.VERIFIED;
      }
    }
    // Requisitos para propietarios (OWNER)
    else if (user.isOwner()) {
      if (
        user.documentImageUrl &&
        user.criminalRecordImageUrl &&
        user.profileImageUrl
      ) {
        user.status = UserStatus.VERIFIED;
      }
    }
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Borrar imagenes de S3
    const imagesToDelete = [
      user.documentImageUrl,
      user.criminalRecordImageUrl,
      user.driverLicenseImageUrl,
      user.profileImageUrl,
    ].filter((url) => url);

    for (const imageUrl of imagesToDelete) {
      await this.s3Service.deleteFile(imageUrl!);
    }

    await this.userRepository.delete(id);
  }

  async verifyUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.status = UserStatus.VERIFIED;
    return this.userRepository.update(user);
  }

  async suspendUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.status = UserStatus.SUSPENDED;
    return this.userRepository.update(user);
  }

  async blockUser(id: string, days: number): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.blockUser(id, days);
  }

  async unblockUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.unblockUser(id);
  }
}
