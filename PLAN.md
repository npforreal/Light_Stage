# Kế hoạch phát triển dự án — Light Stage (Production Roadmap)

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).

## Đợt 2: Smart Excel Parser & Bộ đếm Thiết bị Tự động (Lighting & LED Counter)

### Mục tiêu đợt
Xây dựng engine đọc/ghi Excel/CSV, thuật toán Regex/NLP tự động bóc tách số lượng đèn và màn hình LED từ dữ liệu cue, và bảng tổng hợp trang thiết bị show.

### Giai đoạn 2.1: Excel/CSV Import & Column Mapping Wizard
- [ ] Xây dựng module đọc file Excel (.xlsx, .xls) và CSV với tính năng Header auto-detection.
- [ ] Xây dựng hộp thoại Column Mapping cho phép người dùng ánh xạ cột linh hoạt khi file không theo chuẩn.
- [ ] Xử lý các định dạng thời gian biểu diễn đa dạng (`00:03:00`, `3m20s`, `180s`).

### Giai đoạn 2.2: Smart Hardware Counter & Inventory Aggregation
- [ ] Xây dựng bộ phân tích cú pháp (Regex/NLP parser) nhận diện tự động số lượng + phân loại thiết bị từ text tự do (Beam, Spot, Wash, Par LED, Blinder, Follow, Màn LED Main/Cánh/Sàn).
- [ ] Tính toán số liệu thống kê: Số lượng thiết bị theo từng Cue, Đỉnh sử dụng đồng thời (Peak Concurrent Usage), và Danh mục tổng thiết bị toàn show.
- [ ] Viết bộ unit tests toàn diện cho parser và counter (kiểm thử chuỗi tiếng Việt/tiếng Anh, edge cases).

---

## Đợt 3: Giao diện Chế độ Kép (Dual View: Rundown Table & Timeline Tracks)

### Mục tiêu đợt
Xây dựng giao diện hiển thị tác vụ sân khấu trực quan kép: Bảng Cue Rundown chi tiết để gọi cue và Timeline Tracks theo thời gian tuyến tính.

### Giai đoạn 3.1: Bảng Rundown / Cue List Chuyên nghiệp
- [ ] Dựng bảng Rundown ảo hóa (virtual scrolling) hỗ trợ show lớn hàng trăm cues mượt mà.
- [ ] Hiển thị trạng thái màu chuẩn sân khấu: Active/Go (viền xanh), Standby (viền hổ phách), Completed (xám).
- [ ] Tích hợp tính năng chỉnh sửa trực tiếp nội dung (Inline edit) và kéo thả sắp xếp cue.
- [ ] Bộ lọc góc nhìn theo vai trò kỹ thuật viên (Master View, Lighting View, Visual View, Sound View).

### Giai đoạn 3.2: Timeline Tracks Tuyến tính
- [ ] Xây dựng các dải timeline song song (Lanes: Master, LX, VX, SQ) với tỷ lệ thời gian thực.
- [ ] Thanh Playhead di chuyển mượt mà theo đồng hồ show, hỗ trợ phóng to/thu nhỏ (Zoom in/out).
- [ ] Tương tác click trên timeline để nhảy nhanh (Jump to cue) hoặc đặt mốc chạy thử.

---

## Đợt 4: Sân khấu ảo 2D (Virtual Stage Preview)

### Mục tiêu đợt
Mô phỏng 2D trực quan hệ thống màn hình LED và giàn đèn với khả năng đổi trạng thái động theo cue đang kích hoạt.

### Giai đoạn 4.1: Preset & Cấu hình Bố cục Sân khấu
- [ ] Cung cấp thư viện preset sân khấu thông dụng: End Stage (Tiêu chuẩn), Festival/Concert, Arena/Thrust.
- [ ] Bảng cấu hình nhanh: Thêm/bớt màn hình LED (Main, Cánh, Sàn), vị trí giàn truss đèn (FOH, Mid, Back, Floor).

### Giai đoạn 4.2: Mô phỏng 2D Động (Top-down & Mặt trước)
- [ ] Render 2D bằng SVG/Canvas 60fps góc nhìn Mặt trước (Front View) và Từ trên xuống (Top-down View).
- [ ] Tích hợp phản ứng thời gian thực (Reactive state): Khi gọi Cue (GO), màn hình ảo đổi màu/hiển thị tên visual, các bóng đèn ảo bật sáng theo preset.

---

## Đợt 5: Hệ thống Điều phối Thời gian, Phím tắt Sân khấu & Xuất Báo cáo

### Mục tiêu đợt
Hoàn thiện hệ thống điều khiển vận hành show (phím tắt, đồng hồ delta time), tính năng xuất báo cáo chuyên nghiệp và đóng gói bản phát hành.

### Giai đoạn 5.1: Bộ điều khiển Thời gian & Phím tắt Sân khấu
- [ ] Hệ thống Master Clock: Đồng hồ thực, đồng hồ thời lượng show, đồng hồ đếm ngược cue, cảnh báo lệch giờ (Delta Time).
- [ ] Hệ thống phím tắt tiêu chuẩn: Spacebar (Go), B (Standby), Up/Down (Chuyển cue), Esc (Hold/Pause).
- [ ] Chế độ Operator Lock Mode (khóa giao diện chống bấm nhầm phím trong lúc chạy show).

### Giai đoạn 5.2: Xuất Báo cáo (PDF & Excel) & Đóng gói Production
- [ ] Xuất file Run of Show (ROS) tổng quan và Cue Sheet lọc riêng cho từng bộ phận (LX, VX, SQ) ra PDF chuẩn in ấn.
- [ ] Xuất lại file Excel đã qua chuẩn hóa và thống kê thiết bị.
- [ ] Stress testing, kiểm tra rò rỉ bộ nhớ (no memory leak) và đóng gói installer native cho macOS (`.dmg`) và Windows (`.exe` / `.msi`).
