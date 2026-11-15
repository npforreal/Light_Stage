# Lưu trữ PROGRESS.md (nguyên văn, không chỉnh sửa)

## 2026-11-15 — Hoàn thành & Kiểm chứng Core Domain Data Model, Zustand State Store & Persistence Engine (Giai đoạn 1.2)

### Thay đổi
- Định nghĩa schema TypeScript domain sân khấu chuẩn (`src/types/stage.ts`): Show, Act, Cue với đầy đủ trạng thái playback (Pending, Standby, Go, Hold, Skip, Completed), các phân hệ kỹ thuật (LX - Ánh sáng, VX - Visual LED, SQ - Âm thanh, ST - Sân khấu/Action), DeviceSpecification và hàm tính toán tải thiết bị.
- Xây dựng Zustand store quản lý trạng thái show & cue state machine (`src/store/useShowStore.ts`): Playback controls (standbyCue, goCue, holdCue, skipCue, resetCue), quản lý CRUD Act/Cue, và selector thống kê thiết bị (peak usage & totals).
- Xây dựng Zustand store quản lý đồng hồ & đếm ngược (`src/store/useClockStore.ts`): Master elapsed clock, Cue countdown/elapsed timer, cờ cảnh báo overrun thời gian, tiện ích format thời gian chính xác tới phần mười giây.
- Xây dựng engine tuần tự hóa & phục hồi `.lightstage` (`src/services/persistence.ts`): Parser với kiểm tra phiên bản schema, xuất file Blob, và cơ chế auto-save dự phòng chống mất nguồn với localStorage.
- Xây dựng bộ kiểm thử đơn vị toàn diện: 29/29 tests bao phủ domain models, playback state transitions, clock/countdown và file serialization/auto-save.

### Quyết định kỹ thuật
- Tách biệt rõ ràng giữa state điều phối cue (`useShowStore`) và state đồng hồ realtime tần số cao (`useClockStore`) nhằm tránh re-render thừa cho bảng rundown.
- Schema `.lightstage` có versioning (`schemaVersion: 1`) cùng cơ chế fallback linh hoạt (hỗ trợ cả wrapper envelope và raw show object), kiểm soát chặt chẽ schema không tương thích.

### Kiểm chứng & Kết quả
- `npm run type-check`: TypeScript sạch 100%, 0 lỗi.
- `npx vitest run`: 5/5 test suites passed, 29/29 tests passed (thời gian thực thi 773ms).
- `npm run build`: Production bundle Vite 6 hoàn tất thành công trong 797ms.
- `bash scripts/check.sh --fast`: Quality gate passed toàn bộ.
- `python3 scripts/audit_workflow.py`: ALL CHECKS PASSED, cấu trúc workflow và token discipline đạt chuẩn.

## 2026-11-15 — Hoàn thành Khởi tạo khung dự án Tauri v2 + React 19 + TypeScript + Vite + TailwindCSS (Giai đoạn 1.1)

### Thay đổi
- Khởi tạo kiến trúc Tauri v2 với cấu hình chuẩn cho live stage application (`tauri.conf.json`).
- Thiết lập React 19 + TypeScript 5.7 + Vite 6 + TailwindCSS v3 với dark theme tối ưu cho phòng điều khiển sân khấu.
- Cài đặt thư viện cốt lõi tối giản: `zustand` (state management), `lucide-react` (iconography), `clsx`, `tailwind-merge`.
- Cấu hình test runner `vitest` cùng `@testing-library/react` và `jsdom`. Viết test mẫu `src/App.test.tsx`.
- Cập nhật `scripts/check.sh` hỗ trợ cả chế độ `--fast` (type-check, tests, audit) và chế độ đầy đủ (kèm build và cargo check).

### Quyết định kỹ thuật
- Tối ưu hóa cấu hình Vite và tsconfig bundler mode để tốc độ build/test siêu nhanh (< 1s).
- Graceful degradation cho `cargo check` trong `scripts/check.sh` khi môi trường chưa cài đặt Rust native compiler.

### Kiểm chứng & Kết quả
- `npm run type-check`: 0 errors.
- `npm run test`: 1/1 tests passed trong 584ms.
- `npm run build`: Production bundle hoàn tất trong 822ms (dist/assets sẵn sàng).
- `bash scripts/check.sh --fast`: All quality gate checks passed.
- `python3 scripts/audit_workflow.py`: Repository in prime workflow health.

## 2026-11-15 — Hoàn thiện Bản kế hoạch Sản xuất (Production Roadmap) & Áp dụng vào PLAN.md

### Thay đổi
- Tạo Implementation Plan Artifact chi tiết tới mức Production: `production_plan.md` phân tích đầy đủ nghiệp vụ sân khấu trực tiếp, kiến trúc kỹ thuật Tauri v2, Smart Excel Parser & Counter, Dual View và Sân khấu ảo 2D.
- Cập nhật toàn diện `PLAN.md` chia làm 5 Đợt phát triển cụ thể với các tiêu chí nghiệm thu rõ ràng.
- Đã xác nhận các quyết định mở rộng qua `/grill-me`: Giai đoạn 1 tập trung Standalone offline cực chuẩn, Sân khấu ảo 2D sử dụng thư viện Preset + form cấu hình nhanh.

### Quyết định quan trọng
- Lộ trình chia 5 đợt khép kín, mỗi đợt đều có khả năng kiểm thử độc lập (Test-driven & Verification first).
- Ưu tiên tính ổn định tuyệt đối (Zero-crash) và cơ chế tự động lưu ngầm (Auto-save) phòng ngừa sự cố mất nguồn trong live show.

### Kiểm chứng & Kết quả
- `python3 scripts/audit_workflow.py` -> 0 failure(s), 0 warning(s).
- `bash scripts/check.sh --fast` -> All passed.
