import type { RequestHandler } from 'express';

import * as userService from '../services/user.service';
import { AVATAR_IMAGE_PUBLIC_PATH } from '../config/uploads';
import {
  removeStoredAvatarImage,
  removeStoredAvatarImageByUrl,
  storeAvatarImage,
} from '../services/upload.service';
import { AppError } from '../utils/app-error';
import {
type ChangePasswordInput,
type UpdateProfileInput
} from '../validators/user.validator';

const requireUser = (user: Express.Request['user']) => {
  if (!user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return user;
};

export const getMe: RequestHandler = async (req, res) => {
  const user = await userService.getProfile(requireUser(req.user).id);
  res.status(200).json({ success: true, message: 'Lấy hồ sơ thành công', data: { user } });
};

export const updateMe: RequestHandler = async (req, res) => {
  const user = await userService.updateProfile(requireUser(req.user).id, req.body as UpdateProfileInput);
  res.status(200).json({ success: true, message: 'Cập nhật hồ sơ thành công', data: { user } });
};

export const uploadAvatar: RequestHandler = async (req, res) => {
  if (!req.file) throw new AppError(422, 'Vui lòng chọn ảnh đại diện cần tải lên');

  const userId = requireUser(req.user).id;
  const previous = await userService.getProfile(userId);
  const storedImage = await storeAvatarImage(req.file);
  const avatarUrl = `${AVATAR_IMAGE_PUBLIC_PATH}/${encodeURIComponent(storedImage.filename)}`;

  try {
    const user = await userService.updateProfile(userId, { avatarUrl });
    if (previous.avatarUrl && previous.avatarUrl !== avatarUrl) {
      await removeStoredAvatarImageByUrl(previous.avatarUrl).catch((cleanupError: unknown) => {
        console.error('Không thể xóa ảnh đại diện cũ', cleanupError);
      });
    }
    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: { user },
    });
  } catch (error) {
    await removeStoredAvatarImage(storedImage.filename).catch((cleanupError: unknown) => {
      console.error('Không thể dọn ảnh đại diện sau khi cập nhật thất bại', cleanupError);
    });
    throw error;
  }
};

export const changePassword: RequestHandler = async (req, res) => {
  await userService.changePassword(requireUser(req.user).id, req.body as ChangePasswordInput);
  res.status(200).json({
    success: true,
    message: 'Đổi mật khẩu thành công, vui lòng đăng nhập lại',
    data: null,
  });
};
