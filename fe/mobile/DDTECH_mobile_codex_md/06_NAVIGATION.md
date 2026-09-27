# Navigation

Dùng React Navigation.

## Cấu trúc

```text
RootNavigator
├── AuthNavigator
└── MainTabNavigator
```

## AuthNavigator

- Login
- Register

## Main Tabs

- Trang chủ
- Danh mục
- Giỏ hàng
- Đơn hàng
- Tài khoản

## Stack Screens

- ProductList
- ProductDetail
- Search
- Favorites
- AddressList
- AddressForm
- Checkout
- OrderDetail
- Notifications
- Reviews
- WriteReview
- EditProfile
- ChangePassword

## Yêu cầu

- cart badge
- notification badge
- safe area đúng
- back navigation hợp lý

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
