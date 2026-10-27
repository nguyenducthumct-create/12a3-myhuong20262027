WEB LỚP 12A3 - cách chạy
1) Cài Node.js (bản 18 trở lên).
2) Mở thư mục này, chạy:  npm install   rồi   node server.js
3) Mở http://localhost:3000
Khi đưa lên máy chủ (Render, Railway...): đặt biến môi trường
  ADMIN_CODE = mã đăng nhập của giáo viên (mặc định ndthummh82, nên tự đổi)
  DATA_DIR   = thư mục ổ đĩa lưu trữ lâu dài (để không mất dữ liệu khi máy chủ khởi động lại)
Học sinh: chọn tên + nhập mã (tên + ngày tháng sinh, ví dụ ngan1203).
Dữ liệu lưu trong data.json (báo cáo, điểm, phân công, hoa/lời chúc).

CẬP NHẬT
- Báo cáo theo từng mục: Thủ quỹ (thu, chi, số dư), Lớp phó học tập (tình hình học tập), Lớp phó lao động (tình hình trực nhật), Phó văn nghệ - Phong trào (tham gia phong trào, hoạt động sắp tới).
- Đố nhanh: câu đã hỏi sẽ bị loại khỏi kho, không hỏi lại. Giáo viên có thể thêm câu mới vào kho (nút 'Lưu câu trên vào kho') hoặc 'Làm mới kho' để hỏi lại từ đầu.
- Hết mỗi lượt chơi hiện màn tuyên dương top 3. Đã bỏ trò Vẽ & đoán.
- Thùng góp ý: mọi học sinh gửi được (có thể ẩn danh), chỉ giáo viên đọc được.
- Lưu ý: để câu đã hỏi và góp ý không bị mất khi server khởi động lại, cần ổ đĩa lưu trữ (biến môi trường DATA_DIR).

GOOGLE SHEET (TỰ ĐỘNG GỬI BÁO CÁO VÀ GÓP Ý)
1. Tạo một Google Sheet mới (chỉ mình bạn xem, đừng chia sẻ công khai vì có góp ý của học sinh).
2. Tiện ích mở rộng > Apps Script, dán nội dung file google-sheet-script.gs, tự đặt mã ở dòng KEY.
3. Triển khai > Ứng dụng web (Thực thi: Tôi, Quyền truy cập: Bất kỳ ai), cấp quyền, copy URL.
4. Trên Render > Environment thêm: SHEETS_URL = URL vừa copy; SHEETS_KEY = mã ở dòng KEY.
5. Lưu, Render deploy lại. Đăng nhập giáo viên > Xuất báo cáo > bấm 'Gửi tất cả lên Google Sheet' một lần để đẩy dữ liệu cũ.
Từ đó mỗi báo cáo, nhận xét, góp ý mới đều tự lên Sheet (2 trang tính: Báo cáo, Góp ý).
