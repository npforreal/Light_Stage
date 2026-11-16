# Kế hoạch phát triển dự án — Light Stage (Production Roadmap)

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).

## Đợt 5: Hệ thống Điều phối Thời gian, Phím tắt Sân khấu & Xuất Báo cáo

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 5.1: Bộ điều khiển Thời gian & Phím tắt Sân khấu, Giai đoạn 5.2: Xuất Báo cáo (PDF & Excel) & Đóng gói Production


### Mục tiêu đợt
Hoàn thiện hệ thống điều khiển vận hành show (phím tắt, đồng hồ delta time), tính năng xuất báo cáo chuyên nghiệp và đóng gói bản phát hành.

## Đợt 7: Thiết kế lại Màu UI & Mô phỏng Ánh sáng Chính xác (Color System)

> Tài liệu nền: `docs/COLOR_COURSE.md` (giáo trình màu + nguồn). Chỉ đọc phần liên quan tới giai đoạn đang làm.
> Hiện trạng đo được: ~227 lớp màu Tailwind thô ở 5 component; cyan/amber/xanh lục mang nhiều nghĩa (phân hệ trùng trạng thái); `colorPreset` không có UI/importer nào ghi nên Stage 2D luôn dùng cyan mặc định (`VirtualStagePreview.tsx:32`); cue không có LX/VX vẫn sáng 12 beam + "Visual Loop".

### Mục tiêu đợt
(1) UI hết rối: bảng màu nhỏ, mỗi màu một nghĩa, màu bão hoà chỉ cho trạng thái và ánh sáng thật. (2) Màu đèn trên Stage 2D đúng: pha cộng/trừ, Kelvin, gel, chồng chùm cộng sáng trong linear-light, cảnh báo ngoài gam.

### Giai đoạn 7.1: Lõi khoa học màu (`src/services/color.ts`, thuần hàm, không phụ thuộc UI)
- [ ] 7.1.1 Chuyển đổi sRGB ↔ linear, linear ↔ Oklab/OKLCH, hex ↔ OKLCH.
- [ ] 7.1.2 Gamut map: giữ L/H, giảm C tới khi vào sRGB; trả cờ `outOfGamut`.
- [ ] 7.1.3 `kelvinToRgb` (Helland, kẹp 1000–40000K), `cmyToRgb`, `rgbwToRgb`/`rgbaToRgb`, `xyToLinearRgb` (ma trận XYZ→sRGB, bản chuyển Source A→D65 đơn giản).
- [ ] 7.1.4 `mixLinear(beams[])` cộng ánh sáng trong linear + tone-map nhẹ; `applyDimmer(intensity, curve)` (mặc định bình phương).
- [ ] 7.1.5 `contrastWcag(fg,bg)` và `contrastApca(fg,bg)` (đối chiếu spec trước khi chốt ngưỡng).
- [ ] 7.1.6 Test đơn vị: điểm kiểm Kelvin (2500K≈255,159,70; 2700/3200/5600/6500K), đỏ+lục tuyến tính ≠ cộng gamma, vòng hex→OKLCH→hex sai số < 1/255, gamut map giữ hue.
- Kiểm chứng: `npx vitest run src/services/__tests__/color.test.ts`, `bash scripts/check.sh --fast`.

### Giai đoạn 7.2: Mô hình dữ liệu màu đèn (tương thích ngược)
- [ ] 7.2.1 `src/types/stage.ts`: thêm `LightingColor` (union theo mode: `rgb|rgbw|rgba|cmy|kelvin|gel|name`) vào `LightingCue`; giữ `colorPreset` cũ.
- [ ] 7.2.2 Migrate trong `persistence.ts`: file cũ có `colorPreset` hex → `{mode:'rgb'}`; không làm hỏng file `.lightstage` đã lưu (thêm test round-trip và test file cũ).
- [ ] 7.2.3 Bảng tên màu/gel (`src/data/colors.ts`): Amber, CTO, CTB, Đỏ/Xanh/Vàng…, vài mã Rosco/Lee/GamColor có dữ liệu xy đã xác minh; mục thiếu dữ liệu gắn cờ `approx`.
- [ ] 7.2.4 Importer/`hardwareParser`: nhận cột màu và chuỗi như "3200K", "R255 G0 B0", "Amber", "L201"; ánh xạ vào `LightingColor`; test với tiếng Việt.
- [ ] 7.2.5 Rundown: ô nhập màu LX (picker + mode + swatch) cho cue; swatch số cạnh mô tả.
- Kiểm chứng: vitest các file liên quan; mở file `.lightstage` cũ trong test.

### Giai đoạn 7.3: Hệ token màu & refactor UI
- [ ] 7.3.1 `scripts/gen_tokens.py` (hoặc ts) sinh `src/styles/tokens.css` từ dải OKLCH: surface-0..3, border, text-1..3, accent, dept-lx/vx/sq/st (cùng L, cùng C, hue cách ~90°), status-go/standby/hold/danger.
- [ ] 7.3.2 `tailwind.config.js`: thay `stage.*` bằng token semantic (`bg-surface-1`, `text-text-2`, `text-status-go`…); bỏ dùng màu Tailwind thô trong component.
- [ ] 7.3.3 Test contrast: mọi cặp text/surface được dùng đạt WCAG 4.5 (chữ) / 3 (UI), in kèm APCA Lc.
- [ ] 7.3.4 Refactor theo thứ tự: `App.tsx` (header: chỉ trạng thái mới có màu, đồng hồ trung tính) → `RundownTable` → `TimelineTracks` (dải phân hệ dùng nền mờ, không đặc) → `ImportModal`/`ExportModal`.
- [ ] 7.3.5 Quy tắc: màu phân hệ không trùng hue trạng thái; trạng thái luôn kèm chữ/icon (STBY/GO/HOLD/OVERRUN).
- [ ] 7.3.6 Mô phỏng thiếu màu đỏ-lục (protan/deutan) kiểm tra cặp Go/Overrun/Standby còn phân biệt được.
- Kiểm chứng: vitest contrast, chụp màn hình trước/sau 1280×800 và 960×600, đếm lại số lớp màu thô (mục tiêu ≈ 0).

### Giai đoạn 7.4: Stage 2D hiển thị đèn chính xác
- [ ] 7.4.1 `VirtualStagePreview` lấy màu từ `LightingColor` qua pipeline: màu đích → linear → dimmer → `mixLinear` → gamut map → sRGB.
- [ ] 7.4.2 Beam chồng nhau cộng sáng (`mix-blend-mode: plus-lighter`/`screen` trên nền tối); thêm bloom nhẹ, không cháy trắng cả sân.
- [ ] 7.4.3 Bỏ giá trị mặc định che sự thật: cue không có LX → không phát beam; không có VX → màn hiện "Standby/Off", không "Visual Loop LIVE FEED".
- [ ] 7.4.4 Thanh legend: swatch + nhãn số của cue active (ví dụ "3200K", "R255 G90 B20"), cảnh báo "màu thật rực hơn màn hình" khi `outOfGamut`.
- [ ] 7.4.5 Hỗ trợ màu theo truss/nhóm (override), crossfade màu giữa hai cue bằng nội suy trong linear (hoặc OKLCH, ghi quyết định vào PROGRESS).
- [ ] 7.4.6 Ghi chú trên UI: "mô phỏng xấp xỉ, không thay thế đo đạc".
- Kiểm chứng: test component (màu beam đúng với `LightingColor`, cue rỗng không có beam), browser: GO qua cue Đỏ→Lục→Kelvin và chụp ảnh đối chiếu.

### Giai đoạn 7.5: Tài liệu & đóng đợt
- [ ] 7.5.1 Cập nhật README (mục màu và mô phỏng ánh sáng, giới hạn), liên kết `docs/COLOR_COURSE.md`.
- [ ] 7.5.2 `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`.
- [ ] 7.5.3 Ghi PROGRESS.md, chạy `python3 scripts/archive_logs.py`, commit theo Conventional Commits (mỗi giai đoạn một commit, không push).

### Rủi ro & quyết định cần chốt
- Hệ số/ngưỡng APCA, Helland, ma trận XYZ đang đánh dấu cần đối chiếu nguồn gốc trước khi code.
- Dữ liệu gel đầy đủ chưa có trên nguồn tìm được; chỉ nhập mã nào có xy đã xác minh.
- Mô phỏng chỉ là xấp xỉ (không có phổ thật của từng đèn): phải ghi rõ ở UI.
- Phụ thuộc: Đợt 6 (sửa lỗi vận hành) phải xong trước, đặc biệt 6.3 (header co giãn) vì ảnh hưởng thiết kế lại UI ở 7.3.

