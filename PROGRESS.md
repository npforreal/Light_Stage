# progress log — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-20 — Đợt 18.10: kiểm độc lập Skip #5 (browser thật, 960×640)

### Kiểm chứng (kiểm tra độc lập, không sửa mã)
- #4 (kiểm trước đó, cùng ngày): dán 4 dòng bẩn → banner "Dòng 2: thiếu tên (bỏ qua)", "Dòng 3: thời lượng \"abc\" không đọc được, dùng mặc định 01:00", thống kê "3 cue nhập, 1 bỏ qua, 1 dùng giá trị mặc định".
- Import 4 cue → chọn cue 1.2 → bấm **Skip** trong Inspector: hiện "Bỏ qua cue #1.2?" cùng nút **Xác nhận** / **Huỷ**; chưa cue nào thành SKIP (0).
- **Huỷ** → hộp xác nhận biến mất, vẫn 0 cue SKIP. Skip lại → **Xác nhận** → đúng 1 cue SKIP.
- Layout ổn định khi bật/tắt Khóa: vị trí nút Skip (958,56) và nút Inspector (901,59) giống nhau ở 3 trạng thái (mở khóa / khóa / mở khóa lại) → banner Khóa không còn làm nút nhảy.
- Lưu ý môi trường: pane browser tích hợp đang ẩn nên `requestAnimationFrame` không chạy → không dùng được để đánh giá smooth-scroll; #2 dựa vào `scratch/verify-autoscroll.mjs` (Chrome thật, CDP).

## 2026-11-20 — Đợt 18: vá hồi quy tự cuộn rundown (#2 / 18.5)

### Nguyên nhân gốc (người dùng báo, đã đối chiếu mã)
- `RundownTable.tsx` gắn `onScroll={handleTableScroll}` lên khung bảng. Chính lệnh `scrollIntoView` tự cuộn cũng phát ra `scroll` → tự đánh dấu "người dùng vừa cuộn tay" và chặn lần tự cuộn kế tiếp 5 giây.
- Hệ quả: GO dồn dập (stinger/sự cố) làm cue live nằm dưới mép bảng (cao 279px, cue ở y=279). Chỉ cuộn đúng khi hai lần GO cách nhau > ~5s.

### Sửa
- Bỏ listener `onScroll`; nhận thao tác cuộn tay bằng `onWheel`, `onTouchMove`, `onPointerDown` (chỉ khi `target === currentTarget`, tức kéo thanh cuộn — click hàng vẫn không tính).
- `scrollIntoView({ block: 'center' })` thay `'nearest'` → cue live ở giữa khung, cue Standby kế tiếp vẫn thấy.
- Thêm retry bắt kịp: nếu đang trong thời gian tạm dừng, hẹn kiểm lại mỗi 1s (tối đa 10s) để cue live không bị bỏ rơi khi người dùng ngừng cuộn.
- Thêm `data-cue-id`, `data-cue-number`, `data-cue-status`, `data-cue-active`, `data-cue-standby` trên `<tr>` để đo bằng browser.

### Kiểm chứng
- Test mới trong `RundownTable.test.tsx` (4 test): GO 2 lần < 1s + dispatch `scroll` của trình duyệt; center + standby kế tiếp; wheel → tạm dừng → bắt kịp sau 5s; pointerdown trên row không tính là cuộn.
  - **Đã chứng minh test bắt được lỗi:** gắn lại `onScroll` tạm thời → test "back-to-back GO" **FAIL** (1 failed / 12 passed); gỡ ra → pass.
- `npx vitest run src/components/__tests__/RundownTable.test.tsx` → **13/13 pass**.
- `node scratch/verify-autoscroll.mjs` (browser thật 960×640, 12 cue, ảnh `scratch/rundown-autoscroll-960x640.png`):
  - GO #1→#6 cách 260ms: mỗi lần `active visible=true top=250` (viewport 193..419), standby kế tiếp `visible=true`, scrollTop 0→64→123→182→241→300.
  - Cuộn tay (wheel): scrollTop 359→543; GO ngay sau đó **không** tự cuộn (`visible=false`, đúng chủ đích tạm dừng); sau 5s → `visible=true` (retry bắt kịp).
- `bash scripts/check.sh --fast` → **ALL PASS** (TypeScript, 40 test file / 377 pass + 5 todo, cargo check, audit, guard 0 vi phạm).


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


