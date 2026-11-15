# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-15 — Khởi tạo khung dự án & Chuẩn hóa Workflow kỷ luật Agent

### Thay đổi
- Thiết lập khung dự án: `AGENTS.md` (tối ưu hóa token, tích hợp bối cảnh ứng dụng Light Stage điều phối sân khấu), `PLAN.md`, `PROGRESS.md`.
- Cấu hình công cụ tự động: `scripts/archive_logs.py`, `scripts/audit_workflow.py`, `scripts/handoff.py`, `scripts/check.sh`.
- Cài đặt git repository và `.git/hooks/pre-commit` bảo vệ secret và chạy fast quality gate.

### Quyết định quan trọng
- Định hình phân hệ sân khấu: Lighting (LX), Visual LED (VX), Sound (SQ), Stage/Action.
- Cơ chế đếm thiết bị: Sẽ hỗ trợ cả cột chỉ định số lượng tường minh lẫn phân tích tự động từ văn bản mô tả cue khi import Excel.
- Tối ưu hóa token: Quy định chặt chẽ đọc chọn lọc (chỉ đọc active round trong PLAN.md, ~60 dòng đầu trong PROGRESS.md), sửa file bằng `edit_file`.

### Kiểm chứng & Kết quả
- `python3 scripts/audit_workflow.py` -> 0 failure(s), 0 warning(s).
- `bash scripts/check.sh --fast` -> All passed.
