# Final End-to-End Test

## Flow 1 - User mới

```text
Register
→ Login
→ Home
→ Product Detail
→ Add Cart
→ Address
→ Checkout
→ Order
```

## Flow 2 - Admin tương tác

```text
Mobile tạo order
→ Backend
→ Admin Web thấy order
→ Admin CONFIRMED
→ Mobile nhận Socket update
→ Order Detail đổi trạng thái
```

## Flow 3 - Sau giao hàng

```text
Order DELIVERED
→ User mở Product/Order
→ Review
→ Admin Web thấy review
```

## Kiểm tra cuối

- Android
- iOS nếu có môi trường
- nhiều kích thước màn hình
- keyboard
- safe area
- loading
- empty
- error
- navigation back
- session restore

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
