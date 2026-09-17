# 17 - Testing và Deploy Admin Web

## Test tối thiểu

Auth:
- login admin
- customer bị chặn
- refresh token
- logout

Protected route:
- guest -> login
- customer -> denied
- admin -> allowed

CRUD:
- category
- brand
- product
- variant
- inventory
- order status
- promotion
- review

Realtime:
- order:new
- stock update

## Tools
- Vitest
- React Testing Library

## Build
```bash
npm run build
```

Không được có TypeScript error.

## Deploy
Có thể dùng:
- Vercel
- Netlify
- VPS/Nginx

Production env:
```env
VITE_API_URL=https://api.example.com/api
VITE_SOCKET_URL=https://api.example.com
```

> **Nguyên tắc chung cho Admin Web**
>
> - Framework: React + Vite + TypeScript.
> - Routing: React Router.
> - HTTP: Axios.
> - Realtime: Socket.io Client.
> - Backend dùng chung: Node.js + Express + TypeScript + MySQL 8.
> - Authentication: JWT access token + refresh token.
> - Chỉ tài khoản `ADMIN` được truy cập hệ thống quản trị.
> - Không hard-code dữ liệu nếu backend đã có API tương ứng.
> - Không tin dữ liệu phía client cho các nghiệp vụ quan trọng; Admin Web chỉ gửi yêu cầu, backend mới là nguồn sự thật.
> - Tách rõ `pages`, `components`, `services/api`, `hooks`, `stores`, `types`, `utils`.
> - Mỗi trang phải có trạng thái loading, empty, error và success.
> - Mọi thao tác create/update/delete phải có thông báo rõ ràng.
> - Các trang danh sách nên có search, filter, pagination nếu backend hỗ trợ.
> - Không hiển thị token/password/hash ra giao diện.
> - Code phải chạy được, không viết pseudo-code.
