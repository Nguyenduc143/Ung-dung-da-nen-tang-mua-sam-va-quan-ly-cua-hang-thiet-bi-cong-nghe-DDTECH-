import type { RequestHandler } from 'express';

import * as addressService from '../services/address.service';
import { AppError } from '../utils/app-error';
import type { CreateAddressInput, UpdateAddressInput } from '../validators/address.validator';

const userIdFrom = (req: Parameters<RequestHandler>[0]): number => {
  if (!req.user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return req.user.id;
};

export const list: RequestHandler = async (req, res) => {
  const addresses = await addressService.listAddresses(userIdFrom(req));
  res.status(200).json({ success: true, message: 'Lấy danh sách địa chỉ thành công', data: { addresses } });
};

export const create: RequestHandler = async (req, res) => {
  const address = await addressService.createAddress(userIdFrom(req), req.body as CreateAddressInput);
  res.status(201).json({ success: true, message: 'Thêm địa chỉ thành công', data: { address } });
};

export const update: RequestHandler = async (req, res) => {
  const address = await addressService.updateAddress(
    userIdFrom(req),
    Number(req.params.id),
    req.body as UpdateAddressInput,
  );
  res.status(200).json({ success: true, message: 'Cập nhật địa chỉ thành công', data: { address } });
};

export const remove: RequestHandler = async (req, res) => {
  await addressService.deleteAddress(userIdFrom(req), Number(req.params.id));
  res.status(200).json({ success: true, message: 'Xóa địa chỉ thành công', data: null });
};

export const setDefault: RequestHandler = async (req, res) => {
  const address = await addressService.setDefaultAddress(userIdFrom(req), Number(req.params.id));
  res.status(200).json({ success: true, message: 'Đặt địa chỉ mặc định thành công', data: { address } });
};
