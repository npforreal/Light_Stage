# Kế hoạch phát triển dự án — Light Stage (Production Roadmap)

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).
> **Quy tắc chung cho mọi đợt lớn:** trước khi đóng đợt phải có một giai đoạn "Test như người dùng thật" bằng built-in browser (nhẹ, không cần build Tauri), chạy theo `docs/USER_TEST_SCRIPT.md`. Lỗi tìm được ghi vào PLAN.md (đợt hiện tại nếu chặn đóng đợt, ngược lại đợt kế). Không đánh `[x]` đóng đợt khi còn lỗi mức Critical/High.

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


