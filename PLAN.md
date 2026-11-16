# Kế hoạch phát triển dự án — Light Stage (Production Roadmap)

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).
> **Quy tắc chung cho mọi đợt lớn:** trước khi đóng đợt phải có một giai đoạn "Test như người dùng thật" bằng built-in browser (nhẹ, không cần build Tauri), chạy theo `docs/USER_TEST_SCRIPT.md`. Lỗi tìm được ghi vào PLAN.md (đợt hiện tại nếu chặn đóng đợt, ngược lại đợt kế). Không đánh `[x]` đóng đợt khi còn lỗi mức Critical/High.

## Đợt 5: Hệ thống Điều phối Thời gian, Phím tắt Sân khấu & Xuất Báo cáo

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 5.1: Bộ điều khiển Thời gian & Phím tắt Sân khấu, Giai đoạn 5.2: Xuất Báo cáo (PDF & Excel) & Đóng gói Production


### Mục tiêu đợt
Hoàn thiện hệ thống điều khiển vận hành show (phím tắt, đồng hồ delta time), tính năng xuất báo cáo chuyên nghiệp và đóng gói bản phát hành.

## Đợt 7: Thiết kế lại Màu UI & Mô phỏng Ánh sáng Chính xác (Color System)

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 7.1: Lõi khoa học màu (`src/services/color.ts`), Giai đoạn 7.2: Mô hình dữ liệu màu đèn (tương thích ngược), Giai đoạn 7.3: Hệ token màu & refactor UI, Giai đoạn 7.4: Stage 2D hiển thị đèn chính xác, Giai đoạn 7.5: Tài liệu & đóng đợt

## Đợt 10: Hoàn thiện Đợt 8–9 sau Review (Số lượng đèn, Ký hiệu Stage, Xác minh Browser)

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 10.1: Một nguồn sự thật cho số lượng đèn (Critical), Giai đoạn 10.2: Hoàn thành các mục 9.4 còn dở, Giai đoạn 10.3: Sửa lỗi UI nhỏ, Giai đoạn 10.4: Test như người dùng thật bằng browser (thay thế 9.7 và 8.6 chưa chạy), Giai đoạn 10.5: Đóng đợt & làm sạch nhật ký


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

### Rủi ro & quyết định cần chốt
- 10.1 đổi nguồn sự thật của số lượng đèn: cần migrate cue cũ và file `.lightstage` đã lưu (có test round-trip), tránh đổi số đã nhập.
- Quy trình: giao việc cho agent bên ngoài phải kèm kiểm chứng bằng browser, không chỉ test jsdom; người duyệt đối chiếu PLAN với PROGRESS trước khi đóng đợt.
- Chưa có cargo nên chưa kiểm được build Tauri, in PDF trong Tauri, cửa sổ phụ Tauri (nên cài cargo trước 10.4.3).

### Đợt 11: Học từ FreeShow cho Visual LED (VX) & Stage Confidence
> Nguồn: `docs/FREESHOW_NOTES.md`. Đã hoàn tất và kiểm chứng toàn diện.
- [x] 11.0 Đã đối chiếu 13 ảnh FreeShow (notes mục 4–4d: màn chính, Import, Edit, Stage, Outputs, Styles, Templates, Overlays, Functions, đang chiếu) để thiết kế kiến trúc VX.
- [x] 11.0e Output style dùng chung cho màn LED (nền, media fit Contain/Cover, tỉ lệ, lớp bật sẵn); menu "+" nổi theo nhóm để thêm đèn/màn/truss vào Rig Editor và mục vào Stage Clock layout; mẫu VX có biến `{cue_title}` (liên kết 11.1, 11.4, 11.5).
- [x] 11.0d Chỉ báo LIVE rõ ràng: nút "Clear VX" đổi màu khi có visual đang chiếu, icon từng lớp sáng riêng, một chỉ báo LIVE duy nhất ở header; thẻ cue có huy hiệu transition; nút điều khiển không đè lên preview.
- [x] 11.0c Khung 3 cột thống nhất (danh sách – canvas – inspector gập/mở) cho Rig Editor/Stage 2D; hộp thoại Import dạng lưới theo nhóm có "Dán từ clipboard"; kiểm tra mọi tooltip nút có chip phím tắt; trạng thái rỗng luôn có nút hành động.
- [x] 11.0b Đơn giản hoá UI theo FreeShow: 1 màu nhấn + bộ màu trạng thái tối thiểu, tab icon + nhãn ngắn, nút phụ hiện khi hover/chọn, đồng hồ thực luôn hiện (liên hệ Đợt 7/9.5).
- [x] 11.1 Output cho từng màn LED: tên, màu, trạng thái (chấm xanh/đỏ/vàng), tỉ lệ + độ phân giải; cảnh báo video khác tỉ lệ màn.
- [x] 11.2 Lớp VX (Nền loop / Overlay) bật-xoá riêng; phím panic: Blackout, Clear lớp, **Freeze VX** (khoá output); ghi vào Trợ giúp + test chống trùng phím.
- [x] 11.3 Thời gian vào/ra của cue VX: mặc định toàn show, ghi đè từng cue.
- [x] 11.4 Stage Clock layout cho MC/nhạc công (cue hiện tại + kế tiếp + ghi chú ST); timer "đếm tới giờ" + overrun rõ.
- [x] 11.5 Ý tưởng dài hạn, chỉ ghi nhận: trang điều khiển từ xa LAN, trigger HTTP/OSC/MIDI, biến cue `{cue_title}`, `{cue_no}`, `{speaker}`, thư viện media dạng drawer.
- [x] 11.6 Test như người dùng thật bằng browser cho 11.1–11.4 (theo quy tắc chung).
