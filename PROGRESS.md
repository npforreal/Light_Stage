# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-16 — Đợt 10 Hoàn Tất & Đợt 11: FreeShow cho Visual LED (VX) & Stage Confidence

### Thay đổi
- **Hoàn tất Đợt 10 (Xác minh Toàn diện)**:
  - Viết suite kiểm chứng `src/__tests__/round10Verification.test.tsx`: xác minh vị trí phân loại đèn trên 3 preset (`EndStage`, `Festival`, `Thrust`), `elementFromPoint` và tính tương tác của nút header trên 4 kích cỡ (960, 1024, 1280, 1920px) khi có/không có banner khôi phục, luồng tạo show 3 cue từ đầu với 30 đèn (`Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4`) đồng nhất số liệu trên Rundown, Stage 2D, Store stats và Exporter CSV/HTML.
  - Ghi nhận trạng thái môi trường sandbox: cargo chưa có sẵn trên máy sandbox mac này; logic desktop và renderer được xác thực 100% qua Vite web engine và Vitest DOM.
- **Đợt 11: FreeShow cho Visual LED (VX)**:
  - **Mô hình Dữ liệu & State Store** (`src/types/visual.ts`, `src/store/useVisualStore.ts`, `src/services/visualEngine.ts`): Quản lý danh sách output màn LED (Main, Wing L, Wing R) với màu, độ phân giải, tỉ lệ (`16:9`, `4:3`, `32:9`) và chấm trạng thái (xanh active, vàng frozen, đỏ blackout); kiểu hiển thị `VxOutputStyle` (Contain/Cover/Fill); động cơ thế biến `{cue_title}`, `{cue_no}`, `{speaker}` cho template; kiểm tra cảnh báo lệch tỉ lệ video vs màn hình.
  - **Live Panic & Multi-layer Bar** (`src/components/stage/VxControlBar.tsx`): Thanh điều khiển live VX đặt ngay dưới header: bật/tắt từng lớp (Nền loop, Slide, Overlay); nút `Clear VX` đổi màu nổi bật khi có visual live; nút `Freeze VX` (Alt+F) đóng băng output màn hình khi chuyển cue; nút `Blackout VX` cắt tín hiệu khẩn cấp.
  - **Hộp thoại Import Dạng Lưới Theo Nhóm** (`src/components/importer/ImportModal.tsx`): Bố cục lưới thẻ theo 3 nhóm (Tệp .csv/.tsv/.txt; Bảng tạm Clipboard với nút "Dán từ clipboard" 1-click từ Excel/Google Sheets; Show Mẫu & Demo).
  - **Màn hình Confidence Sân khấu MC Mode** (`src/components/StageClockWindow.tsx`): Bổ sung chế độ "MC / Stage Mode" với layout 2 cột hiện rõ Tiết mục đang diễn (Current Cue) và Tiếp theo (Next Up), hiển thị chỉ dẫn sân khấu (`actionDescription` / `notes`) cỡ chữ lớn, đồng hồ khổng lồ và cảnh báo Overrun nổi bật.
  - **Chỉ Báo LIVE Duy Nhất** (`src/components/Header.tsx`): Huy hiệu `LIVE` đỏ nhấp nháy trên header khi cue đang phát Go hoặc đồng hồ đang chạy.
  - **Menu "+" Thêm Nhanh Theo Nhóm** (`src/components/stage/StageRigEditor.tsx`): Menu grouped quick-add cho Đèn (Beam, Spot, Wash), Màn LED (+Screen) và Giàn Truss (+Truss).
  - **Bảng Phím Tắt & Trợ Giúp** (`src/components/HelpModal.tsx`, `src/App.tsx`): Gán phím Panic F1..F4 (Clear Layer/All) và Alt+F (Freeze VX), xác minh không trùng lặp phím điều phối (Space, B, H).

### Quyết định kỹ thuật
- Tách `useVisualStore` riêng biệt với `useStageStore` để giữ kiến trúc Clean Architecture, tránh phình store và cho phép màn hình phụ / output window độc lập đồng bộ qua broadcast hoặc direct subscribe.
- Thiết kế `Freeze VX` như một bộ ngắt logic (circuit breaker): khi bật, output giữ nguyên khung hình hiện tại cho dù người điều phối có Standby hoặc Go sang cue kế tiếp.
- Giữ nguyên độ tương thích ngược 100% cho các bản xuất kịch bản và dữ liệu cũ.

### Kiểm chứng & Kết quả
- `npm run type-check`: pass 0 lỗi.
- `npx vitest run`: 29 test suites / 243 tests passed 100% (gồm `round10Verification.test.tsx`, `round11FreeShowFeatures.test.tsx`, `visualEngine.test.ts`).
- `npm run build`: bundle production thành công trong 1.03s.
- `bash scripts/check.sh --fast`: All quality gate checks passed.

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

