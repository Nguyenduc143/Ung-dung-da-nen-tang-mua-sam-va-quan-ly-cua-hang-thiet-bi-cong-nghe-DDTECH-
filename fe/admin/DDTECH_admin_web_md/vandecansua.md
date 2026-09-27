Kết quả kiểm tra
Không phát hiện lỗi làm hỏng các chức năng hiện tại.
- Backend: 12/12 bộ integration test đạt.
- Backend TypeScript/build: đạt.
- Admin web TypeScript/build: đạt.
- Upload ảnh sản phẩm và danh mục: đạt.
- Auth, phân quyền, giỏ hàng, đơn hàng, kho, khuyến mãi, đánh giá, thông báo, Socket và Dashboard: đạt.
- npm audit backend/frontend: 0 lỗ hổng dependency.
- Dữ liệu test được tạo riêng và đã dọn sau khi chạy.
Các vấn đề cần xử lý
1. Thanh toán online chưa hoạt động — ưu tiên cao
Backend cho phép tạo đơn với VNPAY, MOMO, ZALOPAY, nhưng API tạo thanh toán chỉ xử lý COD. Các phương thức còn lại trả về 501.
Vị trí: [payment.service.ts (line 77)](D:/Nam4/LTMOBILEDNT/BTLMOBILE/ddtechdlt/be/src/services/payment.service.ts:77)
Đề xuất:
- Nếu chưa làm cổng thanh toán: tạm thời chỉ cho phép COD khi checkout.
- Hoặc triển khai VNPay/MoMo đầy đủ gồm tạo URL, callback, kiểm tra chữ ký, chống callback trùng và đồng bộ trạng thái đơn.
2. Admin web chưa có automated test — ưu tiên cao
File yêu cầu phần 17 chỉ định Vitest và React Testing Library, nhưng frontend hiện không có dependency hoặc script test.
Vị trí:
- [17_TESTING_AND_DEPLOY.md (line 3)](D:/Nam4/LTMOBILEDNT/BTLMOBILE/ddtechdlt/fe/admin/DDTECH_admin_web_md/17_TESTING_AND_DEPLOY.md:3)
- [package.json (line 6)](D:/Nam4/LTMOBILEDNT/BTLMOBILE/ddtechdlt/fe/admin/package.json:6)
Cần bổ sung test cho:
- Đăng nhập admin, chặn customer, refresh và logout.
- Protected route.
- CRUD danh mục, thương hiệu, sản phẩm, kho, khuyến mãi, đánh giá.
- Socket và thông báo realtime.
- Có thể thêm Playwright để kiểm tra luồng trình duyệt thực tế.
Hiện tại frontend chỉ được xác nhận build thành công, chưa thể đảm bảo mọi nút và modal đều hoạt động qua trình duyệt.
3. Refresh token lưu trong localStorage — rủi ro bảo mật
Cả access token và refresh token đang được lưu ở localStorage. Nếu web gặp XSS, refresh token có thể bị lấy.
Vị trí: [authSession.ts (line 55)](D:/Nam4/LTMOBILEDNT/BTLMOBILE/ddtechdlt/fe/admin/src/api/authSession.ts:55)
Đề xuất:
- Refresh token lưu bằng cookie HttpOnly, Secure, SameSite.
- Access token chỉ giữ trong memory.
- Bổ sung CSRF protection nếu chuyển sang cookie.
4. Cấu hình production qua reverse proxy chưa đầy đủ
Backend chưa cấu hình trust proxy. Khi deploy sau Nginx/Vercel proxy:
- req.ip có thể luôn là IP của proxy, khiến nhiều người dùng dùng chung giới hạn đăng nhập.
- URL ảnh tải lên có thể bị lưu thành http://... thay vì https://....
Rate limiter hiện cũng lưu trong RAM: [rateLimit.middleware.ts (line 15)](D:/Nam4/LTMOBILEDNT/BTLMOBILE/ddtechdlt/be/src/middleware/rateLimit.middleware.ts:15)
Đề xuất:
- Thêm biến TRUST_PROXY.
- Production dùng Redis rate limiter.
- Thêm PUBLIC_BASE_URL để tạo URL ảnh ổn định.
5. Bundle admin web khá lớn
Build thành công nhưng file JavaScript khoảng 2,07 MB, gzip khoảng 634 KB. Tất cả trang đang được import ngay từ đầu tại [App.tsx (line 8)](D:/Nam4/LTMOBILEDNT/BTLMOBILE/ddtechdlt/fe/admin/src/App.tsx:8).
Đề xuất:
- Dùng React.lazy() và Suspense cho từng route.
- Tách Dashboard/Recharts thành chunk riêng.
- Chỉ tải module quản lý khi người dùng truy cập.
6. Lưu ảnh trên ổ đĩa chỉ phù hợp chạy local/VPS đơn
Ảnh hiện được lưu trong be/uploads. Cách này hoạt động tốt khi chạy local, nhưng có vấn đề khi deploy container hoặc nhiều server:
- Redeploy có thể mất ảnh.
- Nhiều instance không dùng chung file.
- Chưa có backup/CDN.
- Hiện mới kiểm tra chữ ký đầu file, chưa giải mã toàn bộ ảnh.
Đề xuất production:
- Dùng S3, Cloudinary hoặc MinIO.
- Dùng sharp để đọc, giới hạn kích thước ảnh và encode lại.
- Tạo thumbnail/WebP tự động.
Ngoài ra, ảnh thương hiệu và ảnh riêng của phiên bản sản phẩm vẫn chỉ nhập URL; có thể mở rộng upload tương tự danh mục.
7. Một số API chưa có integration test riêng
Chưa thấy test đầy đủ cho:
- Địa chỉ người dùng.
- Cập nhật hồ sơ và đổi mật khẩu.
- Chi tiết/khóa/mở khóa người dùng từ admin.
- Upload sai định dạng và file vượt 5 MB.
- Các thao tác admin web bằng trình duyệt.
Đánh giá chung
Hệ thống hiện ổn định cho môi trường phát triển và demo. Phần cần ưu tiên tiếp theo là:
1. Khóa các phương thức thanh toán chưa hỗ trợ hoặc triển khai cổng thanh toán.
2. Làm phần 17: test frontend.
3. Cải thiện cách lưu token.
4. Hoàn thiện cấu hình deploy/reverse proxy.
5. Code-splitting và lưu ảnh trên object storage cho production.