WEB LỚP 12A3 - cách chạy
1) Cài Node.js (bản 18 trở lên).
2) Mở thư mục này, chạy:  npm install   rồi   node server.js
3) Mở http://localhost:3000
Khi đưa lên máy chủ (Render, Railway...): đặt biến môi trường
  ADMIN_CODE = mã đăng nhập của giáo viên (mặc định ndthummh82, nên tự đổi)
  DATA_DIR   = thư mục ổ đĩa lưu trữ lâu dài (để không mất dữ liệu khi máy chủ khởi động lại)
Học sinh: chọn tên + nhập mã (tên + ngày tháng sinh, ví dụ ngan1203).
Dữ liệu lưu trong data.json (báo cáo, điểm, phân công, hoa/lời chúc).
