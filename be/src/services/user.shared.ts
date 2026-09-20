import * as userRepository from '../repositories/user.repository';

export const toUserResponse = (user: userRepository.UserProfileRecord) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatar_url,
  gender: user.gender,
  dateOfBirth: user.date_of_birth,
  role: user.role,
  status: user.status,
  lastLoginAt: user.last_login_at,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});
