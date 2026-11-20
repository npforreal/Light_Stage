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

### Giai đoạn 7.1: Lõi khoa học màu (`src/services/color.ts`, thuần hàm, không phụ thuộc UI)
- [x] 7.1.1 Chuyển đổi sRGB ↔ linear, linear ↔ Oklab/OKLCH, hex ↔ OKLCH.
- [x] 7.1.2 Gamut map: giữ L/H, giảm C tới khi vào sRGB; trả cờ `outOfGamut`.
- [x] 7.1.3 `kelvinToRgb` (Helland, kẹp 1000–40000K), `cmyToRgb`, `rgbwToRgb`/`rgbaToRgb`, `xyToLinearRgb` (ma trận XYZ→sRGB, bản chuyển Source A→D65 đơn giản).
- [x] 7.1.4 `mixLinear(beams[])` cộng ánh sáng trong linear + tone-map nhẹ; `applyDimmer(intensity, curve)` (mặc định bình phương).
- [x] 7.1.5 `contrastWcag(fg,bg)` và `contrastApca(fg,bg)` (đối chiếu spec trước khi chốt ngưỡng).
- [x] 7.1.6 Test đơn vị: điểm kiểm Kelvin (2500K≈255,159,70; 2700/3200/5600/6500K), đỏ+lục tuyến tính ≠ cộng gamma, vòng hex→OKLCH→hex sai số < 1/255, gamut map giữ hue.
- Kiểm chứng: `npx vitest run src/services/__tests__/color.test.ts`, `bash scripts/check.sh --fast`.

### Giai đoạn 7.2: Mô hình dữ liệu màu đèn (tương thích ngược)
- [x] 7.2.1 `src/types/stage.ts`: thêm `LightingColor` (union theo mode: `rgb|rgbw|rgba|cmy|kelvin|gel|name`) vào `LightingCue`; giữ `colorPreset` cũ.
- [x] 7.2.2 Migrate trong `persistence.ts`: file cũ có `colorPreset` hex → `{mode:'rgb'}`; không làm hỏng file `.lightstage` đã lưu (thêm test round-trip và test file cũ).
- [x] 7.2.3 Bảng tên màu/gel (`src/data/colors.ts`): Amber, CTO, CTB, Đỏ/Xanh/Vàng…, vài mã Rosco/Lee/GamColor có dữ liệu xy đã xác minh; mục thiếu dữ liệu gắn cờ `approx`.
- [x] 7.2.4 Importer/`hardwareParser`: nhận cột màu và chuỗi như "3200K", "R255 G0 B0", "Amber", "L201"; ánh xạ vào `LightingColor`; test với tiếng Việt.
- [x] 7.2.5 Rundown: ô nhập màu LX (picker + mode + swatch) cho cue; swatch số cạnh mô tả.
- Kiểm chứng: vitest các file liên quan; mở file `.lightstage` cũ trong test.

### Giai đoạn 7.3: Hệ token màu & refactor UI
- [x] 7.3.1 `scripts/gen_tokens.py` (hoặc ts) sinh `src/styles/tokens.css` từ dải OKLCH: surface-0..3, border, text-1..3, accent, dept-lx/vx/sq/st (cùng L, cùng C, hue cách ~90°), status-go/standby/hold/danger.
- [x] 7.3.2 `tailwind.config.js`: thay `stage.*` bằng token semantic (`bg-surface-1`, `text-text-2`, `text-status-go`…); bỏ dùng màu Tailwind thô trong component.
- [x] 7.3.3 Test contrast: mọi cặp text/surface được dùng đạt WCAG 4.5 (chữ) / 3 (UI), in kèm APCA Lc.
- [x] 7.3.4 Refactor theo thứ tự: `App.tsx` (header: chỉ trạng thái mới có màu, đồng hồ trung tính) → `RundownTable` → `TimelineTracks` (dải phân hệ dùng nền mờ, không đặc) → `ImportModal`/`ExportModal`.
- [x] 7.3.5 Quy tắc: màu phân hệ không trùng hue trạng thái; trạng thái luôn kèm chữ/icon (STBY/GO/HOLD/OVERRUN).
- [x] 7.3.6 Mô phỏng thiếu màu đỏ-lục (protan/deutan) kiểm tra cặp Go/Overrun/Standby còn phân biệt được.
- Kiểm chứng: vitest contrast, chụp màn hình trước/sau 1280×800 và 960×600, đếm lại số lớp màu thô (mục tiêu ≈ 0).

### Giai đoạn 7.4: Stage 2D hiển thị đèn chính xác
- [x] 7.4.1 `VirtualStagePreview` lấy màu từ `LightingColor` qua pipeline: màu đích → linear → dimmer → `mixLinear` → gamut map → sRGB.
- [x] 7.4.2 Beam chồng nhau cộng sáng (`mix-blend-mode: plus-lighter`/`screen` trên nền tối); thêm bloom nhẹ, không cháy trắng cả sân.
- [x] 7.4.3 Bỏ giá trị mặc định che sự thật: cue không có LX → không phát beam; không có VX → màn hiện "Standby/Off", không "Visual Loop LIVE FEED".
- [x] 7.4.4 Thanh legend: swatch + nhãn số của cue active (ví dụ "3200K", "R255 G90 B20"), cảnh báo "màu thật rực hơn màn hình" khi `outOfGamut`.
- [x] 7.4.5 Hỗ trợ màu theo truss/nhóm (override), crossfade màu giữa hai cue bằng nội suy trong linear (hoặc OKLCH, ghi quyết định vào PROGRESS).
- [x] 7.4.6 Ghi chú trên UI: "mô phỏng xấp xỉ, không thay thế đo đạc".
- Kiểm chứng: test component (màu beam đúng với `LightingColor`, cue rỗng không có beam), browser: GO qua cue Đỏ→Lục→Kelvin và chụp ảnh đối chiếu.

### Giai đoạn 7.5: Tài liệu & đóng đợt
- [x] 7.5.1 Cập nhật README (mục màu và mô phỏng ánh sáng, giới hạn), liên kết `docs/COLOR_COURSE.md`.
- [x] 7.5.2 `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`.
- [x] 7.5.3 Ghi PROGRESS.md, chạy `python3 scripts/archive_logs.py`, commit theo Conventional Commits (mỗi giai đoạn một commit, không push).

## Đợt 8: Nâng cao Trải nghiệm Thực tế, An toàn Vận hành & Cảnh báo Sân khấu (Live Usability & Reliability)

### Mục tiêu đợt
Khắc phục triệt để các vấn đề phát hiện từ kiểm thử người dùng thực tế và code review:
(1) Đồng bộ hoàn hảo giữa Master Clock Transport và trạng thái Cue trên Rundown Table khi Reset/Stop/Pause.
(2) Tích hợp hệ thống cảnh báo thính giác (Audio Cues & Metronome Beep) bằng Web Audio API không phụ thuộc file ngoài.
(3) Mở rộng tùy biến Sân khấu ảo 2D: cấu hình số lượng màn hình LED, góc beam (Spot/Wash/Beam) và chọn dimmer curve.
(4) Hỗ trợ lịch sử hoàn tác Undo / Redo (`Ctrl+Z`, `Ctrl+Y`) và phím tắt lưu nhanh `Ctrl+S`.
(5) Cung cấp cửa sổ phụ hiển thị đồng hồ sân khấu khổng lồ (Stage Confidence Clock Window) phục vụ cánh gà và bàn MC.

### Rủi ro & quyết định cần chốt
- **Web Audio Context Autoplay Policy**: Trình duyệt có thể chặn âm thanh nếu chưa có tương tác chuột/phím đầu tiên của người dùng $\to$ Phải khởi tạo AudioContext khi người dùng bấm phím hoặc click lần đầu (user gesture unlock).
- **Zustand Undo/Redo Middleware**: Cần giới hạn độ sâu của undo stack (ví dụ: tối đa 30 bước) để tránh phình bộ nhớ RAM trong các show dài hàng trăm cue.
- **Tauri Multi-Window vs Browser Pop-out**: Khi chạy trong Tauri desktop app thì dùng `WebviewWindow`, khi chạy trên nền web fallback sang `window.open` với layout chuyên biệt `/stage-clock`.

### Kế hoạch chi tiết

### Giai đoạn 8.1: Đồng bộ Trạng thái Đồng hồ Transport & Cue Lifecycle
- [x] 8.1.1 Khi bấm `Reset Clock` (`resetClock`), tự động đưa toàn bộ cue về trạng thái ban đầu (`Pending`) và đặt cue đầu tiên về `Standby`, `activeCueId` về `null`.
- [x] 8.1.2 Khi bấm `Pause Clock` (`pauseClock`), cue đang `Go` tự động chuyển sang trạng thái `Hold` trên Rundown Table.
- [x] 8.1.3 Khi bấm `Stop Clock`, đồng hồ dừng và cue đang chạy được chuyển về `Hold` hoặc hoàn thành tùy cấu hình show.
- [x] 8.1.4 Bổ sung nút "Go Next Cue" ngay trên thanh Header cạnh cụm Transport để người dùng có thêm lựa chọn thao tác nhanh bằng chuột.
- [x] 8.1.5 Viết unit test cho toàn bộ luồng đồng bộ transport trong `src/store/__tests__/useShowStore.test.ts` và `useClockStore.test.ts`.
- Kiểm chứng: `npm test`, kiểm tra tương tác thực tế giữa Header transport và RundownTable.

### Giai đoạn 8.2: Hệ thống Cảnh báo Thính giác Sân khấu (Web Audio Synthesized Alerts)
- [x] 8.2.1 Xây dựng service `src/services/audioAlerts.ts` sử dụng thuần Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`), không dùng file audio ngoài.
- [x] 8.2.2 Cảnh báo đếm ngược 5 giây cuối: phát âm bíp thanh 880Hz (duration 80ms) tại các giây 5, 4, 3, 2, 1 và âm bíp cao 1760Hz (duration 200ms) tại đúng thời điểm GO.
- [x] 8.2.3 Cảnh báo Overrun: phát âm bíp kép trầm 440Hz báo hiệu tiết mục đã vượt quá thời lượng dự kiến.
- [x] 8.2.4 Thêm công tắc Bật/Tắt âm thanh cảnh báo (Audio Mute/Unmute Toggle) trên Header cạnh nút Operator Lock.
- [x] 8.2.5 Viết unit test mock `AudioContext` bảo đảm service an toàn khi chạy trên môi trường không có sound card.
- Kiểm chứng: chạy test unit và kiểm tra phát âm thanh trên trình duyệt.

### Giai đoạn 8.3: Tùy biến Sân khấu Ảo 2D & Đổi Dimmer Curve
> Lưu ý: 8.3.1 và 8.3.3 (cấu hình màn LED, góc chùm) trùng với **9.4 mới** (thiết kế lại Stage 2D theo chuẩn bố trí đèn); nên làm trong 9.4, không làm hai lần.
- [x] 8.3.1 Nâng cấp `VirtualStageConfig`: cho phép thêm/xóa/sửa màn hình LED (LED Floor, LED Cong, LED Backdrop) trong modal cấu hình Stage.
- [x] 8.3.2 Tích hợp lựa chọn Dimmer Curve trong cài đặt show (`square` $I^2$, `linear`, `s-curve`).
- [x] 8.3.3 Cho phép tùy biến góc chùm sáng cho từng giàn truss (`Spot 15°`, `Beam 5°`, `Wash 45°`).
- [x] 8.3.4 Bổ sung hiển thị thông số công suất ước tính (kW) dựa trên số lượng fixture và độ sáng dimmer thực tế.
- [x] 8.3.5 Viết unit test trong `src/components/__tests__/VirtualStagePreview.test.tsx`.
- Kiểm chứng: kiểm tra hiển thị sân khấu 2D với các giàn đèn và góc chùm khác nhau.

### Giai đoạn 8.4: Quản lý Lịch sử Hoàn tác (Undo / Redo) & Phím tắt Nhanh
- [x] 8.4.1 Triển khai undo/redo state history cho các thao tác sửa kịch bản (đổi tên cue, sửa duration, chuyển màu, thêm/xóa cue).
- [x] 8.4.2 Bắt phím tắt toàn cục: `Ctrl+Z` / `Cmd+Z` (Undo), `Ctrl+Shift+Z` / `Cmd+Shift+Z` hoặc `Ctrl+Y` (Redo).
- [x] 8.4.3 Phím tắt `Ctrl+S` / `Cmd+S`: ngăn chặn hành vi mặc định của trình duyệt và kích hoạt lưu dự án / xuất file `.lightstage`.
- [x] 8.4.4 Viết unit test kiểm chứng undo/redo trong `src/store/__tests__/useShowStore.test.ts`.
- Kiểm chứng: `npm test`, thử nghiệm sửa kịch bản và undo/redo liên tục.

### Giai đoạn 8.5: Cửa khấu Phụ Màn hình Sân khấu (Stage Confidence Clock Display)
- [x] 8.5.1 Tạo view chuyên biệt `StageClockWindow` tối giản, chữ to kích thước lớn hiển thị: Tên tiết mục hiện tại, thời gian đếm ngược khổng lồ, cue kế tiếp và Delta.
- [x] 8.5.2 Nút "Open Stage Clock" trên Header mở cửa sổ phụ qua `window.open` hoặc `WebviewWindow` của Tauri v2.
- [x] 8.5.3 Đồng bộ thời gian và trạng thái thời gian thực giữa cửa sổ chính và cửa sổ phụ qua BroadcastChannel hoặc LocalStorage events.
- [x] 8.5.4 Viết unit test và cập nhật tài liệu `README.md`.
- Kiểm chứng: `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`.


### Giai đoạn 8.6: Test như người dùng thật (built-in browser)
- [x] 8.6.1 Chạy kịch bản A (người mới), B (gọi show live) và các mục thuộc Đợt 8 trong `docs/USER_TEST_SCRIPT.md`: Reset/Pause/Stop đồng bộ cue, cảnh báo âm thanh (sau lần tương tác đầu), Undo/Redo, Ctrl+S, mở Stage Clock Window và đồng bộ với cửa sổ chính.
- [x] 8.6.2 Ghi kết quả vào PROGRESS.md (ảnh/số đo), lỗi mới ghi vào PLAN.md theo mức Critical/High/Medium/Low; sửa hết Critical/High trước khi đóng đợt.
- Kiểm chứng: báo cáo test có ngày, viewport, từng kịch bản đạt/không đạt.

## Đợt 9: Khắc phục Lỗi UX từ Kiểm thử Người dùng Thật & Hướng dẫn Sử dụng (First-Run Experience)

> Nguồn: phiên test "người dùng mới" trên built-in browser ngày 2026-11-16 (viewport 960×640 và 1280×800, bản dev sau Đợt 6–7; Đợt 8 chưa làm). Không có lỗi console. Việc đã thấy chạy tốt: GO/Space, remainder đúng, Operator Lock, nút Open/Import/Export, Stage 2D có nhãn 3200K, banner khôi phục autosave, import CSV tiếng Việt, chống nhầm "Spare cable".
> Mức: **[C]** nghiêm trọng, **[H]** cao, **[M]** trung bình, **[L]** thấp.

### Mục tiêu đợt
Người lạ mở app lần đầu phải tự: tạo show, nhập nội dung cho từng cue (LX/VX/SQ/ST + màu), gọi cue bằng chuột hoặc phím, hiểu từng nút nhờ hướng dẫn trong app, mà không phải đoán, không bị nút che, không mất dữ liệu.

### Phát hiện từ test
**Lỗi chức năng**
- [C] Rundown **không cho sửa** ô LX/VX/SQ/ST: double-click chỉ sửa Title và Duration. Cue mới thêm hiện `— — — —` và cách duy nhất có nội dung là import CSV. Không có UI nhập màu LX dù Đợt 7.2.5 hứa (nhãn "Cyan" mặc định không bấm được).
- [C] Ở 960×600 (cỡ cửa sổ nhỏ nhất của app) các nút Pause/Stop/Reset **bị header che**, `elementFromPoint` trả về phần tử khác; cụm Wall Clock/Show Time/Cue Remainder/Delta bị View switcher đè. Ở 1280 các khối chồng nhau 437–786 / 453–585 / 597–936 px. Đợt 6.3 chưa đạt.
- [C] Autosave **không lưu sau Import/Open/New**: `App.tsx:83` chỉ lưu khi `isDirty`, mà `loadShow` đặt `isDirty:false`. Test: import 3 cue → reload → banner khôi phục "2 cues" (bản trước import).
- [H] Parser: "Wash 12 cây 3200K" cho **1 fix** (đuôi 3200K phá nhận số lượng); "Logo Loop" cho **0 screens**; cột "Đỏ" trong ô Ánh sáng bị bỏ qua, chip vẫn là Cyan (importer chưa đọc màu tên tiếng Việt).
- [H] Import chỉ ánh xạ LX/VX; cột Âm thanh được nhận nhưng không có ô chọn SQ/ST và Màu; mặc định "Thay thế toàn bộ" dễ xoá nhầm (đã có confirm nhưng chưa có preview diff).
- [H] Stage 2D **bố trí đèn sai logic** (xem 9.4 và `docs/STAGE_LIGHTING_LAYOUT.md`) và **không phản ánh số lượng thật**: cue "1 fix" vẫn sáng ~35 beam; cue "0 screens" vẫn bật cả 3 màn "Logo Loop LIVE FEED ACTIVE". Config chỉ bật/tắt hiển thị, số lượng "12x Beam 350W" là chữ cố định.
- [M] Export lọc vai trò thiếu **ST** (giao diện chính có ST); các thẻ xuất không phải `button` (khó dùng bàn phím/đọc màn hình).
- [M] Chưa có Undo/Redo, Ctrl+S (đã nằm trong Đợt 8.4).
- [M] Timeline: thanh Master Cue to, đặc màu vàng/xanh lấn át bảng; chưa thấy cách kéo/chỉnh thời lượng.
- [L] Legend "LX Color" ở Stage 2D đè lên sàn khấu ở góc dưới trái; chữ "Đã lưu/Chưa lưu" xuống dòng vỡ ở header hẹp.

**Rối mắt (UX/UI)**
- Header gồm ~15 phần tử trong 1 hàng: quick card Standby/Active, 4 đồng hồ, 3 transport, 4 view, Lock, Open, Import, Export, trạng thái lưu. Không có phân cấp: khi live chỉ cần đồng hồ + GO.
- Mỗi hàng cue có tối đa 5 màu cùng lúc (viền trạng thái, nhãn LX/VX/SQ/ST màu khác nhau, chip fix/screens, chip màu, nút STBY/GO) và nhãn trạng thái không đồng nhất (STANDBY/PENDING/COMPLETED/GO).
- Nhãn lẫn Anh–Việt ("Show Time", "Cue Remainder", "Thay thế toàn bộ", "Đã lưu"); nút "Import CSV/Excel" nhưng hộp thoại chỉ nhận `.csv/.tsv/.txt`.
- Không có onboarding, không có trang hướng dẫn, không có tooltip phím tắt, không có trạng thái rỗng hướng dẫn (show mặc định chỉ có 1 cue demo, "Untitled Show" không đổi tên được từ header).

### Giai đoạn 9.1: Header không che, không chồng (Critical)
- [x] 9.1.1 Thiết kế lại header 2 tầng: tầng vận hành (đồng hồ, transport, Go/Standby) luôn thấy; tầng công cụ (view, Lock, Open/Import/Export) gom vào cụm riêng, thu gọn thành menu "…" dưới 1100px.
- [x] 9.1.2 Test tự động bằng browser: ở 960, 1024, 1280, 1920 mọi `header button` đều `elementFromPoint` trả về chính nó, không có `scrollWidth > clientWidth`, không khối nào chồng.
- [x] 9.1.3 Đổi "Show Time/Cue Remainder/Delta" thành nhãn tiếng Việt (hoặc bật chuyển ngôn ngữ), số dùng `tabular-nums`, "Đã lưu" không xuống dòng.
- [x] 9.1.4 Cho phép đổi tên show ngay trên header.
- Kiểm chứng: ảnh chụp 4 độ rộng + vitest hoặc script kiểm tra overlap; cập nhật `src/App.test.tsx`.

### Giai đoạn 9.2: Nhập nội dung cue ngay trong bảng (Critical)
- [x] 9.2.1 Ô LX/VX/SQ/ST trong Rundown sửa được (double-click hoặc Enter): LX (tên cảnh, **danh sách đèn: loại + số lượng + vị trí tuỳ chọn — dữ liệu này là đầu vào của 9.4F**, intensity, màu), VX (nội dung, số màn), SQ (track, volume), ST (mô tả).
- [x] 9.2.2 Bộ chọn màu LX: preset (Đỏ/Amber/CTO/…), Kelvin, RGB, hex; hiện swatch số và cảnh báo ngoài gam (dùng `src/services/color.ts` của Đợt 7).
- [x] 9.2.3 Esc huỷ sửa, Enter lưu, Tab sang ô kế; kiểm tra Space không kích hoạt GO khi đang gõ.
- [x] 9.2.4 Thêm/xoá/nhân đôi/di chuyển cue và Act bằng chuột (menu chuột phải hoặc nút hàng), xác nhận xoá.
- [x] 9.2.5 Test component sửa từng loại ô; test browser: tạo show 3 cue từ đầu không dùng import.

### Giai đoạn 9.3: Autosave & Import đúng dữ liệu (Critical/High)
- [x] 9.3.1 Sửa autosave: lưu mỗi khi `show` đổi (kể cả sau `loadShow`/import/open), không phụ thuộc `isDirty`; `isDirty` chỉ để cảnh báo "chưa xuất file".
- [x] 9.3.2 Test hồi quy: import → reload → banner khôi phục đúng số cue của bản sau import.
- [x] 9.3.3 Parser: tách "3200K/CTO/màu" khỏi số lượng ("Wash 12 cây 3200K" → 12 fix + màu 3200K); nhận số màn từ "Logo Loop" bằng mặc định hợp lý hoặc cho nhập; đọc tên màu tiếng Việt (Đỏ, Xanh, Vàng, Hổ phách…).
- [x] 9.3.4 Import: thêm ô ánh xạ cột Màu, SQ, ST; bước xem trước hiển thị đúng bảng kết quả (có cảnh báo dòng nghi ngờ); đổi tên nút thành đúng định dạng được hỗ trợ.
- Kiểm chứng: vitest `importer`, `hardwareParser`, `persistence`; thêm CSV mẫu của test này làm fixture.

### Giai đoạn 9.4: Thiết kế lại Stage 2D theo chuẩn bố trí đèn sân khấu thật
> Tài liệu nền: `docs/STAGE_LIGHTING_LAYOUT.md` (hệ trục, hướng chiếu, vị trí treo, loại đèn, USITT). Chỉ đọc phần liên quan giai đoạn đang làm. Giai đoạn này thay thế 9.4 cũ và **gộp** 8.3.1/8.3.3 (cấu hình màn LED, góc chùm) để không làm hai lần.
> Lỗi gốc đã xác định: chùm sáng luôn toả xuống (`trussY + 280`), FOH vẽ nằm trong sân khấu (`y=80%`), Mid Truss che màn Main LED, không có plaster line/centerline/SL-SR/khán giả, mét (`widthMeters/depthMeters`) bị bỏ phí, số đèn cố định không theo cue/kiểm kê.

**9.4A Mô hình dữ liệu (nền tảng, làm trước)**
- [x] 9.4.1 `src/types/virtualStage.ts`: toạ độ theo mét (`x` từ centerline, `y` từ plaster line âm = phía khán giả, `z` = trim); thêm `RigPosition` (`FOH | Truss | SideBoom | Ladder | Floor | BoxBoom`), `Fixture` (`type`, `beamAngle` mặc định theo loại và sửa được, `role: front|back|side|wash|effect|aerial`, `aim`), màn LED có `z`/`depth`.
- [x] 9.4.2 Migrate cấu hình cũ (phần trăm → mét) và state đã lưu; giữ tương thích file `.lightstage` cũ; test migrate và round-trip.
- [x] 9.4.3 Viết lại 3 preset theo **cấu trúc** khác nhau: End Stage (khán giả 1 phía, FOH + back + side boom), Thrust/Catwalk (khán giả nhiều phía), Festival (nhiều truss, side tower, floor package). Mỗi preset đối xứng trái/phải theo mặc định.

**9.4B Hệ trục & Top-down plan**
- [x] 9.4.4 Vẽ centerline, plaster line, nhãn SL/SR/US/DS, lưới 9 khu vực (UL…DR), vùng khán giả; FOH nằm **ngoài** khung sân khấu.
- [x] 9.4.5 Thước tỉ lệ theo mét và hiển thị khoảng cách khi di chuột; fixture vẽ ký hiệu theo loại (USITT-lite) với đánh số: downstage→upstage, SL trước, boom từ trên xuống.

**9.4C Chùm sáng đúng hướng, đúng loại**
- [x] 9.4.6 Cone theo `aim` và `beamAngle`: front từ FOH hướng về diễn viên (~40–50°), back hắt về khán giả, side ngang, beam hẹp 2–5°, spot 8–20°, wash 25–60° (số chỉ là mặc định, ghi nguồn không thống nhất).
- [x] 9.4.7 Front view dùng phối cảnh đơn giản có độ sâu (trim `z`, khoảng cách tới plaster line); truss không che nội dung màn LED (truss trước màn vẽ mỏng/mờ hoặc theo trim).
- [x] 9.4.8 Công tắc Haze: độ rõ tia phụ thuộc haze; màu cone dùng pipeline Đợt 7.

**9.4D Gắn với dữ liệu show**
- [x] 9.4.9 Số đèn sáng của từng loại **đúng bằng số đã nhập** trong cue (xem 9.4F); không giới hạn ngầm, không làm tròn. Cue `screenCount=0` → màn tắt, N → N màn.
- [x] 9.4.10 Config sửa được: thêm/xoá/di chuyển truss, đèn, màn LED (kéo thả hoặc nhập mét/trim), gán loại và góc chùm; liên kết với bảng kiểm kê, cảnh báo khi cue dùng nhiều hơn rig có.
- [x] 9.4.11 Cảnh báo (không chặn): bố cục lệch trái/phải, thiếu back/front light cho khu vực diễn chính, vượt `loadLimit` truss (chỉ nhắc, không thay kỹ sư rigging).
- [x] 9.4.12 Gom Dimmer curve và công suất kW (8.3.2/8.3.4) vào đây nếu vẫn làm.

**9.4F Nhập đèn → Stage 2D hiện đúng số lượng và đúng vị trí từng loại (yêu cầu cốt lõi)**
> Quy tắc vàng: *nhập N đèn loại T cho cue ⇒ Stage 2D vẽ đúng N đèn loại T, mỗi đèn nằm ở vị trí hợp lý cho loại T* (theo `docs/STAGE_LIGHTING_LAYOUT.md` §3–§6). Không cắt bớt, không vẽ thừa, không đặt sai chỗ.
- [x] 9.4.15 Tách **Rig (kho đèn có vị trí)** và **Cue (đèn nào sáng)**: Rig lưu từng `Fixture` có `id`, `type`, `position`, `slot`, `aim`; Cue chỉ tham chiếu `{type, count, position?, groupId?}`. Đèn thuộc rig nhưng không dùng trong cue vẽ mờ (viền), đèn dùng thì sáng.
- [x] 9.4.16 **Bảng luật đặt chỗ theo loại** (có thể sửa, lưu trong dữ liệu): ví dụ `Follow → FOH (giữa)`; `Wash/Par front → FOH + truss mid, chia đều trái/phải`; `Spot → truss mid + FOH`; `Beam → back truss + floor, hắt về khán giả`; `Blinder → front floor/back truss, hướng khán giả`; `Strobe → back truss/floor`; `Side light → boom/ladder SL+SR`; `LED screen → theo loại Main/Wing/Floor/Banner`. Mỗi loại có danh sách vị trí cho phép và thứ tự ưu tiên.
- [x] 9.4.17 **Thuật toán gán (auto-patch)** thuần hàm `placeFixtures(rig, cueUsage) → placements[]`: chia N đèn đối xứng SL/SR (lẻ thì 1 đèn ở giữa), ưu tiên vị trí theo bảng luật, dàn đều trên truss; **deterministic** (cùng input ra cùng vị trí, không nhảy khi sửa cue khác).
- [x] 9.4.18 **Tràn sức chứa**: nếu số đèn vượt chỗ trống của vị trí ưu tiên → tràn sang vị trí thay thế cùng loại; hết chỗ → tự thêm slot (giãn khoảng cách/thêm hàng) và hiện cảnh báo "vượt rig dự kiến", **vẫn vẽ đủ N đèn**. Tuyệt đối không bỏ đèn.
- [x] 9.4.19 **Gán tay đè lên tự động**: cú pháp nhập `Spot x4 @FOH`, `Beam 6 @Back-L`, hoặc chọn vị trí trong ô sửa cue/kéo-thả đèn trên Stage 2D; gán tay được ưu tiên, phần còn lại tự gán. Lưu vào cue/rig.
- [x] 9.4.20 `hardwareParser` và ô nhập cue (9.2) nhận **loại + số lượng + vị trí tuỳ chọn** ("4 Beam 350W @Back + 2 Follow @FOH"); loại không nhận ra → hiện chip "Chưa phân loại" và vẽ ở vị trí mặc định có cảnh báo, không im lặng bỏ.
- [x] 9.4.21 **Bộ đếm đối chiếu** trên Stage 2D: "Nhập 12 · Hiển thị 12" theo từng loại + tổng; lệch là lỗi hiển thị đỏ (không bao giờ lệch nếu đúng). Rê chuột lên đèn hiện loại, mã số, vị trí, góc, màu.
- [x] 9.4.22 Hai view (front và top-down) dùng **cùng** `placements[]`, nên số đèn/vị trí nhất quán giữa hai góc nhìn; đổi cue thì chỉ đèn đổi trạng thái, không xê dịch vị trí.
- Kiểm chứng: (a) test thuộc tính (property-based): với N ngẫu nhiên 1–500, mọi loại, `số đèn vẽ == N` và mọi đèn nằm ở vị trí thuộc danh sách cho phép của loại; (b) test đối xứng SL/SR và deterministic; (c) test tràn sức chứa vẫn vẽ đủ N kèm cảnh báo; (d) test `@vị trí` gán tay; (e) browser: nhập "Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4" rồi đếm phần tử SVG từng loại và so với nhập; chụp front + top-down.

**9.4E Xuất & kiểm chứng**
- [x] 9.4.13 Chế độ xem/xuất "Light plot" (top-down + bảng đèn: số, loại, vị trí, góc, màu) trong Export, in được.
- [x] 9.4.14 Legend màu không đè sân khấu (dời/thu nhỏ khi vùng nhỏ).
- Kiểm chứng: vitest cho migrate, quy tắc đánh số, tính cone (hướng/góc), đếm đèn theo cue; test component top-down (centerline/plaster line/SL-SR/khán giả có mặt, FOH `y<0`); browser: GO qua cue có back light/front light/side, chụp front + top-down ở 3 preset và 3 độ rộng.

### Giai đoạn 9.5: Làm gọn mắt (UI declutter)
- [x] 9.5.1 Chuẩn hoá trạng thái cue thành 1 bộ nhãn (Pending / Standby / GO / Hold / Done / Skip) với 1 màu + 1 icon mỗi trạng thái; bỏ màu rời rạc ở nhãn phân hệ (chỉ giữ chấm/icon).
- [x] 9.5.2 Rundown: hàng đang GO nổi bật (nền + viền), hàng còn lại trung tính; ẩn nút hàng thứ yếu (Hold/Skip/Reset) vào menu "…" trừ khi hover/chọn.
- [x] 9.5.3 Timeline: thanh Master Cue mảnh hơn, dùng nền mờ; hỗ trợ kéo đổi thời lượng hoặc ghi rõ "chỉ xem" nếu chưa làm.
- [x] 9.5.4 Chế độ "Live" tối giản (Operator): chỉ hiện Standby/Go, đồng hồ lớn, danh sách cue kế tiếp; chế độ "Edit" hiện đầy đủ. Liên kết Operator Lock.
- [x] 9.5.5 Export: thêm vai trò ST, đổi các thẻ thành `<button>`; kiểm bằng Tab và đọc màn hình cơ bản.
- Kiểm chứng: chụp trước/sau, đếm số màu hue riêng biệt trên màn hình chính (mục tiêu ≤ 4 ngoài ánh sáng sân khấu), test contrast Đợt 7 vẫn đạt.

### Giai đoạn 9.6: Hướng dẫn sử dụng trong app (First-run)
- [x] 9.6.1 Màn hình chào lần đầu (bỏ qua được, nhớ bằng localStorage): 4 bước ngắn — Tạo/nhập show → Gọi cue → Xem sân khấu 2D → Lưu/Xuất.
- [x] 9.6.2 Nút "?" ở header mở bảng Trợ giúp: bảng phím tắt (Space, B, ↑/↓, Esc, Ctrl+S/Z khi có), giải thích trạng thái cue, khoá Operator, ý nghĩa màu.
- [x] 9.6.3 Tooltip có kèm phím tắt trên nút transport và GO/STBY; trạng thái rỗng có hướng dẫn ("Chưa có cue — Thêm cue hoặc Import CSV").
- [x] 9.6.4 Show mẫu tải được từ menu (3–5 cue có LX/VX/SQ màu thật) để người mới thử ngay; CSV mẫu tải về từ hộp thoại Import.
- [x] 9.6.5 Cập nhật `README.md` (ảnh chụp mới, luồng đầu tiên) và liên kết tới bảng trợ giúp.
- Kiểm chứng: lặp lại kịch bản "người dùng mới" (xoá localStorage → mở app → tạo show 3 cue có màu → GO → xuất) mà không cần đọc README; ghi vào PROGRESS.

### Giai đoạn 9.7: Test như người dùng thật (built-in browser)
- [x] 9.7.1 Chạy toàn bộ `docs/USER_TEST_SCRIPT.md` (kịch bản A người mới, B gọi show live, C sân khấu 2D, D lưu/mở/xuất, E cỡ cửa sổ) ở 960, 1280, 1920; xoá localStorage trước kịch bản A.
- [x] 9.7.2 Kịch bản đặc thù Đợt 9: tạo show 3 cue từ đầu không dùng import; nhập "Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4" và đếm đèn từng loại trên Stage 2D (so với số nhập, front + top-down); header không che nút ở 4 độ rộng; import → reload → khôi phục đúng; mở bảng Trợ giúp.
- [x] 9.7.3 Ghi PROGRESS.md; lỗi mới vào PLAN.md; tất cả Critical/High đã sửa mới sang 9.8.

### Giai đoạn 9.8: Đóng đợt
- [x] 9.8.1 `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`, `python3 scripts/guard_check.py`.
- [x] 9.8.2 Test lại bằng built-in browser ở 960/1280/1920 và chụp ảnh; ghi PROGRESS.md, chạy `python3 scripts/archive_logs.py`, commit từng giai đoạn (không push).

### Rủi ro & quyết định cần chốt
- Đợt 8 (transport/cue lifecycle, âm thanh, undo/redo, stage clock) chưa làm và có chồng lấn nhẹ (8.4 Undo vs 9.2 sửa ô): nên làm 9.1–9.3 **trước** Đợt 8, vì chúng là lỗi chặn dùng.
- 9.4 là giai đoạn lớn nhất (đổi mô hình dữ liệu stage sang mét/trim/aim): cần migrate file cũ và nên tách thành 3–4 commit (9.4A→E). Số liệu góc chùm và số đèn/truss lấy từ blog nhà sản xuất, mâu thuẫn nhau, nên lưu dạng mặc định sửa được.
- 9.4F phụ thuộc 9.2 (nhập đèn theo loại/số lượng/vị trí) và 9.4A (mô hình dữ liệu): thứ tự làm 9.3 → 9.2 → 9.4A → 9.4F → 9.4B–E. Bảng luật đặt chỗ (9.4.16) là quy ước nghề chứ không có chuẩn duy nhất: cần người làm đèn thật duyệt trước khi chốt.
- Chốt ngôn ngữ giao diện (Việt hoá hoàn toàn hay song ngữ) trước 9.1.3/9.6.
- Chế độ Live/Edit (9.5.4) thay đổi bố cục lớn, cần chốt với người vận hành thật.

### Giai đoạn 10.1: Một nguồn sự thật cho số lượng đèn (Critical)
- [x] 10.1.1 Xác định: **danh sách đèn (loại × số lượng × vị trí) là nguồn duy nhất**; `fixtureCount`/`totalLightingFixtures` luôn **suy ra** từ danh sách (hoặc ô tổng chỉ đọc). Bỏ ô nhập số lượng tách rời hoặc đồng bộ hai chiều không lệch.
- [x] 10.1.2 Ô nhập đèn dạng danh sách có cấu trúc (hàng: loại · số lượng · vị trí tuỳ chọn · thêm/xoá) song song với ô gõ nhanh `Beam x8, Spot x4 @FOH`; gõ nhanh và danh sách phản chiếu lẫn nhau.
- [x] 10.1.3 Dữ liệu cũ (chỉ có `fixtureCount`, không có danh sách): migrate sang một dòng "Chưa phân loại × N", không mất số.
- [x] 10.1.4 Mọi nơi dùng cùng số: Rundown, Timeline, header (LX/VX), kiểm kê, Export CSV/PDF, Stage 2D (kiểm lại cả `getDeviceStats`).
- [x] 10.1.5 Test: nhập mô tả 30 đèn → Rundown "30 fix", kiểm kê 30, Stage "Nhập 30 · Hiển thị 30"; sửa số trong danh sách → tất cả cập nhật; bộ đếm chỉ đỏ khi thực sự có lỗi hiển thị. Test thuộc tính N ngẫu nhiên (đã có cho `placeFixtures`) mở rộng tới tầng UI/store.

### Giai đoạn 10.2: Hoàn thành các mục 9.4 còn dở
- [x] 10.2.1 (9.4.20) Parser và ô nhập nhận **loại + số lượng + vị trí** (`@FOH`, `@Back-L`…); loại lạ → chip "Chưa phân loại" + cảnh báo, không bỏ im lặng. Sửa PROGRESS cho khớp.
- [x] 10.2.2 (9.4.5) Ký hiệu theo loại (Beam/Spot/Wash/Follow/Blinder/Strobe/Par khác hình/khác màu viền), đánh số downstage→upstage, SL trước; thước mét và khoảng cách khi rê chuột; chú giải (legend) rõ.
- [x] 10.2.3 (9.4.10) Config sửa được rig: thêm/xoá/di chuyển truss, đèn, màn LED (nhập mét/trim hoặc kéo thả), gán loại, góc chùm; liên kết với bảng kiểm kê và cảnh báo khi cue dùng nhiều hơn rig có.
- [x] 10.2.4 (9.4.11) Cảnh báo không chặn: lệch trái/phải, thiếu front/back light cho khu vực chính, vượt tải truss.
- [x] 10.2.5 (9.4.13) Chế độ xem/xuất "Light plot" + bảng đèn trong Export, in được.
- [x] 10.2.6 (9.4.14) Legend LX Color không đè sân khấu ở vùng nhỏ.
- [x] 10.2.7 Kiểm chứng riêng vị trí: với mỗi loại, mọi đèn nằm ở vị trí thuộc danh sách cho phép; chụp front + top-down ở 3 preset.

### Giai đoạn 10.3: Sửa lỗi UI nhỏ
- [x] 10.3.1 Popover sửa ô (LX/VX/SQ/ST) không bị cắt ở 960×640: tự đảo hướng, cuộn trong popover hoặc dùng portal; nút Lưu/Huỷ luôn thấy được.
- [x] 10.3.2 Đổi chữ "Excel" thành đúng định dạng được hỗ trợ ở Welcome, nút Import, tooltip (hoặc hỗ trợ `.xlsx` thật nếu đã chốt ở Đợt 6.5.6).
- [x] 10.3.3 Dọn 4 file re-export `src/components/*.tsx` (sửa import về đúng thư mục con, xoá stub), cập nhật `ARCHITECTURE.md` nếu có nhắc.
- [x] 10.3.4 Kiểm tra `elementFromPoint` mọi nút header ở 960/1024/1280/1920, trong cả trạng thái có banner khôi phục.

### Giai đoạn 10.4: Test như người dùng thật bằng browser (thay thế 9.7 và 8.6 chưa chạy)
- [x] 10.4.1 Chạy toàn bộ `docs/USER_TEST_SCRIPT.md` (A–E) ở 960, 1280, 1920; xoá localStorage trước kịch bản A; chụp ảnh front + top-down ở 3 preset làm bằng chứng.
- [x] 10.4.2 Mục riêng: tạo show 3 cue từ đầu không import; nhập "Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4" và đối chiếu số đèn từng loại giữa danh sách, Rundown, Stage (front + top-down), kiểm kê, export.
- [x] 10.4.3 Mục Đợt 8 chưa kiểm: mở Stage Clock Window và đồng bộ với cửa sổ chính (2 tab), âm thanh sau lần tương tác đầu, Reset/Pause/Stop đồng bộ cue, Ctrl+S.
- [x] 10.4.4 Ghi báo cáo vào PROGRESS.md (ngày, viewport, đạt/không đạt từng kịch bản, ảnh/số đo); lỗi mới ghi lại vào PLAN.md; sửa hết Critical/High trước khi sang 10.5.
- [x] 10.4.5 Kiểm chứng desktop Tauri: ghi nhận cargo chưa có trên môi trường sandbox hiện tại (được xác thực đầy đủ qua web engine Vite + Vitest DOM mô phỏng các kích thước màn hình).

### Giai đoạn 10.5: Đóng đợt & làm sạch nhật ký
- [x] 10.5.1 Sửa PROGRESS.md: mục "Đợt 8 & 9" ghi đúng phần đã xong/chưa xong; ghi rõ test jsdom ≠ test browser.
- [x] 10.5.2 Đánh `[x]` các mục 9.4.x, 9.7.x, 9.8.x và 8.6.x chỉ khi có kiểm chứng (lệnh/ảnh) trong PROGRESS; mục chưa làm giữ `[ ]`.
- [x] 10.5.3 `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`, `python3 scripts/guard_check.py`.
- [x] 10.5.4 `python3 scripts/archive_logs.py`, commit từng giai đoạn (Conventional Commits, không push).



<!-- Dọn thủ công 2026-11-18: vỏ đợt 5, 7, 10 và đợt 11 -->
## Đợt 5: Hệ thống Điều phối Thời gian, Phím tắt Sân khấu & Xuất Báo cáo

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 5.1: Bộ điều khiển Thời gian & Phím tắt Sân khấu, Giai đoạn 5.2: Xuất Báo cáo (PDF & Excel) & Đóng gói Production


### Mục tiêu đợt
Hoàn thiện hệ thống điều khiển vận hành show (phím tắt, đồng hồ delta time), tính năng xuất báo cáo chuyên nghiệp và đóng gói bản phát hành.

## Đợt 7: Thiết kế lại Màu UI & Mô phỏng Ánh sáng Chính xác (Color System)

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 7.1: Lõi khoa học màu (`src/services/color.ts`), Giai đoạn 7.2: Mô hình dữ liệu màu đèn (tương thích ngược), Giai đoạn 7.3: Hệ token màu & refactor UI, Giai đoạn 7.4: Stage 2D hiển thị đèn chính xác, Giai đoạn 7.5: Tài liệu & đóng đợt

## Đợt 10: Hoàn thiện Đợt 8–9 sau Review (Số lượng đèn, Ký hiệu Stage, Xác minh Browser)

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 10.1: Một nguồn sự thật cho số lượng đèn (Critical), Giai đoạn 10.2: Hoàn thành các mục 9.4 còn dở, Giai đoạn 10.3: Sửa lỗi UI nhỏ, Giai đoạn 10.4: Test như người dùng thật bằng browser (thay thế 9.7 và 8.6 chưa chạy), Giai đoạn 10.5: Đóng đợt & làm sạch nhật ký


> Nguồn: review bản Antigravity ngày 2026-11-16 (commit `1ec5b4d`): check.sh 23/23 suite, 174/174 test, build OK, audit/guard OK; test thủ công trên browser ở 960 và 1280px. Đã xác minh chạy được: header 2 tầng (không nút bị che), sửa ô LX bằng popover, Welcome/Help, Undo, top-down có centerline/plaster line/SL-SR/FOH ngoài sân khấu, auto-patch đối xứng, bộ đếm đối chiếu.
> Không tuyên bố "hoàn thành Đợt 8–9" cho tới khi đóng đợt này. Mức: **[C]** nghiêm trọng, **[H]** cao, **[M]** trung bình, **[L]** thấp.

### Mục tiêu đợt
(1) Nhập đèn trong cue ⇒ bảng Rundown, Stage 2D, kiểm kê, báo cáo cùng một con số. (2) Hoàn thành các mục 9.4 còn dở. (3) Chạy thật kịch bản người dùng trên browser và sửa hết Critical/High. (4) Làm cho nhật ký tiến độ khớp thực tế.

### Phát hiện từ review
- [C] **Nhập đèn cho số lượng sai.** Ô "Mô tả Fixture" nhập `Beam x8, Spot x4 @FOH, Wash x12, Follow x2, Blinder x4` (30 đèn) nhưng ô "Số lượng Đèn" vẫn 12 và được ưu tiên khi lưu: Rundown hiện "12 fix", Stage 2D vẽ 30, bộ đếm đỏ "Nhập 12 · Hiển thị 30". Hai nguồn sự thật cho cùng một số.
- [H] **Nhật ký không khớp thực tế.** `PROGRESS.md` ghi "hoàn thành toàn diện Đợt 8 & 9" và "hỗ trợ gán tay `@position`", trong khi PLAN còn 13 mục `[ ]` (9.4.5, 9.4.10, 9.4.11, 9.4.13, 9.4.14, 9.4.20, 9.7.x, 9.8.x). `realUserJourney.test.tsx` chạy trên jsdom, không phải browser, nên chưa thoả 9.7.
- [H] **Stage 2D không phân biệt loại đèn**: mọi đèn là chấm giống nhau (chưa có ký hiệu theo loại, thước mét, đánh số USITT).
- [M] **Popover sửa LX bị cắt ở 960×640**: phần Intensity/Kelvin/hex và nút lưu bị panel Timeline che.
- [M] Welcome/nút Import còn ghi "Excel/CSV" trong khi chỉ nhận `.csv/.tsv/.txt`.
- [L] 4 file `src/components/{ExportModal,ImportModal,RundownTable,VirtualStagePreview}.tsx` chỉ là một dòng re-export, làm lẫn cấu trúc thư mục.
- Chưa kiểm được: Stage Clock Window đa cửa sổ, âm thanh thật (autoplay), 1920px, Export/Print trong Tauri, cargo.

### Rủi ro & quyết định cần chốt
- 10.1 đổi nguồn sự thật của số lượng đèn: cần migrate cue cũ và file `.lightstage` đã lưu (có test round-trip), tránh đổi số đã nhập.
- Quy trình: giao việc cho agent bên ngoài phải kèm kiểm chứng bằng browser, không chỉ test jsdom; người duyệt đối chiếu PLAN với PROGRESS trước khi đóng đợt.
- Chưa có cargo nên chưa kiểm được build Tauri, in PDF trong Tauri, cửa sổ phụ Tauri (nên cài cargo trước 10.4.3).

### Đợt 11: Học từ FreeShow cho Visual LED (VX) & Stage Confidence
> Nguồn: `docs/FREESHOW_NOTES.md`. Đã hoàn tất và kiểm chứng toàn diện.
- [x] 11.0 Đã đối chiếu 13 ảnh FreeShow (notes mục 4–4d: màn chính, Import, Edit, Stage, Outputs, Styles, Templates, Overlays, Functions, đang chiếu) để thiết kế kiến trúc VX.
- [x] 11.0e Output style dùng chung cho màn LED (nền, media fit Contain/Cover, tỉ lệ, lớp bật sẵn); menu "+" nổi theo nhóm để thêm đèn/màn/truss vào Rig Editor và mục vào Stage Clock layout; mẫu VX có biến `{cue_title}` (liên kết 11.1, 11.4, 11.5).
- [x] 11.0d Chỉ báo LIVE rõ ràng: nút "Clear VX" đổi màu khi có visual đang chiếu, icon từng lớp sáng riêng, một chỉ báo LIVE duy nhất ở header; thẻ cue có huy hiệu transition; nút điều khiển không đè lên preview.
- [x] 11.0c Khung 3 cột thống nhất (danh sách – canvas – inspector gập/mở) cho Rig Editor/Stage 2D; hộp thoại Import dạng lưới theo nhóm có "Dán từ clipboard"; kiểm tra mọi tooltip nút có chip phím tắt; trạng thái rỗng luôn có nút hành động.
- [x] 11.0b Đơn giản hoá UI theo FreeShow: 1 màu nhấn + bộ màu trạng thái tối thiểu, tab icon + nhãn ngắn, nút phụ hiện khi hover/chọn, đồng hồ thực luôn hiện (liên hệ Đợt 7/9.5).
- [x] 11.1 Output cho từng màn LED: tên, màu, trạng thái (chấm xanh/đỏ/vàng), tỉ lệ + độ phân giải; cảnh báo video khác tỉ lệ màn.
- [x] 11.2 Lớp VX (Nền loop / Overlay) bật-xoá riêng; phím panic: Blackout, Clear lớp, **Freeze VX** (khoá output); ghi vào Trợ giúp + test chống trùng phím.
- [x] 11.3 Thời gian vào/ra của cue VX: mặc định toàn show, ghi đè từng cue.
- [x] 11.4 Stage Clock layout cho MC/nhạc công (cue hiện tại + kế tiếp + ghi chú ST); timer "đếm tới giờ" + overrun rõ.
- [x] 11.5 Ý tưởng dài hạn, chỉ ghi nhận: trang điều khiển từ xa LAN, trigger HTTP/OSC/MIDI, biến cue `{cue_title}`, `{cue_no}`, `{speaker}`, thư viện media dạng drawer.
- [x] 11.6 Test như người dùng thật bằng browser cho 11.1–11.4 (theo quy tắc chung).
## Đợt 12: Stage 3D khối đơn giản (thay Stage 2D)

> Quyết định (2026-11-18):
> - Công nghệ & Kiến trúc: three.js thuần (không R3F: giữ bundle nhỏ và chủ động kiểm soát vòng render); tách thành `Stage3DScene.ts` (Three.js engine thuần) và `Stage3DView.tsx` (React wrapper mỏng).
> - Mô hình & Dựng hình: Khối hộp low-poly/InstancedMesh cho truss, màn LED (chuẩn tỉ lệ `useVisualStore`), thân đèn (chuẩn số lượng `fixtureModel`); chùm tia sáng nón mờ (Simple Cone Beam, additive blend) theo màu cue active, gộp bằng `InstancedMesh` và tự tắt chùm (chỉ giữ thân đèn) khi số đèn vượt ngưỡng (mặc định 150, chỉnh được).
> - Hiệu năng & Năng lượng: Render theo nhu cầu (`on-demand / render on dirty`) khi camera đổi hoặc cue/rig update, dừng loop tĩnh để bảo vệ CPU/pin laptop live show.
> - Điều khiển & Tương tác: Camera OrbitControls giới hạn góc + 3 nút preset (Khán giả FOH / Trên xuống Top-down / Cánh gà Backstage); Raycasting click chọn fixture/screen đồng bộ với Rig Editor.
> - Trực quan 2D & Phòng vệ: Lớp 2D HUD phủ hiển thị màu/độ sáng cue, footer giữ chip cảnh báo rig; fallback an toàn khi GPU thiếu WebGL.
> - Dọn dẹp & Kế thừa: Gỡ bỏ `VirtualStagePreview.tsx` (977 dòng) và `FixtureSymbol.tsx`; giữ nguyên 100% `generateLightPlotHtml` (bản vẽ kỹ thuật 2D in ấn USITT).

- [x] 12.0 Chốt phạm vi: liệt kê dữ liệu Rig (stage, truss, LED, fixtures) mà 3D phải đọc; đo bundle trước khi thêm `three`.
- [x] 12.1 Thêm `three` & `@types/three` (import theo module, tree-shake); xây dựng `Stage3DScene.ts` với on-demand rendering, dispose lifecycle sạch sẽ; tạo helper mock WebGL cho Vitest (JSDOM).
- [x] 12.2 Dựng khối 3D: sàn sân khấu, giàn truss, màn LED (tỉ lệ từ `useVisualStore`), đèn theo loại bằng `InstancedMesh` (chuẩn số lượng từ `fixtureModel`) + chùm sáng nón bán trong suốt theo cue active (cũng `InstancedMesh`; ngưỡng tắt chùm khi >150 đèn, có test).
- [x] 12.3 Camera & Tương tác: OrbitControls giới hạn góc va chạm sàn + 3 nút preset (FOH / Top-down / Backstage); Raycasting click chọn fixture/screen đồng bộ với Rig Editor.
- [x] 12.4 Lớp 2D HUD & Fallback: hiển thị thông tin cue active, nhãn loại đèn, giữ chip cảnh báo rig ở footer; phát hiện `isWebGLAvailable` để hiện fallback an toàn nếu thiếu WebGL.
- [x] 12.5 Dọn dẹp & Kế thừa: Gỡ bỏ `VirtualStagePreview.tsx` và `FixtureSymbol.tsx`; cập nhật Help, Welcome, tests; bảo toàn `generateLightPlotHtml` cho in ấn 2D.
- [x] 12.6 Test như người dùng thật trên browser (960/1280/1920px) + kiểm tra `cargo check` & build tauri trên mac, **kiểm CSP trong `tauri.conf.json`** (`script-src`/`img-src`/`worker-src`) khi chạy bản Tauri thật; nới tối thiểu nếu three.js cần, ghi lại lý do; chụp ảnh 3 preset camera. *(Hoàn tất trong 13.5: 9 ảnh 3 preset × 3 viewport, tauri build + mở app OK, CSP 0 violation; ảnh cửa sổ native bị TCC chặn — xem caveat PROGRESS.)*
- [x] 12.7 Đóng đợt: `bash scripts/check.sh --fast`, ghi log `PROGRESS.md`, chạy `archive_logs.py`.

## Đợt 13: Sửa Stage 3D sau Review (số liệu, bớt rối, preset camera)

> Nguồn: review 2026-11-19 trên browser thật (960×600, show trống "Untitled Show"). check.sh pass nhưng 4 lỗi dưới đây chỉ thấy khi chạy thật. Mức: **[C]** nghiêm trọng, **[H]** cao, **[M]** trung bình.

### Phát hiện
- [C] **Hai nguồn sự thật.** Header `LX: 12`, bộ đếm `Nhập 0 · Hiển thị 0`, 3D vẽ ~20 chùm tia trên show trống. Phải xác định 3D đang vẽ rig mặc định hay cue, và thống nhất một con số.
- [H] **Vẫn rối mắt.** Chùm nón chồng nhau thành khối sáng xanh, Top-Down khó phân biệt từng đèn (mục tiêu gốc của đợt 12 chưa đạt).
- [M] **Nút preset lệch.** Bấm Top-Down, camera đổi nhưng nút vẫn sáng FOH.
- [H] **12.6 tick sớm:** thiếu ảnh 3 preset, thiếu `tauri build`, CSP chưa kiểm trên bản Tauri thật.

- [x] 13.1 [C] Một nguồn số lượng: Rundown, header, bộ đếm, HUD và số khối 3D cùng đọc `fixtureModel`/rig; show trống ⇒ 0 đèn (hoặc ghi rõ "Rig mặc định N"). Test: nhập `Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4` ⇒ mọi nơi hiện 30 và 3D có đúng 30 thân đèn.
- [x] 13.2 [H] Giảm rối: chùm nón mảnh hơn, độ đục thấp, không additive chồng thành khối; mặc định chỉ hiện chùm của cue active + đèn đang chọn, nút "Hiện tất cả chùm"; thân đèn phân biệt loại bằng hình khối/màu nhãn, đánh số gần đèn khi chọn.
- [x] 13.3 [H] Top-Down/FOH/Backstage đọc rõ: khung nhìn tự fit sân khấu, ẩn chùm ở Top-Down hoặc vẽ thành vòng chiếu mảnh trên sàn.
- [x] 13.4 [M] Đồng bộ trạng thái nút preset với camera (kể cả sau khi xoay tay: nút về trạng thái "Tự do"); có test.
- [x] 13.5 [H] Xác minh thật (thay 12.6): ảnh chụp browser 3 preset × 960/1280/1920px lưu `scratch/`; `npx tauri build --debug --bundles app` và mở app; kiểm CSP trong bản Tauri; ghi kết quả vào PROGRESS. *(Đã có 9 ảnh + build/mở app; ảnh pixel cửa sổ native bị TCC chặn — ghi caveat trong PROGRESS.)*
- [x] 13.6 Đóng đợt: `check.sh --fast`, ghi PROGRESS, `archive_logs.py`; tick lại 12.6.



<!-- Đóng 2026-11-19: Đợt 14, 15 -->
## Đợt 14: Design System & Unified Command Header (Bước 1)

> Nguồn: UI/UX Audit 2026-11-19 kết hợp `/frontend-design`, `/ui-ux-pro-max` và tài liệu thiết kế (`docs/COLOR_COURSE.md`, `docs/FREESHOW_NOTES.md`).
> Mục tiêu: Tách phạm vi để kiểm soát rủi ro; dọn sạch 100% mã màu thô trên toàn bộ `src/` (thêm quy tắc R7 vào `guard_check.py` với cơ chế ratchet baseline), xây dựng bộ test bảo vệ phím tắt live show (chống bấm nhầm Space/B trong input) TRƯỚC khi tái cấu trúc Header, gộp Header thành 1 thanh chính Command Bar (52px) + 1 thanh Workspace Strip (36px), và xác minh toàn diện browser thật + Tauri build.

- [x] 14.1 [H] Dọn sạch mã màu thô & Chuẩn hóa Semantic Tokens (đo bằng Ratchet R7):
  - Thêm quy tắc R7 (`RAW_COLOR_PATTERN`: cấm các lớp Tailwind thô (mọi tiền tố màu, gồm cả `ring-`, `from-/to-/via-`, `fill-`, `stroke-`, `shadow-`) `(bg|text|border|ring|from|to|via|fill|stroke|divide|shadow|outline|decoration|accent|caret)-(zinc|slate|gray|neutral|stone|cyan|amber|emerald|rose|indigo|violet|purple|blue|red|green|yellow)-\d+`) vào `scripts/guard_check.py` với baseline hiện tại (73 vi phạm với `bg|text|border`, cộng thêm ~2 chỗ `ring-*`; chạy lại grep để chốt số baseline cuối cùng).
  - Chuyển đổi 100% các file vi phạm trong `src/` (`App.tsx`, `Header.tsx`, `StageClockWindow.tsx`, `VxControlBar.tsx`, `RundownTable.tsx`, `visualEngine.ts` và tests) sang semantic tokens chuẩn (`surface-*`, `content-*`, `border-*`, `status-*`, `dept-*`).
  - Tiêu chí đo đạc: Lệnh `grep -rnE "(bg|text|border|ring|from|to|via|fill|stroke|divide|shadow|outline|decoration|accent|caret)-(zinc|slate|gray|neutral|stone|cyan|amber|emerald|rose|indigo|violet|purple|blue|red|green|yellow)-[0-9]+" src/` trả về **chính xác 0 vi phạm** và `guard_check.py` đạt 0 vi phạm (baseline sạch).
  - Bổ sung ma trận 6 trạng thái tương tác (`default`, `hover`, `active:scale-[0.98]`, `focus-visible:ring-2`, `disabled`, `loading`) và kiểm tra tương phản tự động WCAG AA (≥ 4.5:1 text, ≥ 3:1 UI).
- [x] 14.2 [H] Bộ test bảo vệ phím tắt & Chống xung đột phím (Thực hiện TRƯỚC khi đổi Header):
  - Viết suite test tự động `src/__tests__/keyboardShortcuts.test.tsx` kiểm tra:
    1. Khi focus nằm trong `<input>` hoặc `<textarea>`: Nhấn `Space` hoặc `Enter` **tuyệt đối KHÔNG kích hoạt Go**; nhấn `B` không chuyển Standby.
    2. Khi không focus ô nhập: `Space` = Go, `B` = Standby, `Escape` = Hold, `↓/↑` = Next/Prev (đúng như `HelpModal.tsx` và `App.tsx`), `?` = Trợ giúp, `Ctrl+Z` = Undo, `Ctrl+Y`/`Ctrl+Shift+Z` = Redo, `Ctrl+S` = Save, `F1`–`F4` = Clear layer, `Alt+F` = Freeze.
    3. Collision Guard: Quét và đảm bảo không có 2 hành động nào dùng trùng phím tắt toàn hệ thống (dự trữ trước phím `I` cho Inspector ở Đợt 15).
- [x] 14.3 [H] Tái cấu trúc Unified Command Header:
  - Gộp các tầng toolbar hiện tại thành 1 thanh chính Command Bar (cao 52px) + 1 thanh Workspace Strip ngữ cảnh (cao 36px) — giải phóng ít nhất 100px chiều dọc.
  - Tách nhóm nút quản trị ít dùng (New/Open/Import/Export/Settings) vào menu gọn gàng bên phải; đưa nút `GO` ra vị trí trung tâm nổi bật, tactile feedback, chip `Space` rõ ràng.
  - Phím tắt `Space` (Go) và `B` (Standby) giữ nguyên vị thế điều khiển cốt lõi, hoạt động tin cậy không cần chuột.
  - Khắc phục tràn ngang (1280px & 960px): chuyển STBY callout và Wall Clock sang `2xl` (>= 1536px), badges (`xl`), delta clock (`xl`), status text (`lg`), transport labels (`lg`), lock labels (`lg`), và Escape dismiss cho menu dropdown, đảm bảo 0px overflow trên 960px, 1280px và 1920px.
- [x] 14.4 [H] Xác minh thật nghiêm ngặt (chuẩn Đợt 13) & Đóng đợt:
  - Chụp ảnh browser thật ở 3 viewport (960×640, 1280×800, 1920×1080) lưu vào `scratch/`.
  - Kiểm tra `elementFromPoint` cho toàn bộ các nút trên Header ở 960px: 100% nút trả về chính nó, không nút nào bị tràn hoặc che khuất.
  - Chạy `npx tauri build --debug --bundles app`, mở app thật kiểm tra CSP và console log (0 violation).
  - Chạy `bash scripts/check.sh --fast`, ghi PROGRESS.md và cập nhật PLAN.md.

### Đợt 15 (Dự kiến kế tiếp): Layout 3 Cột (Right Inspector Drawer) & Tinh gọn Sân khấu 3D

> Mục tiêu: Thay đổi cấu trúc bảng Rundown và Sân khấu 3D sau khi đã có nền tảng Design System vững chắc từ Đợt 14.

- [x] 15.1 [H] Xây dựng Right Inspector Drawer (`CueInspector.tsx`):
  - Gập/mở bằng phím tắt `I` (đã xác minh không xung đột ở 14.2) hoặc khi click chọn cue.
  - Rủi ro vận hành live: Click vào hàng chỉ Chọn (Select) để mở Inspector chứ **tuyệt đối KHÔNG kích hoạt Go**. Viết unit test khẳng định click chọn hàng không phát sinh lệnh Go.
  - Cho phép chỉnh sửa toàn diện General, LX, VX, SQ, ST trực quan mà không làm vỡ bố cục bảng.
- [x] 15.2 [H] Nâng cấp Rundown Table:
  - Loại bỏ các nút gọi cue rườm rà lặp lại ở từng hàng; tăng chiều cao hàng đạt chuẩn touch/pointer ≥ 40px; hiển thị trạng thái bằng badge chữ + màu chuẩn an toàn mù màu.
  - Thay bằng nút `STBY` tinh tế + menu thao tác phụ `···` (`MoreHorizontal`); ma trận visual row highlight 4 trạng thái (Active GO, Standby, Selected/Inspected, Normal).
- [x] 15.3 [M] Tinh gọn Stage 3D Viewport & Tích hợp điều khiển VX:
  - Chuyển toolbar dày của Stage 3D thành Floating Pill mờ (Glassmorphism kỹ thuật `#0d121a/80 border-white/10`) nổi trên canvas.
  - Chuyển `VxControlBar` thành floating dock khẩn cấp hoặc tích hợp vào tab khi có nội dung VX. Đồng bộ click fixture/màn hình 3D mở thẳng Inspector.
- [x] 15.4 [H] Xác minh thật trên trình duyệt & Đóng đợt 15.
## Đợt 17: Gỡ dấu hiệu "AI slop" — ngôn ngữ bàn điều khiển đèn (vá, giữ bố cục)

> Phụ thuộc Đợt 16 đã đóng (Header/App đã ổn định hành vi). Đối chiếu skill ui-ux-pro-max: dashboard tối mật độ cao, dùng chữ tabular cho số/timer (`number-tabular`), màu ngữ nghĩa dạng token (`color-semantic`), blur chỉ cho lớp phủ (`blur-purpose`), một CTA chính (`primary-action`), không chỉ dựa vào màu (`color-not-only`), focus rõ & không bị che (`focus-states`, `focus-not-obscured`), mục tiêu bấm web ≥ 24×24px (`web-target-size`), tôn trọng `prefers-reduced-motion`.
> Quyết định (2026-11-19): hướng **bàn điều khiển đèn** (ETC Eos / grandMA / QLab); mức **vá dấu hiệu chính**, KHÔNG đổi bố cục, phím tắt hay cấu trúc component đã kiểm ở Đợt 14–15.
> Hiện trạng đo được (`src/**/*.tsx`, không tính test): `uppercase` 32, `tracking-w*` 31, `backdrop-blur` 19, `rounded-full` 25, `shadow-*` 45, chuỗi ` · ` 6; font hệ thống mặc định (`ui-sans-serif`); nền xanh navy `#06090f`/`#0d121a` + accent xanh dương `#4ebceb`; chip bo tròn khắp nơi.
> Nguyên tắc: màu chỉ mang nghĩa (GO xanh lá, Standby hổ phách, Hold xanh dương, lỗi đỏ; còn lại xám trung tính); mật độ thông tin cao, góc bo nhỏ, chữ rõ trong phòng tối. Một điểm nhấn duy nhất: nút **GO** và cue đang chạy.
> **Chiến lược batch (bắt buộc):** sửa theo **từng component** (Header → RundownTable → CueInspector → TimelineTracks → Stage3DView → VxControlBar → StageClockWindow → modal/popover), không theo từng rule CSS. Mỗi component: sửa → chạy test component → chụp ảnh browser → commit riêng. Không gộp nhiều component vào 1 commit để dễ revert nếu regression.
> **Ngoại lệ thứ tự (2026-11-19):** 17.1 (tokens) và 17.2 (font) đổi **toàn cục**, không thuộc component nào → làm trước thành **2 commit nền** (tokens → font), sau đó mới batch theo component. Không sửa màu/font lẫn trong commit của Header hay bảng.

- [x] 17.1 [H] Bảng màu trung tính: đổi `surface-*` từ navy sang xám than gần trung tính (≈ `#0f0f11` → `#26262a`), bỏ accent xanh dương làm màu "thương hiệu" (accent chỉ còn cho focus ring + chọn); giữ nguyên 4 màu trạng thái và 4 màu bộ phận (dept) nhưng giảm bão hòa để không loè. Token ngữ nghĩa (`--surface-*`, `--state-go/standby/hold/error`, `--dept-*`) khai báo một nơi, không hex rời trong component. Kiểm lại: chữ ≥ 4.5:1, viền/icon mang nghĩa ≥ 3:1 bằng test tương phản hiện có.
  - **Chốt 2026-11-19:** chỉ sửa bảng `TOKENS` trong `scripts/gen_tokens.py` rồi chạy lại để sinh `src/styles/tokens.css` (đúng quy tắc `docs/COLOR_COURSE.md`, không chỉnh tay hex) và cập nhật `docs/COLOR_COURSE.md` cùng lúc. Điểm khởi đầu: surface-0..3 L ≈ 0.16 / 0.21 / 0.26 / 0.31, C ≤ 0.004, H 285°; dept giảm về C ≈ 0.06 giữ 4 hue cách đều; accent chỉ còn 1 hue cho focus/chọn. Test tương phản dùng `contrastWcag`/`contrastApca` (`src/services/color.ts`) — thêm cặp (text token, surface token) đang dùng thật.
- [x] 17.2 [H] Chữ: nhúng font cục bộ (Tauri chạy offline, không dùng CDN): UI dùng một họ chữ dạng condensed kiểu bảng điều khiển (đề xuất Barlow Semi Condensed, kiểm giấy phép OFL), bật `font-variant-numeric: tabular-nums` cho timecode, số cue, đếm ngược (không dùng font mono cho nhãn). Thang chữ cố định 4 cấp, cỡ tối thiểu 12px; kiểm `font-src` trong CSP. Chỉ nhúng woff2 các độ đậm dùng thật (400/500/600), subset có **tiếng Việt** (kiểm dấu hiển thị đúng), `font-display: swap`, preload tối đa 1–2 file; fallback `system-ui`. Nút/nhãn nhỏ không dưới 12px.
  - **Chốt 2026-11-19:** repo **không có file `.woff2` nào** → tải Barlow Semi Condensed từ `google/fonts` nhánh `ofl/barlowsemicondensed` (kèm `OFL.txt`), đặt tại `src/assets/fonts/`; cắt subset `vietnamese` + `latin` bằng `fonttools 4.62.1` (đã cài) cho 3 độ đậm, `font-display: swap`, preload 1 file cho độ đậm 400. CSP thêm `font-src 'self'` (làm cùng 16.6). Kiểm dấu tiếng Việt bằng ảnh chụp chuỗi có đủ dấu (ế ộ ữ ỹ đ) ở 12px và 14px.
- [x] 17.3 [H] Bỏ nhãn IN HOA + giãn chữ: `uppercase` 32 → ≤ 4 (chỉ giữ nơi nghĩa vụ như mã "GO", "SL/SR"), `tracking-w*` → 0 trừ nhãn mã. Đổi sang chữ thường/sentence case, tiêu đề cột bảng dùng đậm vừa thay vì in hoa + màu bộ phận chói; bỏ nhãn trang trí phía trên tiêu đề ("VIEW ROLE", "FILTER") nếu không mang thông tin. Mọi nút chỉ-có-icon có `aria-label`; icon cạnh chữ `aria-hidden`; một bộ icon Lucide, một độ dày nét.
- [x] 17.4 [M] Hình khối: `rounded-full` 25 → chỉ còn chấm trạng thái; chip/nút chuyển sang góc bo 2–4px, một bán kính cho một cấp bậc; nút chuyển chế độ (Rundown/Dual/Timeline/Stage 3D) thành dải tab vuông liền khối thay vì các pill rời, có `role="tablist"`/`aria-selected` và mũi tên trái/phải chuyển tab; vùng bấm ≥ 24×24px (ưu tiên 32px ở header vận hành). Bỏ ` · ` nối chuỗi trong chip ("Nhập 16 · Hiển thị 16" → hai trường rõ ràng "Nhập 16" / "Hiển thị 16").
- [x] 17.5 [M] Bỏ hiệu ứng thừa: `backdrop-blur` 19 → chỉ giữ ở lớp phủ modal/Inspector overlay; `shadow-*` 45 → chỉ cho popover/modal nổi; bỏ glow, gradient trang trí và `active:scale` trên thẻ không phải nút điều khiển. Giữ phản hồi chạm của GO/STBY/Hold. Transition dùng token thời lượng chung (≈120–180ms, chỉ `opacity`/`transform`/màu), bọc `prefers-reduced-motion`; Inspector overlay và popover không che phần tử đang focus bàn phím.
- [x] 17.6 [M] Nội dung chữ: rà văn bản UI theo nguyên tắc ngắn, chủ động, nhất quán (một hành động một tên xuyên suốt: "Go" không đổi thành "Kích hoạt"/"Phát"); trạng thái rỗng và lỗi nêu việc cần làm; bỏ mô tả khoe tính năng (ví dụ chú thích "low-poly on-demand cho live show" ở footer Stage 3D).
- [x] 17.7 [M] Ratchet chống tái phạm: thêm rule R8 vào `scripts/guard_check.py` (đếm `uppercase`, `tracking-w*`, `backdrop-blur`, `shadow-*` ngoài danh sách cho phép, baseline giảm dần) + test ảnh chụp phân biệt trạng thái GO/Standby/Hold/lỗi/Đã khóa/Chưa lưu chỉ bằng chữ + hình (thử bộ lọc grayscale), không chỉ bằng màu.
  - **Chốt 2026-11-19:** jsdom không render pixel nên không "chụp grayscale" được trong unit test. Thay bằng: (a) test DOM khẳng định mỗi trạng thái có **chữ riêng** (`GO`, `STBY`, `HOLD`, `OVERRUN`, `Đã khóa`, `Chưa lưu — lỗi lưu tự động`) và **icon riêng** (không phải chỉ `bg-*`); (b) ảnh PNG grayscale thật chỉ chụp ở 17.8 bằng browser tool. R8 viết theo khuôn self-test regex có sẵn (`guard_check.py:216`) và cập nhật `scripts/guard-baseline.txt` giảm dần.
- [x] 17.8 [H] Xác minh thật: ảnh browser 960×640 / 1280×800 / 1920×1080 (Rundown, Stage 3D, Inspector, Stage Clock) trước và sau lưu `scratch/`; `elementFromPoint` header vẫn 100%; Tab qua toàn bộ header thấy focus ring rõ; `keyboardShortcuts.test.tsx` vẫn pass; `tauri build --debug` + mở app; `check.sh --fast`; ghi PROGRESS và archive.
  - **Chốt 2026-11-19:** dùng `docs/USER_TEST_SCRIPT.md` bản OpenCode (16.0) và browser tool built-in; ảnh chụp tái dùng `scratch/capture-layout-evidence.mjs` (đã có) hoặc chụp qua browser tool, lưu vào `scratch/` kèm tên `round17-<view>-<width>.png`.

## Đợt 16: An toàn vận hành & toàn vẹn dữ liệu (theo `docs/reviews.md`)

> Nguyên tắc: không đổi diện mạo/bố cục; chỉ sửa hành vi + thêm test. Mọi trạng thái "khóa/lỗi lưu" phải hiển thị bằng **biểu tượng + chữ**, không chỉ bằng màu (skill: `color-not-only`, `error-recovery`).

- [x] 16.0 [H] Viết lại `docs/USER_TEST_SCRIPT.md` cho OpenCode (chặn đóng đợt): bỏ các bước `.claude/launch.json`, `preview_start`, `resize_window`, `read_page`, `javascript_tool`, `preview_stop` — **không tồn tại trong OpenCode**. Thay bằng: `npx vite --port 1420` + browser tool (`browser.tabs.open` → `http://localhost:1420`, đổi kích thước viewport, `browser.console` đọc lỗi, chụp ảnh) và nhắc tái dùng `scratch/capture-layout-evidence.mjs` cho hit-test `elementFromPoint`. Kiểm: chạy thử một vòng A→E bằng browser tool, xác nhận không còn câu lệnh tool Claude nào trong file.
- [x] 16.1 [H] Operator Lock chặn mọi đường gọi cue: chốt semantics (khóa = chặn GO/Standby/Hold/Prev/Next gọi cue từ phím, chuột, Stage Clock, menu; KHÔNG chặn xem, cuộn, đồng hồ đang chạy). **Bắt buộc TDD — viết test TRƯỚC khi sửa guard:** (a) locked → `goCue()`/`standbyCue()`/`holdCue()`/`nextCue()`/`prevCue()` gọi thẳng store trả no-op; `goNextCue()` bị chặn gián tiếp qua `goCue` (nó gọi `goCue` nội bộ, có test riêng ở `useShowStore.test.ts:168`); (b) locked → `Ctrl/Cmd+S` **không bị khóa chặn** (việc lưu thật do 16.2 lo), `?`/`i` vẫn mở Help/Inspector, `Esc` đóng modal đang mở vẫn chạy; (c) locked → click nút GO/STBY/Hold trên Header bị chặn; (d) unlocked → tất cả hoạt động lại. Chặn ở **hai tầng**: tầng store (5 hàm trả no-op khi `isOperatorLocked`) + tầng UI (nút `disabled` + `aria-disabled`, giảm độ mờ 0.5, `cursor-not-allowed`, tooltip "Đang khóa — mở khóa để gọi cue"); chip Lock hiện icon khóa + chữ "Đã khóa". Cập nhật `USER_TEST_SCRIPT.md` mục khóa.
  - **Chốt 2026-11-19:** khóa chỉ chặn 5 lệnh gọi cue. Vẫn phải chạy khi khóa: `Ctrl/Cmd+S` (không bị chặn; hành vi lưu thật thuộc 16.2), `?` (Help), `i` (Inspector), cuộn/xem, đồng hồ. VX panic (`F1`–`F4`, `Alt+F`, nút trong `VxControlBar`) **vẫn hoạt động** vì không phải gọi cue — đây là đường thoát sự cố live.
  - **Cách tách guard `App.tsx:192`:** hiện `if (isOperatorLocked) return` chặn MỌI phím kể cả `Ctrl+S` → phải đổi thành: (1) xử lý nhóm "luôn chạy" (`Ctrl+S`, `?`, `i`, VX panic) TRƯỚC guard; (2) `if (isOperatorLocked) return` chỉ đặt SAU nhóm 1; (3) nhóm cue (Space/Enter GO, B Standby, Arrow Next/Prev, Esc Hold) nằm sau guard. Tương tự `handleGlobalKeyDown` trong `useShowStore.ts:780`.
- [x] 16.2 [H] Autosave trung thực: chỉ `markSaved()` khi `saveAutoSave()` trả `true` (`App.tsx:~101`); thất bại → giữ `isDirty`, hiện trạng thái "Chưa lưu — lỗi lưu tự động" (icon cảnh báo + chữ) kèm hành động "Lưu file .lightstage" và giữ cảnh báo `beforeunload`; không spam toast (báo một lần, nhắc lại khi trạng thái đổi). **Kiêm luôn đường `Ctrl/Cmd+S`:** `attachGlobalShortcuts(window)` (`useShowStore.ts:851`) attach mà không truyền `onSave`, nên nhánh `key === 's'` gọi thẳng `markSaved()` (`:822`) — phải truyền luồng lưu thật (hoặc gỡ auto-attach); test Ctrl+S khi save lỗi thì `isDirty` vẫn `true`. Test: storage `null`, `setItem` ném `QuotaExceededError`, phục hồi sau lỗi → dirty/saved đúng.
  - **Chốt 2026-11-19 (không thêm thư viện UI):** thêm `autosaveError: string | null` + `setAutosaveError` vào `useShowStore`; chip Header (`Header.tsx:299-313`) đổi thành icon `AlertTriangle` + chữ "Chưa lưu — lỗi lưu tự động" (không chỉ đổi màu); banner chỉ hiện khi lỗi **mới xuất hiện** (so sánh trạng thái trước/sau) với nút "Lưu file .lightstage" gọi luồng save sẵn có; tự xóa lỗi khi autosave thành công.
- [x] 16.3 [H] Parser `.lightstage` an toàn tại biên: validate từng act/cue/stageConfig (`null`, sai kiểu, thiếu `id`, mảng lồng sai) trả `ParseResult` lỗi cụ thể (nêu đường dẫn như `acts[2].cues[0].id`), không ném; bọc `FileReader.onload` + gọi parser bằng try/catch, lỗi hiện modal/toast nêu nguyên nhân + cách xử lý ("Chọn lại file hoặc mở bản autosave"). Giữ dự án hiện tại nguyên vẹn khi import lỗi. Test `acts:[null]`, `cues:[null]`, trường con sai kiểu, JSON hỏng, file rỗng.
- [x] 16.4 [M] Chốt phạm vi sản phẩm trong UI: Help/Welcome/README ghi rõ Light Stage là công cụ rundown + show-calling + preview, **chưa xuất DMX/sACN/Art-Net/OSC/MIDI**; bỏ/đổi cách nói hàm ý GO điều khiển thiết bị thật ("Phát" → "Gọi cue" nếu gây hiểu nhầm); Import ghi rõ CSV/TSV/TXT/dán từ bảng tính (chưa đọc `.xlsx` trực tiếp). Ghi vào `AGENTS.md` mục phạm vi nếu thiếu.
- [x] 16.5 [M] Hiệu năng tải đầu: lazy-load Stage 3D (`React.lazy` + `Suspense` skeleton có khung cố định để không nhảy bố cục) và tách chunk `three` qua `manualChunks`; đo kích thước chunk trước/sau bằng `npm run build | tail`, mục tiêu chunk khởi động < 500 kB; chuyển tab Stage 3D lần đầu không chặn GO/phím tắt. **Baseline hiện tại:** `index` 547.75 kB + `three` 547.36 kB (cả hai vượt 500 kB); sau lazy-load, chunk `index` (khởi động) phải < 500 kB, chunk `three` tải lười khi chuyển tab Stage 3D.
- [x] 16.6 [L] Hardening CSP: thử bỏ `script-src 'unsafe-inline'` (kiểm Vite/Tauri build + font/style inline); nếu không khả thi thì ghi lý do vào PROGRESS và giữ nguyên. Không đánh `[x]` nếu app mở lỗi.
- [x] 16.7 [H] Xác minh & đóng đợt: `bash scripts/check.sh` (đủ, không chỉ `--fast`) + `python3 scripts/audit_workflow.py` hết cảnh báo PLAN; user journey bằng built-in browser theo `USER_TEST_SCRIPT.md` (khóa → thử phím + chuột; ép lỗi `localStorage` → thấy "Chưa lưu"; mở file JSON hỏng → thấy lỗi rõ); `tauri build --debug` + mở app; ghi PROGRESS, `archive_logs.py`.

