# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

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

