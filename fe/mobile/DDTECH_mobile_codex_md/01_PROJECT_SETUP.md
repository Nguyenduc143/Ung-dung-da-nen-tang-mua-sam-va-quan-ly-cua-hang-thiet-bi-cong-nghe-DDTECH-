# Khởi tạo Expo Project

## Yêu cầu

Khởi tạo hoặc chuẩn hóa project tại:

```text
DDTECH/frontend/mobile
```

## Stack

- Expo SDK 54
- React Native
- TypeScript
- React Navigation
- Axios
- Socket.io Client
- Expo SecureStore
- AsyncStorage nếu cần lưu cache không nhạy cảm
- Zustand hoặc Context API cho state
- icon package tương thích Expo

## Environment

Tạo `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.x.x:5000
```

Không hard-code IP trong code.

## Kiểm tra

- app chạy được bằng Expo
- TypeScript không lỗi
- import alias nếu dùng phải hoạt động

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
