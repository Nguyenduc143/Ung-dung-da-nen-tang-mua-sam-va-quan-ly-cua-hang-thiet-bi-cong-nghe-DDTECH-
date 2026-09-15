# DDTECH Backend

Backend REST API và realtime server cho DDTECH, sử dụng Express, TypeScript, MySQL và Socket.io.

## Yêu cầu

- Node.js 20 trở lên
- MySQL 8

## Cài đặt và chạy

```bash
npm install
copy .env.example .env
npm run dev
```

Trước khi chạy, hãy tạo database `ddtech` và cập nhật các biến `DB_*` trong `.env`.
Server chỉ bắt đầu lắng nghe sau khi kết nối MySQL và chạy `SELECT 1` thành công.

Nếu dùng macOS/Linux, thay lệnh `copy` bằng `cp`.

Các lệnh chính:

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

## Kiểm tra health API

Mở `http://localhost:5000/api/health` hoặc chạy:

```bash
curl http://localhost:5000/api/health
```

Response có định dạng:

```json
{
  "success": true,
  "message": "DDTECH API đang hoạt động",
  "data": {
    "status": "ok",
    "timestamp": "2026-01-01T00:00:00.000Z",
    "uptime": 1.23
  }
}
```
