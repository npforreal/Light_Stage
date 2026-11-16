# Kế hoạch phát triển dự án — Light Stage (Production Roadmap)

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).

## Đợt 5: Hệ thống Điều phối Thời gian, Phím tắt Sân khấu & Xuất Báo cáo

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 5.1: Bộ điều khiển Thời gian & Phím tắt Sân khấu, Giai đoạn 5.2: Xuất Báo cáo (PDF & Excel) & Đóng gói Production


### Mục tiêu đợt
Hoàn thiện hệ thống điều khiển vận hành show (phím tắt, đồng hồ delta time), tính năng xuất báo cáo chuyên nghiệp và đóng gói bản phát hành.

## Đợt 7: Thiết kế lại Màu UI & Mô phỏng Ánh sáng Chính xác (Color System)

> Đã xong và lưu trữ (xem `archive/PLAN.md`): Giai đoạn 7.1: Lõi khoa học màu (`src/services/color.ts`, thuần hàm, không phụ thuộc UI), Giai đoạn 7.2: Mô hình dữ liệu màu đèn (tương thích ngược), Giai đoạn 7.3: Hệ token màu & refactor UI, Giai đoạn 7.4: Stage 2D hiển thị đèn chính xác, Giai đoạn 7.5: Tài liệu & đóng đợt


> Tài liệu nền: `docs/COLOR_COURSE.md` (giáo trình màu + nguồn). Chỉ đọc phần liên quan tới giai đoạn đang làm.
> Hiện trạng đo được: ~227 lớp màu Tailwind thô ở 5 component; cyan/amber/xanh lục mang nhiều nghĩa (phân hệ trùng trạng thái); `colorPreset` không có UI/importer nào ghi nên Stage 2D luôn dùng cyan mặc định (`VirtualStagePreview.tsx:32`); cue không có LX/VX vẫn sáng 12 beam + "Visual Loop".

### Mục tiêu đợt
(1) UI hết rối: bảng màu nhỏ, mỗi màu một nghĩa, màu bão hoà chỉ cho trạng thái và ánh sáng thật. (2) Màu đèn trên Stage 2D đúng: pha cộng/trừ, Kelvin, gel, chồng chùm cộng sáng trong linear-light, cảnh báo ngoài gam.

### Rủi ro & quyết định cần chốt
- Hệ số/ngưỡng APCA, Helland, ma trận XYZ đang đánh dấu cần đối chiếu nguồn gốc trước khi code.
- Dữ liệu gel đầy đủ chưa có trên nguồn tìm được; chỉ nhập mã nào có xy đã xác minh.
- Mô phỏng chỉ là xấp xỉ (không có phổ thật của từng đèn): phải ghi rõ ở UI.
- Phụ thuộc: Đợt 6 (sửa lỗi vận hành) phải xong trước, đặc biệt 6.3 (header co giãn) vì ảnh hưởng thiết kế lại UI ở 7.3.

