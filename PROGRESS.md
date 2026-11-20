# progress log — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-20 — Đợt 18 (tiếp): 18.6a header 960px + script evidence + Tauri/Stage Clock

### Thay đổi
- **18.6a — header vừa 960px (hồi quy đã đóng):** `Header.tsx` ẩn wordmark "Light Stage" dưới `lg` (giữ badge `LS`), nhãn đồng hồ rút gọn `Show` / `Cue` / `Delta` dưới `lg` (bản đầy đủ `Show Time` / `Cue Remainder` / `Delta (Sớm|Trễ)` từ `lg`), ẩn chip `B`/`Esc` dưới `lg` (vẫn còn `title` + `aria-label`), GO `px-4 lg:px-6`.
  - Kiểm ảnh hưởng: `Delta` giờ có 2 node (compact + full) → thêm `data-testid="header-delta-label-compact|full"`; cập nhật 3 test dùng `getByText('Delta')` (`Header.test.tsx`, `round18Verification.test.tsx`, `realUserJourney.test.tsx`).
  - Test mới: "keeps the 960px command bar compact so Lock + Tools stay inside the viewport" (assert class co giãn + `aria-label` Khóa/Tools).
- **Script evidence:** `scratch/capture-layout-evidence.mjs` — thêm `captureScreenshot(cdp)` (hết lỗi `is not defined`), hàm `assertHeaderFitsViewport` (header/bar/doc `scrollWidth`, `clippedButtons`, `truncatedTexts`, `zoneRects`), đo 3 trạng thái default/locked/hold và gate mới; Hold state cũng được audit `elementFromPoint` đầy đủ.
- **Script mới:** `scratch/verify-stage-clock.mjs` — mở popup qua menu Tools bằng `Runtime.evaluate { userGesture: true }`, bắt target `?view=stage-clock`, bấm GO ở cửa sổ chính, assert trạng thái/đếm lùi + chụp 2 ảnh.

### Kết quả kiểm chứng
- `node scratch/capture-layout-evidence.mjs` → **ALL ACCEPTANCE PASSED**:
  - Default: `header.scrollWidth=960`, `doc.scrollWidth=960`, clipped=[], truncated=[], 18/18 nút clickable, zones 12→303 | 367→582 | 646→948.
  - Operator Locked: 960/960, clipped=[], zones 12→303 | 368→583 | 648→948.
  - Cue Hold (Resume): 960/960, clipped=[], truncated=[], zones 12→310 | 319→638 | 646→948.
  - Dropdown Tools: 7/7 item clickable, 0 clipped. Ảnh: `scratch/viewport-960x640.png`, `scratch/operator-locked-960x640.png`, `scratch/cue-hold-960x640.png`.
- `node scratch/verify-stage-clock.mjs` → **PASS**: popup mở từ Tools, `STANDBY` → `GO`, cue "Pre-Show / Walk-in", countdown `04:58` → `04:56`.
- `bash scripts/check.sh --fast` → **OK** (TypeScript, toàn bộ vitest, cargo check, workflow audit, guard check 0 vi phạm).
- `npm run tauri build -- --debug --bundles app` → **EXIT=0**, bundle `Light Stage.app` **29.99 MiB**; mở app: tiến trình sống, **2 cửa sổ** (main 1280×800 + stage clock 1024×769). Người dùng xác nhận cửa sổ phụ chuyển GO + đếm lùi đúng.
  - Giới hạn môi trường: `osascript` bị từ chối Apple Events (-1743), `screencapture` không có quyền Screen Recording, không có `cliclick` → không tự động chụp/click bản native; đã kiểm bằng Quartz window list + xác nhận trực tiếp của người dùng.

### Còn lại của 18.10
- Chạy lại bằng browser thật #4 (import thiếu tên / thời lượng `abc`), #5 (Skip cần xác nhận), #2 (tự cuộn 960×640 với ≥ 6 cue), rồi `bash scripts/check.sh` đủ + archive.


## 2026-11-20 — Đợt 18: Hoàn tất vá lỗi từ review người dùng (18.1–18.10)

### Thay đổi & Khắc phục Lỗi cốt lõi
- **18.1 Space un-locking bug (Critical #1):**
  - Khắc phục triệt để lỗi người dùng nhấn Khóa bằng chuột rồi nhấn Space vô tình mở khóa lại.
  - Khi bật Khóa, nút Khóa gọi ngay `e.currentTarget.blur()`. Bắt `onKeyDown` trên nút Khóa để chặn dứt điểm Space/Enter khi đang locked.
  - Trong `App.tsx` global keyboard handler: khi `isOperatorLocked`, Space và Enter bị `preventDefault()` và gọi `active.blur()`, chặn đứng synthetic click và kích hoạt visual feedback "Đang khóa vận hành".
- **18.2 Hold / Resume Transport Mechanics (#3):**
  - Sửa ưu tiên hiển thị status badge: `status === 'Hold'` được kiểm tra TRƯỚC `isActive || status === 'Go'` trong cả `RundownTable` và `CueInspector`.
  - Khi cue ở trạng thái Hold: Hero GO button hiện rõ badge cam "HOLD"; nút Hold trên Header & CueInspector chuyển thành nút "Resume" (icon Play, gọi `resumeCue()`).
  - `resumeCue` đưa cue trở lại trạng thái 'Go' và tiếp tục đếm ngược từ thời gian còn lại (không reset thời gian ban đầu). Cập nhật mô tả Help modal.
- **18.3 Import không nuốt dữ liệu (#4):**
  - Mở rộng `convertRowsToActs` với `issues` và `defaultDurationCount`: dòng thiếu tên cue hoặc thời lượng không parse được (ví dụ `"abc"`) ghi nhận cảnh báo rõ ràng thay vì nuốt thầm `|| 60000`.
  - `ImportModal` hiển thị banner cảnh báo dòng cần xem, cho phép bật/tắt "Bỏ qua dòng thiếu tên", kèm thống kê: `N cue nhập, M bỏ qua, K dùng giá trị mặc định`.
- **18.4 Skip an toàn & Ổn định layout (#5):**
  - Thêm bước xác nhận inline cho nút Skip trong `CueInspector`: hiển thị "Bỏ qua cue #N?" với nút "Xác nhận" và "Huỷ", ngăn chặn bấm nhầm.
  - Di chuyển banner Operator Lock vào bên trong `<main>` ngang hàng với view, cố định vị trí ngăn chặn dịch chuyển dọc của drawer CueInspector khi đóng/mở khóa.
- **18.5 RundownTable Auto-scroll (#2):**
  - Tự động cuộn mượt tới cue đang chạy (`activeCueId`) hoặc chuẩn bị (`standbyCueId`). Tạm dừng tự cuộn trong 5s khi người dùng cuộn chuột thủ công.
- **18.6 Responsive 960×640 (#6, #9):**
  - Header: Loại bỏ `hidden xl:flex` trên bộ đếm phần cứng LX/VX và Delta Time; thu gọn padding/gap giúp hiển thị đầy đủ thông số trên viewport 960px.
  - RundownTable: Tối ưu min-width các cột (tổng ~902px) giúp hiển thị đầy đủ tất cả các cột bao gồm Sân khấu (ST) ở 960px.
  - Stage 3D: Dời floating pill sang `top-3 right-3` tránh che Live Cue Card; `VxControlBar` hỗ trợ responsive flex-wrap.
- **18.7 Phản hồi khi Khóa & Khởi tạo Show sạch (#7, #8):**
  - Vô hiệu hóa và gắn `aria-disabled` cho các nút gọi cue khi khóa; click nút khi khóa kích hoạt phản hồi "Đang khóa vận hành".
  - Hiển thị banner "Dữ liệu mẫu" và nút "Bắt đầu từ trắng" trên bảng rundown; hàm `createBlankShow()` tạo dự án sạch không chứa cue mẫu.
- **18.8 Stage Clock popup blocked handling (#11):**
  - Bổ sung thông báo "Trình duyệt chặn cửa sổ phụ" khi popup bị chặn; cấp quyền `core:webview:allow-create-webview-window` trong `capabilities/default.json`.
- **18.9 Việt hóa & Giải thích Delta (#10, #12):**
  - Việt hóa nhất quán các modal Import và Export với định dạng song ngữ tương thích. Delta hiển thị rõ trạng thái `(Sớm)` / `(Trễ)` kèm tooltip giải thích chi tiết.
- **18.10 Kiểm chứng tự động:**
  - Viết suite kiểm thử toàn diện `src/__tests__/round18Verification.test.tsx` (9 suites kiểm tra từng tiêu chí).

### Kiểm chứng (Quality Gate)
- `npx tsc --noEmit` → **0 error**.
- `npx vitest run` → **40 test files passed (40/40), 372 tests passed, 0 failed**.
- `cargo check --manifest-path src-tauri/Cargo.toml` → **Finished dev profile [unoptimized + debuginfo]**.
- `bash scripts/check.sh` (full build) → **ALL PASS**: TypeCheck, Tests, Cargo check, Vite Production Build, Workflow Audit, Drift Guard (0 violations).


## 2026-11-19 — Kiểm thử người dùng (SM)

### Kiểm thử & phát hiện
- Chạy app đang phục vụ tại `http://127.0.0.1:1420` (HTTP 200): welcome 4 bước, rundown/timeline/Stage 3D, import demo preview, Help và cửa sổ export.
- **High — trạng thái cue sai sau Hold:** GO làm countdown chạy; nhấn Esc hoặc nút Hold thì countdown dừng ở 04:58 nhưng cue trên rundown vẫn hiện **GO**. Tái hiện với cue `1.0 Pre-Show / Walk-in`; lặp lại bằng cả phím và nút.
- **Medium — đếm màn LED sai trong CSV mẫu:** cue `1.1 Opening Video & Countdown` có `Intro Motion Video (3 screens)` nhưng preview import báo **1 screen**.
- Stage 3D tải canvas; chuyển view không có lỗi console trong lượt kiểm tra. Không tràn trang ở 960×640, 1280×800, 1920×1080.

### Kiểm chứng
- `bash scripts/check.sh --fast` → **OK**: TypeScript, 39 test files / 363 tests pass (5 todo), Cargo check, workflow audit và drift guard.
- Chỉ kiểm thử giao diện trên Vite đang chạy; lượt này không đóng gói/chạy lại binary Tauri, không xác minh nội dung file export thực tế.
- Không sửa mã ứng dụng và không đánh dấu lại milestone trong PLAN.

## 2026-11-19 — Đợt 17.8: xác minh & đóng đợt 17 (UI vá "AI slop")

### Thay đổi (vá nốt phần rà soát phát hiện)
- Thay 187 `text-[8..11px]` → `text-xs` (12px) ở 12 file (đúng 17.2 "không dưới 12px"); đo DOM: 0 phần tử chữ < 12px.
- `Stage3DView`/`VxControlBar`: bỏ hex navy cũ `#0d121a` → token `bg-surface-1/95`.
- `index.css`: thêm `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }` (trước đó là ring mặc định 1px).

### Số liệu cuối (src/**/*.tsx, không test)
`uppercase` 2 (mã trạng thái), `tracking-w*` 0, ` · ` 0, `backdrop-blur` 7 (chỉ overlay modal/Inspector), `rounded-full` 13 (chấm trạng thái + swatch màu), `shadow-*` 19 (chỉ modal/popover/HUD nổi).

### Kiểm chứng
- `npx tsc` sạch; `vitest` 39 file / 363 pass; `bash scripts/check.sh` đủ → OK; `guard_check` 0 vi phạm mới (R8 bật).
- `node scratch/capture-layout-evidence.mjs`: 960/1280/1920 PASS, header 100% clickable, 0 clipped. Ảnh trước/sau: `scratch/r17-before-*.png`, `scratch/r17-after-*.png`.
- Tab thật: focus ring solid 2px; font Barlow Semi Condensed; có rule `prefers-reduced-motion`.
- `tauri build --debug --bundles app` OK (29.96 MiB), mở app → tiến trình sống.

