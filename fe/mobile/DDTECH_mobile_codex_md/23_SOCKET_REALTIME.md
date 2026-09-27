# Socket.io Realtime

## Kết nối

Dùng:

```env
EXPO_PUBLIC_SOCKET_URL=http://<LAN_IP>:5000
```

## Events user có thể nhận

```text
order:updated
payment:updated
notification:new
product:updated
product:stock_updated
promotion:updated
```

## Quy tắc

- một socket instance toàn app
- connect sau auth
- truyền token theo backend
- reconnect hợp lý
- cleanup listener
- không đăng ký listener trùng
- disconnect khi logout

## Ví dụ

```text
Admin cập nhật đơn → order:updated
→ Orders screen cập nhật
→ Order Detail cập nhật
→ Notification badge cập nhật nếu có
```

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
