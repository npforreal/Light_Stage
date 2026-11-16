# Nhật ký tiến độ dự án — Light Stage

> Quy ước: Mục mới nhất luôn được thêm vào ĐẦU tệp (ngay dưới phần mở đầu này).
> Lịch sử cũ nằm trong `archive/PROGRESS.md` (chỉ đọc khi cần tra cứu).

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

