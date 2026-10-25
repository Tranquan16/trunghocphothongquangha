# Website THPT Quang Hà

Trang tin lấy danh sách bài viết và nội dung bài từ website chính thức của trường, sau đó hiển thị ngay trên trang này. Chọn một tin để đọc trong cửa sổ nội dung; trang không điều hướng sang website nguồn.

## Triển khai

API lấy tin nằm trong `functions/api/news.js`, theo định dạng Cloudflare Pages Functions. Vì website nguồn không cho phép trình duyệt bên ngoài đọc dữ liệu trực tiếp, cần triển khai cả thư mục `functions` cùng các tệp giao diện lên Cloudflare Pages.

1. Kết nối repository này với Cloudflare Pages.
2. Để trống lệnh build và chọn `.` làm thư mục đầu ra.
3. Sau khi triển khai, mở website Pages. Trang sẽ gọi `/api/news` mỗi lần tải và lấy nội dung bài khi người xem chọn tin.

Không mở `index.html` trực tiếp bằng `file://` để kiểm tra API; Functions chỉ chạy khi trang được phục vụ qua Cloudflare Pages. Nếu dùng hosting khác, cần chuyển API trong `functions/api/news.js` sang cơ chế backend tương ứng với hosting đó.

## Xem thử Functions trên máy

Cài Node.js, sau đó chạy:

```powershell
npx wrangler pages dev .
```
