# DDTECH Admin Web - Bộ đặc tả triển khai

Đây là bộ Markdown dùng để triển khai **Frontend Admin Web** cho hệ thống DDTECH.

## Công nghệ

- React
- Vite
- TypeScript
- React Router
- Axios
- Socket.io Client
- Có thể dùng Ant Design hoặc Tailwind CSS
- Khuyến nghị Recharts cho dashboard

## Cấu trúc đề xuất

```text
frontend/admin/
├── src/
│   ├── api/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── hooks/
│   ├── stores/
│   ├── socket/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── .env
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Thứ tự triển khai

1. `01_PROJECT_SETUP.md`
2. `02_API_AXIOS_CONFIG.md`
3. `03_ADMIN_AUTH.md`
4. `04_PROTECTED_ROUTE_LAYOUT.md`
5. `05_CATEGORIES.md`
6. `06_BRANDS.md`
7. `07_PRODUCTS.md`
8. `08_PRODUCT_VARIANTS_IMAGES.md`
9. `09_INVENTORY.md`
10. `10_ORDERS.md`
11. `11_USERS.md`
12. `12_PROMOTIONS.md`
13. `13_REVIEWS.md`
14. `14_DASHBOARD.md`
15. `15_NOTIFICATIONS_SOCKET.md`
16. `16_GLOBAL_UX_COMPONENTS.md`
17. `17_TESTING_AND_DEPLOY.md`

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
