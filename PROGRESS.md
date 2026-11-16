# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

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

