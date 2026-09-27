# DDTECH Mobile - Master Workflow

## Mục tiêu

Xây dựng hoàn chỉnh ứng dụng Mobile User cho DDTECH.

## Cấu trúc dự án

```text
DDTECH/
├── frontend/
│   ├── admin/      # đã hoàn thành
│   └── mobile/     # làm tại đây
├── backend/        # đã hoàn thành
└── README.md
```

## Thứ tự triển khai

1. `01_PROJECT_SETUP.md`
2. `02_PROJECT_STRUCTURE.md`
3. `03_THEME_SHARED_UI.md`
4. `04_API_AXIOS.md`
5. `05_AUTH_STORE.md`
6. `06_NAVIGATION.md`
7. `07_AUTH_SCREENS.md`
8. `08_HOME.md`
9. `09_CATEGORY_BRAND.md`
10. `10_PRODUCT_LIST.md`
11. `11_PRODUCT_DETAIL.md`
12. `12_SEARCH_FILTER.md`
13. `13_FAVORITES.md`
14. `14_CART.md`
15. `15_ADDRESSES.md`
16. `16_CHECKOUT.md`
17. `17_ORDERS.md`
18. `18_ORDER_DETAIL.md`
19. `19_PAYMENT.md`
20. `20_REVIEWS.md`
21. `21_PROFILE.md`
22. `22_NOTIFICATIONS.md`
23. `23_SOCKET_REALTIME.md`
24. `24_GLOBAL_STATES.md`
25. `25_TESTING.md`
26. `26_FINAL_E2E.md`

## Luồng chính cần chạy được

```text
Đăng ký/Đăng nhập
→ Home
→ Danh mục
→ Danh sách sản phẩm
→ Chi tiết sản phẩm
→ Yêu thích
→ Giỏ hàng
→ Địa chỉ
→ Checkout
→ Tạo đơn hàng
→ Admin Web nhận đơn
→ Admin cập nhật trạng thái
→ Mobile nhận Socket update
→ Xem chi tiết đơn
→ Đánh giá sản phẩm
```

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
