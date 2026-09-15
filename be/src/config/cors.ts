import type { CorsOptions } from 'cors';

import { env } from './env';
import { AppError } from '../utils/app-error';

const localDevelopmentOrigin =
  /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(:\d+)?$/;

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) {
    // Native mobile clients such as Expo do not normally send an Origin header.
    return true;
  }

  return origin === env.ADMIN_WEB_ORIGIN
    || (env.NODE_ENV !== 'production' && localDevelopmentOrigin.test(origin));
};

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new AppError(403, 'Origin không được phép truy cập API'));
  },
  credentials: true,
};
