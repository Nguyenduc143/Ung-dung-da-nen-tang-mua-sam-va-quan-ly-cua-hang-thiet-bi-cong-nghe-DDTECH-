import type { UserStatus } from '../types/auth';
import type { ApiResponse } from '../types/api';
import type { UserData, UserListData, UserQuery } from '../types/user';
import { apiClient } from './axiosClient';

export const listUsers = async (query: UserQuery): Promise<UserListData> => {
  const response = await apiClient.get<ApiResponse<UserListData>>('/admin/users', {
    params: query,
  });
  return response.data.data;
};

export const getUser = async (id: number): Promise<UserData> => {
  const response = await apiClient.get<ApiResponse<UserData>>(`/admin/users/${id}`);
  return response.data.data;
};

export const updateUserStatus = async (id: number, status: UserStatus): Promise<UserData> => {
  const response = await apiClient.patch<ApiResponse<UserData>>(`/admin/users/${id}/status`, {
    status,
  });
  return response.data.data;
};
