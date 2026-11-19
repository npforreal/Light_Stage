# progress log — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-19 — Đợt 16.3: parser `.lightstage` an toàn tại biên

### Thay đổi
- `src/services/persistence.ts`:
  - Thêm tầng validate trước khi normalize: `validateShowShape` (show → act → cue), `validateCueShape` (id/actId/cueNumber/title/durationMs/status/departments), `validateStageShape` (`stage.screens[]`, `stage.trusses[]`).
  - Mọi lỗi trả `ParseResult.error` kèm **đường dẫn cụ thể**: `acts[0].cues[0].id`, `acts[0].cues[0].departments.lx.fixtureCount`, `stage.screens[0]`…
  - Bọc phần normalize trong `try/catch` cuối cùng: dữ liệu lạ không thể làm ném ra khỏi `parseLightStageFile`.
  - Thêm `readLightStageFile(file): Promise<ParseResult>` — lọc file rỗng, bắt `FileReader.onerror`/`onabort`/`readAsText` throw; không bao giờ reject.
- `src/App.tsx`: `handleFileSelected` chuyển sang `async` + `readLightStageFile`, bỏ `alert()`; lỗi import mở **modal** "Không mở được dự án" (role `dialog`, `aria-modal`, `data-testid="import-error-modal"`) hiện nguyên nhân + gợi ý "Chọn lại file hoặc mở bản autosave" + nút "Chọn file khác". Dự án đang mở không bị chạm tới.
- Test mới `src/__tests__/round16ParserSafety.test.tsx` (13 test, viết trước): `acts:[null]`, `cues:[null]`, id sai/thiếu, departments sai, số sai kiểu, stage sai, JSON hỏng/rỗng, file rỗng/hỏng qua `readLightStageFile`, import lỗi giữ nguyên show, import hợp lệ vẫn chạy.

### Quyết định kỹ thuật
- Validate **trước** normalize để không "tự bịa id" che mất dữ liệu hỏng; id thiếu là lỗi cứng thay vì đoán.
- Không dùng schema library mới: hàm thuần TypeScript để giữ bundle nhỏ và không thêm dependency.
- Modal thay `alert()` vì `alert` chặn main thread (đúng lúc live show) và không copy được đường dẫn lỗi.
- `e.target.value = ''` đặt **trước** khi đọc file, để chọn lại cùng file vẫn kích hoạt `change`.

### Kiểm chứng
- TDD: 13 test mới đỏ trước khi implement (11 fail), sau implement **13/13 xanh**.
- `npx tsc --noEmit` sạch; `npx vitest run` → **37 files / 353 tests pass**.

## 2026-11-19 — Đợt 16.2: autosave trung thực + báo lỗi có hành động

### Thay đổi
- `src/store/useShowStore.ts`: thêm `autosaveError: string | null` + `setAutosaveError()`; reset về `null` trong `loadShow`/`newShow`.
- `src/App.tsx`:
  - `persistNow()` (dùng chung cho autosave debounce **và** Ctrl/Cmd+S): gọi `saveAutoSave()`; **chỉ** `markSaved()` + xoá lỗi khi trả `true`; thất bại → `setAutosaveError(...)` và **giữ `isDirty`**.
  - Bỏ đoạn autosave cũ gọi `saveAutoSave()` rồi `markSaved()` vô điều kiện.
  - Banner lỗi một lần (`role="alert"`, `data-testid="autosave-error-banner"`) với nút **"Lưu file .lightstage"** (tải file thật rồi `markSaved`) + nút "Đóng"; tự ẩn khi lỗi được xoá. So sánh `previousAutosaveError` bằng `useRef` để không spam khi cùng một lỗi.
  - `beforeunload` giữ nguyên theo `isDirty` → vẫn cảnh báo khi lưu lỗi.
- `src/services/persistence.ts`: thêm `downloadLightStageFile()` dùng chung; `ExportModal` chuyển sang helper này (bỏ code tải file trùng lặp).
- `src/components/Header.tsx`: chip trạng thái có `data-state` (`error`/`dirty`/`saved`); khi lỗi hiện icon `AlertTriangle` + chữ (lg: "Chưa lưu — lỗi lưu tự động", nhỏ hơn: "Lỗi lưu"), tooltip nêu cách xử lý.
- Test mới `src/__tests__/round16AutosaveError.test.tsx` (7 test, viết trước): storage ném `QuotaExceededError`, `localStorage` hỏng, Ctrl+S lỗi vẫn dirty, phục hồi → sạch lỗi, autosave thành công, `beforeunload` vẫn chặn.

### Quyết định kỹ thuật
- Không thêm thư viện toast/UI mới: dùng store flag + chip + banner như chốt trong PLAN.
- Lỗi lưu **thắng** trạng thái dirty trong chip (một nguồn sự thật, không hiện hai cảnh báo mâu thuẫn).
- "Lưu file .lightstage" tải file trực tiếp (không mở Export modal) rồi `markSaved()` — vì file đã thực sự được ghi ra đĩa.
- Gộp autosave + Ctrl+S vào cùng `persistNow()` để không còn hai đường lưu lệch hành vi.

### Kiểm chứng
- TDD: 7 test mới đỏ trước khi implement (4 fail), sau implement **7/7 xanh**.
- `npx tsc --noEmit` sạch; `npx vitest run` → **36 files / 340 tests pass**.
- Browser thật (ép `Storage.prototype.setItem` ném `QuotaExceededError` rồi bấm "Add Cue", chờ 1.4s):
  - chip `data-state="error"`, có `<svg>` cảnh báo, text "Lỗi lưu", tooltip đầy đủ;
  - banner `role="alert"`: "Chưa lưu — lỗi lưu tự động: không ghi được bộ nhớ cục bộ (đầy hoặc bị chặn). | Lưu file .lightstage | Đóng";
  - khôi phục storage + Ctrl/Cmd+S → chip `data-state="saved"`, banner biến mất, `lightstage_autosave_v1` có dữ liệu.

## 2026-11-19 — Đợt 16.1: Operator Lock chỉ chặn 5 lệnh gọi cue (TDD)

### Thay đổi
- `src/store/useShowStore.ts`:
  - Thêm guard `if (state.isOperatorLocked) return;` vào **5 hàm**: `standbyCue`, `goCue`, `holdCue`, `nextCue`, `prevCue` (nên `goNextCue` bị chặn gián tiếp qua `goCue`). Guard đặt **sau** khi đọc state, **trước** mọi mutation và trước `useClockStore` → khóa không đổi cue, không chạy/pause đồng hồ, không set `isDirty`.
  - `handleGlobalKeyDown`: **bỏ** guard khóa ở đầu (hàm này chỉ xử lý undo/redo/save, không phải lệnh cue). Nhánh `Ctrl/Cmd+S` không còn gọi `markSaved()` khi thiếu `onSave` (trước đây báo "đã lưu" giả).
  - Gỡ auto-attach `attachGlobalShortcuts(window)` lúc import (nguyên nhân Ctrl+S không lưu thật); App đăng ký lại kèm `onSave`.
- `src/App.tsx`:
  - Tách guard thành 3 nhóm: **(1) luôn chạy** (`?`, `i`, `F1`–`F4`, `Alt+F`) → **(2) `if (isOperatorLocked) return`** → **(3) nhóm cue** (Space/Enter, B, ↑/↓, Esc).
  - Thêm `persistNow()` = `saveAutoSave(show, stageConfig)` + `markSaved()` **chỉ khi trả `true`**, gắn vào `attachGlobalShortcuts(window, { onSave: persistNow })`.
  - Banner khóa: đổi câu thành "Các lệnh gọi cue đã bị vô hiệu hóa…" cho đúng phạm vi.
- `src/components/Header.tsx`: GO / STBY / Hold có `disabled`, `aria-disabled`, `cursor-not-allowed`, `disabled:opacity-50`, tooltip "Đang khóa — mở khóa để gọi cue", thêm `data-testid` (`header-hero-go-button`, `header-standby-button`, `header-hold-button`); chip Lock hiện icon + chữ **"Đã khóa"** (mở: "Khóa").
- Test: thêm `src/__tests__/round16OperatorLock.test.tsx` (16 test, viết **trước** khi sửa); cập nhật `keyboardShortcuts.test.tsx` (lock không còn chặn undo/redo/save) và `App.test.tsx`/`Header.test.tsx` theo nhãn mới.

### Quyết định kỹ thuật
- Undo/Redo được coi là **sửa dữ liệu**, không phải lệnh gọi cue → vẫn chạy khi khóa (khớp câu chốt "khóa chỉ chặn 5 lệnh gọi cue"). Đã ghi rõ trong test.
- `Ctrl+S` không còn fallback `markSaved()`: nếu không có luồng lưu thì trả `false` thay vì nói dối trạng thái. 16.2 sẽ thêm UI báo lỗi.
- Không đụng `VxControlBar`/VX store: panic là đường thoát sự cố, phải sống ngoài khóa.

### Kiểm chứng
- TDD: test mới **đỏ 12/16** trước khi sửa (`npx vitest run src/__tests__/round16OperatorLock.test.tsx`), sau khi sửa **16/16 xanh**.
- `npx tsc --noEmit` → sạch. `npx vitest run` → **35 files, 333 tests pass**.
- Browser thật (`vite --port 1420` + `browser.evaluate`):
  - Khóa → gửi Space/Enter/B/↑/↓/Esc: `live=false`, `LX: 0` (không cue nào chạy).
  - 3 nút Header: `disabled=true`, `aria-disabled=true`, `title="Đang khóa — mở khóa để gọi cue"`, `cursor=not-allowed`; keyframes opacity `["1","0.5"]` (transition bị treo vì tab nền nên `getComputedStyle` còn 1 — CSS đã áp đúng).
  - Khóa → `i` mở/đóng `[data-testid="cue-inspector-drawer"]`, `?` mở `#help-modal-title` (cả hai vẫn chạy).
  - Mở khóa → Space: `live=true`, `LX: 12`.

## 2026-11-19 — Đợt 16.0: viết lại kịch bản test người dùng cho OpenCode

### Thay đổi
- `docs/USER_TEST_SCRIPT.md` viết lại toàn bộ: bỏ mọi lệnh của môi trường cũ (launch config, các tool preview/read/javascript không tồn tại), thay bằng bảng lệnh `browser.*` thật (`tabs.open`, `wait`, `snapshot`, `find`, `click`, `press`, `fill`, `select`, `evaluate`, `console`, `screenshot`, `files.upload`).
- Thêm mục "Ba cỡ cửa sổ": browser tool không đổi viewport được → đo bằng `browser.evaluate` (`scrollWidth` vs `innerWidth`) hoặc chạy `node scratch/capture-layout-evidence.mjs` (đặt `Emulation.setDeviceMetricsOverride`, chụp PNG + audit `elementFromPoint`).
- Bổ sung vào kịch bản B/D/E các bước kiểm mới của đợt 16: khóa chỉ chặn 5 lệnh cue nhưng `Ctrl/Cmd+S`, `?`, `i`, `Esc` đóng modal, đồng hồ và VX panic vẫn chạy; ép lỗi autosave → chip cảnh báo + banner; mở file hỏng → lỗi nêu đường dẫn, dự án hiện tại không đổi.
- Ghi chú fallback: nếu `browser.screenshot` báo "needs a visible tab" thì dùng script CDP làm bằng chứng tương đương.

### Quyết định kỹ thuật
- Giữ 5 kịch bản A–E và quy tắc ghi kết quả; chỉ thay phần công cụ + thêm bước kiểm hành vi mới.
- Không nhắc tên tool cũ trong tài liệu để `grep` kiểm tra sạch (chỉ nói "công cụ của môi trường khác").

### Kiểm chứng
- `grep -nE "preview_start|resize_window|read_page|javascript_tool|preview_stop|\.claude" docs/USER_TEST_SCRIPT.md` → không khớp (sạch).
- Chạy thật bằng browser tool trên `npx vite --port 1420`: mở tab → `wait load` → `evaluate` xoá localStorage → reload → `console(level:error)` = **0 lỗi**; `evaluate` đo `window 1000×700`, `scrollWidth 1000` (không tràn), **25 nút header, 0 nút bị che** (`elementFromPoint`).
- `node scratch/capture-layout-evidence.mjs` → PASS: 3 ảnh 960/1280/1920, 100% header button clickable + 0 clipped, dropdown admin 7/7 clickable.

## 2026-11-19 — Rà bản PLAN sau chỉnh tay + sửa 4 chỗ nhầm lẫn

### Thay đổi
- `PLAN.md` (chỉ sửa câu chữ, không đổi cấu trúc mục):
  - Dòng "5 điểm vướng…" → liệt kê đủ 7 mục có chốt: **16.0, 16.1, 16.2, 17.1, 17.2, 17.7, 17.8**.
  - **16.1(b)**: tách rõ "Ctrl/Cmd+S không bị khóa chặn" (việc lưu thật do 16.2 lo), thêm `?`/`i` và `Esc` đóng modal; bổ sung `goNextCue()` bị chặn gián tiếp qua `goCue` (có test riêng `useShowStore.test.ts:168`).
  - **16.2**: thêm đường `Ctrl/Cmd+S` — `attachGlobalShortcuts(window)` (`useShowStore.ts:851`) attach không truyền `onSave` nên `markSaved()` (`:822`) chạy mà không lưu; yêu cầu truyền luồng lưu thật hoặc gỡ auto-attach, kèm test save lỗi vẫn `isDirty`.
  - **Đợt 17**: thêm ngoại lệ thứ tự — 17.1 (tokens) và 17.2 (font) là 2 commit nền làm trước, rồi mới batch theo component.

### Quyết định kỹ thuật
- Không đổi nội dung 16.0/16.5/17.1/17.2/17.7/17.8 do người dùng vừa chỉnh; chỉ kiểm tính đúng đắn và sửa câu chữ gây nhầm.
- Kiểm baseline 16.5 bằng build thật thay vì tin số ghi tay.

### Kiểm chứng
- `npm run build`: khớp baseline trong PLAN — `index` 547.75 kB (gzip 150.59), `three` 547.36 kB (gzip 136.67); cả hai vượt 500 kB.
- `python3 scripts/audit_workflow.py`: ALL CHECKS PASSED (plan hygiene, verification record, kích thước tài liệu).
- `python3 scripts/guard_check.py`: `0 new violations (0 baselined)`.
- Chưa đánh `[x]` mục nào; không chạy `check.sh` vì chỉ sửa tài liệu.

## 2026-11-19 — Sửa PLAN theo review đa góc độ (chuẩn bị giao OpenCode)

### Thay đổi
- `PLAN.md` 16.1: thêm yêu cầu **TDD bắt buộc** (4 test case cụ thể trước khi sửa guard), ghi rõ cách tách guard `App.tsx:192` thành 3 lớp (nhóm "luôn chạy" → guard lock → nhóm cue), tách block chốt kỹ thuật riêng để worker không bỏ sót.
- `PLAN.md` 16.5: thêm **baseline chunk hiện tại** (`index` 547.75 kB + `three` 547.36 kB) để worker có số tham chiếu trước/sau.
- `PLAN.md` Đợt 17 header: thêm **chiến lược batch bắt buộc** — sửa theo từng component (Header → RundownTable → CueInspector → ...), mỗi component commit riêng, chống regression rải rác.

### Quyết định kỹ thuật
- Giữ nguyên nội dung các mục khác, không thêm mục mới — chỉ làm rõ cách thực thi.
- Review đánh giá PLAN 8.7/10; 3 sửa đổi trên nhắm vào 3 điểm trừ duy nhất (khả thi worker 7/10, phạm vi 7/10, thiếu baseline).

### Kiểm chứng
- `python3 scripts/audit_workflow.py`: ALL CHECKS PASSED. PLAN 46 dòng ≤ 250.
- Chỉ sửa tài liệu, không đổi mã nguồn.

## 2026-11-19 — Chốt 5 điểm vướng vào PLAN (khả thi đợt 16–17)

### Thay đổi
- `PLAN.md`: thêm khối "Rà soát khả thi 2026-11-19" (bằng chứng code + danh sách skill/công cụ có sẵn) và chốt 5 điểm trước đây còn mơ hồ:
  - **16.0 (mới, [H])**: viết lại `docs/USER_TEST_SCRIPT.md` cho OpenCode — bỏ `.claude/launch.json`/`preview_start`/`resize_window`/`read_page`/`javascript_tool`/`preview_stop` (không tồn tại), thay bằng `npx vite --port 1420` + browser tool built-in, tái dùng `scratch/capture-layout-evidence.mjs`.
  - **16.1**: làm rõ khóa chỉ chặn 5 lệnh gọi cue; `Ctrl/Cmd+S`, `?` (Help), `i` (Inspector), cuộn/xem và VX panic (`F1`–`F4`, `Alt+F`, nút `VxControlBar`) vẫn chạy; phải tách guard, không `return` sớm ở `App.tsx:192` / `useShowStore.ts:780`.
  - **16.2**: chốt không thêm thư viện UI — `autosaveError` trong store + chip Header có icon `AlertTriangle` + chữ, banner chỉ hiện khi lỗi mới, tự xóa khi lưu lại được.
  - **17.1**: chốt sửa `TOKENS` trong `scripts/gen_tokens.py` (không chỉnh hex tay), cập nhật `docs/COLOR_COURSE.md`, điểm khởi đầu OKLCH surface-0..3 L 0.16/0.21/0.26/0.31, C ≤ 0.004, H 285°, dept C ≈ 0.06.
  - **17.2**: chốt tải Barlow Semi Condensed OFL từ `google/fonts` vào `src/assets/fonts/` kèm `OFL.txt`, subset `vietnamese`+`latin` bằng `fonttools 4.62.1`, preload 1 file, CSP thêm `font-src 'self'`.
  - **17.7 / 17.8**: bỏ "chụp grayscale" trong unit test (jsdom không render pixel) → test DOM khẳng định chữ + icon riêng, ảnh grayscale thật chỉ ở 17.8; R8 theo khuôn self-test có sẵn và cập nhật `scripts/guard-baseline.txt`.

### Quyết định kỹ thuật
- Skill dùng cho hai đợt **đã có sẵn trên máy**, không cần cài: `ui-ux-pro-max` tại `~/.claude/skills/ui-ux-pro-max` (739 dòng `SKILL.md` + `data/` + `scripts/`; đã xác nhận các guideline được PLAN dẫn — `color-not-only`, `number-tabular`, `blur-purpose`, `primary-action`, `focus-not-obscured`, `web-target-size` — có trong dữ liệu skill), cùng `frontend-design`, `impeccable`, `design-system`, `ui-styling`, `web-design-guidelines`, `ai-slop-detector`; `browser` là tool built-in của OpenCode.
- `fonttools 4.62.1` đã cài; `curl -sI https://fonts.gstatic.com/` trả mã HTTP (không phải lỗi mạng) → tải font offline khả thi.
- Số liệu hiện trạng đợt 17 đo lại (loại `__tests__`) khớp PLAN: `uppercase` 32, `tracking-w*` 31, `backdrop-blur` 19, `rounded-full` 25, `shadow-*` 45; `role="tablist"` 0 occurrence; `manualChunks.three` đã tồn tại.

### Kiểm chứng
- `python3 scripts/audit_workflow.py`: ALL CHECKS PASSED (PLAN 44 dòng ≤ 250, PROGRESS lean, plan hygiene thấy 2 đợt).
- `python3 scripts/guard_check.py`: `Guard check OK: 0 new violations (0 baselined)`.
- Chỉ sửa tài liệu, không đổi mã nguồn; chưa đánh `[x]` mục nào nên không chạy lại `check.sh`.

## 2026-11-19 — Ghi lại đánh giá workspace

### Thay đổi
- Tạo `docs/reviews.md` ghi lại đánh giá kiến trúc, vận hành, autosave, import, bảo mật, hiệu năng, kiểm thử và các giới hạn của lần review.
- Giữ nguyên thay đổi có sẵn trong `PLAN.md`; không sửa mã nguồn.

### Kiểm chứng
- Review gốc đã chạy `bash scripts/check.sh`: type-check, 34 test files / 317 tests, `cargo check`, frontend production build, workflow audit và drift guard đều đạt; có cảnh báo chunk JavaScript lớn và audit PLAN tại thời điểm đó.
- Đây là cập nhật tài liệu; không chạy lại test/build. `PLAN.md` hiện có section Đợt 16 nhưng chưa chạy lại workflow audit sau thay đổi đó.

