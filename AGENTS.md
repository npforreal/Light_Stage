# Quy chuẩn & Hướng dẫn Kỹ thuật — Light Stage

## 1. Ngữ cảnh Dự án (Project Context)
- **Tên dự án**: Light Stage (Desktop App cho macOS & Windows).
- **Mục tiêu**: Ứng dụng điều phối & hiển thị timeline/cue rundown sân khấu thời gian thực cho Stage Manager, Show Caller và kỹ thuật viên AV (Âm thanh, Ánh sáng, Visual LED).
- **Phân hệ chính**:
  - `Lighting (LX)`: Tác vụ đánh đèn, cảnh sáng, cường độ/preset, số lượng fixture.
  - `Visual LED (VX)`: Màn hình LED, video intro, visuals loop, số lượng màn hình/output.
  - `Sound (SQ)`: Micro, nhạc nền, stingers, hiệu ứng âm thanh.
  - `Stage / Action`: Chỉ dẫn nhân sự, MC, nghệ sĩ vào/ra sân khấu.
- **Tính năng cốt lõi**:
  - Nhập timeline thủ công (manual entry) hoặc import file Excel/CSV rundown chuẩn.
  - Tự động bóc tách và kiểm đếm số lượng đèn (fixtures) & màn hình LED theo từng tiết mục/cue và tổng hợp toàn show.
  - Trực quan hóa timeline chạy theo thời gian thực (clock time, duration, countdown, status Standby / Go).
- **Giai đoạn hiện tại**: Dựng khung kiến trúc (Scaffold), chuẩn hóa workflow, chưa triển khai code nghiệp vụ.

## 2. Kỷ luật Ngữ cảnh & Token (Token Discipline)
- **Đọc có chọn lọc (Selective Reading)**:
  - `PLAN.md`: Chỉ đọc đợt hiện tại (phần `## ` cuối cùng). Không nạp cả file.
  - `PROGRESS.md`: Chỉ đọc ~60 dòng đầu tiên (chứa 2-3 tác vụ gần nhất).
  - `archive/`: Tra cứu lịch sử cũ bằng `grep`, không đọc trọn file.
- **Sửa file chuẩn xác**: Luôn dùng `edit_file` thay vì ghi đè (`write_file`) cho file hiện có.
- **Cắt tỉa output**: Command output dài phải lọc qua `tail -n 30` hoặc `grep`; không in log thô quá dài vào context.

## 3. Quy trình Thực thi (Agentic Engineering Loop)
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
