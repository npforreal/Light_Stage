# Chính sách Bảo mật (Security Policy) — Light Stage

Dự án **Light Stage** cam kết bảo vệ dữ liệu vận hành show diễn và duy trì mức độ an toàn cao nhất cho phần mềm. Vì đây là repository mã nguồn mở (public repo), tài liệu này quy định cách thức báo cáo và xử lý các vấn đề bảo mật.

---

## 1. Các phiên bản được hỗ trợ (Supported Versions)

Chúng tôi hỗ trợ và phát hành các bản vá bảo mật cho các phiên bản sau:

| Phiên bản | Hỗ trợ bảo mật | Trạng thái |
| :--- | :--- | :--- |
| `0.1.x` (Current Main) | :white_check_mark: Có | Đang phát triển tích cực |
| `< 0.1.0` | :x: Không | Bản thử nghiệm nội bộ |

---

## 2. Báo cáo Lỗ hổng Bảo mật (Reporting a Vulnerability)

Nếu bạn phát hiện ra bất kỳ lỗ hổng bảo mật nào trong Light Stage, **vui lòng KHÔNG mở issue công khai trên GitHub**.

Vui lòng báo cáo theo quy trình tiết lộ có trách nhiệm (Responsible Disclosure):

1. **GitHub Private Vulnerability Reporting**:
   - Truy cập tab **Security** trên repository GitHub của dự án: `Security` ➔ `Advisories` ➔ `Report a vulnerability`.
   - Cung cấp mô tả chi tiết về lỗ hổng, các bước tái hiện (Proof of Concept - PoC), và tác động tiềm ẩn.

2. **Gửi Email trực tiếp**:
   - Trong trường hợp không thể sử dụng tính năng bảo mật của GitHub, vui lòng gửi email tới: **security@lightstage.local** hoặc liên hệ trực tiếp maintainer (`npforreal`).
   - Chúng tôi khuyến khích mã hóa nội dung bằng GPG nếu có thông tin nhạy cảm.

### Cam kết phản hồi
- **Thời gian phản hồi ban đầu**: Trong vòng **48 giờ** kể từ khi nhận báo cáo.
- **Đánh giá mức độ & Kế hoạch xử lý**: Trong vòng **5 ngày làm việc**.
- **Công bố bản vá**: Chúng tôi sẽ phát hành bản vá và thông báo bảo mật (Security Advisory) sau khi lỗ hổng đã được xác nhận và giải quyết an toàn.

---

## 3. Phạm vi Bảo mật (Security Scope)

Light Stage là ứng dụng desktop hoạt động theo mô hình **Offline-First**:
- Toàn bộ dữ liệu dự án (`.lightstage`), cấu hình sân khấu và file import (Excel/CSV) được xử lý hoàn toàn **cục bộ** trên thiết bị người dùng.
- Ứng dụng **không thu thập telemetry**, không gửi thông tin show diễn ra máy chủ bên ngoài.

### Các lĩnh vực ưu tiên xem xét bảo mật:
- **Xử lý tệp tin không tin cậy (File Parsing & Deserialization)**: Tránh các lỗi tràn bộ nhớ hoặc tấn công DoS khi phân tích các file CSV/TSV/JSON hoặc Excel định dạng độc hại.
- **Tauri IPC & Sandbox Boundary**: Đảm bảo các lệnh gọi giữa Webview frontend và Rust backend được cấp quyền tối thiểu (`capabilities`), ngăn chặn Remote Code Execution (RCE) hoặc truy cập trái phép hệ thống tệp.
- **XSS trong giao diện**: Tránh việc render mã độc hại thông qua tên cue hoặc nội dung visual/lighting được nhập vào.

---

## 4. Thực hành An toàn cho Người dùng

- Luôn tải bản phát hành chính thức từ trang [Releases](https://github.com/npforreal/Light_Stage/releases) đã được ký số hoặc từ kho lưu trữ đáng tin cậy.
- Kiểm tra tính toàn vẹn của tệp `.lightstage` trước khi mở trong phòng điều khiển trực tiếp.
- Giữ hệ điều hành (macOS / Windows) và WebView runtime (Edge WebView2 trên Windows, WebKit trên macOS) luôn ở phiên bản cập nhật nhất.
