# Quy chuẩn Kỹ thuật & Bối cảnh Dự án — Light Stage

## 1. Bối cảnh & Yêu cầu Kỹ thuật (Project Context)
- **Tên ứng dụng**: Light Stage (Desktop App cho macOS & Windows).
- **Công nghệ nền tảng (Tech Stack)**:
  - Framework: **Tauri v2 (Rust backend + React / TypeScript frontend)** — siêu nhẹ, tối ưu RAM/CPU khi vận hành live show.
  - UI & Styling: TailwindCSS + Lucide Icons (Dark theme tối ưu phòng điều khiển âm thanh/ánh sáng).
- **Phân hệ điều phối sân khấu**:
  - `Lighting (LX)`: Cảnh sáng, chùm đèn, preset, số lượng fixture.
  - `Visual LED (VX)`: Màn hình LED (Main, Cánh), video loop, visuals, số lượng màn hình.
  - `Sound (SQ)`: Micro, nhạc nền, stingers, hiệu ứng âm thanh.
  - `Stage / Action`: Di chuyển diễn viên/MC, đạo cụ, chỉ dẫn sân khấu.
- **Tính năng cốt lõi**:
  - **Nhập liệu & Đếm tự động**: Nhập tay hoặc import Excel/CSV. Tự động nhận diện cột chuyên dụng và bóc tách chuỗi mô tả (regex/parser) để đếm số lượng đèn và màn hình LED theo từng cue và tổng show.
  - **Giao diện hiển thị chế độ kép (Dual View)**:
    - *Bảng Rundown / Cue List*: Hiển thị chi tiết từng cue, hỗ trợ gọi cue (Standby / Go), countdown timer, điều khiển phím tắt (Space = Go, B = Standby).
    - *Timeline Tracks*: Thanh ngang tuyến tính theo thời gian trực quan cho từng kênh LX, VX, SQ.
  - **Sân khấu ảo 2D (Virtual Stage Preview)**: Hiển thị sơ đồ 2D (mặt trước & top-down) mô phỏng vị trí màn hình LED và giàn đèn, tự động highlight sáng/đổi màu theo cue active.
  - **Lưu trữ & Xuất file**: File dự án độc lập `.lightstage` (JSON format) + Xuất báo cáo Cue Sheet ra Excel & PDF.

## 2. Kỷ luật Ngữ cảnh & Token (Token Discipline)
- **Đọc có chọn lọc (Selective Reading)**:
  - `PLAN.md`: Chỉ đọc đợt hiện tại (phần `## ` cuối cùng). Không nạp cả file.
  - `PROGRESS.md`: Chỉ đọc ~60 dòng đầu tiên (chứa 2-3 tác vụ gần nhất).
  - `archive/`: Tra cứu lịch sử cũ bằng `grep`, tuyệt đối không đọc trọn file.
- **Sửa file chuẩn xác**: Luôn dùng `edit_file` thay vì ghi đè (`write_file`) cho file hiện có.
- **Cắt tỉa output**: Command output dài phải lọc qua `tail -n 30` hoặc `grep`; không in log thô quá dài vào context.

## 3. Chu trình Thực thi Chuẩn (The Agentic Loop)
1. **Lập kế hoạch hẹp**: Bám sát checklist `[ ]` trong active round của `PLAN.md`.
2. **Kỷ luật kiểm chứng (Verify-Before-Check)**:
   - Tuyệt đối KHÔNG đánh dấu `[x]` nếu chưa chạy kiểm thử thực tế có kết quả đạt.
   - Chạy kiểm tra nhanh: `bash scripts/check.sh --fast`.
3. **Cập nhật nhật ký & mốc**:
   - Thêm log vào ĐẦU `PROGRESS.md`: Thay đổi, Quyết định kỹ thuật, Lệnh & kết quả kiểm chứng.
   - Tích `[x]` vào `PLAN.md` cho mốc đã chứng minh hoạt động.
4. **Lưu trữ không mất mát (Lossless Archive)**:
   - Khi hoàn tất một đợt/giai đoạn: Chạy `python3 scripts/archive_logs.py` để chuyển log cũ sang `archive/`.

## 4. Công cụ Tự động & Quản lý Chất lượng
- `bash scripts/check.sh [--fast]`: Fast quality gate (linter, unit test, audit).
- `python3 scripts/audit_workflow.py`: Workflow doctor quét phình token, cấu trúc file và secret leak.
- `python3 scripts/handoff.py`: Trích xuất snapshot trạng thái gọn gàng để bàn giao phiên / trước `/compact`.
- **Git Commit**: Commit nguyên tử theo Conventional Commits; hook `.git/hooks/pre-commit` tự động bảo vệ secret và chạy quality gate. Không tự ý push remote.
