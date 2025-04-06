// src/infrastructure/security/interfaces/jwt-payload.interface.ts

import { UserRole } from '../../../core/domain/enums/user-role.enum';

export interface JwtPayload {
  sub: string;         // ID del usuario
  email: string;       // Email del usuario
  role: UserRole;      // Rol del usuario (RENTER, OWNER, ADMIN)
  isTwoFactorAuthenticated?: boolean;  // Indica si el usuario completó la autenticación de dos factores
  iat?: number;        // Issued at (cuando fue generado el token)
  exp?: number;        // Expiración del token
}