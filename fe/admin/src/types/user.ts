import type { UserRole, UserStatus } from './auth';

export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  gender: UserGender | null;
  dateOfBirth: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListData {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserQuery {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserData {
  user: AdminUser;
}
