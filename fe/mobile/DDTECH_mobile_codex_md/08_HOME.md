# Home Screen

## Thành phần

1. Header
   - logo/tên DDTECH
   - notification
2. Search bar
3. Banner
4. Danh mục nhanh
5. Sản phẩm nổi bật
6. Sản phẩm mới
7. Sản phẩm bán chạy
8. Khuyến mãi

## API

```http
GET /api/categories
GET /api/products?featured=true
GET /api/products?new=true
GET /api/products?sort=best_selling
```

Nếu backend có banner endpoint thì dùng endpoint thực tế.

## Yêu cầu

- pull to refresh
- horizontal sections nếu phù hợp
- ProductCard reusable

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
