# Profile và User Settings

## API

```http
GET   /api/users/me
PATCH /api/users/me
PATCH /api/users/me/password
POST  /api/auth/logout
POST  /api/auth/logout-all
```

## Profile menu

- thông tin cá nhân
- địa chỉ
- đơn hàng
- yêu thích
- thông báo
- đổi mật khẩu
- đăng xuất

## Edit Profile

Field:
- avatar nếu backend hỗ trợ
- full_name
- phone
- gender
- date_of_birth

## Change Password

- current password
- new password
- confirm password

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
