# Kịch bản test "người dùng thật" bằng browser tool của OpenCode

Dùng cuối mỗi đợt lớn (xem quy tắc đầu `PLAN.md`). Mục tiêu: đóng vai người lạ, không đọc code, chỉ làm theo giao diện; ghi lại cả lỗi chức năng lẫn chỗ **khó hiểu/rối mắt**.

> Chỉ dùng công cụ có thật trong OpenCode: `browser.*` (built-in) và script CDP trong `scratch/`. Không dùng công cụ của môi trường khác (Claude Code, launch config) — chúng không tồn tại ở đây.

## Chuẩn bị (nhẹ, không cần Tauri)

1. Chạy dev server nền: `npx vite --port 1420` (kiểm `http://localhost:1420` trả 200).
2. Mở tab: `browser.tabs.open({ url: "http://localhost:1420" })` → lưu `tab.id`.
3. Chờ tải xong: `browser.wait({ tabID, condition: "load" })`.
4. Xoá dữ liệu cũ rồi tải lại (kịch bản A):
   `browser.evaluate({ tabID, script: "localStorage.clear(); 'ok'" })` → `browser.reload({ tabID })`.
5. Đọc trạng thái bằng `browser.snapshot({ tabID })` (cây accessibility + ref), tìm chữ bằng `browser.find({ tabID, text })`, đo bằng `browser.evaluate({ tabID, script })`. Chỉ `browser.screenshot` khi cần xem bố cục — nhớ `browser.tabs.focus({ tabID })` trước khi chụp.

### Bản đồ thao tác

| Việc cần làm | Lệnh |
| --- | --- |
| Mở app | `browser.tabs.open({ url })` |
| Đọc DOM/aria | `browser.snapshot({ tabID })`, `browser.find({ tabID, text })` |
| Bấm / gõ / chọn | `browser.click({ tabID, ref })`, `browser.press({ tabID, key })`, `browser.fill`, `browser.select` |
| Đo layout, `elementFromPoint`, `localStorage` | `browser.evaluate({ tabID, script })` (trả JSON) |
| Đọc lỗi console | `browser.console({ tabID, level: "error" })` |
| Chụp ảnh | `browser.tabs.focus({ tabID })` → `browser.screenshot({ tabID, fullPage?: true })` |
| Tải file lên input | `browser.files.upload({ tabID, ref, paths })` |
| Dọn dẹp | `browser.tabs.close({ tabID })` |

### Ba cỡ cửa sổ (960×640 / 1280×800 / 1920×1080)

Browser tool không có lệnh đổi viewport, nên dùng một trong hai cách:

- **Đo trong app đang mở**: `browser.evaluate` kiểm `document.documentElement.scrollWidth <= window.innerWidth` và `getBoundingClientRect()` của từng vùng; ghi lại `window.innerWidth/innerHeight` thật để biết đang test cỡ nào.
- **Ảnh + hit-test chuẩn 3 cỡ**: chạy `node scratch/capture-layout-evidence.mjs` — script tự mở Chrome headless, đặt `Emulation.setDeviceMetricsOverride` cho từng cỡ, chụp `scratch/viewport-<w>x<h>.png` và audit `elementFromPoint` toàn bộ nút header (kèm dropdown admin). Dùng output PASS/FAIL của script làm bằng chứng.

Ảnh chụp có thể trễ một nhịp so với thao tác: sau khi bấm, gọi `browser.snapshot` lại trước khi kết luận. Nếu `browser.screenshot` báo "needs a visible tab" (app không ở foreground), dùng `node scratch/capture-layout-evidence.mjs` để lấy PNG + hit-test — đó là bằng chứng tương đương.

## Kịch bản

**A. Người mới (5 phút)** không có hướng dẫn nào ngoài giao diện.
- Mở app: có hiểu mình đang ở đâu, làm gì trước? Có màn chào/trợ giúp không?
- Đổi tên show, thêm Act, thêm 3 cue, sửa tên/thời lượng, nhập LX/VX/SQ/ST cho từng cue (loại đèn + số lượng + màu).
- Thử nhập sai (rỗng, số âm, chữ lạ): có báo lỗi dễ hiểu không?
- Undo/Redo, `Ctrl/Cmd+S`.

**B. Gọi show live**
- Standby cue 1, `Space` = GO, `B`, `↑`/`↓`, `Esc`; Reset/Pause/Stop; đồng hồ (remainder, delta, overrun) khớp thực tế.
- **Operator Lock** (chi tiết bắt buộc):
  1. Bấm chip Lock → chip hiện **icon khóa + chữ "Đã khóa"** (không chỉ đổi màu).
  2. Khi khóa, thử từng đường gọi cue: `Space`/`Enter`, `B`, `↑`/`↓`, `Esc`, nút GO/STBY/Hold trên Header, nút trên Stage Clock → **không cue nào đổi trạng thái**; nút cue phải `disabled`/`aria-disabled`, mờ, `cursor-not-allowed`, tooltip "Đang khóa — mở khóa để gọi cue".
  3. Khi khóa, các thứ sau **vẫn phải chạy**: `Ctrl/Cmd+S`, `?` mở Help, `i` mở Inspector, `Esc` đóng modal đang mở, cuộn/xem bảng, đồng hồ đang chạy, và **VX panic** (`F1`–`F4`, `Alt+F`, nút trong `VxControlBar`) — đây là đường thoát sự cố live.
  4. Mở khóa → mọi phím/nút gọi cue hoạt động lại.
- Kiểm tra nút bị che: mọi `header button` phải `elementFromPoint` trả về chính nó (dùng `capture-layout-evidence.mjs` hoặc `browser.evaluate`).

**C. Sân khấu 2D**
- Mỗi preset (End/Festival/Thrust), front và top-down.
- Nhập số đèn từng loại, đếm đúng số và đúng vị trí; cue không có LX/VX thì tắt; màu đèn khớp (Kelvin/RGB/gel); Config.

**D. Lưu / mở / xuất**
- Import CSV mẫu có tiếng Việt; chế độ Thay thế vs Thêm vào cuối.
- Reload → banner khôi phục autosave: có đúng bản mới nhất không.
- Save `.lightstage` → Open lại; Export CSV/PDF (lọc LX/VX/SQ/ST).
- **Autosave lỗi (bắt buộc)**: ép `localStorage.setItem` ném lỗi bằng `browser.evaluate` (ghi đè tạm trong tab), sửa 1 cue → sau ~1s phải thấy chip **icon cảnh báo + chữ "Chưa lưu — lỗi lưu tự động"**, banner một lần có nút "Lưu file .lightstage"; `beforeunload` vẫn cảnh báo. Bỏ ép lỗi, lưu lại thành công → chip về "Đã lưu", lỗi tự xoá.
- **File hỏng (bắt buộc)**: mở file JSON hỏng / `acts:[null]` → thấy thông báo nêu **đường dẫn lỗi cụ thể** + cách xử lý, dự án đang mở **không bị thay đổi**.

**E. Cỡ cửa sổ & rối mắt**
- 960 / 1280 / 1920: không tràn, không chồng, không che (đo `scrollWidth` vs `innerWidth`, `elementFromPoint`).
- Đếm số màu nổi bật cùng lúc trên màn chính; nhãn trạng thái nhất quán; ngôn ngữ nhất quán.
- Trạng thái GO / Standby / Hold / lỗi / Đã khóa / Chưa lưu: phân biệt được **bằng chữ + hình**, không chỉ bằng màu (thử nhìn ảnh chụp đã chuyển grayscale).

## Ghi kết quả

Mỗi lỗi ghi: mức (Critical/High/Medium/Low), viewport (`window.innerWidth` thật), bước tái hiện, kết quả thực tế vs mong đợi, bằng chứng (số đo `rect`, `elementFromPoint`, output console, đường dẫn ảnh trong `scratch/`). Đưa vào `PROGRESS.md` (bản test) và `PLAN.md` (việc sửa). Các mục kiểm tra riêng của từng đợt thêm vào phần đó của PLAN, không sửa kịch bản này trừ khi quy trình thay đổi.
