import type { RequestHandler } from 'express';
import { z, type ZodType } from 'zod';
import * as service from '../services/chat.service';
import * as schema from '../validators/chat.validator';
import { AppError } from '../utils/app-error';

const parse = <T>(validator: ZodType<T>, value: unknown): T => {
  const result = validator.safeParse(value);
  if (!result.success) throw new AppError(422, 'Dữ liệu chat không hợp lệ', z.flattenError(result.error).fieldErrors);
  return result.data;
};
const actor = (user: Express.Request['user']) => {
  if (!user) throw new AppError(401, 'Bạn chưa đăng nhập');
  return user.id;
};
const respond = (operation: (req: Parameters<RequestHandler>[0]) => Promise<unknown>, message: string): RequestHandler => async (req, res) => {
  const data = await operation(req);
  res.status(200).json({ success: true, message, data });
};
export const open = respond(req => { parse(schema.chatActionSchema, req.body ?? {}); return service.open(actor(req.user)); }, 'Mở hội thoại thành công');
export const list = respond(req => service.list(actor(req.user), parse(schema.chatListSchema, req.query)), 'Lấy danh sách hội thoại thành công');
export const detail = respond(req => service.detail(actor(req.user), parse(schema.chatIdSchema, req.params.id)), 'Lấy hội thoại thành công');
export const messages = respond(req => service.messages(actor(req.user), parse(schema.chatIdSchema, req.params.id), parse(schema.chatMessagesSchema, req.query)), 'Lấy lịch sử chat thành công');
export const send = respond(req => service.send(actor(req.user), parse(schema.chatIdSchema, req.params.id), parse(schema.chatSendSchema, req.body)), 'Gửi tin nhắn thành công');
export const claim = respond(req => { parse(schema.chatActionSchema, req.body ?? {}); return service.claim(actor(req.user), parse(schema.chatIdSchema, req.params.id)); }, 'Nhận hội thoại thành công');
export const read = respond(req => service.read(actor(req.user), parse(schema.chatIdSchema, req.params.id), parse(schema.chatReadSchema, req.body).readSeq), 'Đánh dấu đã đọc thành công');
export const close = respond(req => { parse(schema.chatActionSchema, req.body ?? {}); return service.close(actor(req.user), parse(schema.chatIdSchema, req.params.id)); }, 'Đóng hội thoại thành công');
