# progress log — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

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

## 2026-11-19 — Đợt 16.7: xác minh đóng đợt 16

### Kiểm chứng
- `bash scripts/check.sh` (đủ, không `--fast`) → **0 failure**, 1 warning (workflow audit: PROGRESS dài, sẽ archive).
- `python3 scripts/audit_workflow.py` → 0 failure; cảnh báo duy nhất là PROGRESS > 150 dòng trước khi archive.
- `python3 scripts/guard_check.py` → 0 new violations.
- User journey bằng browser thật trên `localhost:1420`:
  - Khóa → banner "Các lệnh gọi cue đã bị vô hiệu hóa"; Space/B/Esc không đổi cue (`live=false`, `LX: 0`).
  - Khóa → `?` mở Help, `i` mở/đóng Inspector (vẫn chạy).
  - Mở khóa → Space: `live=true`, `LX: 12`.
  - Import file hỏng (`acts:[null]`) → modal "Không mở được dự án | Invalid project data: acts[0] must be an object | Chọn lại file hoặc mở bản autosave…"; show hiện tại giữ nguyên; **0 console error**.
- `npm run tauri build -- --debug --bundles app` → build OK, `Light Stage.app` 29.86 MiB; mở app thật → tiến trình `Contents/MacOS/app` sống (PID 58246).
  - Ghi chú: bước đóng gói `.dmg` của `bundle_dmg.sh` bị treo do macOS chặn AppleScript/Finder automation (`Not authorized to send Apple events`), không phải lỗi app; đã build riêng bundle `app` để xác minh.
- Sau khi ghi log: chạy `python3 scripts/archive_logs.py` để đưa log đợt cũ sang `archive/`.

## 2026-11-19 — Đợt 16.6: hardening CSP (bỏ `script-src 'unsafe-inline'`)

### Thay đổi
- `src-tauri/tauri.conf.json` CSP:
  - Trước: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline';`
  - Sau: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; script-src 'self'; connect-src 'self' ipc: http://ipc.localhost`
- Giữ `style-src 'unsafe-inline'` (Tailwind/React ghi style inline, không thể bỏ nếu không refactor toàn bộ).
- Thêm `font-src 'self' data:` để sẵn cho font self-host ở 17.2.
- Thêm `connect-src 'self' ipc: http://ipc.localhost` cho IPC của Tauri v2.

### Quyết định kỹ thuật
- `index.html` không có `<script>` inline; Vite build phát module script ngoài → `script-src 'self'` đủ cho bản production.
- Không đánh `[x]` chỉ dựa vào lý thuyết: đã kiểm bằng bản build thật + CSP meta trên server tĩnh trước khi chốt.

### Kiểm chứng
- `npm run build` OK; inject đúng chuỗi CSP vào `dist/index.html`, phục vụ `python3 -m http.server 1431`.
- Browser thật mở `http://localhost:1431`: `document.title` đúng, `#root` có 1 con, header "Light Stage" render, **0 console error** (không có vi phạm CSP).
- `tauri build --debug` được kiểm ở 16.7 để chắc chắn webview Tauri không khác trình duyệt.

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

