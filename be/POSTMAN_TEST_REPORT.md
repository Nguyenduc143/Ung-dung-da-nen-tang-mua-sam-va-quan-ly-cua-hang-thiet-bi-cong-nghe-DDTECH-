# Báo cáo kiểm thử API qua Postman MCP — 2026-09-16

Backend: http://127.0.0.1:5000/api. MySQL: 127.0.0.1:3307/ddtech.
Đã build TypeScript trước khi chạy. Không sửa logic backend trong phiên test.

| Lần chạy | Requests | Assertions pass | Assertions fail |
|---|---:|---:|---:|
| Health probe | 1 | 1 | 0 |
| Collection chính | 97 | 197 | 0 |
| Collection bổ sung | 30 | 57 | 3 |
| Kiểm tra lại variant | 12 | 24 | 0 |

Các lỗi assertion ở lần bổ sung là lỗi kỳ vọng test, không phải lỗi backend:

- Thêm sản phẩm có variant nhưng thiếu variantId: test dự kiến 409, code trả đúng 422.
- Xóa variant còn stock=7: test dự kiến 200/success=true, code trả đúng 409/success=false.
- Đã xác minh lại: stock > 0 bị chặn; điều chỉnh stock về 0 qua inventory rồi DELETE thành công.
- Collection bổ sung đã được sửa kỳ vọng và thêm bước đưa stock về 0. Chỉ các ca liên quan được chạy lại, không chạy lại toàn bộ collection bổ sung đã sửa.

## Phạm vi đã chạy

- Auth: register, login, me, refresh rotation, token cũ/đã revoke, logout, logout-all, đổi mật khẩu.
- User/admin: profile, danh sách/chi tiết user, khóa/mở, từ chối customer vào admin và user bị khóa.
- Category/brand/attributes: CRUD, slug trùng, tự trỏ parent, xóa mềm/public visibility.
- Product: danh sách, ID/slug, tạo/sửa/xóa, ảnh chính, variant, từ chối PATCH stock trực tiếp.
- Cart/favorite: thêm, lấy, sửa số lượng, xóa, clear, quantity=0 và thiếu xác thực.
- Checkout/order: áp voucher, tổng tiền từ server, lịch sử/chi tiết, toàn bộ trạng thái giao hàng và hủy đơn.
- Payment: trạng thái COD PAID sau DELIVERED.
- Promotion: tạo, danh sách, sửa, validate giỏ hàng và ngừng hoạt động.
- Review: tạo sau mua hàng, danh sách, sửa, admin duyệt/phản hồi và xóa.
- Inventory: nhập/điều chỉnh sản phẩm và variant, chặn stock âm, lịch sử, tồn thấp; xác minh stock thực tế.
- Dashboard: summary, revenue, orders-by-status, top-products, recent-orders, low-stock.
- Notifications: danh sách, số chưa đọc, đọc một và đọc tất cả.

Đây là kiểm thử chức năng theo các ca trên, không phải chứng minh mọi tổ hợp input/concurrency đều đúng. Không kiểm thử cổng thanh toán online hoặc Socket.io trong đợt Postman này.

## Kết quả lưu lại

- [Log collection chính](postman/MCP_RUN_MAIN.txt)
- [Log bổ sung, giữ nguyên lỗi kỳ vọng ban đầu](postman/MCP_RUN_SUPPLEMENTARY.txt)
- [Log kiểm tra lại](postman/MCP_RUN_VARIANT_RECHECK.txt)
- [Collection chính](https://www.postman.com/collections/48563624-0629997d-c4c1-484c-a13d-cc881aec28e1)
- [Collection bổ sung](https://www.postman.com/collections/48563624-e8f1b10d-74d9-4ef5-bc85-903096312be7)

Các file DDTECH_MCP_*.postman_collection.json là snapshot để xem request/assertion, không chạy lại ngay sau cleanup: ID/shipping method và credentials test cần được cấp mới. Mật khẩu admin tạm đã được bỏ khỏi collection.

Đã xóa đúng 2 tài khoản, 3 sản phẩm, 2 đơn hàng test cùng danh mục/thương hiệu/voucher/phương thức vận chuyển và các dữ liệu phụ thuộc của phiên này. Dữ liệu test đã xóa không được giữ làm fixture cho lần sau.
