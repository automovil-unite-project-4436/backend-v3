import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    
    // Verificar si el usuario existe
    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    
    // Si el usuario tiene 2FA habilitado, verificar que haya completado la autenticación de dos factores
    if (user.isTwoFactorEnabled && !user.isTwoFactorAuthenticated) {
      throw new UnauthorizedException('Se requiere autenticación de dos factores');
    }
    
    return true;
  }
}