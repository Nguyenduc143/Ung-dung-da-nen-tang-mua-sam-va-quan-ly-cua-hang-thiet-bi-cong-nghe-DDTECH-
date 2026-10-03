# Checkout

## API

```http
POST /api/promotions/validate
POST /api/orders
```

Gửi `cartItemIds` từ các checkbox đã chọn ở giỏ hàng. Backend chỉ tạo đơn và xóa
những item này; sản phẩm chưa chọn vẫn nằm trong giỏ.

Dùng thêm shipping API thực tế nếu backend có.

## Sections

- selected address
- cart items
- shipping method
- voucher
- payment method
- note
- summary

## Quy tắc quan trọng

Client không tự quyết:
- unit price
- subtotal
- discount
- total

Backend phải tính lại.

Sau order success:
- clear cart store
- refetch cart
- chuyển Order Success / Order Detail

> ## Quy tắc chung cho Codex
>
> - Chỉ làm Mobile User tại `DDTECH/frontend/mobile`.
> - Stack: React Native + Expo SDK 57 + TypeScript.
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
