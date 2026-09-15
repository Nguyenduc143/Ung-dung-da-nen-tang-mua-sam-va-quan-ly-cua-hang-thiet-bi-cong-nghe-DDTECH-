# 01 - Khởi tạo Backend DDTECH

## Yêu cầu

Hãy tạo project backend tại:

```text
DDTECH/backend
```

Sử dụng:

- Node.js
- Express
- TypeScript
- mysql2
- jsonwebtoken
- bcrypt
- socket.io
- cors
- dotenv
- helmet
- morgan
- zod
- nodemon hoặc tsx

## Cần tạo

- `package.json`
- `tsconfig.json`
- `.env`
- `.env.example`
- `.gitignore`
- `src/app.ts`
- `src/server.ts`
- các folder chuẩn

## Scripts

Cần có tối thiểu:

```json
{
  "dev": "...",
  "build": "...",
  "start": "...",
  "typecheck": "..."
}
```

## Server

- REST API prefix: `/api`
- Health check: `GET /api/health`
- Socket.io chạy cùng HTTP server.
- CORS cho phép Admin Web và Expo Mobile trong môi trường local.

## Environment đề xuất

```env
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=ddtech

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

ADMIN_WEB_ORIGIN=http://localhost:5173
```

## Output mong muốn

1. Các lệnh cài package.
2. Cấu trúc thư mục.
3. Nội dung đầy đủ từng file.
4. Cách chạy `npm run dev`.
5. Test `GET /api/health`.

> **Nguyên tắc chung**
>
> - Backend: Node.js + Express + TypeScript.
> - Database: MySQL 8, database `ddtech`.
> - Truy vấn bằng `mysql2/promise`; không dùng ORM trừ khi tôi yêu cầu.
> - Authentication: JWT access token + refresh token.
> - Password: bcrypt.
> - Realtime: Socket.io.
> - Response API thống nhất: `{ success, message, data, errors? }`.
> - Không thay đổi tên bảng/cột trong database hiện tại nếu chưa thật sự cần thiết.
> - Mọi input từ client phải validate ở backend.
> - Không tin `price`, `role`, `stock`, `total_amount`, `payment_status` do client gửi lên.
> - Các nghiệp vụ nhiều bước như checkout, đổi tồn kho, áp voucher, thanh toán phải dùng transaction.
> - Viết code tách `routes -> controller -> service -> repository/query` rõ ràng.
> - Có middleware xử lý lỗi tập trung.
> - Code phải chạy được, không viết pseudo-code.
