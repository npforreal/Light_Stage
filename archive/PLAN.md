# Lưu trữ PLAN.md (nguyên văn, không chỉnh sửa)

## Đợt 1: Khởi động, Khung kiến trúc & Nền tảng Core Data Engine

### Mục tiêu đợt
Khởi tạo nền tảng desktop Tauri v2 (Rust + React/TS + TailwindCSS), xây dựng toàn bộ data models chuẩn cho nghiệp vụ sân khấu, bộ máy auto-save và schema `.lightstage`.

### Giai đoạn 1.1: Khởi tạo khung & Chuẩn hóa Workflow
- [x] Thiết lập workflow chuẩn: AGENTS.md, PLAN.md, PROGRESS.md, scripts/ và git pre-commit hook.
- [x] Thống nhất kiến trúc qua /grill-me: Tauri v2 + React/TS, Dual View, Sân khấu ảo 2D, File .lightstage.
- [x] Khởi tạo dự án Tauri v2 (Vite + React 19 + TypeScript + TailwindCSS), cấu hình linter, format và test runner.
- [x] Cấu hình script kiểm tra chất lượng code (`check.sh`) cho cả TypeScript và Rust.

### Giai đoạn 1.2: Thiết kế Core Domain Data Model & Persistence
- [x] Thiết kế schema chuẩn (`types/stage.ts`): Show, Act, Cue (Pending/Standby/Go/Hold/Skip), Department Cues (LX, VX, SQ, ST).
- [x] Xây dựng State Management (Zustand store): Playback controller, active cue state machine, master & countdown clocks.
- [x] Xây dựng bộ lưu trữ & phục hồi: File dự án `.lightstage` (JSON schema) và cơ chế auto-save dự phòng chống mất điện.

---

## Đợt 2: Smart Excel Parser & Bộ đếm Thiết bị Tự động (Lighting & LED Counter)

### Mục tiêu đợt
Xây dựng engine đọc/ghi Excel/CSV, thuật toán Regex/NLP tự động bóc tách số lượng đèn và màn hình LED từ dữ liệu cue, và bảng tổng hợp trang thiết bị show.

### Giai đoạn 2.1: Excel/CSV Import & Column Mapping Wizard
- [x] Xây dựng module đọc file Excel (.xlsx, .xls) và CSV với tính năng Header auto-detection.
- [x] Xây dựng hộp thoại Column Mapping cho phép người dùng ánh xạ cột linh hoạt khi file không theo chuẩn.
- [x] Xử lý các định dạng thời gian biểu diễn đa dạng (`00:03:00`, `3m20s`, `180s`).

### Giai đoạn 2.2: Smart Hardware Counter & Inventory Aggregation
- [x] Xây dựng bộ phân tích cú pháp (Regex/NLP parser) nhận diện tự động số lượng + phân loại thiết bị từ text tự do (Beam, Spot, Wash, Par LED, Blinder, Follow, Màn LED Main/Cánh/Sàn).
- [x] Tính toán số liệu thống kê: Số lượng thiết bị theo từng Cue, Đỉnh sử dụng đồng thời (Peak Concurrent Usage), và Danh mục tổng thiết bị toàn show.
- [x] Viết bộ unit tests toàn diện cho parser và counter (kiểm thử chuỗi tiếng Việt/tiếng Anh, edge cases).

---

