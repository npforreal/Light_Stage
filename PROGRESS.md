# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

## 2026-11-19 — Đợt 13: Sửa Stage 3D sau Review Hoàn Tất

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

