# Lưu trữ PROGRESS.md (nguyên văn, không chỉnh sửa)

## 2026-11-16 — Hoàn thành Toàn diện Đợt 8 & Đợt 9 qua Native Swarm

### Thay đổi
- **Đồng bộ Transport, Vòng đời Cue & Hoàn tác Undo/Redo (Đợt 8.1, 8.4, 9.3)**:
  - Đồng bộ Master Clock và Rundown Table: `resetClock()` đưa tất cả cue về `Pending`, cue đầu về `Standby`, `activeCueId: null`; `pauseClock()` và `stopClock()` chuyển cue `Go` sang `Hold`. Bổ sung nút `Go Next Cue`.
  - Triển khai ngăn xếp hoàn tác 30 bước (`past`, `future`, `canUndo`, `canRedo`, `undo()`, `redo()`) cho mọi thao tác sửa kịch bản. Hỗ trợ phím tắt toàn cục `Ctrl+Z`, `Ctrl+Y`, `Ctrl+S`.
  - Khắc phục triệt để Autosave: lưu mỗi khi dữ liệu show thay đổi qua subscription mà không phụ thuộc cờ `isDirty`.
  - Nâng cấp `hardwareParser` và `importer`: bóc tách độc lập nhiệt độ màu / màu tiếng Việt khỏi số lượng fixture (ví dụ: *"Wash 12 cây 3200K"* $\to$ 12 fixtures, màu 3200K); tự động nhận diện màn hình từ *"Logo Loop"*; hỗ trợ ánh xạ cột Màu, SQ, ST.
- **Hệ thống Cảnh báo Thính giác & Đồng hồ Sân khấu Phụ (Đợt 8.2, 8.5)**:
  - Xây dựng `audioAlerts.ts` thuần Web Audio API: bíp đếm ngược 5 giây cuối (880Hz / 80ms tại 5..1s, 1760Hz / 200ms tại 0s GO), bíp kép 440Hz khi overrun; hỗ trợ user gesture unlock và audio mute toggle.
  - Xây dựng màn hình phụ `StageClockWindow.tsx` tối ưu cho bàn MC / cánh gà: đếm ngược kích thước khổng lồ, delta, active/standby cue; đồng bộ real-time đa cửa sổ qua `BroadcastChannel` và `localStorage`.
- **Tái thiết kế Giao diện Header & Nhập liệu Rundown (Đợt 9.1, 9.2, 9.5, 9.6)**:
  - Header 2 tầng chống đè lấn: Tầng 1 (Live Operations: Transport, Clocks, Clocks tabular-nums, Go Next); Tầng 2 (Tools: Views, Lock, Audio Mute, Stage Clock, Import/Export, Rename show trực tiếp, menu thu gọn "..." dưới 1100px).
  - Sửa trực tiếp ô LX, VX, SQ, ST trên bảng Rundown: LX tích hợp Color Picker popover (presets, Kelvin slider, hex, gamut warning); VX (nội dung, số màn); SQ (track, volume); ST (chỉ dẫn). Chống kích hoạt GO khi đang gõ phím Space. Thêm/xóa/nhân đôi cue trực tiếp.
  - Chuẩn hoá huy hiệu trạng thái cue; thêm modal Chào mừng `WelcomeModal` (4 bước, lưu localStorage) và bảng Trợ giúp `HelpModal` phím tắt.
- **Tái thiết kế Sân khấu ảo 2D & Auto-Patch Đèn (Đợt 8.3, 9.4)**:
  - Hệ toạ độ mét thực tế: Centerline (x=0), Plaster Line (y=0), trim Z. 3 Presets chuẩn USITT: EndStage, Festival, Thrust.
  - Thuật toán `placeFixtures(rig, cueUsage)` tất định: đối xứng SL/SR, xử lý tràn rig không cắt xén, hỗ trợ gán tay `@position`.
  - Top-down view (Centerline, Plaster Line, SL/SR, 9 zones, FOH ngoài sân khấu y < 0) & Front view theo chiều sâu; chùm sáng theo góc nhắm và beam angle; công tắc khói Haze, đường cong Dimmer và công suất kW; huy hiệu đối chiếu "Nhập X · Hiển thị X".

### Quyết định kỹ thuật
- Vận hành song song qua Swarm với 6 agents chuyên trách (`worker-core`, `worker-audio-clock`, `worker-stage2d`, `worker-ui-rundown`, `verifier`, `monitor`), phân tách ranh giới tệp tin hoàn toàn độc lập, không xảy ra xung đột merge.
- Tách biệt tuyệt đối giữa Rig (phần cứng vật lý) và Cue (trạng thái kích hoạt theo cảnh), giúp giao diện 2D luôn đồng nhất giữa Front view và Top-down plan.

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 23/23 test suites passed, 174/174 unit tests passed (0 failures).
- `tsc --noEmit` & `npm run build`: 0 lỗi biên dịch TypeScript, bundle sản phẩm hoàn tất thành công trong 1.06s.
- `python3 scripts/audit_workflow.py` & `python3 scripts/guard_check.py`: 100% checks passed, 0 drift violations.


### Thay đổi
- **Kiểm thử Hành trình Người dùng Thực tế (`src/__tests__/realUserJourney.test.tsx`)**:
  - Xây dựng 6 kịch bản kiểm thử tích hợp mô phỏng toàn diện hành trình làm việc của một Đạo diễn sân khấu (Show Caller):
    1. *Khởi động & FOH Dark UI*: Nhận diện thương hiệu, tiêu đề show, đồng hồ Show Time/Cue Remainder/Delta và thống kê phần cứng.
    2. *Crash Recovery*: Banner khôi phục màu Cyan tự động phát hiện bản lưu và phục hồi chỉ với 1 click.
    3. *Live Calling & Hotkey Safety*: Kích hoạt Go bằng Space, Esc để Hold, Operator Lock khóa phím ngăn chặn bấm nhầm.
    4. *Optical Stage 2D*: Kiểm tra hiển thị camera Front View, Top-Down Plan, nhãn nhiệt độ màu 3200K, đồng bộ visual lên 3 màn hình LED.
    5. *Hardware Parser*: Kiểm tra khả năng tự động đếm số lượng đèn và màn hình từ chuỗi mô tả phức tạp.
    6. *Export & Print*: Dialog xuất báo cáo lọc theo từng bộ phận chuyên môn, in ấn PDF và xuất file JSON `.lightstage`.
- **Tổng hợp Vấn đề Phát hiện & Lập Kế hoạch Đợt 8**:
  - Lưu trữ lossless các đợt cũ vào `archive/PLAN.md`.
  - Thiết lập roadmap chi tiết cho Đợt 8 gồm 5 giai đoạn: Đồng bộ Transport & Cue Lifecycle (8.1), Cảnh báo thính giác Web Audio synthesized alerts (8.2), Tùy biến Stage 2D & Dimmer curves (8.3), Undo/Redo history & Hotkey lưu nhanh (8.4), Cửa sổ đồng hồ sân khấu phụ Stage Confidence Clock (8.5).

### Quyết định kỹ thuật
- **Đồng bộ Cue - Clock**: Xác định việc reset đồng hồ bắt buộc phải đưa cue state về `Pending`/`Standby` để tránh hiện tượng lệch pha giữa Master Clock và Rundown Table.
- **Synthesized Audio Alerts**: Ưu tiên tạo âm thanh bíp qua Web Audio API (OscillatorNode) thay vì tải file `.mp3` bên ngoài, loại bỏ hoàn toàn độ trễ (zero latency) và bảo đảm ứng dụng hoạt động offline hoàn hảo khi không có kết nối mạng.

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 16/16 test suites passed, 105/105 unit tests passed (thêm 6 unit tests mới trong `realUserJourney.test.tsx`).
- `python3 scripts/audit_workflow.py` & `python3 scripts/guard_check.py`: 100% checks passed, 0 drift violations, prime workflow health.

## 2026-11-16 — Hoàn thành Thiết kế lại Màu UI & Mô phỏng Ánh sáng Chính xác (Đợt 7)

### Thay đổi
- **Lõi khoa học màu (`src/services/color.ts`) (7.1)**:
  - Triển khai toàn diện các hàm thuần toán không phụ thuộc UI: chuyển đổi sRGB ↔ Linear, Linear ↔ Oklab ↔ OKLCH, hex ↔ OKLCH.
  - Thuật toán Gamut Mapping: giữ nguyên Lightness ($L$) và Hue ($h$), binary search giảm Chroma ($C$) trong không gian OKLCH đưa màu về trong gam sRGB an toàn, trả cờ `outOfGamut`.
  - Mô phỏng nguồn sáng: nhiệt độ màu Kelvin (Helland, 1000K–40000K), lọc trừ CMY (`cmyToLinearRgb`), hệ đèn đa emitter RGBW/RGBA (`rgbwToLinearRgb`, `rgbaToLinearRgb`), tọa độ màu CIE xy (`xyToLinearRgb`).
  - Tổng hợp quang học: đường cong dimmer bình phương vật lý `applyDimmer(intensity, 'square')`, cộng chùm sáng chồng nhau trong linear light `mixLinear(beams[])` kèm tone mapping mềm Reinhard.
  - Đo độ tương phản: chuẩn WCAG 2.2 (`contrastWcag`) và APCA 0.98G-4g (`contrastApca`).
- **Mô hình dữ liệu màu đèn & Tương thích ngược (7.2)**:
  - Bổ sung `LightingColor` union vào `src/types/stage.ts` (`rgb | rgbw | rgba | cmy | kelvin | gel | name`).
  - Xây dựng cơ sở dữ liệu `src/data/colors.ts` gồm gel sân khấu (Lee Filters, Rosco Supergel với CIE xy đã xác minh), tên màu sân khấu chuẩn, các hàm phân giải `resolveLightingColorToLinear`, `resolveLightingColorToHex`, `getLightingColorLabel`.
  - Migration tự động trong `persistence.ts`: đọc file `.lightstage` cũ có `colorPreset` hex tự động chuyển đổi thành `{ mode: 'rgb', hex }`.
  - Nâng cấp `hardwareParser.ts` và `importer.ts` bóc tách màu tự động từ text mô tả ("3200K", "Amber", "L201", "R255 G90 B20").
  - Tích hợp swatch màu LX và tính năng click chuyển preset màu nhanh trên bảng kịch bản `RundownTable.tsx`.
- **Hệ thống Semantic Tokens & Refactor UI (7.3)**:
  - Xây dựng `scripts/gen_tokens.py` tự động sinh `src/styles/tokens.css` từ dải OKLCH cho 19 semantic tokens (surface-0..3, border, text-1..3, accent, dept-lx/vx/sq/st, status-go/standby/hold/danger).
  - Tích hợp semantic tokens vào `tailwind.config.js` và `src/index.css`.
  - Refactor toàn bộ 5 components trung tâm loại bỏ hoàn toàn các lớp màu thô (`slate-*`, `cyan-*`, `amber-*`): `App.tsx`, `RundownTable.tsx`, `TimelineTracks.tsx`, `ImportModal.tsx`, `ExportModal.tsx`.
  - Thử nghiệm và kiểm chứng độ tương phản: mọi cặp màu chữ/nền đều đạt WCAG 2.2 $\ge 4.5:1$ và APCA $L_c \ge 75$; kiểm thử mô phỏng khiếm sắc (protanopia/deuteranopia) xác nhận trạng thái phân biệt rõ ràng qua độ chói và nhãn văn bản.
- **Sân khấu 2D & Mô phỏng quang học chính xác (7.4)**:
  - `VirtualStagePreview.tsx`: Kết nối toàn bộ pipeline màu quang học (LightingColor $\to$ linear $\to$ dimmer $\to$ gamut mapping $\to$ sRGB).
  - Lớp chùm sáng beam chuyển sang kỹ thuật blend mode cộng sáng `mixBlendMode: 'screen'` và bộ lọc bloom mềm `feGaussianBlur stdDeviation="4"`.
  - Bổ sung thanh legend quang học góc dưới: hiển thị swatch màu thực tế, mã hex, nhãn tên/nhiệt độ màu, cảnh báo khi màu vượt gam sRGB ("Màu vượt gam sRGB (thực tế rực rỡ hơn)") và ghi chú disclaimer rõ ràng.
- **Tài liệu & Đóng đợt (7.5)**:
  - Cập nhật `README.md` với mục mô tả hệ thống khoa học màu và liên kết `docs/COLOR_COURSE.md`.
  - Đóng toàn bộ checklist Đợt 7 trong `PLAN.md`.

### Quyết định kỹ thuật
- **Linear Light Synthesis**: Việc cộng dồn chùm sáng trên sân khấu ảo bắt buộc phải diễn ra trong không gian ánh sáng tuyến tính (Linear RGB) trước khi áp dụng gamma encoding của sRGB để tránh hiện tượng màu bị tối sạm tại các vùng giao thoa.
- **OKLCH Gamut Mapping**: Thay vì cắt cụt (clipping) từng kênh RGB làm biến dạng hue (ví dụ: biến màu lục bão hòa thành vàng hoặc xanh lơ), hệ thống giữ cố định $L$ và $h$ trong không gian OKLCH và chỉ giảm $C$ cho đến khi nằm trong gam sRGB.
- **Không gian màu giao diện tối**: Màu bão hòa cao CHỈ được sử dụng cho trạng thái vận hành sống (Go/Standby/Hold/Danger) và chùm đèn thực tế; toàn bộ khung viền, bề mặt và chữ sử dụng màu trung tính dịu mắt với độ tương phản cao, chống lóa và bảo vệ mắt đạo diễn trong phòng điều khiển tối.

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 15/15 test suites passed, 99/99 unit tests passed (thêm 16 unit tests mới về khoa học màu, contrast, gamut mapping, migration và optical simulation).
- `npm run build`: Production bundle Vite hoàn tất không lỗi trong 864ms (339kB js / 100kB gzip).
- `python3 scripts/audit_workflow.py` & `python3 scripts/guard_check.py`: 100% checks passed, 0 drift violations.


## 2026-11-16 — Hoàn thành Sửa lỗi Vận hành & Độ tin cậy Live Show (Đợt 6)

### Thay đổi
- **Chống mất dữ liệu (6.1)**:
  - Tích hợp autosave debounced 1s khi state `show` thay đổi; hiển thị huy hiệu trạng thái "Đã lưu / Chưa lưu" trực quan từ `isDirty`.
  - Bổ sung thanh thông báo phục hồi phiên làm việc tự động lưu (AutoSave Recovery Banner) khi khởi động với 2 lựa chọn: "Khôi phục" hoặc "Bỏ qua".
  - Bổ sung nút "Open" mở file dự án `.lightstage` trực tiếp qua `parseLightStageFile`, kiểm tra phiên bản và hiển thị thông báo lỗi chi tiết khi file hỏng.
  - Cảnh báo xác nhận khi `isDirty` trước khi mở dự án, tạo show mới hoặc import CSV; hỗ trợ 2 chế độ import: "Thay thế toàn bộ" hoặc "Thêm vào cuối" (`appendActs`).
  - Đăng ký sự kiện `beforeunload` chặn đóng cửa sổ trình duyệt ngoài ý muốn khi có thay đổi chưa lưu.
- **Đồng hồ & Phím tắt Sân khấu (6.2)**:
  - Gom toàn bộ logic kích hoạt cue thành một hàm duy nhất trong `useShowStore.ts`: tự động gọi `syncCueDuration` và `startClock` đồng bộ.
  - Tối ưu bộ bắt phím tắt: Space và Enter tự động `blur()` button đang focus để không kích hoạt nhầm nút; chỉ bỏ qua khi đang gõ trong input/textarea/select/contenteditable.
  - Đồng hồ show chuyển sang tính toán theo mốc `performance.now()` thực tế thay vì cộng `tick(100)` định kỳ, ngăn chặn hoàn toàn hiện tượng trôi giờ khi cửa sổ ứng dụng ở chế độ chạy nền.
  - Chuẩn hóa quản lý số cue: tự động tính số cue tăng dần (`1.0`, `2.0`, `3.0`...) không trùng lặp và cảnh báo khi nhập trùng.
- **Bố cục Responsive & Khóa Vận hành (6.3)**:
  - Header co giãn an toàn từ 960px đến 1920px: ẩn bớt Wall Clock và Hardware Stats trên màn hình nhỏ, bảo đảm các nút chức năng Lock/Open/Import/Export luôn hiển thị.
  - Operator Lock hiển thị cố định với thanh banner cảnh báo màu vàng nổi bật, ngăn ngừa hoàn toàn rủi ro chạm phím ngoài ý muốn.
- **Parser Đếm Thiết Bị Chuẩn Xác (6.4)**:
  - Nâng cấp `hardwareParser.ts` với regex word boundary, loại bỏ các từ gây nhận diện nhầm như "Spare cable 3", "Party mode", "Ghế MC".
  - Giới hạn số lượng hợp lệ trong khoảng 1–9999, từ chối các số lượng bất thường (như `x 4000000000`).
  - Hỗ trợ bóc tách ghi chú trong ngoặc như "Beam x 4 (FOH)" và chuyển trạng thái như "Blinder 2 -> 0".
- **Sân Khấu 2D & Xuất Báo Cáo An Toàn (6.5)**:
  - `VirtualStagePreview.tsx`: Chỉ phát chùm sáng (beam) khi cue có LX thật; màn hình hiển thị "Standby/Off" khi cue không có VX.
  - `exporter.ts`: Triệt để escape HTML chống XSS trên trang in PDF; thêm tiền tố bảo vệ `'` chống tấn công CSV/Formula Injection (DDE).
  - Sử dụng hidden iframe in ấn chuẩn tương thích hoàn hảo với Tauri webview; kích hoạt CSP nghiêm ngặt trong `tauri.conf.json`.

### Quyết định kỹ thuật
- **Định nghĩa Delta Time (6.2.4)**: `Delta = plannedStart(cue) - actualStart(cue) - cueOverrun`. Delta phản ánh chính xác độ lệch thời gian của show so với thời điểm dự kiến bắt đầu cue đang chạy (cộng dồn thời lượng kế hoạch của các cue trước đó) trừ đi độ trễ xuất phát thực tế và phần thời gian chạy quá giờ (overrun) của cue hiện tại.
- **Phương án Định dạng Import (6.5.6)**: Giữ nguyên định dạng CSV/TSV chuẩn hóa có UTF-8 BOM thay vì cài thêm thư viện `.xlsx` nặng hàng chục megabytes, đảm bảo ứng dụng siêu nhẹ, mở/xuất trực tiếp sang Microsoft Excel hoàn hảo không lỗi font.

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 14/14 test suites passed, 83/83 unit tests passed, TypeScript 0 errors, guard_check 0 violations.
- `npm run build`: Production bundle Vite hoàn tất thành công trong 863ms (325kB js / 95kB gzip).
- Toàn bộ 23/23 tiêu chí trong Đợt 6 của `PLAN.md` đã được kiểm chứng và đạt yêu cầu.

## 2026-11-15 — Thiết lập & Kích hoạt Agentic Engineering Workflow 2.0 cho Dự án

### Thay đổi
- Khởi tạo và đồng bộ bộ công cụ Agentic Engineering Workflow 2.0:
  - Bổ sung `ARCHITECTURE.md`: Tài liệu kiến trúc phân tầng (Types, Store, Services, UI Presentation, Tauri harness) và danh mục đăng ký công cụ bắt buộc.
  - Tích hợp `scripts/guard_check.py` & `scripts/guard-baseline.txt`: Rào chắn chống trôi kiến trúc R1-R6 (đăng ký tool, usage header, phân tầng, layout whitelist hỗ trợ Tauri v2 và modern web) với cơ chế bánh cóc baseline (ratchet).
  - Tích hợp `scripts/entropy_report.py`: Báo cáo entropy định kỳ phát hiện tool mồ côi, code trùng lặp.
  - Tích hợp `scripts/routing_check.py` & `scripts/skill_lint.py`: Bộ kiểm tra định tuyến và ngân sách token.
  - Cấu hình `.githooks/pre-commit` (kích hoạt qua `git config core.hooksPath .githooks`): Chặn rò rỉ secret và tự động chạy fast quality gate trước mỗi commit.
  - Nâng cấp `scripts/check.sh`: Thêm bước kiểm tra drift guard tự động vào cổng kiểm thử chất lượng.
  - Cập nhật `AGENTS.md` và `.gitignore` (bảo vệ `scratch/`, `.env`).

### Quyết định kỹ thuật
- Tùy biến `scripts/guard_check.py` để nhận diện cấu trúc dự án Tauri v2 (`src-tauri`) và các tệp cấu hình web hiện đại (`index.html`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `SECURITY.md`) thay vì nạp vào baseline ngoại lệ, đảm bảo chuẩn kiến trúc sạch 0 violations.
- Giữ nguyên toàn bộ lộ trình và ngữ cảnh nghiệp vụ của dự án (`PLAN.md`, `PROGRESS.md`, `AGENTS.md`, Đợt 6 và Đợt 7) mà không làm gián đoạn tiến độ.

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: All quality gate checks passed (TypeScript 0 errors, 14/14 test suites passed, 74/74 unit tests passed, audit_workflow OK, guard_check OK 0 violations).
- `python3 scripts/audit_workflow.py`: ALL CHECKS PASSED.
- `python3 scripts/guard_check.py`: Guard check OK: 0 new violations (0 baselined).
- `python3 scripts/entropy_report.py`: 0 unreferenced tools, 0 tools missing from ARCHITECTURE.md.
- `python3 scripts/handoff.py`: Snapshot bàn giao hoạt động hoàn hảo.

## 2026-11-15 — Bổ sung Tài liệu Hướng dẫn Toàn diện (User & Dev), MIT License & Chính sách Bảo mật (Public Repo)

### Thay đổi
- Bổ sung `README.md` chuyên sâu chia làm 2 phần:
  - **Phần 1 - Hướng dẫn Người dùng (Non-Tech)**: Giới thiệu nghiệp vụ sân khấu, hướng dẫn cài đặt (.dmg cho macOS, .exe/.msi cho Windows), tổng quan giao diện, hướng dẫn nhập dữ liệu thủ công / Excel / CSV, cơ chế đếm tự động đèn & màn hình LED, điều khiển show calling trực tiếp với phím tắt (Spacebar = GO, B = Standby), chế độ Operator Lock Mode, sân khấu ảo 2D và xuất báo cáo PDF / Excel.
  - **Phần 2 - Hướng dẫn Lập trình viên (Developer Guide)**: Kiến trúc hệ thống Tauri v2 + React 19 + TypeScript + Zustand + TailwindCSS, cấu trúc thư mục, yêu cầu môi trường, hướng dẫn chạy dev / test / quality gate, quy trình đóng gói native installer và quy chuẩn conventional commits.
- Bổ sung `LICENSE`: MIT License chuẩn bản quyền open-source năm 2026.
- Bổ sung `SECURITY.md`: Chính sách bảo mật cho public repository (phiên bản hỗ trợ, quy trình báo cáo lỗ hổng qua GitHub Private Advisories hoặc email bảo mật có cam kết SLA 48h, phạm vi offline-first & an toàn sandbox).

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 14/14 test suites, 74/74 unit tests passed, type-check 0 errors.
- `python3 scripts/audit_workflow.py`: ALL CHECKS PASSED, cấu trúc tài liệu và token discipline đạt chuẩn.

## 2026-11-15 — Hoàn thành & Kiểm chứng Show Control, Phím tắt Sân khấu, Khóa an toàn Operator, Báo cáo & Stress Testing (Đợt 5)

### Thay đổi
- Nâng cấp Master Clock & Show Control Bar (`src/App.tsx`):
  - Hiển thị đồng hồ thực tế (Wall Clock HH:MM:SS), tổng thời lượng show trôi qua, đếm ngược cue đang Go với cảnh báo Overrun.
  - Tính toán Delta Time thời gian thực so với thời gian biểu dự kiến (hiển thị +ahead hoặc -behind theo giây).
  - Tích hợp hệ thống phím tắt tiêu chuẩn: Spacebar (Go), 'B' (Standby), Up/Down (Chuyển cue Standby), Esc (Hold/Pause).
- Xây dựng chế độ Khóa an toàn Operator Lock (`src/App.tsx`):
  - Nút chuyển trạng thái khóa có biểu tượng và màu cảnh báo trực quan; vô hiệu hóa toàn bộ hotkeys kích hoạt ngoài ý muốn khi đang chạy live show.
- Xây dựng module Xuất báo cáo chuyên nghiệp (`src/services/exporter.ts` & `src/components/export/ExportModal.tsx`):
  - Tạo trang Run of Show (ROS) Cue Sheet độc lập chuẩn in ấn A4 Landscape với `@media print` CSS, hỗ trợ xem trước và in PDF trực tiếp qua trình duyệt với bộ lọc phân hệ (Master, LX, VX, SQ).
  - Xuất bảng Cue Sheet và bảng kiểm kê tổng hợp thiết bị (Hardware Inventory với đỉnh Peak Concurrent) ra định dạng CSV mã hóa UTF-8 BOM, tương thích hoàn hảo với Microsoft Excel.
  - Xuất và lưu trữ dự án `.lightstage` (JSON).
- Bộ kiểm thử quy mô lớn & Stress Testing (`src/services/__tests__/stress.test.ts`):
  - Kiểm thử áp lực với show quy mô 1.000+ cues trên 10 acts: bóc tách phần cứng < 100ms, tuần tự hóa < 150ms, parse < 200ms, xuất CSV < 100ms.
  - Toàn bộ 74/74 unit tests passing, tsc sạch lỗi, Vite production bundle tối ưu (314kB gzip 92kB).

### Quyết định kỹ thuật
- Tận dụng CSS `@media print` cho bản xuất PDF thay vì cài đặt thư viện jsPDF / Puppeteer nặng hàng chục megabytes, mang lại giao diện in sắc nét theo tỷ lệ giấy A4 thực tế mà không phát sinh thêm bundle size.
- CSV UTF-8 BOM (`\uFEFF`) giải quyết triệt để vấn đề hiển thị ký tự tiếng Việt có dấu khi người dùng mở trực tiếp bằng Excel trên Windows/macOS.

### Kiểm chứng & Kết quả
- `npm run type-check`: 0 errors.
- `npx vitest run`: 14/14 test suites passed, 74/74 tests passed (1.19s).
- `npm run build`: Production bundle hoàn tất trong 895ms.
- `bash scripts/check.sh --fast`: All quality gate checks passed.
- `python3 scripts/audit_workflow.py`: ALL CHECKS PASSED, prime workflow health.

## 2026-11-15 — Hoàn thành & Kiểm chứng Sân khấu ảo 2D Virtual Stage Preview (Đợt 4)

### Thay đổi
- Xây dựng mô hình dữ liệu bố cục sân khấu & store quản lý (`src/types/virtualStage.ts` & `src/store/useStageStore.ts`):
  - Hỗ trợ 3 preset kiến trúc sân khấu tiêu chuẩn: End Stage (Standard Nhà hát/Hội trường), Festival/Concert (sân khấu ngoài trời với cánh LED lớn), và Thrust/Catwalk (sân khấu sàn diễn thời trang mở rộng).
  - Định nghĩa chi tiết hệ thống màn hình LED (Main LED, Left/Right Wings, Floor LED, Banner) và giàn truss đèn (Back truss, Mid truss, FOH truss, Floor edge).
  - Cung cấp bảng cấu hình nhanh (toggle hiển thị từng màn hình, từng giàn truss, đổi camera view và preset).
- Xây dựng component mô phỏng 2D thời gian thực (`src/components/stage/VirtualStagePreview.tsx`):
  - Render SVG hiệu năng cao 60fps góc nhìn kép: Mặt trước (Front View) và Từ trên xuống (Top-down Plan View).
  - Phản ứng thời gian thực (Reactive cue highlights): Khi kích hoạt GO, màn hình LED ảo phát sáng sống động kèm hiển thị nội dung visual loop; giàn đèn chiếu các chùm nón sáng (beam cones) theo màu sắc và cường độ preset của cue hiện hành.
  - Tích hợp thanh công cụ điều khiển: Chuyển camera, chọn preset sân khấu, và mở khay cấu hình thiết bị linh hoạt.
- Tích hợp vào App chính: Bổ sung chế độ xem 'Stage 2D' vào thanh chuyển View Mode.
- Thêm 9 unit tests cho Stage store và VirtualStagePreview, nâng tổng số kiểm thử toàn dự án lên 63/63 tests passing.

### Quyết định kỹ thuật
- Áp dụng triệt để nguyên lý ponytail: Sử dụng 100% SVG thuần kết hợp CSS transitions thay vì nhúng Three.js / WebGL cồng kềnh, tối ưu triệt để RAM và CPU (bundle size chỉ tăng nhẹ lên 297kB), không gây quá tải tài nguyên máy vận hành show.

### Kiểm chứng & Kết quả
- `npm run type-check`: 0 errors.
- `npx vitest run`: 11/11 test suites passed, 63/63 tests passed (1.18s).
- `npm run build`: Production bundle Vite 6 hoàn tất trong 878ms.
- `bash scripts/check.sh --fast`: All quality gate checks passed.
- `python3 scripts/audit_workflow.py`: prime workflow health.

## 2026-11-15 — Hoàn thành & Kiểm chứng Giao diện Chế độ Kép Dual View: Rundown Table & Timeline Tracks (Đợt 3)

### Thay đổi
- Xây dựng component bảng gọi Cue Rundown (`src/components/rundown/RundownTable.tsx`):
  - Hiển thị danh sách cue chi tiết với màu sắc trạng thái chuẩn show: Active/Go (emerald), Standby (amber), Hold (rose), Completed (zinc).
  - Bộ lọc linh hoạt theo góc nhìn kỹ thuật viên (Master View, Lighting LX, Visual VX, Sound SQ, Stage Action ST).
  - Điều khiển gọi lệnh trực tiếp tại từng hàng (STBY, GO, HOLD, SKIP, RESET) và inline edit tiêu đề/thời lượng cue.
- Xây dựng component Timeline Tracks tuyến tính (`src/components/timeline/TimelineTracks.tsx`):
  - Dải track song song cho Master, LX, VX, SQ hiển thị cue blocks theo tỷ lệ thời gian thực.
  - Thanh Playhead thời gian thực di chuyển đồng bộ với `useClockStore`, hỗ trợ zoom in/out tỉ lệ hiển thị (px/giây).
  - Tương tác click chọn cue để gọi Standby hoặc double click để kích hoạt GO trực tiếp.
- Tích hợp giao diện điều phối tổng thể (`src/App.tsx` & `src/components/importer/ImportModal.tsx`):
  - Thanh header hiển thị Master Clock, Cue Countdown thời gian thực với cảnh báo overrun đỏ rực khi quá giờ.
  - Bộ đếm thiết bị tổng và đỉnh đồng thời (Peak Concurrent) cập nhật động.
  - Hỗ trợ 3 chế độ xem: Bảng Rundown, Dải Timeline Tracks, và Chế độ kép Dual Split (trên bảng - dưới timeline).
  - Phím tắt điều hành nhanh toàn cục (Space = GO, B = Standby).
  - Hộp thoại Import CSV/TSV và nút xuất file `.lightstage`.
- Bổ sung 6 unit tests kiểm thử render và tương tác cho RundownTable, TimelineTracks và App, nâng tổng số lên 54/54 tests passing.

### Quyết định kỹ thuật
- Tận dụng SVG và flex/grid CSS thuần cho Timeline Tracks thay vì kéo các thư viện chart/canvas nặng nề, giữ bundle nhẹ (283kB) và tốc độ render tức thì.
- Phân luồng re-render: Đồng hồ chạy với requestAnimationFrame nội bộ ở thanh header và playhead, tránh trigger re-render bảng Rundown table khi không đổi cue.

### Kiểm chứng & Kết quả
- `npm run type-check`: 0 errors.
- `npx vitest run`: 9/9 test suites passed, 54/54 tests passed (810ms).
- `npm run build`: Production bundle Vite 6 hoàn tất trong 849ms.
- `bash scripts/check.sh --fast`: All quality gate checks passed.
- `python3 scripts/audit_workflow.py`: prime workflow health.

## 2026-11-15 — Hoàn thành & Kiểm chứng Smart Excel/CSV Importer & Smart Hardware Counter (Đợt 2)

### Thay đổi
- Xây dựng module importer thông minh (`src/services/importer.ts`):
  - Bộ phân tích thời gian đa định dạng `parseTimeString` / `parseTimeToMs`: Hỗ trợ `HH:MM:SS`, `MM:SS`, `3m20s`, `180s`, số thuần và định dạng tiếng Việt như `2 phút 30 giây`, `1 giờ 15 phút`.
  - Bộ đọc RFC-4180 CSV / TSV tích hợp, chuẩn hóa dòng, escape quote, tự động nhận diện header hàng đầu và suy luận ánh xạ cột linh hoạt (cueNumber, title, act, duration, lx, vx, sq, stage, notes).
- Xây dựng bộ phân tích phần cứng và kiểm kê sân khấu (`src/services/hardwareParser.ts`):
  - Thuật toán bóc tách regex song ngữ nhận diện thiết bị & số lượng từ text tự do (e.g. `4 Beam 350W + 2 Follow`, `Màn LED cánh x 2`, `Spot 1000W x 4`, `2 cây Follow, 8 cái Beam`).
  - Phân loại chủng loại thiết bị: Beam, Spot, Wash, ParLED, Blinder, Follow, Laser, Strobe, Smoke; Màn hình LED MainScreen, WingScreen, FloorScreen, Banner.
  - Tính toán số liệu thống kê show: Số lượng theo cue, đỉnh sử dụng đồng thời (Peak Concurrent Usage), và bảng tổng kiểm kê thiết bị toàn show.
- Thêm 19 unit tests mới cho Importer và Hardware Parser (`src/services/__tests__/importer.test.ts`, `src/services/__tests__/hardwareParser.test.ts`), nâng tổng số unit tests lên 48/48 passed.

### Quyết định kỹ thuật
- Tối ưu parser CSV thuần RFC-4180 không phát sinh dependency nặng không cần thiết, đảm bảo khởi động ứng dụng và bundle size tối ưu dưới 800KB.
- Regex bóc tách số lượng hỗ trợ cả mẫu đứng trước (`4 Beam`) và mẫu đứng sau (`Beam x 4`, `Beam: 4 cái`, `4 cây Beam`), chuẩn hóa tên thiết bị đồng nhất để tính peak concurrent usage chuẩn xác.

### Kiểm chứng & Kết quả
- `npm run type-check`: 0 errors.
- `npx vitest run`: 7/7 test suites passed, 48/48 tests passed (571ms).
- `npm run build`: Production bundle hoàn tất trong 840ms.
- `bash scripts/check.sh --fast`: All quality gate checks passed.
- `python3 scripts/audit_workflow.py`: prime workflow health.

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
