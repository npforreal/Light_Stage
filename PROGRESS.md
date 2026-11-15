# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

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

