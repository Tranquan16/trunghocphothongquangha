# Website THPT Quang Hà

Cổng thông tin chia nội dung thành các trang riêng để dễ theo dõi:

- `index.html`: trang chủ và các lối tắt.
- `tin-tuc.html`: tin mới từ website trường, có phân trang và cửa sổ đọc bài.
- `van-ban.html`: liên kết đến công văn, văn bản và thông báo chính thức.
- `tra-cuu.html`: liên kết đến trang bảng điểm và thông báo tra cứu điểm thi.
- `su-kien.html`: lịch sự kiện; chỉ hiển thị sự kiện khi có thông báo chính thức.

## Triển khai

API tin tức nằm trong `functions/api/news.js`, theo định dạng Cloudflare Pages Functions. Cần triển khai cả thư mục `functions` cùng các tệp giao diện lên Cloudflare Pages.

1. Kết nối repository này với Cloudflare Pages.
2. Để trống lệnh build và chọn `.` làm thư mục đầu ra.
3. Sau khi triển khai, mở `tin-tuc.html`. Trang sẽ gọi `/api/news` để lấy tin và tải nội dung khi người xem chọn bài.

Không mở `index.html` trực tiếp bằng `file://` để kiểm tra API; Functions chỉ chạy khi trang được phục vụ qua Cloudflare Pages. Nếu dùng hosting khác, cần chuyển API trong `functions/api/news.js` sang cơ chế backend tương ứng với hosting đó.

## Xem thử Functions trên máy

Cài Node.js, sau đó chạy:

```powershell
npx wrangler pages dev .
```
