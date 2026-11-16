# Kế hoạch phát triển dự án — Light Stage (Production Roadmap)

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).
> **Quy tắc chung cho mọi đợt lớn:** trước khi đóng đợt phải có một giai đoạn "Test như người dùng thật" bằng built-in browser (nhẹ, không cần build Tauri), chạy theo `docs/USER_TEST_SCRIPT.md`. Lỗi tìm được ghi vào PLAN.md (đợt hiện tại nếu chặn đóng đợt, ngược lại đợt kế). Không đánh `[x]` đóng đợt khi còn lỗi mức Critical/High.

## Đợt 5: Hệ thống Điều phối Thời gian, Phím tắt Sân khấu & Xuất Báo cáo

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 5.1: Bộ điều khiển Thời gian & Phím tắt Sân khấu, Giai đoạn 5.2: Xuất Báo cáo (PDF & Excel) & Đóng gói Production


### Mục tiêu đợt
Hoàn thiện hệ thống điều khiển vận hành show (phím tắt, đồng hồ delta time), tính năng xuất báo cáo chuyên nghiệp và đóng gói bản phát hành.

## Đợt 7: Thiết kế lại Màu UI & Mô phỏng Ánh sáng Chính xác (Color System)

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 7.1: Lõi khoa học màu (`src/services/color.ts`), Giai đoạn 7.2: Mô hình dữ liệu màu đèn (tương thích ngược), Giai đoạn 7.3: Hệ token màu & refactor UI, Giai đoạn 7.4: Stage 2D hiển thị đèn chính xác, Giai đoạn 7.5: Tài liệu & đóng đợt

## Đợt 8: Nâng cao Trải nghiệm Thực tế, An toàn Vận hành & Cảnh báo Sân khấu (Live Usability & Reliability)

### Mục tiêu đợt
Khắc phục triệt để các vấn đề phát hiện từ kiểm thử người dùng thực tế và code review:
(1) Đồng bộ hoàn hảo giữa Master Clock Transport và trạng thái Cue trên Rundown Table khi Reset/Stop/Pause.
(2) Tích hợp hệ thống cảnh báo thính giác (Audio Cues & Metronome Beep) bằng Web Audio API không phụ thuộc file ngoài.
(3) Mở rộng tùy biến Sân khấu ảo 2D: cấu hình số lượng màn hình LED, góc beam (Spot/Wash/Beam) và chọn dimmer curve.
(4) Hỗ trợ lịch sử hoàn tác Undo / Redo (`Ctrl+Z`, `Ctrl+Y`) và phím tắt lưu nhanh `Ctrl+S`.
(5) Cung cấp cửa sổ phụ hiển thị đồng hồ sân khấu khổng lồ (Stage Confidence Clock Window) phục vụ cánh gà và bàn MC.

### Rủi ro & quyết định cần chốt
- **Web Audio Context Autoplay Policy**: Trình duyệt có thể chặn âm thanh nếu chưa có tương tác chuột/phím đầu tiên của người dùng $\to$ Phải khởi tạo AudioContext khi người dùng bấm phím hoặc click lần đầu (user gesture unlock).
- **Zustand Undo/Redo Middleware**: Cần giới hạn độ sâu của undo stack (ví dụ: tối đa 30 bước) để tránh phình bộ nhớ RAM trong các show dài hàng trăm cue.
- **Tauri Multi-Window vs Browser Pop-out**: Khi chạy trong Tauri desktop app thì dùng `WebviewWindow`, khi chạy trên nền web fallback sang `window.open` với layout chuyên biệt `/stage-clock`.

### Kế hoạch chi tiết

### Giai đoạn 8.1: Đồng bộ Trạng thái Đồng hồ Transport & Cue Lifecycle
- [x] 8.1.1 Khi bấm `Reset Clock` (`resetClock`), tự động đưa toàn bộ cue về trạng thái ban đầu (`Pending`) và đặt cue đầu tiên về `Standby`, `activeCueId` về `null`.
- [x] 8.1.2 Khi bấm `Pause Clock` (`pauseClock`), cue đang `Go` tự động chuyển sang trạng thái `Hold` trên Rundown Table.
- [x] 8.1.3 Khi bấm `Stop Clock`, đồng hồ dừng và cue đang chạy được chuyển về `Hold` hoặc hoàn thành tùy cấu hình show.
- [x] 8.1.4 Bổ sung nút "Go Next Cue" ngay trên thanh Header cạnh cụm Transport để người dùng có thêm lựa chọn thao tác nhanh bằng chuột.
- [x] 8.1.5 Viết unit test cho toàn bộ luồng đồng bộ transport trong `src/store/__tests__/useShowStore.test.ts` và `useClockStore.test.ts`.
- Kiểm chứng: `npm test`, kiểm tra tương tác thực tế giữa Header transport và RundownTable.

### Giai đoạn 8.2: Hệ thống Cảnh báo Thính giác Sân khấu (Web Audio Synthesized Alerts)
- [x] 8.2.1 Xây dựng service `src/services/audioAlerts.ts` sử dụng thuần Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`), không dùng file audio ngoài.
- [x] 8.2.2 Cảnh báo đếm ngược 5 giây cuối: phát âm bíp thanh 880Hz (duration 80ms) tại các giây 5, 4, 3, 2, 1 và âm bíp cao 1760Hz (duration 200ms) tại đúng thời điểm GO.
- [x] 8.2.3 Cảnh báo Overrun: phát âm bíp kép trầm 440Hz báo hiệu tiết mục đã vượt quá thời lượng dự kiến.
- [x] 8.2.4 Thêm công tắc Bật/Tắt âm thanh cảnh báo (Audio Mute/Unmute Toggle) trên Header cạnh nút Operator Lock.
- [x] 8.2.5 Viết unit test mock `AudioContext` bảo đảm service an toàn khi chạy trên môi trường không có sound card.
- Kiểm chứng: chạy test unit và kiểm tra phát âm thanh trên trình duyệt.

### Giai đoạn 8.3: Tùy biến Sân khấu Ảo 2D & Đổi Dimmer Curve
> Lưu ý: 8.3.1 và 8.3.3 (cấu hình màn LED, góc chùm) trùng với **9.4 mới** (thiết kế lại Stage 2D theo chuẩn bố trí đèn); nên làm trong 9.4, không làm hai lần.
- [x] 8.3.1 Nâng cấp `VirtualStageConfig`: cho phép thêm/xóa/sửa màn hình LED (LED Floor, LED Cong, LED Backdrop) trong modal cấu hình Stage.
- [x] 8.3.2 Tích hợp lựa chọn Dimmer Curve trong cài đặt show (`square` $I^2$, `linear`, `s-curve`).
- [x] 8.3.3 Cho phép tùy biến góc chùm sáng cho từng giàn truss (`Spot 15°`, `Beam 5°`, `Wash 45°`).
- [x] 8.3.4 Bổ sung hiển thị thông số công suất ước tính (kW) dựa trên số lượng fixture và độ sáng dimmer thực tế.
- [x] 8.3.5 Viết unit test trong `src/components/__tests__/VirtualStagePreview.test.tsx`.
- Kiểm chứng: kiểm tra hiển thị sân khấu 2D với các giàn đèn và góc chùm khác nhau.

### Giai đoạn 8.4: Quản lý Lịch sử Hoàn tác (Undo / Redo) & Phím tắt Nhanh
- [x] 8.4.1 Triển khai undo/redo state history cho các thao tác sửa kịch bản (đổi tên cue, sửa duration, chuyển màu, thêm/xóa cue).
- [x] 8.4.2 Bắt phím tắt toàn cục: `Ctrl+Z` / `Cmd+Z` (Undo), `Ctrl+Shift+Z` / `Cmd+Shift+Z` hoặc `Ctrl+Y` (Redo).
- [x] 8.4.3 Phím tắt `Ctrl+S` / `Cmd+S`: ngăn chặn hành vi mặc định của trình duyệt và kích hoạt lưu dự án / xuất file `.lightstage`.
- [x] 8.4.4 Viết unit test kiểm chứng undo/redo trong `src/store/__tests__/useShowStore.test.ts`.
- Kiểm chứng: `npm test`, thử nghiệm sửa kịch bản và undo/redo liên tục.

### Giai đoạn 8.5: Cửa khấu Phụ Màn hình Sân khấu (Stage Confidence Clock Display)
- [x] 8.5.1 Tạo view chuyên biệt `StageClockWindow` tối giản, chữ to kích thước lớn hiển thị: Tên tiết mục hiện tại, thời gian đếm ngược khổng lồ, cue kế tiếp và Delta.
- [x] 8.5.2 Nút "Open Stage Clock" trên Header mở cửa sổ phụ qua `window.open` hoặc `WebviewWindow` của Tauri v2.
- [x] 8.5.3 Đồng bộ thời gian và trạng thái thời gian thực giữa cửa sổ chính và cửa sổ phụ qua BroadcastChannel hoặc LocalStorage events.
- [x] 8.5.4 Viết unit test và cập nhật tài liệu `README.md`.
- Kiểm chứng: `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`.


### Giai đoạn 8.6: Test như người dùng thật (built-in browser)
- [ ] 8.6.1 Chạy kịch bản A (người mới), B (gọi show live) và các mục thuộc Đợt 8 trong `docs/USER_TEST_SCRIPT.md`: Reset/Pause/Stop đồng bộ cue, cảnh báo âm thanh (sau lần tương tác đầu), Undo/Redo, Ctrl+S, mở Stage Clock Window và đồng bộ với cửa sổ chính.
- [ ] 8.6.2 Ghi kết quả vào PROGRESS.md (ảnh/số đo), lỗi mới ghi vào PLAN.md theo mức Critical/High/Medium/Low; sửa hết Critical/High trước khi đóng đợt.
- Kiểm chứng: báo cáo test có ngày, viewport, từng kịch bản đạt/không đạt.

## Đợt 9: Khắc phục Lỗi UX từ Kiểm thử Người dùng Thật & Hướng dẫn Sử dụng (First-Run Experience)

> Nguồn: phiên test "người dùng mới" trên built-in browser ngày 2026-11-16 (viewport 960×640 và 1280×800, bản dev sau Đợt 6–7; Đợt 8 chưa làm). Không có lỗi console. Việc đã thấy chạy tốt: GO/Space, remainder đúng, Operator Lock, nút Open/Import/Export, Stage 2D có nhãn 3200K, banner khôi phục autosave, import CSV tiếng Việt, chống nhầm "Spare cable".
> Mức: **[C]** nghiêm trọng, **[H]** cao, **[M]** trung bình, **[L]** thấp.

### Mục tiêu đợt
Người lạ mở app lần đầu phải tự: tạo show, nhập nội dung cho từng cue (LX/VX/SQ/ST + màu), gọi cue bằng chuột hoặc phím, hiểu từng nút nhờ hướng dẫn trong app, mà không phải đoán, không bị nút che, không mất dữ liệu.

### Phát hiện từ test
**Lỗi chức năng**
- [C] Rundown **không cho sửa** ô LX/VX/SQ/ST: double-click chỉ sửa Title và Duration. Cue mới thêm hiện `— — — —` và cách duy nhất có nội dung là import CSV. Không có UI nhập màu LX dù Đợt 7.2.5 hứa (nhãn "Cyan" mặc định không bấm được).
- [C] Ở 960×600 (cỡ cửa sổ nhỏ nhất của app) các nút Pause/Stop/Reset **bị header che**, `elementFromPoint` trả về phần tử khác; cụm Wall Clock/Show Time/Cue Remainder/Delta bị View switcher đè. Ở 1280 các khối chồng nhau 437–786 / 453–585 / 597–936 px. Đợt 6.3 chưa đạt.
- [C] Autosave **không lưu sau Import/Open/New**: `App.tsx:83` chỉ lưu khi `isDirty`, mà `loadShow` đặt `isDirty:false`. Test: import 3 cue → reload → banner khôi phục "2 cues" (bản trước import).
- [H] Parser: "Wash 12 cây 3200K" cho **1 fix** (đuôi 3200K phá nhận số lượng); "Logo Loop" cho **0 screens**; cột "Đỏ" trong ô Ánh sáng bị bỏ qua, chip vẫn là Cyan (importer chưa đọc màu tên tiếng Việt).
- [H] Import chỉ ánh xạ LX/VX; cột Âm thanh được nhận nhưng không có ô chọn SQ/ST và Màu; mặc định "Thay thế toàn bộ" dễ xoá nhầm (đã có confirm nhưng chưa có preview diff).
- [H] Stage 2D **bố trí đèn sai logic** (xem 9.4 và `docs/STAGE_LIGHTING_LAYOUT.md`) và **không phản ánh số lượng thật**: cue "1 fix" vẫn sáng ~35 beam; cue "0 screens" vẫn bật cả 3 màn "Logo Loop LIVE FEED ACTIVE". Config chỉ bật/tắt hiển thị, số lượng "12x Beam 350W" là chữ cố định.
- [M] Export lọc vai trò thiếu **ST** (giao diện chính có ST); các thẻ xuất không phải `button` (khó dùng bàn phím/đọc màn hình).
- [M] Chưa có Undo/Redo, Ctrl+S (đã nằm trong Đợt 8.4).
- [M] Timeline: thanh Master Cue to, đặc màu vàng/xanh lấn át bảng; chưa thấy cách kéo/chỉnh thời lượng.
- [L] Legend "LX Color" ở Stage 2D đè lên sàn khấu ở góc dưới trái; chữ "Đã lưu/Chưa lưu" xuống dòng vỡ ở header hẹp.

**Rối mắt (UX/UI)**
- Header gồm ~15 phần tử trong 1 hàng: quick card Standby/Active, 4 đồng hồ, 3 transport, 4 view, Lock, Open, Import, Export, trạng thái lưu. Không có phân cấp: khi live chỉ cần đồng hồ + GO.
- Mỗi hàng cue có tối đa 5 màu cùng lúc (viền trạng thái, nhãn LX/VX/SQ/ST màu khác nhau, chip fix/screens, chip màu, nút STBY/GO) và nhãn trạng thái không đồng nhất (STANDBY/PENDING/COMPLETED/GO).
- Nhãn lẫn Anh–Việt ("Show Time", "Cue Remainder", "Thay thế toàn bộ", "Đã lưu"); nút "Import CSV/Excel" nhưng hộp thoại chỉ nhận `.csv/.tsv/.txt`.
- Không có onboarding, không có trang hướng dẫn, không có tooltip phím tắt, không có trạng thái rỗng hướng dẫn (show mặc định chỉ có 1 cue demo, "Untitled Show" không đổi tên được từ header).

### Giai đoạn 9.1: Header không che, không chồng (Critical)
- [x] 9.1.1 Thiết kế lại header 2 tầng: tầng vận hành (đồng hồ, transport, Go/Standby) luôn thấy; tầng công cụ (view, Lock, Open/Import/Export) gom vào cụm riêng, thu gọn thành menu "…" dưới 1100px.
- [x] 9.1.2 Test tự động bằng browser: ở 960, 1024, 1280, 1920 mọi `header button` đều `elementFromPoint` trả về chính nó, không có `scrollWidth > clientWidth`, không khối nào chồng.
- [x] 9.1.3 Đổi "Show Time/Cue Remainder/Delta" thành nhãn tiếng Việt (hoặc bật chuyển ngôn ngữ), số dùng `tabular-nums`, "Đã lưu" không xuống dòng.
- [x] 9.1.4 Cho phép đổi tên show ngay trên header.
- Kiểm chứng: ảnh chụp 4 độ rộng + vitest hoặc script kiểm tra overlap; cập nhật `src/App.test.tsx`.

### Giai đoạn 9.2: Nhập nội dung cue ngay trong bảng (Critical)
- [x] 9.2.1 Ô LX/VX/SQ/ST trong Rundown sửa được (double-click hoặc Enter): LX (tên cảnh, **danh sách đèn: loại + số lượng + vị trí tuỳ chọn — dữ liệu này là đầu vào của 9.4F**, intensity, màu), VX (nội dung, số màn), SQ (track, volume), ST (mô tả).
- [x] 9.2.2 Bộ chọn màu LX: preset (Đỏ/Amber/CTO/…), Kelvin, RGB, hex; hiện swatch số và cảnh báo ngoài gam (dùng `src/services/color.ts` của Đợt 7).
- [x] 9.2.3 Esc huỷ sửa, Enter lưu, Tab sang ô kế; kiểm tra Space không kích hoạt GO khi đang gõ.
- [x] 9.2.4 Thêm/xoá/nhân đôi/di chuyển cue và Act bằng chuột (menu chuột phải hoặc nút hàng), xác nhận xoá.
- [x] 9.2.5 Test component sửa từng loại ô; test browser: tạo show 3 cue từ đầu không dùng import.

### Giai đoạn 9.3: Autosave & Import đúng dữ liệu (Critical/High)
- [x] 9.3.1 Sửa autosave: lưu mỗi khi `show` đổi (kể cả sau `loadShow`/import/open), không phụ thuộc `isDirty`; `isDirty` chỉ để cảnh báo "chưa xuất file".
- [x] 9.3.2 Test hồi quy: import → reload → banner khôi phục đúng số cue của bản sau import.
- [x] 9.3.3 Parser: tách "3200K/CTO/màu" khỏi số lượng ("Wash 12 cây 3200K" → 12 fix + màu 3200K); nhận số màn từ "Logo Loop" bằng mặc định hợp lý hoặc cho nhập; đọc tên màu tiếng Việt (Đỏ, Xanh, Vàng, Hổ phách…).
- [x] 9.3.4 Import: thêm ô ánh xạ cột Màu, SQ, ST; bước xem trước hiển thị đúng bảng kết quả (có cảnh báo dòng nghi ngờ); đổi tên nút thành đúng định dạng được hỗ trợ.
- Kiểm chứng: vitest `importer`, `hardwareParser`, `persistence`; thêm CSV mẫu của test này làm fixture.

### Giai đoạn 9.4: Thiết kế lại Stage 2D theo chuẩn bố trí đèn sân khấu thật
> Tài liệu nền: `docs/STAGE_LIGHTING_LAYOUT.md` (hệ trục, hướng chiếu, vị trí treo, loại đèn, USITT). Chỉ đọc phần liên quan giai đoạn đang làm. Giai đoạn này thay thế 9.4 cũ và **gộp** 8.3.1/8.3.3 (cấu hình màn LED, góc chùm) để không làm hai lần.
> Lỗi gốc đã xác định: chùm sáng luôn toả xuống (`trussY + 280`), FOH vẽ nằm trong sân khấu (`y=80%`), Mid Truss che màn Main LED, không có plaster line/centerline/SL-SR/khán giả, mét (`widthMeters/depthMeters`) bị bỏ phí, số đèn cố định không theo cue/kiểm kê.

**9.4A Mô hình dữ liệu (nền tảng, làm trước)**
- [x] 9.4.1 `src/types/virtualStage.ts`: toạ độ theo mét (`x` từ centerline, `y` từ plaster line âm = phía khán giả, `z` = trim); thêm `RigPosition` (`FOH | Truss | SideBoom | Ladder | Floor | BoxBoom`), `Fixture` (`type`, `beamAngle` mặc định theo loại và sửa được, `role: front|back|side|wash|effect|aerial`, `aim`), màn LED có `z`/`depth`.
- [x] 9.4.2 Migrate cấu hình cũ (phần trăm → mét) và state đã lưu; giữ tương thích file `.lightstage` cũ; test migrate và round-trip.
- [x] 9.4.3 Viết lại 3 preset theo **cấu trúc** khác nhau: End Stage (khán giả 1 phía, FOH + back + side boom), Thrust/Catwalk (khán giả nhiều phía), Festival (nhiều truss, side tower, floor package). Mỗi preset đối xứng trái/phải theo mặc định.

**9.4B Hệ trục & Top-down plan**
- [x] 9.4.4 Vẽ centerline, plaster line, nhãn SL/SR/US/DS, lưới 9 khu vực (UL…DR), vùng khán giả; FOH nằm **ngoài** khung sân khấu.
- [ ] 9.4.5 Thước tỉ lệ theo mét và hiển thị khoảng cách khi di chuột; fixture vẽ ký hiệu theo loại (USITT-lite) với đánh số: downstage→upstage, SL trước, boom từ trên xuống.

**9.4C Chùm sáng đúng hướng, đúng loại**
- [x] 9.4.6 Cone theo `aim` và `beamAngle`: front từ FOH hướng về diễn viên (~40–50°), back hắt về khán giả, side ngang, beam hẹp 2–5°, spot 8–20°, wash 25–60° (số chỉ là mặc định, ghi nguồn không thống nhất).
- [x] 9.4.7 Front view dùng phối cảnh đơn giản có độ sâu (trim `z`, khoảng cách tới plaster line); truss không che nội dung màn LED (truss trước màn vẽ mỏng/mờ hoặc theo trim).
- [x] 9.4.8 Công tắc Haze: độ rõ tia phụ thuộc haze; màu cone dùng pipeline Đợt 7.

**9.4D Gắn với dữ liệu show**
- [x] 9.4.9 Số đèn sáng của từng loại **đúng bằng số đã nhập** trong cue (xem 9.4F); không giới hạn ngầm, không làm tròn. Cue `screenCount=0` → màn tắt, N → N màn.
- [ ] 9.4.10 Config sửa được: thêm/xoá/di chuyển truss, đèn, màn LED (kéo thả hoặc nhập mét/trim), gán loại và góc chùm; liên kết với bảng kiểm kê, cảnh báo khi cue dùng nhiều hơn rig có.
- [ ] 9.4.11 Cảnh báo (không chặn): bố cục lệch trái/phải, thiếu back/front light cho khu vực diễn chính, vượt `loadLimit` truss (chỉ nhắc, không thay kỹ sư rigging).
- [x] 9.4.12 Gom Dimmer curve và công suất kW (8.3.2/8.3.4) vào đây nếu vẫn làm.

**9.4F Nhập đèn → Stage 2D hiện đúng số lượng và đúng vị trí từng loại (yêu cầu cốt lõi)**
> Quy tắc vàng: *nhập N đèn loại T cho cue ⇒ Stage 2D vẽ đúng N đèn loại T, mỗi đèn nằm ở vị trí hợp lý cho loại T* (theo `docs/STAGE_LIGHTING_LAYOUT.md` §3–§6). Không cắt bớt, không vẽ thừa, không đặt sai chỗ.
- [x] 9.4.15 Tách **Rig (kho đèn có vị trí)** và **Cue (đèn nào sáng)**: Rig lưu từng `Fixture` có `id`, `type`, `position`, `slot`, `aim`; Cue chỉ tham chiếu `{type, count, position?, groupId?}`. Đèn thuộc rig nhưng không dùng trong cue vẽ mờ (viền), đèn dùng thì sáng.
- [x] 9.4.16 **Bảng luật đặt chỗ theo loại** (có thể sửa, lưu trong dữ liệu): ví dụ `Follow → FOH (giữa)`; `Wash/Par front → FOH + truss mid, chia đều trái/phải`; `Spot → truss mid + FOH`; `Beam → back truss + floor, hắt về khán giả`; `Blinder → front floor/back truss, hướng khán giả`; `Strobe → back truss/floor`; `Side light → boom/ladder SL+SR`; `LED screen → theo loại Main/Wing/Floor/Banner`. Mỗi loại có danh sách vị trí cho phép và thứ tự ưu tiên.
- [x] 9.4.17 **Thuật toán gán (auto-patch)** thuần hàm `placeFixtures(rig, cueUsage) → placements[]`: chia N đèn đối xứng SL/SR (lẻ thì 1 đèn ở giữa), ưu tiên vị trí theo bảng luật, dàn đều trên truss; **deterministic** (cùng input ra cùng vị trí, không nhảy khi sửa cue khác).
- [x] 9.4.18 **Tràn sức chứa**: nếu số đèn vượt chỗ trống của vị trí ưu tiên → tràn sang vị trí thay thế cùng loại; hết chỗ → tự thêm slot (giãn khoảng cách/thêm hàng) và hiện cảnh báo "vượt rig dự kiến", **vẫn vẽ đủ N đèn**. Tuyệt đối không bỏ đèn.
- [x] 9.4.19 **Gán tay đè lên tự động**: cú pháp nhập `Spot x4 @FOH`, `Beam 6 @Back-L`, hoặc chọn vị trí trong ô sửa cue/kéo-thả đèn trên Stage 2D; gán tay được ưu tiên, phần còn lại tự gán. Lưu vào cue/rig.
- [ ] 9.4.20 `hardwareParser` và ô nhập cue (9.2) nhận **loại + số lượng + vị trí tuỳ chọn** ("4 Beam 350W @Back + 2 Follow @FOH"); loại không nhận ra → hiện chip "Chưa phân loại" và vẽ ở vị trí mặc định có cảnh báo, không im lặng bỏ.
- [x] 9.4.21 **Bộ đếm đối chiếu** trên Stage 2D: "Nhập 12 · Hiển thị 12" theo từng loại + tổng; lệch là lỗi hiển thị đỏ (không bao giờ lệch nếu đúng). Rê chuột lên đèn hiện loại, mã số, vị trí, góc, màu.
- [x] 9.4.22 Hai view (front và top-down) dùng **cùng** `placements[]`, nên số đèn/vị trí nhất quán giữa hai góc nhìn; đổi cue thì chỉ đèn đổi trạng thái, không xê dịch vị trí.
- Kiểm chứng: (a) test thuộc tính (property-based): với N ngẫu nhiên 1–500, mọi loại, `số đèn vẽ == N` và mọi đèn nằm ở vị trí thuộc danh sách cho phép của loại; (b) test đối xứng SL/SR và deterministic; (c) test tràn sức chứa vẫn vẽ đủ N kèm cảnh báo; (d) test `@vị trí` gán tay; (e) browser: nhập "Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4" rồi đếm phần tử SVG từng loại và so với nhập; chụp front + top-down.

**9.4E Xuất & kiểm chứng**
- [ ] 9.4.13 Chế độ xem/xuất "Light plot" (top-down + bảng đèn: số, loại, vị trí, góc, màu) trong Export, in được.
- [ ] 9.4.14 Legend màu không đè sân khấu (dời/thu nhỏ khi vùng nhỏ).
- Kiểm chứng: vitest cho migrate, quy tắc đánh số, tính cone (hướng/góc), đếm đèn theo cue; test component top-down (centerline/plaster line/SL-SR/khán giả có mặt, FOH `y<0`); browser: GO qua cue có back light/front light/side, chụp front + top-down ở 3 preset và 3 độ rộng.

### Giai đoạn 9.5: Làm gọn mắt (UI declutter)
- [x] 9.5.1 Chuẩn hoá trạng thái cue thành 1 bộ nhãn (Pending / Standby / GO / Hold / Done / Skip) với 1 màu + 1 icon mỗi trạng thái; bỏ màu rời rạc ở nhãn phân hệ (chỉ giữ chấm/icon).
- [x] 9.5.2 Rundown: hàng đang GO nổi bật (nền + viền), hàng còn lại trung tính; ẩn nút hàng thứ yếu (Hold/Skip/Reset) vào menu "…" trừ khi hover/chọn.
- [x] 9.5.3 Timeline: thanh Master Cue mảnh hơn, dùng nền mờ; hỗ trợ kéo đổi thời lượng hoặc ghi rõ "chỉ xem" nếu chưa làm.
- [x] 9.5.4 Chế độ "Live" tối giản (Operator): chỉ hiện Standby/Go, đồng hồ lớn, danh sách cue kế tiếp; chế độ "Edit" hiện đầy đủ. Liên kết Operator Lock.
- [x] 9.5.5 Export: thêm vai trò ST, đổi các thẻ thành `<button>`; kiểm bằng Tab và đọc màn hình cơ bản.
- Kiểm chứng: chụp trước/sau, đếm số màu hue riêng biệt trên màn hình chính (mục tiêu ≤ 4 ngoài ánh sáng sân khấu), test contrast Đợt 7 vẫn đạt.

### Giai đoạn 9.6: Hướng dẫn sử dụng trong app (First-run)
- [x] 9.6.1 Màn hình chào lần đầu (bỏ qua được, nhớ bằng localStorage): 4 bước ngắn — Tạo/nhập show → Gọi cue → Xem sân khấu 2D → Lưu/Xuất.
- [x] 9.6.2 Nút "?" ở header mở bảng Trợ giúp: bảng phím tắt (Space, B, ↑/↓, Esc, Ctrl+S/Z khi có), giải thích trạng thái cue, khoá Operator, ý nghĩa màu.
- [x] 9.6.3 Tooltip có kèm phím tắt trên nút transport và GO/STBY; trạng thái rỗng có hướng dẫn ("Chưa có cue — Thêm cue hoặc Import CSV").
- [x] 9.6.4 Show mẫu tải được từ menu (3–5 cue có LX/VX/SQ màu thật) để người mới thử ngay; CSV mẫu tải về từ hộp thoại Import.
- [x] 9.6.5 Cập nhật `README.md` (ảnh chụp mới, luồng đầu tiên) và liên kết tới bảng trợ giúp.
- Kiểm chứng: lặp lại kịch bản "người dùng mới" (xoá localStorage → mở app → tạo show 3 cue có màu → GO → xuất) mà không cần đọc README; ghi vào PROGRESS.

### Giai đoạn 9.7: Test như người dùng thật (built-in browser)
- [ ] 9.7.1 Chạy toàn bộ `docs/USER_TEST_SCRIPT.md` (kịch bản A người mới, B gọi show live, C sân khấu 2D, D lưu/mở/xuất, E cỡ cửa sổ) ở 960, 1280, 1920; xoá localStorage trước kịch bản A.
- [ ] 9.7.2 Kịch bản đặc thù Đợt 9: tạo show 3 cue từ đầu không dùng import; nhập "Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4" và đếm đèn từng loại trên Stage 2D (so với số nhập, front + top-down); header không che nút ở 4 độ rộng; import → reload → khôi phục đúng; mở bảng Trợ giúp.
- [ ] 9.7.3 Ghi PROGRESS.md; lỗi mới vào PLAN.md; tất cả Critical/High đã sửa mới sang 9.8.

### Giai đoạn 9.8: Đóng đợt
- [ ] 9.8.1 `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`, `python3 scripts/guard_check.py`.
- [ ] 9.8.2 Test lại bằng built-in browser ở 960/1280/1920 và chụp ảnh; ghi PROGRESS.md, chạy `python3 scripts/archive_logs.py`, commit từng giai đoạn (không push).

### Rủi ro & quyết định cần chốt
- Đợt 8 (transport/cue lifecycle, âm thanh, undo/redo, stage clock) chưa làm và có chồng lấn nhẹ (8.4 Undo vs 9.2 sửa ô): nên làm 9.1–9.3 **trước** Đợt 8, vì chúng là lỗi chặn dùng.
- 9.4 là giai đoạn lớn nhất (đổi mô hình dữ liệu stage sang mét/trim/aim): cần migrate file cũ và nên tách thành 3–4 commit (9.4A→E). Số liệu góc chùm và số đèn/truss lấy từ blog nhà sản xuất, mâu thuẫn nhau, nên lưu dạng mặc định sửa được.
- 9.4F phụ thuộc 9.2 (nhập đèn theo loại/số lượng/vị trí) và 9.4A (mô hình dữ liệu): thứ tự làm 9.3 → 9.2 → 9.4A → 9.4F → 9.4B–E. Bảng luật đặt chỗ (9.4.16) là quy ước nghề chứ không có chuẩn duy nhất: cần người làm đèn thật duyệt trước khi chốt.
- Chốt ngôn ngữ giao diện (Việt hoá hoàn toàn hay song ngữ) trước 9.1.3/9.6.
- Chế độ Live/Edit (9.5.4) thay đổi bố cục lớn, cần chốt với người vận hành thật.

## Đợt 10: Hoàn thiện Đợt 8–9 sau Review (Số lượng đèn, Ký hiệu Stage, Xác minh Browser)

> Nguồn: review bản Antigravity ngày 2026-11-16 (commit `1ec5b4d`): check.sh 23/23 suite, 174/174 test, build OK, audit/guard OK; test thủ công trên browser ở 960 và 1280px. Đã xác minh chạy được: header 2 tầng (không nút bị che), sửa ô LX bằng popover, Welcome/Help, Undo, top-down có centerline/plaster line/SL-SR/FOH ngoài sân khấu, auto-patch đối xứng, bộ đếm đối chiếu.
> Không tuyên bố "hoàn thành Đợt 8–9" cho tới khi đóng đợt này. Mức: **[C]** nghiêm trọng, **[H]** cao, **[M]** trung bình, **[L]** thấp.

### Mục tiêu đợt
(1) Nhập đèn trong cue ⇒ bảng Rundown, Stage 2D, kiểm kê, báo cáo cùng một con số. (2) Hoàn thành các mục 9.4 còn dở. (3) Chạy thật kịch bản người dùng trên browser và sửa hết Critical/High. (4) Làm cho nhật ký tiến độ khớp thực tế.

### Phát hiện từ review
- [C] **Nhập đèn cho số lượng sai.** Ô "Mô tả Fixture" nhập `Beam x8, Spot x4 @FOH, Wash x12, Follow x2, Blinder x4` (30 đèn) nhưng ô "Số lượng Đèn" vẫn 12 và được ưu tiên khi lưu: Rundown hiện "12 fix", Stage 2D vẽ 30, bộ đếm đỏ "Nhập 12 · Hiển thị 30". Hai nguồn sự thật cho cùng một số.
- [H] **Nhật ký không khớp thực tế.** `PROGRESS.md` ghi "hoàn thành toàn diện Đợt 8 & 9" và "hỗ trợ gán tay `@position`", trong khi PLAN còn 13 mục `[ ]` (9.4.5, 9.4.10, 9.4.11, 9.4.13, 9.4.14, 9.4.20, 9.7.x, 9.8.x). `realUserJourney.test.tsx` chạy trên jsdom, không phải browser, nên chưa thoả 9.7.
- [H] **Stage 2D không phân biệt loại đèn**: mọi đèn là chấm giống nhau (chưa có ký hiệu theo loại, thước mét, đánh số USITT).
- [M] **Popover sửa LX bị cắt ở 960×640**: phần Intensity/Kelvin/hex và nút lưu bị panel Timeline che.
- [M] Welcome/nút Import còn ghi "Excel/CSV" trong khi chỉ nhận `.csv/.tsv/.txt`.
- [L] 4 file `src/components/{ExportModal,ImportModal,RundownTable,VirtualStagePreview}.tsx` chỉ là một dòng re-export, làm lẫn cấu trúc thư mục.
- Chưa kiểm được: Stage Clock Window đa cửa sổ, âm thanh thật (autoplay), 1920px, Export/Print trong Tauri, cargo.

### Giai đoạn 10.1: Một nguồn sự thật cho số lượng đèn (Critical)
- [x] 10.1.1 Xác định: **danh sách đèn (loại × số lượng × vị trí) là nguồn duy nhất**; `fixtureCount`/`totalLightingFixtures` luôn **suy ra** từ danh sách (hoặc ô tổng chỉ đọc). Bỏ ô nhập số lượng tách rời hoặc đồng bộ hai chiều không lệch.
- [x] 10.1.2 Ô nhập đèn dạng danh sách có cấu trúc (hàng: loại · số lượng · vị trí tuỳ chọn · thêm/xoá) song song với ô gõ nhanh `Beam x8, Spot x4 @FOH`; gõ nhanh và danh sách phản chiếu lẫn nhau.
- [x] 10.1.3 Dữ liệu cũ (chỉ có `fixtureCount`, không có danh sách): migrate sang một dòng "Chưa phân loại × N", không mất số.
- [x] 10.1.4 Mọi nơi dùng cùng số: Rundown, Timeline, header (LX/VX), kiểm kê, Export CSV/PDF, Stage 2D (kiểm lại cả `getDeviceStats`).
- [x] 10.1.5 Test: nhập mô tả 30 đèn → Rundown "30 fix", kiểm kê 30, Stage "Nhập 30 · Hiển thị 30"; sửa số trong danh sách → tất cả cập nhật; bộ đếm chỉ đỏ khi thực sự có lỗi hiển thị. Test thuộc tính N ngẫu nhiên (đã có cho `placeFixtures`) mở rộng tới tầng UI/store.

### Giai đoạn 10.2: Hoàn thành các mục 9.4 còn dở
- [ ] 10.2.1 (9.4.20) Parser và ô nhập nhận **loại + số lượng + vị trí** (`@FOH`, `@Back-L`…); loại lạ → chip "Chưa phân loại" + cảnh báo, không bỏ im lặng. Sửa PROGRESS cho khớp.
- [ ] 10.2.2 (9.4.5) Ký hiệu theo loại (Beam/Spot/Wash/Follow/Blinder/Strobe/Par khác hình/khác màu viền), đánh số downstage→upstage, SL trước; thước mét và khoảng cách khi rê chuột; chú giải (legend) rõ.
- [ ] 10.2.3 (9.4.10) Config sửa được rig: thêm/xoá/di chuyển truss, đèn, màn LED (nhập mét/trim hoặc kéo thả), gán loại, góc chùm; liên kết với bảng kiểm kê và cảnh báo khi cue dùng nhiều hơn rig có.
- [ ] 10.2.4 (9.4.11) Cảnh báo không chặn: lệch trái/phải, thiếu front/back light cho khu vực chính, vượt tải truss.
- [ ] 10.2.5 (9.4.13) Chế độ xem/xuất "Light plot" + bảng đèn trong Export, in được.
- [ ] 10.2.6 (9.4.14) Legend LX Color không đè sân khấu ở vùng nhỏ.
- [ ] 10.2.7 Kiểm chứng riêng vị trí: với mỗi loại, mọi đèn nằm ở vị trí thuộc danh sách cho phép; chụp front + top-down ở 3 preset.

### Giai đoạn 10.3: Sửa lỗi UI nhỏ
- [ ] 10.3.1 Popover sửa ô (LX/VX/SQ/ST) không bị cắt ở 960×640: tự đảo hướng, cuộn trong popover hoặc dùng portal; nút Lưu/Huỷ luôn thấy được.
- [ ] 10.3.2 Đổi chữ "Excel" thành đúng định dạng được hỗ trợ ở Welcome, nút Import, tooltip (hoặc hỗ trợ `.xlsx` thật nếu đã chốt ở Đợt 6.5.6).
- [ ] 10.3.3 Dọn 4 file re-export `src/components/*.tsx` (sửa import về đúng thư mục con, xoá stub), cập nhật `ARCHITECTURE.md` nếu có nhắc.
- [ ] 10.3.4 Kiểm tra `elementFromPoint` mọi nút header ở 960/1024/1280/1920, trong cả trạng thái có banner khôi phục.

### Giai đoạn 10.4: Test như người dùng thật bằng browser (thay thế 9.7 và 8.6 chưa chạy)
- [ ] 10.4.1 Chạy toàn bộ `docs/USER_TEST_SCRIPT.md` (A–E) ở 960, 1280, 1920; xoá localStorage trước kịch bản A; chụp ảnh front + top-down ở 3 preset làm bằng chứng.
- [ ] 10.4.2 Mục riêng: tạo show 3 cue từ đầu không import; nhập "Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4" và đối chiếu số đèn từng loại giữa danh sách, Rundown, Stage (front + top-down), kiểm kê, export.
- [ ] 10.4.3 Mục Đợt 8 chưa kiểm: mở Stage Clock Window và đồng bộ với cửa sổ chính (2 tab), âm thanh sau lần tương tác đầu, Reset/Pause/Stop đồng bộ cue, Ctrl+S.
- [ ] 10.4.4 Ghi báo cáo vào PROGRESS.md (ngày, viewport, đạt/không đạt từng kịch bản, ảnh/số đo); lỗi mới ghi lại vào PLAN.md; sửa hết Critical/High trước khi sang 10.5.
- [ ] 10.4.5 Kiểm chứng desktop Tauri: cài cargo rồi `cargo check`/build, thử Export/Print và Stage Clock Window trong Tauri. Nếu chưa cài được cargo, ghi rõ lý do + danh sách phần chưa kiểm vào PROGRESS; không tuyên bố đóng đợt khi phần desktop còn bỏ ngỏ.

### Giai đoạn 10.5: Đóng đợt & làm sạch nhật ký
- [ ] 10.5.1 Sửa PROGRESS.md: mục "Đợt 8 & 9" ghi đúng phần đã xong/chưa xong; ghi rõ test jsdom ≠ test browser.
- [ ] 10.5.2 Đánh `[x]` các mục 9.4.x, 9.7.x, 9.8.x và 8.6.x chỉ khi có kiểm chứng (lệnh/ảnh) trong PROGRESS; mục chưa làm giữ `[ ]`.
- [ ] 10.5.3 `bash scripts/check.sh --fast`, `npm run build`, `python3 scripts/audit_workflow.py`, `python3 scripts/guard_check.py`.
- [ ] 10.5.4 `python3 scripts/archive_logs.py`, commit từng giai đoạn (Conventional Commits, không push).

### Rủi ro & quyết định cần chốt
- 10.1 đổi nguồn sự thật của số lượng đèn: cần migrate cue cũ và file `.lightstage` đã lưu (có test round-trip), tránh đổi số đã nhập.
- Quy trình: giao việc cho agent bên ngoài phải kèm kiểm chứng bằng browser, không chỉ test jsdom; người duyệt đối chiếu PLAN với PROGRESS trước khi đóng đợt.
- Chưa có cargo nên chưa kiểm được build Tauri, in PDF trong Tauri, cửa sổ phụ Tauri (nên cài cargo trước 10.4.3).
