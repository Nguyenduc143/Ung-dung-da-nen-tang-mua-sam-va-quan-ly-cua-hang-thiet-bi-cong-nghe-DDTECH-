# Cấu trúc thư mục Mobile

Tạo cấu trúc:

```text
src/
├── api/
│   ├── axiosClient.ts
│   ├── auth.api.ts
│   ├── users.api.ts
│   ├── products.api.ts
│   ├── categories.api.ts
│   ├── brands.api.ts
│   ├── cart.api.ts
│   ├── favorites.api.ts
│   ├── addresses.api.ts
│   ├── orders.api.ts
│   ├── payments.api.ts
│   ├── reviews.api.ts
│   ├── promotions.api.ts
│   └── notifications.api.ts
├── components/
├── hooks/
├── navigation/
├── screens/
│   ├── auth/
│   ├── home/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── favorites/
│   ├── profile/
│   └── notifications/
├── stores/
├── socket/
├── theme/
├── types/
├── utils/
└── constants/
```

Mục tiêu:
- route rõ
- business logic không nhét hết vào screen
- API tách service
- store tách riêng
- types dùng lại

> ## Quy tắc chung cho Codex
>
> - Chỉ làm Mobile User tại `DDTECH/frontend/mobile`.
> - Stack: React Native + Expo SDK 54 + TypeScript.
> - Dùng React Navigation, Axios, Socket.io Client.
> - Không sửa Backend nếu không thật sự cần thiết.
> - Không hard-code dữ liệu nếu backend đã có API.
> - Không dùng `localhost` trên điện thoại thật; dùng `EXPO_PUBLIC_API_URL` và LAN IP.
> - Tái sử dụng component, theme, hooks và service.
> - Mọi màn hình phải có loading / empty / error state khi phù hợp.
> - Token và dữ liệu nhạy cảm phải lưu an toàn bằng Expo SecureStore.
> - Sau mỗi module phải chạy TypeScript check / lint nếu project có cấu hình, và sửa lỗi trước khi chuyển bước tiếp theo.
> - Không phá vỡ các màn hình đã hoàn thành.
> - UI dùng tiếng Việt.
> - Ưu tiên code sạch, component rõ ràng, typing đầy đủ.
