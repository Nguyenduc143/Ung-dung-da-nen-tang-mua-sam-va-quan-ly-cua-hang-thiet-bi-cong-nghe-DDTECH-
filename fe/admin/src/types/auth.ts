export type UserRole = 'ADMIN' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'LOCKED';

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

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginData extends TokenPair {
  user: AuthUser;
}

export interface CurrentUserData {
  user: AuthUser;
}
