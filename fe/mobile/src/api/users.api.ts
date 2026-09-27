import type {
  ApiResponse,
  ChangePasswordInput,
  UpdateProfileInput,
  UserProfile,
} from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { apiClient } from './axiosClient';

export interface AvatarUploadFile {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: Blob;
}

const normalizeProfile = (profile: UserProfile): UserProfile => ({
  ...profile,
  avatarUrl: resolveMediaUrl(profile.avatarUrl),
});

export const getProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<ApiResponse<{ user: UserProfile }>>('/users/me');
  return normalizeProfile(response.data.data.user);
};

export const updateProfile = async (input: UpdateProfileInput): Promise<UserProfile> => {
  const response = await apiClient.patch<ApiResponse<{ user: UserProfile }>>('/users/me', input);
  return normalizeProfile(response.data.data.user);
};

export const uploadAvatar = async (
  asset: AvatarUploadFile,
  onProgress?: (progress: number) => void,
): Promise<UserProfile> => {
  const formData = new FormData();
  const fileName = asset.fileName ?? `avatar-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? 'image/jpeg';

  if (asset.file) {
    formData.append('image', asset.file, fileName);
  } else {
    formData.append('image', { uri: asset.uri, name: fileName, type: mimeType } as unknown as Blob);
  }

  const response = await apiClient.post<ApiResponse<{ user: UserProfile }>>(
    '/users/me/avatar',
    formData,
    {
      onUploadProgress: ({ loaded, total }) => {
        if (total) onProgress?.(Math.min(100, Math.round((loaded / total) * 100)));
      },
    },
  );
  return normalizeProfile(response.data.data.user);
};

export const changePassword = async (input: ChangePasswordInput): Promise<void> => {
  await apiClient.patch<ApiResponse<null>>('/users/me/password', input);
};
