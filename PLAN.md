# Kế hoạch phát triển dự án — Light Stage

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).

## Đợt 1: Khởi động, Khung kiến trúc & Nền tảng Core Logic

### Mục tiêu đợt
Thiết lập bộ khung dự án Tauri (Rust + React/TS), xây dựng data model chuẩn cho timeline sân khấu, engine đếm thiết bị (đèn & màn hình LED) và bộ parser Excel/CSV.

### Giai đoạn 1.1: Khởi tạo khung & Chuẩn hóa Workflow
- [x] Thiết lập workflow chuẩn: AGENTS.md, PLAN.md, PROGRESS.md, scripts/ và git pre-commit hook.
- [x] Thống nhất kiến trúc qua /grill-me: Tauri v2 + React/TS, Dual View, Sân khấu ảo 2D, File .lightstage.
- [ ] Khởi tạo dự án Tauri (Vite + React + TypeScript + TailwindCSS), cấu hình linter, format và test runner.
- [ ] Cấu hình script kiểm tra chất lượng code (`check.sh`) cho TypeScript/Rust.

### Giai đoạn 1.2: Thiết kế Data Model & Core Parser / Counter
- [ ] Thiết kế schema chuẩn cho Stage Cue Sheet (Cue#, Time, Segment, Action, LX, VX, SQ, Device Counts).
- [ ] Xây dựng module đọc/ghi file Excel & CSV timeline.
- [ ] Xây dựng bộ phân tích cú pháp (parser) tự động phát hiện và kiểm đếm số lượng đèn và màn hình LED từ dữ liệu cue.
- [ ] Viết bộ unit tests cho core parser, counter và edge cases (file rỗng, định dạng lạ, thiếu cột).

### Giai đoạn 1.3: Giao diện hiển thị Timeline cơ bản & Sân khấu ảo 2D
- [ ] Dựng UI bảng Rundown / Cue List cho phép nhập tay, điều khiển phím tắt (Space=Go, B=Standby).
- [ ] Dựng UI Timeline tracks trực quan theo thời gian.
- [ ] Dựng component Sân khấu ảo 2D mô phỏng vị trí đèn & màn hình LED highlight theo cue active.
- [ ] Tích hợp tính năng kéo thả import Excel với bảng thống kê thiết bị tự động.
- [ ] Chạy kiểm thử tích hợp, tối ưu hiệu năng và cập nhật tài liệu kỹ thuật.
