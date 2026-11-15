# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-15 — Hoàn thành phỏng vấn /grill-me & Thống nhất kiến trúc Light Stage

### Thay đổi
- Cập nhật `AGENTS.md` bổ sung đầy đủ chi tiết kiến trúc sau phỏng vấn /grill-me:
  - Stack: Tauri v2 (Rust + React/TypeScript + TailwindCSS).
  - UI: Chế độ kép Dual View (Bảng Rundown / Cue calling + Timeline tracks) + Sân khấu ảo 2D (Top-down & Front-facing layout).
  - Phím tắt: Space (Go), B (Standby), điều hướng cue.
  - File format: Dự án độc lập `.lightstage` (JSON) + Export Excel/PDF.
  - Bộ đếm thiết bị: Kết hợp cột số lượng chuyên dụng và smart parser bóc tách chuỗi text.
- Cập nhật `PLAN.md` chi tiết các giai đoạn triển khai của Đợt 1.

### Quyết định quan trọng
- Chọn Tauri v2 để đảm bảo ứng dụng chạy desktop native siêu nhẹ, không ngốn RAM/CPU trong phòng điều khiển kỹ thuật sân khấu.
- Giữ `AGENTS.md` cực kỳ cô đọng, tối ưu token theo đúng nguyên tắc của skill `agentic-engineering-workflow`.

### Kiểm chứng & Kết quả
- `python3 scripts/audit_workflow.py` -> 0 failure(s), 0 warning(s).
- `bash scripts/check.sh --fast` -> All passed.
