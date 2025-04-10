import { UserRole } from '../../../core/domain/enums/user-role.enum';

export interface JwtPayload {
  sub: string;       
  email: string;       
  role: UserRole;  
  isTwoFactorAuthenticated?: boolean; 
  iat?: number;    
  exp?: number;
}