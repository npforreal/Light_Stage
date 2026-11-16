# Kịch bản test "người dùng thật" bằng built-in browser

Dùng cuối mỗi đợt lớn (xem quy tắc đầu `PLAN.md`). Mục tiêu: đóng vai người lạ, không đọc code, chỉ làm theo giao diện; ghi lại cả lỗi chức năng lẫn chỗ **khó hiểu/rối mắt**.

## Chuẩn bị (nhẹ, không cần Tauri)
1. Tạo tạm `.claude/launch.json` (xoá sau khi test, không commit):
   `{"version":"0.0.1","configurations":[{"name":"light-stage","runtimeExecutable":"npx","runtimeArgs":["vite","--port","1420"],"port":1420}]}`
2. `preview_start` tên `light-stage`; `resize_window` lần lượt 960×640, 1280×800, 1920×1080 (nhớ trả `desktop` khi xong, `preview_stop`).
3. Xoá dữ liệu cũ: `localStorage.clear()` rồi tải lại trang (kịch bản A).
4. Ưu tiên `read_page`/`find`/`javascript_tool` để đọc trạng thái; chỉ chụp ảnh khi cần xem bố cục. Lưu ý ảnh chụp có thể trễ một nhịp so với thao tác.

## Kịch bản
**A. Người mới (5 phút)** không có hướng dẫn nào ngoài giao diện.
- Mở app: có hiểu mình đang ở đâu, làm gì trước? Có màn chào/trợ giúp không?
- Đổi tên show, thêm Act, thêm 3 cue, sửa tên/thời lượng, nhập LX/VX/SQ/ST cho từng cue (loại đèn + số lượng + màu).
- Thử nhập sai (rỗng, số âm, chữ lạ): có báo lỗi dễ hiểu không?
- Undo/Redo, Ctrl+S (nếu đã có).

**B. Gọi show live**
- Standby cue 1, Space = GO, B, ↑/↓, Esc; Reset/Pause/Stop; đồng hồ (remainder, delta, overrun) khớp thực tế.
- Operator Lock: khoá rồi thử phím và nút; mở khoá.
- Kiểm tra nút bị che: mọi `header button` phải `elementFromPoint` trả về chính nó.

**C. Sân khấu 2D**
- Mỗi preset (End/Festival/Thrust), front và top-down.
- Nhập số đèn từng loại, đếm đúng số và đúng vị trí; cue không có LX/VX thì tắt; màu đèn khớp (Kelvin/RGB/gel); Config.

**D. Lưu / mở / xuất**
- Import CSV mẫu có tiếng Việt; chế độ Thay thế vs Thêm vào cuối.
- Reload → banner khôi phục autosave: có đúng bản mới nhất không.
- Save `.lightstage` → Open lại; Export CSV/PDF (lọc LX/VX/SQ/ST).

**E. Cỡ cửa sổ & rối mắt**
- 960 / 1280 / 1920: không tràn, không chồng, không che.
- Đếm số màu nổi bật cùng lúc trên màn chính; nhãn trạng thái nhất quán; ngôn ngữ nhất quán.

## Ghi kết quả
Mỗi lỗi ghi: mức (Critical/High/Medium/Low), viewport, bước tái hiện, kết quả thực tế vs mong đợi, bằng chứng (số đo `rect`, `elementFromPoint`, ảnh). Đưa vào `PROGRESS.md` (bản test) và `PLAN.md` (việc sửa). Các mục kiểm tra riêng của từng đợt thêm vào phần đó của PLAN, không sửa kịch bản này trừ khi quy trình thay đổi.
