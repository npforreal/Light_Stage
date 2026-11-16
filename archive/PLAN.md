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

### Giai đoạn 5.1: Bộ điều khiển Thời gian & Phím tắt Sân khấu
- [x] Hệ thống Master Clock: Đồng hồ thực, đồng hồ thời lượng show, đồng hồ đếm ngược cue, cảnh báo lệch giờ (Delta Time).
- [x] Hệ thống phím tắt tiêu chuẩn: Spacebar (Go), B (Standby), Up/Down (Chuyển cue), Esc (Hold/Pause).
- [x] Chế độ Operator Lock Mode (khóa giao diện chống bấm nhầm phím trong lúc chạy show).

### Giai đoạn 5.2: Xuất Báo cáo (PDF & Excel) & Đóng gói Production
- [x] Xuất file Run of Show (ROS) tổng quan và Cue Sheet lọc riêng cho từng bộ phận (LX, VX, SQ) ra PDF chuẩn in ấn.
- [x] Xuất lại file Excel đã qua chuẩn hóa và thống kê thiết bị.
- [x] Stress testing, kiểm tra rò rỉ bộ nhớ (no memory leak) và đóng gói installer native cho macOS (`.dmg`) và Windows (`.exe` / `.msi`).
## Đợt 6: Sửa lỗi Vận hành & Độ tin cậy Live Show

> Nguồn: đánh giá đa góc độ ngày 2026-11-15 (test thủ công trên browser 1280×800 + đọc code). Thứ tự giai đoạn theo mức nghiêm trọng khi chạy live.

### Mục tiêu đợt
Không mất dữ liệu show, phím tắt và đồng hồ đúng tuyệt đối khi gọi cue, giao diện dùng được ở mọi cỡ cửa sổ hợp lệ (≥ 960×600), export an toàn.

### Giai đoạn 6.1: Chống mất dữ liệu (Critical)
- [x] 6.1.1 Nối autosave: gọi `saveAutoSave` (debounce ~1s) khi `show` đổi; hiển thị trạng thái "Đã lưu / chưa lưu" từ `isDirty`.
- [x] 6.1.2 Khi khởi động: nếu có autosave, hỏi khôi phục (dùng `loadAutoSave`), có nút bỏ.
- [x] 6.1.3 Nút "Open Project (.lightstage)" dùng `parseLightStageFile`; báo lỗi rõ khi file hỏng/sai phiên bản.
- [x] 6.1.4 Import CSV và New Show: hỏi xác nhận khi `isDirty`, cho phép "Thêm vào cuối" thay vì thay thế toàn bộ (`ImportModal.tsx:61`).
- [x] 6.1.5 Cảnh báo thoát khi `isDirty` (`beforeunload`; với Tauri dùng sự kiện đóng cửa sổ).
- Kiểm chứng: test persistence/store, browser: sửa cue → reload → khôi phục đúng; mở lại file đã lưu.

### Giai đoạn 6.2: Đồng hồ & phím tắt đúng khi gọi cue (Critical)
- [x] 6.2.1 Gom logic GO vào một hàm duy nhất (store/hook): `goCue` + `syncCueDuration(cue.durationMs, true)` + `startClock`; hotkey, nút bảng và timeline đều gọi hàm này.
- [x] 6.2.2 Hotkey: chỉ bỏ qua khi focus ở input/textarea/select/contenteditable; khi focus ở button thì `blur()` hoặc vẫn GO nhưng không kích hoạt nút (test cả Space và Enter).
- [x] 6.2.3 Đồng hồ dùng mốc `performance.now()` thay vì cộng `tick(100)` để không trôi và không chậm khi cửa sổ ở nền.
- [x] 6.2.4 Định nghĩa lại Delta (so với thời điểm kế hoạch bắt đầu cue hiện tại); ghi quyết định vào PROGRESS.
- [x] 6.2.5 Trạng thái cue: Esc đặt rõ Hold + dừng đồng hồ; cue đã chạy xong chuyển Done thay vì để Hold/Go.
- [x] 6.2.6 Cue number tự tăng, không trùng (`1.0`, `2.0`…), cảnh báo khi người dùng nhập trùng.
- Kiểm chứng: test store/clock (GO cue 01:00 → remainder 01:00), test hotkey có button focus, browser lặp lại kịch bản đã lỗi.

### Giai đoạn 6.3: Bố cục responsive & Operator Lock luôn thấy được (High)
- [x] 6.3.1 Header co giãn ở 960–1920px: rút gọn nhãn, ẩn Wall Clock hoặc gom nút phụ vào menu; Lock/Import/Export luôn nằm trong màn hình.
- [x] 6.3.2 Operator Lock luôn hiển thị cố định; hiển thị banner rõ khi đang khoá.
- [x] 6.3.3 Kiểm tra `scrollWidth === clientWidth` ở 960, 1280, 1920 (test browser, kèm ảnh).
- Kiểm chứng: đo bằng JS trên browser tại 3 độ rộng + chụp màn hình.

### Giai đoạn 6.4: Parser đếm đúng (Medium)
- [x] 6.4.1 `hardwareParser.ts`: thay `includes()` bằng khớp từ (word boundary/từ khoá có biên), nhận "Spare", "Party" không phải fixture; giữ hỗ trợ tiếng Việt có dấu.
- [x] 6.4.2 Giới hạn số lượng hợp lý (ví dụ 1–9999), vượt thì cảnh báo thay vì nhận.
- [x] 6.4.3 Xử lý "Beam x 4 (FOH)" và ngoặc/ghi chú đuôi; thêm test hồi quy các ca đã lỗi (`Spare cable 3`, `Party mode`, `x 4000000000`, `Blinder 2 -> 0`).
- Kiểm chứng: vitest `hardwareParser`, `importer`, `stress` (hiệu năng vẫn dưới ngưỡng).

### Giai đoạn 6.5: Stage 2D không nói sai & Export an toàn (Medium)
- [x] 6.5.1 `VirtualStagePreview.tsx`: cue không có LX → không phát beam; không có VX → màn hiện "Standby/Off" thay vì "Visual Loop LIVE FEED ACTIVE" (phần màu chính xác thuộc Đợt 7).
- [x] 6.5.2 `exporter.ts`: escape HTML mọi chuỗi người dùng/CSV chèn vào bản in; test với `<script>`/`<img onerror>`.
- [x] 6.5.3 CSV export: chống CSV injection (ô bắt đầu bằng `= + - @` thì thêm tiền tố an toàn); test.
- [x] 6.5.4 In PDF: thay `window.open`+`document.write` bằng cách chạy được trong Tauri webview (iframe ẩn/`window.print` hoặc lệnh Tauri); thử trên bản build.
- [x] 6.5.5 `tauri.conf.json`: bật CSP chặt (`default-src 'self'`, cho phép style inline cần thiết), kiểm tra app vẫn chạy.
- [x] 6.5.6 Import: hoặc hỗ trợ `.xlsx` thật, hoặc sửa README/UI chỉ nói CSV/TSV (chốt phương án).
- Kiểm chứng: vitest exporter/stage; browser mở Export, in thử; `npm run build`.

### Giai đoạn 6.6: Đóng đợt
- [x] 6.6.1 `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`.
- [x] 6.6.2 Ghi PROGRESS.md, `python3 scripts/archive_logs.py`, commit Conventional Commits (mỗi giai đoạn một commit, không push).

### Rủi ro & quyết định cần chốt
- Cần cài Rust/cargo để kiểm tra bản build Tauri thật (6.5.4, 6.5.5); môi trường hiện chưa có cargo.
- Định nghĩa Delta (6.2.4) và phương án `.xlsx` (6.5.6) cần người dùng chốt.

