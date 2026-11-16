# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-16 — Đợt 10.2 & 10.3: Ký hiệu Stage, Rig Editor, Light Plot, Popover

### Thay đổi
- **Ký hiệu USITT-lite** (`src/services/stageSymbols.ts`, `src/components/stage/FixtureSymbol.tsx`): mỗi loại đèn có hình riêng (kể cả Laser chevron, Smoke), đánh số downstage→upstage, SL trước, boom trên→dưới; thước mét + đọc khoảng cách khi rê chuột.
- **Stage 2D**: legend LX Color/loại đèn/dimmer/haze/power + chip cảnh báo chuyển xuống **footer dưới canvas** (không còn `absolute` đè sân khấu); cảnh báo lệch SL/SR, thiếu front/back, vượt tải truss, cue > rig.
- **Rig Editor** (`src/components/stage/StageRigEditor.tsx`): sửa kích thước sân khấu, thêm/xoá/sửa màn LED, truss (vị trí, trim, tải), từng đèn (loại, vị trí, toạ độ, trim, góc chùm, bật/tắt); hiển thị “Rig N đèn · Cue cần M” và cảnh báo khi cue vượt rig.
- **Parser** (`fixtureModel.parseFixtureText`): clause lạ có số lượng rõ ràng (“Foo x4”, “4 Foo”, “Bar 2 cây”) thành dòng `Other` + chip “Chưa phân loại”; vẫn loại noise spare/party/cable/ghế/bàn/quạt.
- **Light Plot** (`exporter.generateLightPlotHtml`): sơ đồ top-down có màn LED/truss/ký hiệu đánh số, legend, bảng số–loại–vị trí–X/Y/trim–góc–công suất; nút in trong ExportModal.
- **Popover** (`src/components/common/ClampedPopover.tsx`): portal + `position: fixed`, kẹp trong viewport và cuộn trong popover; áp cho 4 editor LX/VX/SQ/ST (nút Lưu/Huỷ luôn thấy ở 960×640).
- **Dọn dẹp**: xoá 4 stub re-export `src/components/{ExportModal,ImportModal,RundownTable,VirtualStagePreview}.tsx`; bỏ chữ “Excel” ở Welcome/Import/Export (dùng CSV/TSV đúng định dạng hỗ trợ).

### Quyết định kỹ thuật
- Cảnh báo stage là **không chặn**: chỉ hiện chip + tooltip, không đổi dữ liệu cue.
- Light plot dùng HTML/SVG thuần (không thêm thư viện) để in qua iframe như cue sheet hiện có.
- Popover dùng portal thay vì `absolute` để không bị `overflow-hidden` của bảng/cell cắt mất.

### Kiểm chứng & Kết quả
- `npm run type-check`: pass.
- `npx vitest run`: 26 suites / 217 tests pass (thêm `stageSymbols.test.ts`, `ClampedPopover.test.tsx`, test rig CRUD, light plot, footer/cảnh báo).
- `bash scripts/check.sh --fast`: pass; audit 0 failure (warning PLAN.md 256 dòng), guard 0 vi phạm.
- **Chưa tick** 10.2.7 (ảnh front + top-down 3 preset) và 10.3.4 (`elementFromPoint` header 4 độ rộng) vì cần browser thật ở 10.4.

## 2026-11-16 — Đợt 10.1: Một nguồn sự thật cho số lượng đèn

### Thay đổi
- **Mô hình dữ liệu**: `DeviceSpecification.position` (FOH/Back/Mid/Floor…) và `LightingCue.fixtureCount` chuyển thành cache suy ra; `calculateCueDeviceCounts` ưu tiên tổng `fixtures[]`.
- **Service mới `src/services/fixtureModel.ts`**: parse/format danh sách đèn, chuẩn hoá cue/show, migrate dữ liệu cũ (`fixtureCount` → một dòng "Chưa phân loại × N"), đếm theo loại.
- **Store/persistence**: `addCue`, `updateCue`, `appendActs`, `loadShow`, `parseLightStageFile` đều chuẩn hoá qua `normalizeCue`/`normalizeShow`; `getDeviceStats` tính trực tiếp từ `departments`.
- **`hardwareParser`**: tách vị trí khỏi tên (`@FOH`, `(FOH)`, `[Mid]`), không còn nhét vị trí vào tên thiết bị.
- **RundownTable**: bỏ ô "Số lượng Đèn" tách rời; thay bằng ô nhập nhanh + danh sách có cấu trúc (loại · số lượng · vị trí · thêm/xoá), tổng chỉ đọc, chip cảnh báo "Chưa phân loại".
- **Stage 2D / Timeline / Export**: dùng chung số suy ra; `placeFixtures` nhận vị trí từ danh sách và cảnh báo đèn chưa phân loại.

### Quyết định kỹ thuật
- Giữ `fixtureCount` trong schema (optional) để tương thích file cũ, nhưng mọi ghi mới đều bị chuẩn hoá lại từ danh sách — không còn hai nguồn sự thật.
- Migration ưu tiên `fixtureSummary` trước `fixtureCount` để cue cũ có mô tả vẫn giữ đúng loại đèn.

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 24/24 test suites, 188/188 unit tests passed; audit workflow 0 failure (1 warning: PLAN.md 256 dòng, sẽ archive ở 10.5.4); guard check 0 vi phạm.
- Test mới: `fixtureModel.test.ts` (8 ca, gồm property test format→parse), store (3 ca), RundownTable (2 ca), VirtualStagePreview "Nhập 30 · Hiển thị 30", persistence migrate.

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

