# DDTECH Backend - Bộ đặc tả triển khai

Bộ file này dùng để triển khai backend cho đồ án:

**XÂY DỰNG ỨNG DỤNG ĐA NỀN TẢNG MUA SẮM VÀ QUẢN LÝ CỬA HÀNG THIẾT BỊ CÔNG NGHỆ “DDTECH”**

## Stack

- Node.js
- Express
- TypeScript
- MySQL 8
- mysql2/promise
- JWT
- bcrypt
- Socket.io
- Axios ở phía client
- Mobile: React Native + Expo SDK 54
- Admin: React + Vite

## Cấu trúc backend mục tiêu

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── database.ts
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middleware/
│   ├── validators/
│   ├── socket/
│   ├── utils/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Thứ tự nên làm

1. `01_PROJECT_SETUP.md`
2. `02_DATABASE_CONNECTION.md`
3. `03_AUTH_JWT.md`
4. `04_USERS_ADDRESSES.md`
5. `05_CATEGORIES_BRANDS.md`
6. `06_PRODUCTS_VARIANTS_IMAGES.md`
7. `07_CART_FAVORITES.md`
8. `08_ORDERS_CHECKOUT.md`
9. `09_PAYMENTS.md`
10. `10_PROMOTIONS.md`
11. `11_REVIEWS.md`
12. `12_NOTIFICATIONS_SOCKET.md`
13. `13_INVENTORY.md`
14. `14_ADMIN_DASHBOARD.md`
15. `15_SECURITY_ERROR_VALIDATION.md`
16. `16_TESTING_API_DOCS.md`

## Quy tắc quan trọng

- Mobile và Admin cùng gọi một backend.
- Admin Web chỉ được thao tác route admin khi JWT có `role = ADMIN`.
- Mobile nhận cập nhật realtime thông qua Socket.io.
- Đơn hàng phải snapshot thông tin sản phẩm.
- Không xóa cứng order.
- Không dùng `MAX(id)+1` để sinh mã đơn hàng ở backend.
- Khi checkout phải khóa bản ghi tồn kho phù hợp bằng transaction/`SELECT ... FOR UPDATE`.
- Với sản phẩm có variant, phải xác minh `variant_id` thực sự thuộc `product_id`.

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
