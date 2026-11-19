# progress log — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-19 — Đợt 14.4 & 15.4 (Milestone 6): Xác Minh Toàn Diện E2E, Browser CDP Evidence & Build Tauri Desktop Hoàn Tất

### Thay đổi
- **Thu thập bằng chứng bố cục trình duyệt headless thật (Native WebSocket CDP)** (`scratch/capture-layout-evidence.mjs`):
  - Chụp ảnh màn hình PNG thật tại 3 kích thước viewport chuẩn: `960x640` (`viewport-960x640.png`), `1280x800` (`viewport-1280x800.png`), `1920x1080` (`viewport-1920x1080.png`).
  - Giải mã PNG byte stream và kiểm tra phân bố màu quang học (100% ảnh đạt kích thước chuẩn, không rỗng, > 280 màu sắc khác nhau).
  - Khảo sát thực nghiệm `elementFromPoint(cx, cy)` trên 100% các nút Header (18/18 nút) tại viewport 960px: khẳng định 0 che khuất (0 occlusion), 0 tràn lề (0 clipping), và 100% clickability (bao gồm Hero Go, Admin menu button, View mode switchers, Filter pills, Inspector toggle, STBY, Hold, Reset clock, Lock).
  - Khảo sát dropdown menu Admin tại 960px: 7/7 menu items unoccluded, unclipped, và 100% clickable qua hit-test.
- **Biên dịch bản Desktop App production** (`src-tauri`):
  - Chạy thành công `npx tauri build --debug --bundles app` với exit code 0.
  - Tạo thành công bundle macOS app tại `src-tauri/target/debug/bundle/macos/Light Stage.app` (kích thước 29.86 MiB).
- **Cập nhật Kế hoạch & Trạng thái Hoàn thành**:
  - Đóng toàn diện các mục 14.4 và 15.3, 15.4 trong `PLAN.md`.

### Quyết định kỹ thuật
- Tự động hóa kiểm thử CDP qua WebSocket native của Node 22 mà không cần cài đặt thêm thư viện ngoài (Puppeteer/Playwright), đảm bảo quy trình kiểm định nhẹ, độc lập và chạy được trực tiếp trên hệ thống CI/CD hoặc local môi trường air-gapped.
- Cơ chế giải mã và tính toán độ sáng/phân bố màu trực tiếp trên buffer PNG giúp phát hiện ngay lập tức trường hợp canvas trắng hoặc render lỗi mà không dựa vào assertions giả định.

### Kiểm chứng & Kết quả
- `node scratch/capture-layout-evidence.mjs`: Pass 100% (3 screenshots lưu tại `scratch/`, 18/18 header buttons unoccluded & unclipped tại 960px, 7/7 dropdown items pass hit-test).
- `npx tauri build --debug --bundles app`: Pass 100% (exit code 0, bundle size 29.86 MiB).
- `bash scripts/check.sh --fast`: 4/4 quality gate pass sạch sẽ (TypeScript type-check, 34/34 vitest suites / 317 tests pass, cargo check 0 warning/error, workflow audit prime health, drift guard R7 0 violation).
- `grep -rnE "(bg|text|border|ring|from|to|via|fill|stroke|divide|shadow|outline|decoration|accent|caret)-(zinc|slate|gray|neutral|stone|cyan|amber|emerald|rose|indigo|violet|purple|blue|red|green|yellow)-[0-9]+" src/`: Chính xác 0 vi phạm trên toàn bộ `src/`.

## 2026-11-19 — Đợt 15.1 & 15.2 (R4): Right Inspector Drawer & Nâng Cấp Bảng Rundown

### Thay đổi
- **Mở rộng Store Quản lý Lựa chọn & Inspector** (`src/store/useShowStore.ts`):
  - Bổ sung `selectedCueId`, `isInspectorOpen`, `selectCue(cueId)`, `toggleInspector()`, `setInspectorOpen(open)`, `getSelectedCue()`.
  - Tự động kích hoạt mở Inspector khi `selectCue` với `cueId !== null`.
  - Reset `selectedCueId: null` an toàn khi `deleteCue`, `loadShow`, `newShow`.
- **Xây dựng Right Inspector Drawer** (`src/components/CueInspector.tsx`):
  - Thiết kế drawer kỹ thuật chuyên nghiệp (width `w-88`/`w-96`, height `h-full`, border-l).
  - Responsive: Chế độ overlay có backdrop mờ trên viewport < 1200px, docked adjacent view trên >= 1200px.
  - Header: Mã số cue, status badge chuẩn, title cue, nút đóng `✕`, thanh thao tác nhanh (Set Standby, Hold, Skip).
  - 5 Accordions chuyên sâu:
    1. General & Timing: Title, numeric duration (giây) + format MM:SS, scheduled wall time, auto-advance toggle.
    2. Lighting (LX): Scene Name, Master Intensity slider (0-100%), Kelvin slider (2700K-6500K) + color presets với gamut warning, quản lý fixture counts & thêm loại đèn.
    3. Visual LED (VX): Content name, Screen target dropdown, Screen count, loop toggle, layer mapping (Background/Slide/Overlay).
    4. Sound (SQ): Track name, volume slider (0-100%), fade duration, microphone channels checklist.
    5. Stage Action (ST): Action description, cast members, props, director notes.
  - Đồng bộ hai chiều tức thời vào store thông qua `updateCue(cue.id, patch)`.
- **Nâng cấp Bảng Rundown Chuẩn Vận Hành Live** (`src/components/rundown/RundownTable.tsx`):
  - Chiều cao hàng đạt chuẩn touch/pointer >= 40px (`min-h-[44px] h-11`).
  - Row click selection: Nhấp vào hàng kích hoạt `selectCue` và mở Inspector; **tuyệt đối KHÔNG gọi `goCue`** hay phát sinh lệnh chạy show ngoài ý muốn.
  - Loại bỏ hoàn toàn nút GO đơn lẻ và nhóm 8 nút rườm rà ở từng hàng.
  - Thay bằng nút `STBY` tinh tế + menu thả xuống `···` (`MoreHorizontal`) cho các tác vụ phụ (Add Below, Duplicate, Hold, Skip, Reset, Delete).
  - Ma trận visual row highlight: Active GO (`border-l-status-go` + LIVE indicator), Standby (`border-l-status-standby`), Selected/Inspected (`border-l-accent ring-1 ring-accent/60 bg-surface-2/80`), Normal (`border-l-transparent`).
- **Tích hợp Layout & Phím tắt Toàn cục** (`src/App.tsx`, `src/services/shortcutRegistry.ts`):
  - Mount `<CueInspector />` cạnh `<main>` trong khung flex layout.
  - Phím tắt `I`/`i`: Bật/tắt Inspector Drawer an toàn, được bảo vệ bởi `isKeyboardProtected` khi đang gõ vào input/textarea.
  - Kết nối nút Inspector trên Header với store actions.
- **Suite Test Toàn diện** (`src/components/__tests__/CueInspector.test.tsx`, `src/components/__tests__/RundownTable.test.tsx`, `src/__tests__/keyboardShortcuts.test.tsx`):
  - 10 unit tests mới cho `CueInspector.tsx` bao phủ toàn bộ 5 accordions, fast actions, empty state, và collapse/expand.
  - Mở rộng test suite `RundownTable.test.tsx` khẳng định click chọn hàng không kích hoạt playback và touch target >= 40px.
  - Bổ sung test phím tắt `I`/`i` và input guard trong `keyboardShortcuts.test.tsx`.

### Quyết định kỹ thuật
- Tách bạch tuyệt đối giữa Thao tác Lựa chọn (Select) và Thao tác Điều khiển Phát (Live Calling). Việc loại bỏ nút GO ở từng hàng và chuyển sang Hero Central GO Button kết hợp phím Space giúp loại bỏ 100% rủi ro bấm nhầm nút phát trong môi trường phòng tối FOH.
- Dùng `React.useMemo` cho `allCues` trong `CueInspector` ngăn ngừa triệt để lỗi snapshot cache loop của Zustand.
- Tuân thủ 100% Rule R7 (chỉ dùng semantic tokens, 0 mã màu thô).

### Kiểm chứng & Kết quả
- `npm test -- src/components/__tests__/CueInspector.test.tsx`: 10/10 tests pass 100% (674ms).
- `npm test -- src/components/__tests__/RundownTable.test.tsx`: 9/9 tests pass 100% (213ms).
- `npx vitest run`: 34 test files / 313 tests pass 100% (3.74s).
- `python3 scripts/guard_check.py`: 0 violations (0 baselined).
- `bash scripts/check.sh --fast`: 4/4 quality gate checks pass sạch sẽ.

## 2026-11-19 — Đợt 14.3 (R3 / Remediation 2): Khắc Phục Dứt Điểm Tràn Ngang 1280px Bằng Breakpoint 2xl

### Thay đổi
- **Trì hoãn các phần tử phụ sang Breakpoint 2xl** (`src/components/Header.tsx`):
  - Standby Callout (`hidden xl:flex` → `hidden 2xl:flex`): ẩn trên viewport < 1536px, tiết kiệm ~138px ở 1280px.
  - Wall Clock trong cụm Tabular Clocks (`hidden min-[1280px]:flex/block` → `hidden 2xl:flex/block`): ẩn trên viewport < 1536px, tiết kiệm ~85px ở 1280px.
  - Tổng chiều rộng tiết kiệm tại 1280px: 223px. Chiều rộng tự nhiên của Command Bar giảm từ 1,442px xuống 1,219px (<= 1280px với biên an toàn 61px).
  - Giữ nguyên hiển thị đầy đủ trên màn hình 1920px (>= 1536px).
- **Cập nhật Unit Test Suite** (`src/components/__tests__/Header.test.tsx`):
  - Cập nhật assertion cho Standby Callout kiểm tra class `hidden 2xl:flex`.
  - Bổ sung assertion kiểm tra Wall Clock với class `hidden 2xl:flex`.

### Quyết định kỹ thuật
- Giải quyết dứt điểm lỗi tràn ngang +162px tại viewport 1280px (khi Tailwind `xl:` kích hoạt ở 1280px làm bung đồng loạt các phần tử phụ), đảm bảo nút Admin Menu và cụm đồng hồ không bị đẩy ra ngoài màn hình và clickable 100%.

### Kiểm chứng & Kết quả
- `npm test -- src/components/__tests__/Header.test.tsx`: 10/10 tests pass 100% (176ms).
- `npx vitest run`: 33 test files / 300 tests pass 100% (3.76s).
- `python3 scripts/guard_check.py`: 0 violations (0 baselined).
- `bash scripts/check.sh --fast`: 4/4 quality gate checks pass cleanly (type-check, unit tests, cargo check, workflow audit, drift guard).

