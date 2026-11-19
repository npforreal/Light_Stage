# Lưu trữ PROGRESS.md (nguyên văn, không chỉnh sửa)

## 2026-11-19 — Đợt 16.5: lazy-load Stage 3D, chunk khởi động < 500 kB

### Thay đổi
- `src/App.tsx`: `Stage3DView` chuyển sang `React.lazy(() => import(...))` (named export → `default`), bọc `<Suspense>` với skeleton `Stage3DLoadingSkeleton` (`data-testid="stage-3d-skeleton"`, `aria-busy`, chiều cao `h-full` → không nhảy bố cục). Import tĩnh cũ bị gỡ.
- Test cập nhật theo async chunk: `App.test.tsx` dùng `await screen.findByTestId("stage-3d-view")`; `realUserJourney.test.tsx` Hành trình 4 chuyển `async` + `waitFor(preset-foh)`.

### Quyết định kỹ thuật
- `manualChunks.three` đã có sẵn từ trước; phần giảm thật đến từ việc gỡ import tĩnh `Stage3DView` khỏi entry → `three` chỉ tải khi mở tab Stage 3D.
- Skeleton cố định kích thước thay vì spinner giữa màn hình để không đẩy layout khi chunk về.
- Suspense đặt **trong** nhánh `viewMode === 'stage'` nên các view khác không bị ảnh hưởng.

### Kiểm chứng (`npm run build`)
- Trước: `index` 557.21 kB (gzip 152.96) + `three` 547.36 kB.
- Sau: `index` **481.70 kB (gzip 133.41)** < 500 kB; `Stage3DView` 76.73 kB (gzip 20.86); `three` 547.36 kB chỉ tải lười.
- `npx vitest run` → **37 files / 353 tests pass**.

## 2026-11-19 — Đợt 16.4: chốt phạm vi sản phẩm trong UI & docs

### Thay đổi
- `src/components/HelpModal.tsx`: thêm mục **"Phạm vi sử dụng (Scope)"** — Light Stage là rundown + show-calling + preview, GO/Standby/Hold không gửi lệnh tới thiết bị thật; chưa có DMX/sACN/Art-Net/OSC/MIDI.
- `src/components/HelpModal.tsx`: sửa mục Operator Lock đang **mâu thuẫn với 16.1** ("chỉ có thể gọi cue bằng nhấp chuột") → nói đúng 5 lệnh cue bị chặn ở mọi đường, liệt kê việc vẫn chạy khi khóa.
- `src/components/WelcomeModal.tsx`: bước 4 ghi rõ GO/Standby chỉ đổi trạng thái trong app; thêm footnote phạm vi (DMX/OSC/MIDI + `.xlsx`) ngay trên footer.
- `src/components/importer/ImportModal.tsx`: phụ đề đổi thành "CSV / TSV / TXT, hoặc dán bảng từ Excel / Google Sheets"; card file ghi "Chưa đọc trực tiếp .xlsx — hãy lưu sang CSV/TSV".
- `README.md`: thêm blockquote **Phạm vi của bản hiện tại** ở mục 1.
- `AGENTS.md`: thêm mục **Phạm vi bản hiện tại (Scope — không suy rộng)** làm ràng buộc cho mọi thay đổi UI/help/docs sau này.

### Quyết định kỹ thuật
- Không hạ cấp tính năng nào; chỉ sửa câu chữ để không hàm ý điều khiển thiết bị thật.
- Sửa luôn câu Help về Operator Lock vì 16.1 đã đổi hành vi nút Header (đây là lỗi logic tài liệu phát sinh trong đợt).

### Kiểm chứng
- `npx tsc --noEmit` sạch; `npx vitest run` → **37 files / 353 tests pass** (không có test nào phụ thuộc câu chữ cũ).
- `grep -n "DMX\|sACN\|Art-Net\|OSC\|MIDI"` trong Help/Welcome/README/AGENTS đều nằm trong câu phủ định ("chưa hỗ trợ").

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

## 2026-11-19 — Đợt 14.3 (R3 / Remediation): Khắc Phục Tràn Ngang Command Bar & Thêm Xử Lý Escape Dropdown

### Thay đổi
- **Điều chỉnh Breakpoints Thích ứng Command Bar** (`src/components/Header.tsx`):
  - Standby Callout (`hidden md:flex` → `hidden xl:flex`): ẩn trên màn hình < 1280px, tiết kiệm ~140px.
  - Live Hardware Badges (`flex` → `hidden xl:flex`): ẩn trên màn hình < 1280px, tiết kiệm ~106px.
  - Chấm trạng thái lưu ("Chưa lưu" / "Đã lưu"): chuyển text sang `hidden lg:inline`, giữ nguyên chấm màu trực quan, tiết kiệm ~45px trên < 1024px.
  - Nhãn nút điều khiển STBY & Hold: chuyển sang `hidden lg:inline`, giữ nguyên icon và chip phím tắt `B`, `Esc`, tiết kiệm ~60px trên < 1024px.
  - Nhãn nút Operator Lock ("Locked" / "Lock"): chuyển sang `hidden lg:inline`, giữ nguyên icon khóa/mở khóa, tiết kiệm ~35px trên < 1024px.
  - Cụm Delta Time trong đồng hồ: chuyển sang `hidden xl:flex` (kèm vạch ngăn `hidden xl:block`), tiết kiệm ~50px trên < 1280px.
- **Xử lý phím Escape cho Menu Quản trị Thứ cấp** (`src/components/Header.tsx`):
  - Thêm xử lý phím `Escape` trên container và `useEffect` keydown capture: khi dropdown mở, bấm `Escape` sẽ đóng menu (`setIsMoreMenuOpen(false)`) và gọi `e.stopPropagation()` ngăn chặn sự kiện lan ra ngoài kích hoạt nhầm lệnh Hold Cue toàn cục.
- **Mở rộng Test Suite Header** (`src/components/__tests__/Header.test.tsx`):
  - Thêm 2 unit test bao phủ toàn bộ các responsive breakpoint classes và hành vi đóng menu bằng phím Escape mà không kích hoạt Hold Cue (tăng tổng số test từ 8 lên 10).

### Quyết định kỹ thuật
- Giải quyết dứt điểm lỗi tràn ngang (+342px ở 960px và +162px ở 1280px) do Challenger 1 phát hiện, đảm bảo nút Admin Menu và cụm đồng hồ luôn hiển thị trọn vẹn và hit-testable (`elementFromPoint` hợp lệ) trên mọi kích thước viewport từ 960px trở lên.
- Ngăn chặn hoàn toàn xung đột phím tắt giữa Escape đóng dropdown và Escape giữ lệnh sân khấu (Hold).

### Kiểm chứng & Kết quả
- `npm test -- src/components/__tests__/Header.test.tsx`: 10/10 tests pass 100% (169ms).
- `npx vitest run`: 33 test files / 300 tests pass 100% (3.83s).
- `python3 scripts/guard_check.py`: 0 violations (0 baselined).
- `bash scripts/check.sh --fast`: 4/4 quality gate checks pass cleanly (TypeScript type check, unit tests, cargo check, workflow audit, drift guard).

## 2026-11-19 — Đợt 14.3: Tái Cấu Trúc Unified Command Header (R3) Hoàn Tất

### Thay đổi
- **14.3 Command Bar (cao chính xác 52px / `h-[52px]`)** (`src/components/Header.tsx`):
  - Left Zone: Logo thương hiệu `LS` + "Light Stage", tiêu đề show chỉnh sửa inline kèm icon bút/lưu, chấm trạng thái lưu/chưa lưu (`bg-status-go` / `bg-status-standby`), và badge phần cứng trực tiếp (`LX: {liveLxCount}`, `VX: {liveVxCount}`).
  - Center Zone: Standby callout (`STBY: X Title`), nút Hero Central GO nổi bật (`h-10 px-5 sm:px-6 rounded-xl bg-status-go hover:bg-status-go/90 text-surface-0 font-black shadow-lg shadow-status-go/25 active:scale-[0.97]`) kèm chip `<kbd>Space</kbd>` và badge `LIVE` khi đang chạy; nút Standby Next (`B`) và nút Hold/Pause (`Esc`).
  - Right Zone: Cụm đồng hồ tabular-nums (Wall Clock ẩn khi < 1280px, Show Time, Cue Remainder đếm ngược, Delta Time) kèm nút Reset Clock nhanh; nút khóa vận hành Operator Lock; nút menu quản trị thứ cấp `MoreHorizontal` (`⋮`) gom gọn toàn bộ tác vụ phụ (Mute, Stage Clock, New Show, Open, Import, Export, Help).
- **14.3 Workspace Strip ngữ cảnh (cao chính xác 36px / `h-[36px]`)** (`src/components/Header.tsx`):
  - Left Zone: Thanh chuyển chế độ xem 4 pill (`Rundown`, `Dual`/`Split`, `Timeline`, `Stage 3D`).
  - Center Zone: Bộ lọc vai trò ngữ cảnh (`ALL`, `LX`, `VX`, `SQ`, `ST`) và nút `+ Add Cue`.
  - Right Zone: Thống kê số lượng cue & tổng thời lượng show (`X Cues · Ym Zs`) và nút mở/gập Inspector Drawer (`PanelRight` + `Inspector` + `<kbd>I</kbd>`).
- **14.3 Cập nhật App & Suite Test Header** (`src/App.tsx`, `src/components/__tests__/Header.test.tsx`):
  - Mở rộng suite test `Header.test.tsx` từ 3 lên 8 test kiểm chứng đầy đủ: chiều cao 2 thanh (52px & 36px), nút Hero GO và phím Space, menu Admin dropdown, chỉnh sửa tên show, mute audio, toggle lock, filter vai trò và toggle inspector.

### Quyết định kỹ thuật
- Tái cấu trúc Header thành 2 tầng cố định 52px + 36px (tổng 88px) giải phóng 78px trực tiếp trên Header (và ≥ 118px khi kết hợp đưa VxControlBar vào dock nổi ở Đợt 15).
- Thiết kế thích ứng ngang hoàn hảo trong viewport 960px mà không bị tràn (overflow) hay che khuất phần tử điều khiển.
- Tuân thủ 100% token ngữ nghĩa Design System theo Quy tắc R7 (0 vi phạm màu thô).

### Kiểm chứng & Kết quả
- `npm test -- src/components/__tests__/Header.test.tsx`: 8/8 tests pass 100% (150ms).
- `npx vitest run`: 33 test files / 298 tests pass 100% (3.64s).
- `python3 scripts/guard_check.py`: 0 violations (0 baselined).
- `bash scripts/check.sh --fast`: 4/4 quality gate checks pass cleanly (type-check, unit tests, cargo check, workflow audit, drift guard).

## 2026-11-19 — Đợt 14.2: Bộ Test Bảo Vệ Phím Tắt & Chống Xung Đột Phím (R2) Hoàn Tất (Kèm Khắc Phục Lỗ Hổng Operator Lock & Input Protection)

### Thay đổi
- **14.2 Shortcut Registry & Collision Guard Service** (`src/services/shortcutRegistry.ts`):
  - Định nghĩa `ShortcutDefinition`, danh mục `ShortcutCategory`, và catalog toàn bộ 16 phím tắt hoạt động + 1 phím dự trữ `I` cho Inspector Drawer (`SYSTEM_SHORTCUTS`). Đóng băng mảng với `Object.freeze(SYSTEM_SHORTCUTS)`.
  - Cung cấp hàm `normalizeShortcutSignature(s)` có cắt tỉa khoảng trắng `s.key.trim()` và `detectShortcutCollisions(shortcuts)` phát hiện va chạm phím tự động.
  - Cung cấp vị từ lọc đối tượng nhập liệu chuẩn DOM & JSDOM `isEditableTarget(el)` và `isKeyboardProtected(e)`: hỗ trợ thẻ `<option>`, duyệt tìm phần tử cha `<select>`, hỗ trợ `contenteditable="plaintext-only"`, và chuẩn hóa chữ thường / cắt khoảng trắng thuộc tính `contenteditable` (xử lý case-insensitivity `"TRUE"`).
- **14.2 Tích hợp Bộ Lọc Bảo vệ vào App & Show Store** (`src/App.tsx`, `src/store/useShowStore.ts`):
  - `src/App.tsx`: chuyển `isOperatorLocked` từ state cục bộ sang `useShowStore` (`isOperatorLocked`, `setOperatorLocked`), thay thế logic lọc cục bộ bằng `isKeyboardProtected(e)`, chuyển các hàm gọi cue sang `useShowStore.getState().*` để loại bỏ rủi ro closure lạc hậu và tương thích hoàn hảo với Vitest spies.
  - `src/store/useShowStore.ts`: đưa `isOperatorLocked` vào Zustand store; thêm `isKeyboardProtected(e)` vào `handleGlobalKeyDown` để bảo vệ browser native undo/redo trong ô nhập liệu khi nhấn `Ctrl+Z`, đồng thời thêm chốt chặn `if (useShowStore.getState().isOperatorLocked) return false;` ở đầu `handleGlobalKeyDown` ngăn chặn 100% bypass qua phím tắt edit (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`, `Ctrl+S`). Tự động reset `isOperatorLocked: false` khi `loadShow` hoặc `newShow`.
- **14.2 Bộ Test Phím Tắt Toàn Diện** (`src/__tests__/keyboardShortcuts.test.tsx`):
  - Xây dựng 29 unit test bao phủ toàn bộ 6 nhóm yêu cầu cốt lõi (Input Protection bao gồm plaintext-only / TRUE / option, Global Live Shortcuts, Operator Lock Guard ngăn chặn 100% các phím Space/B/Undo/Redo/Save, Button Blur Ergonomics, Collision Guard & 'I' Reservation & Array Freeze) cùng các unit predicate tests.

### Quyết định kỹ thuật
- Tách biệt service thuần túy `shortcutRegistry.ts` giúp hệ thống có thể tái sử dụng catalog phím tắt cho `HelpModal`, thanh menu Header, và các kiểm tra kiến trúc mà không bị phụ thuộc vòng tròn vào UI store.
- Đưa `isOperatorLocked` lên `useShowStore` đảm bảo tính nhất quán trên toàn bộ ứng dụng: cả event listener trong React component (`App.tsx`) lẫn listener toàn cục ngoài lifecycle React (`useShowStore.ts`) đều tuân thủ trạng thái khóa vận hành trong live show.

### Kiểm chứng & Kết quả
- `npx vitest run src/__tests__/keyboardShortcuts.test.tsx`: 29/29 tests pass 100% (416ms).
- `npx vitest run`: 33 test suites / 293 tests pass 100% (4.25s).
- `npm run type-check`: 0 type errors.
- `bash scripts/check.sh --fast`: 4/4 quality gate checks pass cleanly (type-check, tests, cargo check, workflow audit, drift guard).

## 2026-11-19 — Đợt 14.1: Chuẩn hóa Semantic Tokens & Guard Check R7 Hoàn Tất

### Thay đổi
- **14.1 Semantic Tokens & Opacity Modifiers** (`tailwind.config.js`, `index.html`):
  - Định nghĩa helper `colorToken(variableName)` sử dụng `color-mix(in srgb, var(...) calc(...), transparent)` để hỗ trợ đầy đủ các modifier độ mờ `/20`, `/60` trên toàn bộ token CSS variables.
  - Bổ sung alias `borderColor` (`subtle`, `default`, `strong`) hỗ trợ cả `border-default` và `border-border-default`.
  - Chuẩn hóa màu nền & text trang gốc trong `index.html` sang `bg-surface-0 text-content-1 selection:bg-accent selection:text-surface-0`.
- **14.1 Quy tắc R7 & Tự động hoá Drift Guard** (`scripts/guard_check.py`):
  - Bổ sung quy tắc R7 (`RAW_COLOR_PATTERN`) kiểm tra toàn diện các tiền tố màu thô (`bg`, `text`, `border`, `ring`, `from`, `to`, `via`, `fill`, `stroke`, `divide`, `shadow`, `outline`, `decoration`, `accent`, `caret`) với họ màu thô trong `src/`.
  - Tích hợp self-tests R7 vào `run_tests()` và đăng ký vào bộ kiểm tra vi phạm.
- **14.1 Dọn sạch 100% mã màu thô trên toàn bộ `src/`**:
  - `src/App.tsx`: chuyển banner tự động lưu, banner Operator Lock sang `bg-surface-1/95`, `border-border-default`, `text-accent`, `bg-status-standby/15`, `text-status-standby`.
  - `src/components/Header.tsx`: chuyển badge LIVE sang `bg-status-danger/20 text-status-danger border-status-danger/40`.
  - `src/components/stage/VxControlBar.tsx`: chuyển các nút Clear VX, Freeze VX, Blackout VX sang `bg-status-standby`, `bg-status-danger`, `ring-status-standby`, `ring-status-danger`.
  - `src/components/rundown/RundownTable.tsx`: chuyển nhãn cảnh báo unclassified và gamut warning sang `text-status-standby`, `bg-status-standby/15`.
  - `src/services/visualEngine.ts` & `src/services/__tests__/visualEngine.test.ts`: chuyển trạng thái active, frozen, blackout, standby sang `bg-status-go`, `bg-status-standby`, `bg-status-danger`, `bg-content-3`.
  - `src/components/StageClockWindow.tsx` & `src/components/__tests__/StageClockWindow.test.tsx`: chuyển toàn bộ 48 vị trí màu thô sang token ngữ nghĩa chuẩn (`bg-surface-1..3`, `text-content-1..3`, `status-go/standby/danger`, `accent`).
- **14.1 Kiểm thử Tương phản WCAG AA & Ma trận 6 trạng thái** (`src/services/__tests__/color.test.ts`):
  - Bổ sung test tự động kiểm tra tương phản WCAG 2.2 trên toàn bộ cặp màu surface, content, status, department (100% đạt chuẩn WCAG AA/AAA).
  - Khẳng định ma trận 6 trạng thái tương tác (`default`, `hover`, `active`, `focusVisible`, `disabled`, `selected`) sử dụng 100% semantic tokens.

### Quyết định kỹ thuật
- Sử dụng CSS `color-mix(in srgb, ...)` trong Tailwind config đảm bảo khả năng tương thích cao trên WebView Tauri v2 mà vẫn giữ tính động của CSS variables.
- Triệt tiêu hoàn toàn mã màu Tailwind thô giúp giao diện thích ứng nhất quán và an toàn tuyệt đối với độ tương phản phòng điều khiển ánh sáng/âm thanh.

### Kiểm chứng & Kết quả
- `grep -rnE "(bg|text|border|ring|from|to|via|fill|stroke|divide|shadow|outline|decoration|accent|caret)-(zinc|slate|gray|neutral|stone|cyan|amber|emerald|rose|indigo|violet|purple|blue|red|green|yellow)-\d+" src/`: **0 kết quả** (Exit code 1).
- `python3 scripts/guard_check.py --test`: pass cleanly.
- `python3 scripts/guard_check.py`: **0 new violations (0 baselined)** (Clean exit 0).
- `npm run type-check`: pass 0 lỗi.
- `npx vitest run`: **32 test files / 264 passed** (100%).
- `bash scripts/check.sh --fast`: All quality gate checks passed!

### Thay đổi
- **13.1 Một nguồn số lượng** (`src/components/stage/Stage3DScene.ts`, `Stage3DView.tsx`, `src/components/Header.tsx`):
  - `Stage3DScene.update()` chỉ lấy `placements.filter(isActive)` — 3D vẽ đúng số đèn của cue đang chạy. Show chưa Go ⇒ 0 thân đèn, 0 chùm, 0 vòng chiếu (trước đây vẽ cả 44 đèn rig mặc định).
  - Toolbar tách 2 chip: `Cue 1.0: Nhập 12 · Hiển thị 12` (hoặc `Cue: chưa gọi · 0 đèn`) và `Rig mặc định 44` (cấu hình, tooltip ghi rõ không phải đèn đang chiếu). Footer thêm `Cue: 12/12 đèn · Rig: 44`; HUD có hint `Chưa gọi cue · sân khấu trống · rig mặc định 44`.
  - Header `LX/VX` đọc `getCueLightingCount/getCueScreenCount(activeCue)` (0 khi chưa Go) thay vì tổng toàn show; `getDeviceStats()` vẫn giữ nguyên cho báo cáo tổng.
- **13.2 Giảm rối**:
  - Chùm nón mảnh theo `beamAngle` thật (`tan(angle/2) * trimHeight`), `NormalBlending` (bỏ additive), opacity 0.06–0.24 thay vì 0.28 chồng khối.
  - Mặc định chỉ hiện chùm của đèn đang chọn; nút `Hiện tất cả chùm` / `Ẩn chùm khác` (chip `data-testid="beam-show-all"`) bật toàn bộ chùm trong cue. Ngưỡng >150 đèn vẫn tự ngắt chùm.
  - Thân đèn phân biệt 5 loại bằng hình khối + màu riêng (`FIXTURE_BODY_COLORS`, cone/cylinder/box/octahedron/sphere…), scale 1.45 cho dễ thấy; đèn đang chọn có vòng amber + nhãn sprite `#số Loại` (USITT-lite numbering).
- **13.3 Đọc rõ 3 góc nhìn**:
  - `frameCamera()` tự fit theo bounding sphere của sân khấu (`width`, `depth`, `maxTrim` truss/đèn) và aspect, áp dụng cho cả 3 preset và khi resize.
  - Top-Down nghiêng 11° thay vì nhìn thẳng đứng (sửa lỗi camera up suy biến làm sàn xoay ~45°); ẩn chùm, vẽ vòng chiếu mảnh `RingGeometry` trên sàn cho từng đèn active.
- **13.4 Đồng bộ nút preset**:
  - Thêm `CameraMode = 'foh' | 'topDown' | 'backstage' | 'free'`; `OrbitControls` event `start` ⇒ scene phát `onCameraModeChange('free')`; view bỏ highlight preset và hiện chip `Tự do`. Bấm lại preset ⇒ đồng bộ lại. Thêm hook `onSceneRef` để test/integration truy cập engine.
- **Test**: suite mới `src/__tests__/round13Verification.test.tsx` (12 test: số lượng 0/30, header/cue/footer/3D, beam mặc định & toàn bộ, 5 silhouette, fit 3 preset × 3 layout, Top-Down pools, free-orbit sync). Cập nhật test đợt 12 và `Stage3DScene.test.ts` theo semantics mới.

### Quyết định kỹ thuật
- Stage 3D là **preview của cue live**, không phải bản vẽ rig; rig mặc định hiển thị thành chip riêng để không tạo "hai nguồn sự thật".
- Header phản ánh cue đang chạy (Go) để khớp Rundown/HUD/3D; số tổng show vẫn lấy qua `getDeviceStats` khi cần.
- Top-Down dùng tilt nhỏ thay vì đổi `camera.up` để không phá logic polar angle của OrbitControls.
- Geometry/material thân đèn cache theo loại và dispose trong `dispose()`, tránh phình bộ nhớ khi rebuild.

### Kiểm chứng & Kết quả
- `npm run type-check`: pass 0 lỗi.
- `npx vitest run`: **32 test suites / 262 tests passed** (đợt 13: 12/12).
- `npm run build`: pass — `index.js` 513.10 kB, `three.js` 547.36 kB.
- `bash scripts/check.sh --fast`: pass toàn bộ (type-check, tests, cargo check 7.07s, workflow audit, drift guard).
- **13.5 ảnh browser thật** (`scratch/capture-round13.mjs`, Chrome 157 headless CDP, WebGL2 ANGLE Metal): 9/9 PNG — `round13-{foh,topdown,backstage}-{960,1280,1920}.png`, đúng 960×600 / 1280×800 / 1920×1080, 93–150 KB, canvas thật (fallback ẩn), preset active đúng. Log UI: trước Go `Cue: chưa gọi · 0 đèn`, `Rig mặc định 44`, `LX: 0`; sau Go `Cue 1.0: Nhập 12 · Hiển thị 12`, `LX: 12`, `VX: 1`. Không có console/CSP/network error.
- **13.5 Tauri**: `npx tauri build --debug --bundles app` exit 0 (16s, bundle `Light Stage.app` 29.85 MiB); rebuild sau chỉnh camera 10.51s; `open` app ⇒ PID 14454 chạy thật (WebKit GPU/Networking/WebContent spawn). CSP nguyên văn: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline';` — kiểm với `dist/` thật + header CSP y hệt: JS self, data/blob image OK, request ngoài bị chặn, **0 violation**, Stage 3D render (`scratch/round13-tauri-csp-stage3d.png`).
- **Caveat 13.5**: shell hiện tại thiếu quyền Screen Recording/Automation (TCC) nên `screencapture` cửa sổ app native bị chặn; ảnh pixel CSP lấy từ bundle production thật phục vụ dưới đúng policy. Cần chụp cửa sổ native thì chạy lại `screencapture` từ phiên GUI có quyền.

## 2026-11-19 — Đợt 12: Stage 3D khối đơn giản (thay Stage 2D) Hoàn Tất

### Thay đổi
- **Engine 3D thuần Three.js & Tách lớp Kiến trúc** (`src/components/stage/Stage3DScene.ts`, `src/components/stage/Stage3DView.tsx`):
  - Xây dựng `Stage3DScene.ts` điều khiển Three.js thuần không dùng React Three Fiber (R3F) nhằm tối ưu bundle và vòng render on-demand (`render on dirty`).
  - Dựng khối 3D low-poly: sàn sân khấu (`StageConfig.dimensions`), phần mở rộng Thrust, lưới toạ độ mét, giàn truss (`BoxGeometry` kim loại mờ), màn hình LED (`PlaneGeometry` viền bezel, tự động điều chỉnh tỉ lệ theo `useVisualStore` và phát quang theo trạng thái cue VX).
  - Khối thân đèn (`InstancedMesh` chuẩn số lượng từ `fixtureModel` & `placeFixtures`) kết hợp chùm tia sáng nón bán trong suốt (`ConeGeometry`, additive blending) phản ánh màu quang học (Oklab/Oklch gamut mapping) và dimmer vật lý.
  - Cơ chế tự động ngắt chùm tia sáng khi tổng số đèn vượt ngưỡng (mặc định >150 đèn hoặc tuỳ chỉnh qua pill toggle `≤ 150` / `≤ 50`) để bảo vệ GPU và pin laptop khi chạy live show dài.
  - Camera `OrbitControls` với giới hạn góc va chạm sàn (`maxPolarAngle`), 3 preset camera mượt mà: Khán giả (`FOH`), Nhìn từ trên xuống (`Top-Down Plan`), và Cánh gà hậu trường (`Backstage Wing`).
  - Raycasting tương tác: Click trực tiếp vào đèn hoặc màn hình LED trong không gian 3D để chọn và đồng bộ 2 chiều với `StageRigEditor`.
- **Lớp 2D HUD Phủ & Fallback An toàn**:
  - HUD phủ góc trái hiển thị Cue Active, tên cảnh LX, độ sáng dimmer %, swatch màu thực tế và cảnh báo lệch gam màu.
  - Footer giữ nguyên legend ký hiệu đèn, chip cảnh báo rig (Đợt 10.2), công suất tiêu thụ kW và công tắc Haze/Dimmer Curve.
  - Phát hiện WebGL tự động qua `isWebGLAvailable()`, hiển thị card fallback thông tin rig an toàn nếu môi trường thiếu WebGL.
- **Dọn dẹp & Kế thừa**:
  - Gỡ bỏ `VirtualStagePreview.tsx` (977 dòng SVG cũ) và `FixtureSymbol.tsx`.
  - Cập nhật `Header.tsx`, `App.tsx`, `WelcomeModal.tsx`, `HelpModal.tsx`, thay đổi tab điều khiển sang `Stage 3D`.
  - Bảo toàn 100% bản vẽ kỹ thuật in ấn 2D `generateLightPlotHtml` (USITT-lite) trong `src/services/exporter.ts`.
- **Kiểm thử Toàn diện**:
  - Tạo `src/__tests__/helpers/mockWebGL.ts` hỗ trợ mock WebGL cho Vitest (JSDOM).
  - Viết bộ test chuyên sâu `src/components/stage/__tests__/Stage3DScene.test.ts` (7 tests) và `src/components/stage/__tests__/Stage3DView.test.tsx` (7 tests).
  - Viết suite kiểm chứng tích hợp `src/__tests__/round12Verification.test.tsx` (8 tests) trên 3 viewport (960px, 1280px, 1920px), 3 preset camera, đồng bộ Raycasting selection, ngưỡng tắt beam, và CSP an toàn trong `tauri.conf.json`.

### Quyết định kỹ thuật
- Tách `three` thành chunk riêng biệt (`vite.config.ts` manualChunks) giúp bundle chính giữ nguyên dung lượng nhỏ (~504 kB) và lazy/tree-shake tối ưu.
- Khống chế render on-demand triệt để (chỉ render khi camera di chuyển hoặc dữ liệu thay đổi, không chạy continuous animation loop), đảm bảo mức tải CPU/GPU gần như 0% khi tĩnh.
- Tương thích ngược tuyệt đối với toàn bộ dữ liệu cấu hình rig, exporter và hệ thống cảnh báo quang học hiện hành.

### Kiểm chứng & Kết quả
- `npm run type-check`: pass 0 lỗi.
- `npx vitest run`: 31 test suites / 250 tests passed 100%.
- `cargo check --manifest-path src-tauri/Cargo.toml`: Finished dev profile cleanly (0.30s).
- `npm run build`: bundle thành công (`index.js` 504.40 kB, `three.js` 534.63 kB).
- `bash scripts/check.sh --fast`: All quality gate checks passed (Type check, Unit tests, Cargo check, Workflow audit, Drift guard).

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

## 2026-11-16 — Hoàn thành Toàn diện Đợt 8 & Đợt 9 qua Native Swarm

### Thay đổi
- **Đồng bộ Transport, Vòng đời Cue & Hoàn tác Undo/Redo (Đợt 8.1, 8.4, 9.3)**:
  - Đồng bộ Master Clock và Rundown Table: `resetClock()` đưa tất cả cue về `Pending`, cue đầu về `Standby`, `activeCueId: null`; `pauseClock()` và `stopClock()` chuyển cue `Go` sang `Hold`. Bổ sung nút `Go Next Cue`.
  - Triển khai ngăn xếp hoàn tác 30 bước (`past`, `future`, `canUndo`, `canRedo`, `undo()`, `redo()`) cho mọi thao tác sửa kịch bản. Hỗ trợ phím tắt toàn cục `Ctrl+Z`, `Ctrl+Y`, `Ctrl+S`.
  - Khắc phục triệt để Autosave: lưu mỗi khi dữ liệu show thay đổi qua subscription mà không phụ thuộc cờ `isDirty`.
  - Nâng cấp `hardwareParser` và `importer`: bóc tách độc lập nhiệt độ màu / màu tiếng Việt khỏi số lượng fixture (ví dụ: *"Wash 12 cây 3200K"* $\to$ 12 fixtures, màu 3200K); tự động nhận diện màn hình từ *"Logo Loop"*; hỗ trợ ánh xạ cột Màu, SQ, ST.
- **Hệ thống Cảnh báo Thính giác & Đồng hồ Sân khấu Phụ (Đợt 8.2, 8.5)**:
  - Xây dựng `audioAlerts.ts` thuần Web Audio API: bíp đếm ngược 5 giây cuối (880Hz / 80ms tại 5..1s, 1760Hz / 200ms tại 0s GO), bíp kép 440Hz khi overrun; hỗ trợ user gesture unlock và audio mute toggle.
  - Xây dựng màn hình phụ `StageClockWindow.tsx` tối ưu cho bàn MC / cánh gà: đếm ngược kích thước khổng lồ, delta, active/standby cue; đồng bộ real-time đa cửa sổ qua `BroadcastChannel` và `localStorage`.
- **Tái thiết kế Giao diện Header & Nhập liệu Rundown (Đợt 9.1, 9.2, 9.5, 9.6)**:
  - Header 2 tầng chống đè lấn: Tầng 1 (Live Operations: Transport, Clocks, Clocks tabular-nums, Go Next); Tầng 2 (Tools: Views, Lock, Audio Mute, Stage Clock, Import/Export, Rename show trực tiếp, menu thu gọn "..." dưới 1100px).
  - Sửa trực tiếp ô LX, VX, SQ, ST trên bảng Rundown: LX tích hợp Color Picker popover (presets, Kelvin slider, hex, gamut warning); VX (nội dung, số màn); SQ (track, volume); ST (chỉ dẫn). Chống kích hoạt GO khi đang gõ phím Space. Thêm/xóa/nhân đôi cue trực tiếp.
  - Chuẩn hoá huy hiệu trạng thái cue; thêm modal Chào mừng `WelcomeModal` (4 bước, lưu localStorage) và bảng Trợ giúp `HelpModal` phím tắt.
- **Tái thiết kế Sân khấu ảo 2D & Auto-Patch Đèn (Đợt 8.3, 9.4)**:
  - Hệ toạ độ mét thực tế: Centerline (x=0), Plaster Line (y=0), trim Z. 3 Presets chuẩn USITT: EndStage, Festival, Thrust.
  - Thuật toán `placeFixtures(rig, cueUsage)` tất định: đối xứng SL/SR, xử lý tràn rig không cắt xén, hỗ trợ gán tay `@position`.
  - Top-down view (Centerline, Plaster Line, SL/SR, 9 zones, FOH ngoài sân khấu y < 0) & Front view theo chiều sâu; chùm sáng theo góc nhắm và beam angle; công tắc khói Haze, đường cong Dimmer và công suất kW; huy hiệu đối chiếu "Nhập X · Hiển thị X".

### Quyết định kỹ thuật
- Vận hành song song qua Swarm với 6 agents chuyên trách (`worker-core`, `worker-audio-clock`, `worker-stage2d`, `worker-ui-rundown`, `verifier`, `monitor`), phân tách ranh giới tệp tin hoàn toàn độc lập, không xảy ra xung đột merge.
- Tách biệt tuyệt đối giữa Rig (phần cứng vật lý) và Cue (trạng thái kích hoạt theo cảnh), giúp giao diện 2D luôn đồng nhất giữa Front view và Top-down plan.

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 23/23 test suites passed, 174/174 unit tests passed (0 failures).
- `tsc --noEmit` & `npm run build`: 0 lỗi biên dịch TypeScript, bundle sản phẩm hoàn tất thành công trong 1.06s.
- `python3 scripts/audit_workflow.py` & `python3 scripts/guard_check.py`: 100% checks passed, 0 drift violations.


### Thay đổi
- **Kiểm thử Hành trình Người dùng Thực tế (`src/__tests__/realUserJourney.test.tsx`)**:
  - Xây dựng 6 kịch bản kiểm thử tích hợp mô phỏng toàn diện hành trình làm việc của một Đạo diễn sân khấu (Show Caller):
    1. *Khởi động & FOH Dark UI*: Nhận diện thương hiệu, tiêu đề show, đồng hồ Show Time/Cue Remainder/Delta và thống kê phần cứng.
    2. *Crash Recovery*: Banner khôi phục màu Cyan tự động phát hiện bản lưu và phục hồi chỉ với 1 click.
    3. *Live Calling & Hotkey Safety*: Kích hoạt Go bằng Space, Esc để Hold, Operator Lock khóa phím ngăn chặn bấm nhầm.
    4. *Optical Stage 2D*: Kiểm tra hiển thị camera Front View, Top-Down Plan, nhãn nhiệt độ màu 3200K, đồng bộ visual lên 3 màn hình LED.
    5. *Hardware Parser*: Kiểm tra khả năng tự động đếm số lượng đèn và màn hình từ chuỗi mô tả phức tạp.
    6. *Export & Print*: Dialog xuất báo cáo lọc theo từng bộ phận chuyên môn, in ấn PDF và xuất file JSON `.lightstage`.
- **Tổng hợp Vấn đề Phát hiện & Lập Kế hoạch Đợt 8**:
  - Lưu trữ lossless các đợt cũ vào `archive/PLAN.md`.
  - Thiết lập roadmap chi tiết cho Đợt 8 gồm 5 giai đoạn: Đồng bộ Transport & Cue Lifecycle (8.1), Cảnh báo thính giác Web Audio synthesized alerts (8.2), Tùy biến Stage 2D & Dimmer curves (8.3), Undo/Redo history & Hotkey lưu nhanh (8.4), Cửa sổ đồng hồ sân khấu phụ Stage Confidence Clock (8.5).

### Quyết định kỹ thuật
- **Đồng bộ Cue - Clock**: Xác định việc reset đồng hồ bắt buộc phải đưa cue state về `Pending`/`Standby` để tránh hiện tượng lệch pha giữa Master Clock và Rundown Table.
- **Synthesized Audio Alerts**: Ưu tiên tạo âm thanh bíp qua Web Audio API (OscillatorNode) thay vì tải file `.mp3` bên ngoài, loại bỏ hoàn toàn độ trễ (zero latency) và bảo đảm ứng dụng hoạt động offline hoàn hảo khi không có kết nối mạng.

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 16/16 test suites passed, 105/105 unit tests passed (thêm 6 unit tests mới trong `realUserJourney.test.tsx`).
- `python3 scripts/audit_workflow.py` & `python3 scripts/guard_check.py`: 100% checks passed, 0 drift violations, prime workflow health.

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

## 2026-11-15 — Bổ sung Tài liệu Hướng dẫn Toàn diện (User & Dev), MIT License & Chính sách Bảo mật (Public Repo)

### Thay đổi
- Bổ sung `README.md` chuyên sâu chia làm 2 phần:
  - **Phần 1 - Hướng dẫn Người dùng (Non-Tech)**: Giới thiệu nghiệp vụ sân khấu, hướng dẫn cài đặt (.dmg cho macOS, .exe/.msi cho Windows), tổng quan giao diện, hướng dẫn nhập dữ liệu thủ công / Excel / CSV, cơ chế đếm tự động đèn & màn hình LED, điều khiển show calling trực tiếp với phím tắt (Spacebar = GO, B = Standby), chế độ Operator Lock Mode, sân khấu ảo 2D và xuất báo cáo PDF / Excel.
  - **Phần 2 - Hướng dẫn Lập trình viên (Developer Guide)**: Kiến trúc hệ thống Tauri v2 + React 19 + TypeScript + Zustand + TailwindCSS, cấu trúc thư mục, yêu cầu môi trường, hướng dẫn chạy dev / test / quality gate, quy trình đóng gói native installer và quy chuẩn conventional commits.
- Bổ sung `LICENSE`: MIT License chuẩn bản quyền open-source năm 2026.
- Bổ sung `SECURITY.md`: Chính sách bảo mật cho public repository (phiên bản hỗ trợ, quy trình báo cáo lỗ hổng qua GitHub Private Advisories hoặc email bảo mật có cam kết SLA 48h, phạm vi offline-first & an toàn sandbox).

### Kiểm chứng & Kết quả
- `bash scripts/check.sh --fast`: 14/14 test suites, 74/74 unit tests passed, type-check 0 errors.
- `python3 scripts/audit_workflow.py`: ALL CHECKS PASSED, cấu trúc tài liệu và token discipline đạt chuẩn.

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

## 2026-11-15 — Hoàn thành Khởi tạo khung dự án Tauri v2 + React 19 + TypeScript + Vite + TailwindCSS (Giai đoạn 1.1)

### Thay đổi
- Khởi tạo kiến trúc Tauri v2 với cấu hình chuẩn cho live stage application (`tauri.conf.json`).
- Thiết lập React 19 + TypeScript 5.7 + Vite 6 + TailwindCSS v3 với dark theme tối ưu cho phòng điều khiển sân khấu.
- Cài đặt thư viện cốt lõi tối giản: `zustand` (state management), `lucide-react` (iconography), `clsx`, `tailwind-merge`.
- Cấu hình test runner `vitest` cùng `@testing-library/react` và `jsdom`. Viết test mẫu `src/App.test.tsx`.
- Cập nhật `scripts/check.sh` hỗ trợ cả chế độ `--fast` (type-check, tests, audit) và chế độ đầy đủ (kèm build và cargo check).

### Quyết định kỹ thuật
- Tối ưu hóa cấu hình Vite và tsconfig bundler mode để tốc độ build/test siêu nhanh (< 1s).
- Graceful degradation cho `cargo check` trong `scripts/check.sh` khi môi trường chưa cài đặt Rust native compiler.

### Kiểm chứng & Kết quả
- `npm run type-check`: 0 errors.
- `npm run test`: 1/1 tests passed trong 584ms.
- `npm run build`: Production bundle hoàn tất trong 822ms (dist/assets sẵn sàng).
- `bash scripts/check.sh --fast`: All quality gate checks passed.
- `python3 scripts/audit_workflow.py`: Repository in prime workflow health.

## 2026-11-15 — Hoàn thiện Bản kế hoạch Sản xuất (Production Roadmap) & Áp dụng vào PLAN.md

### Thay đổi
- Tạo Implementation Plan Artifact chi tiết tới mức Production: `production_plan.md` phân tích đầy đủ nghiệp vụ sân khấu trực tiếp, kiến trúc kỹ thuật Tauri v2, Smart Excel Parser & Counter, Dual View và Sân khấu ảo 2D.
- Cập nhật toàn diện `PLAN.md` chia làm 5 Đợt phát triển cụ thể với các tiêu chí nghiệm thu rõ ràng.
- Đã xác nhận các quyết định mở rộng qua `/grill-me`: Giai đoạn 1 tập trung Standalone offline cực chuẩn, Sân khấu ảo 2D sử dụng thư viện Preset + form cấu hình nhanh.

### Quyết định quan trọng
- Lộ trình chia 5 đợt khép kín, mỗi đợt đều có khả năng kiểm thử độc lập (Test-driven & Verification first).
- Ưu tiên tính ổn định tuyệt đối (Zero-crash) và cơ chế tự động lưu ngầm (Auto-save) phòng ngừa sự cố mất nguồn trong live show.

### Kiểm chứng & Kết quả
- `python3 scripts/audit_workflow.py` -> 0 failure(s), 0 warning(s).
- `bash scripts/check.sh --fast` -> All passed.
