# Kiểm thử DDTECH Mobile

## Lệnh kiểm tra tự động

```bash
npm run typecheck
npm test
npm run test:coverage
```

Test tự động bao phủ validation đăng nhập/đăng ký/địa chỉ, lỗi API, trạng thái sản phẩm,
global empty/error states và quản lý socket listener.

## Checklist kiểm thử tích hợp trên thiết bị

Chuẩn bị backend và MySQL, đặt `EXPO_PUBLIC_API_URL` cùng `EXPO_PUBLIC_SOCKET_URL`
thành địa chỉ LAN của máy chạy backend. Không dùng `localhost` trên điện thoại thật.

- [ ] Đăng ký tài khoản mới, kiểm tra lỗi email/số điện thoại trùng hoặc sai định dạng.
- [ ] Đăng nhập đúng/sai mật khẩu; đóng và mở lại ứng dụng để kiểm tra khôi phục phiên.
- [ ] Làm access token hết hạn: request phải refresh một lần và tiếp tục; refresh token sai phải về đăng nhập.
- [ ] Đăng xuất: token bị xóa, socket ngắt và màn hình riêng tư không mở lại được.
- [ ] Mở sản phẩm, tìm kiếm, lọc danh mục/thương hiệu/khoảng giá và tải thêm trang.
- [ ] Thêm/xóa yêu thích; kiểm tra badge và trạng thái sau khi mở lại ứng dụng.
- [ ] Thêm/cập nhật/xóa giỏ hàng; thử quantity bằng 0 và vượt tồn kho.
- [ ] Tạo/sửa/xóa/chọn địa chỉ giao hàng.
- [ ] Checkout với voucher hợp lệ, voucher sai và voucher hết hạn.
- [ ] Đặt hàng, xem chi tiết, hủy đơn đủ điều kiện và thử hủy đơn không đủ điều kiện.
- [ ] Nhận thông báo, đánh dấu đã đọc/tất cả đã đọc và mở đúng màn hình đích.
- [ ] Cập nhật đơn hàng từ admin: trạng thái đơn và thông báo phải đổi realtime đúng một lần.
- [ ] Tắt mạng hoặc backend: hiển thị lỗi phù hợp, nút Thử lại hoạt động, không request lặp vô hạn.
- [ ] Sản phẩm/variant hết hàng hoặc không có giá: vẫn xem được chi tiết nhưng không thể mua.

## Kiểm tra an toàn và ổn định

- Không ghi access token hoặc refresh token ra console.
- Mỗi `subscribeRealtime` trong screen phải trả và chạy hàm unsubscribe khi unmount.
- Không tạo socket mới khi access token không đổi.
- Theo dõi tab Network khi đổi bộ lọc và chuyển màn hình để phát hiện request lặp.
