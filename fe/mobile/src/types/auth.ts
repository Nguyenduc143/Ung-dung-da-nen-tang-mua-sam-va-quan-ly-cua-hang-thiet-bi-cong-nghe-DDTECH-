export type UserRole = 'CUSTOMER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'LOCKED';
export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends AuthUser {
  gender: UserGender | null;
  dateOfBirth: string | null;
  lastLoginAt: string | null;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: UserGender | null;
  dateOfBirth?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginData extends TokenPair {
  user: AuthUser;
}

export interface CurrentUserData {
  user: AuthUser;
}

export interface RegisterData {
  user: AuthUser;
}

export interface LogoutAllData {
  revokedCount: number;
}
