# progress log — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

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

