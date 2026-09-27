# DDTECH Admin Web

Admin web sử dụng React, TypeScript, Vite, Ant Design, Axios và Socket.IO Client.

## Chạy development

```bash
npm install
npm run dev
```

Sao chép `.env.example` thành `.env` và kiểm tra:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Kiểm thử

```bash
npm test
npm run test:watch
npm run test:coverage
npm run typecheck
```

Các test hiện có bao phủ:

- đăng nhập admin, chặn customer, refresh token và logout;
- protected route cho guest và admin;
- hợp đồng API CRUD category, brand, product, variant, inventory, order, promotion, review;
- realtime `order:new` và `product:stock_updated`.

## Build production

```bash
npm run build
npm run preview
```

Các trang được tách thành từng chunk theo route để giảm dung lượng tải ban đầu.

## Deploy Vercel

1. Chọn Root Directory là `fe/admin`.
2. Khai báo `VITE_API_URL` và `VITE_SOCKET_URL` trong Project Settings.
3. Deploy; file `vercel.json` đã cấu hình SPA fallback.

## Deploy Netlify

1. Chọn Base Directory là `fe/admin`.
2. Khai báo hai biến môi trường production.
3. File `netlify.toml` đã cấu hình build và SPA fallback.

## Deploy VPS/Nginx

1. Chạy `npm ci && npm run build`.
2. Sao chép nội dung `dist/` vào `/var/www/ddtech-admin`.
3. Dùng mẫu `deploy/nginx.conf`, thay `server_name` và cấu hình HTTPS.

Backend production phải đặt `ADMIN_WEB_ORIGIN` đúng origin của admin web. Nếu backend
được chạy trong container, thư mục `be/uploads` cần gắn persistent volume hoặc thay bằng
object storage để không mất ảnh sau khi deploy lại.

