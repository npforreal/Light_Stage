# Kế hoạch phát triển dự án — Light Stage (Production Roadmap)

> Lịch sử cũ nằm trong `archive/PLAN.md` (chỉ đọc khi cần tra cứu).

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
