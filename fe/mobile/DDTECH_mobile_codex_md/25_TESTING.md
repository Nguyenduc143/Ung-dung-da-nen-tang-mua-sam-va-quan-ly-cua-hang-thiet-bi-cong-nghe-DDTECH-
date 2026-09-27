# Testing Mobile

## Kiểm tra chức năng

- login
- register
- refresh token
- logout
- products
- search/filter
- favorite
- cart
- address
- checkout
- order
- cancel
- notification
- socket

## Edge cases

- token hết hạn
- mất mạng
- backend tắt
- sản phẩm hết hàng
- variant hết hàng
- voucher hết hạn
- voucher sai
- quantity vượt stock
- order update realtime

## Kiểm tra kỹ thuật

- không lỗi TypeScript
- không warning nghiêm trọng
- không log token
- không duplicate socket listener
- không infinite request

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
