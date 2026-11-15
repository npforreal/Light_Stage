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

## Đợt 3: Giao diện Chế độ Kép (Dual View: Rundown Table & Timeline Tracks)

### Mục tiêu đợt
Xây dựng giao diện hiển thị tác vụ sân khấu trực quan kép: Bảng Cue Rundown chi tiết để gọi cue và Timeline Tracks theo thời gian tuyến tính.

### Giai đoạn 3.1: Bảng Rundown / Cue List Chuyên nghiệp
- [x] Dựng bảng Rundown ảo hóa (virtual scrolling) hỗ trợ show lớn hàng trăm cues mượt mà.
- [x] Hiển thị trạng thái màu chuẩn sân khấu: Active/Go (viền xanh), Standby (viền hổ phách), Completed (xám).
- [x] Tích hợp tính năng chỉnh sửa trực tiếp nội dung (Inline edit) và kéo thả sắp xếp cue.
- [x] Bộ lọc góc nhìn theo vai trò kỹ thuật viên (Master View, Lighting View, Visual View, Sound View).

### Giai đoạn 3.2: Timeline Tracks Tuyến tính
- [x] Xây dựng các dải timeline song song (Lanes: Master, LX, VX, SQ) với tỷ lệ thời gian thực.
- [x] Thanh Playhead di chuyển mượt mà theo đồng hồ show, hỗ trợ phóng to/thu nhỏ (Zoom in/out).
- [x] Tương tác click trên timeline để nhảy nhanh (Jump to cue) hoặc đặt mốc chạy thử.

---

## Đợt 4: Sân khấu ảo 2D (Virtual Stage Preview)

### Mục tiêu đợt
Mô phỏng 2D trực quan hệ thống màn hình LED và giàn đèn với khả năng đổi trạng thái động theo cue đang kích hoạt.

### Giai đoạn 4.1: Preset & Cấu hình Bố cục Sân khấu
- [x] Cung cấp thư viện preset sân khấu thông dụng: End Stage (Tiêu chuẩn), Festival/Concert, Arena/Thrust.
- [x] Bảng cấu hình nhanh: Thêm/bớt màn hình LED (Main, Cánh, Sàn), vị trí giàn truss đèn (FOH, Mid, Back, Floor).

### Giai đoạn 4.2: Mô phỏng 2D Động (Top-down & Mặt trước)
- [x] Render 2D bằng SVG/Canvas 60fps góc nhìn Mặt trước (Front View) và Từ trên xuống (Top-down View).
- [x] Tích hợp phản ứng thời gian thực (Reactive state): Khi gọi Cue (GO), màn hình ảo đổi màu/hiển thị tên visual, các bóng đèn ảo bật sáng theo preset.

---

