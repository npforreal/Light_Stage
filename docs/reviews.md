# Đánh giá workspace Light Stage

**Ngày đánh giá:** 2026-11-19  
**Phạm vi:** Đọc cấu trúc, tài liệu, mã frontend/backend, luồng import/export, persistence, thao tác gọi cue, cấu hình Tauri và chạy quality gate. Đây là đánh giá kỹ thuật tổng quan, không phải kiểm toán bảo mật chuyên sâu hay xác nhận sẵn sàng vận hành thiết bị sân khấu.

## Tóm tắt điều hành

Light Stage có nền tảng tốt cho công cụ lập rundown, gọi cue, theo dõi thời gian và mô phỏng sân khấu. Mã nguồn phân lớp tương đối rõ, có test cho dịch vụ nghiệp vụ, store và UI; quality gate và build frontend hiện chạy được.

**Chưa nên dựa vào Operator Lock hoặc trạng thái “đã lưu” như bảo đảm an toàn khi vận hành live.** Review phát hiện hai vấn đề ưu tiên cao: nút điều khiển giao diện vẫn hoạt động khi khóa, và ứng dụng đánh dấu đã lưu dù autosave có thể thất bại. Parser dự án cũng cần xử lý dữ liệu có cấu trúc sai an toàn hơn.

## Phát hiện theo mức ưu tiên

### Cao — Operator Lock chỉ chặn phím tắt, không chặn nút GO trên giao diện

- `App` bỏ qua sự kiện phím khi `isOperatorLocked` bật ([`App.tsx`](../src/App.tsx#L192)).
- Nút GO trên Header vẫn gọi trực tiếp `goCue()` và không bị disable theo trạng thái khóa ([`Header.tsx`](../src/components/Header.tsx#L362)).
- Kịch bản kiểm thử thủ công yêu cầu bật khóa rồi thử cả phím lẫn nút ([`USER_TEST_SCRIPT.md`](./USER_TEST_SCRIPT.md#L21)).

**Tác động:** Người vận hành vẫn có thể gọi cue bằng chuột trong lúc giao diện báo đang khóa. Tên và cách dùng Operator Lock tạo kỳ vọng rằng thao tác gọi cue sẽ bị chặn.

**Khuyến nghị:** Chốt rõ semantics của khóa; nếu khóa nhằm ngăn gọi nhầm, chặn thao tác GO/STBY/Hold và mọi đường gọi cue ở tầng store hoặc command handler, không chỉ ẩn/disable UI. Thêm test cho nút GO, STBY, Hold và các điều khiển gọi cue khác ở trạng thái locked.

### Cao — Autosave lỗi nhưng ứng dụng vẫn báo đã lưu

- `saveAutoSave()` trả về `false` khi không có storage hoặc `setItem` phát sinh lỗi ([`persistence.ts`](../src/services/persistence.ts#L200)).
- Autosave trong `App` bỏ qua giá trị trả về rồi luôn gọi `markSaved()` ([`App.tsx`](../src/App.tsx#L97)).

**Tác động:** Khi storage đầy, bị chặn hoặc không khả dụng, ứng dụng có thể xóa trạng thái dirty, hiển thị “Đã lưu” và không còn cảnh báo rời trang dù dữ liệu mới chỉ tồn tại trong bộ nhớ.

**Khuyến nghị:** Chỉ gọi `markSaved()` sau khi lưu thành công; khi thất bại, giữ trạng thái chưa lưu và thông báo lỗi có thể hành động được. Bổ sung test cho lỗi quota/storage không khả dụng và xác nhận cảnh báo unsaved vẫn còn.

### Trung bình — Dữ liệu dự án JSON sai cấu trúc có thể làm parser ném lỗi

- Parser kiểm tra `acts` là mảng nhưng sau đó truy cập trực tiếp `act.id` và `cue.id` trong các phép `map` ([`persistence.ts`](../src/services/persistence.ts#L121)).
- Luồng chọn file gọi parser trong callback `FileReader.onload` mà không bao quanh bằng xử lý lỗi cho cấu trúc dữ liệu ([`App.tsx`](../src/App.tsx#L260)).

**Tác động:** File JSON hợp lệ về cú pháp nhưng chứa phần tử `null` hoặc sai kiểu có thể không được chuyển thành `ParseResult` lỗi thân thiện; người dùng có thể không nhận được thông báo import rõ ràng.

**Khuyến nghị:** Xác thực từng act, cue và stage config tại biên nhập; bảo đảm mọi lỗi dữ liệu trả về thông báo cụ thể. Thêm test cho `acts: [null]`, `cues: [null]` và các trường con sai kiểu.

## Đánh giá theo lĩnh vực

### Kiến trúc và khả năng bảo trì

- Frontend React/TypeScript, store Zustand, service nghiệp vụ và component được tổ chức thành các khu vực riêng; các parser, mô hình fixture, persistence và exporter có test tập trung.
- Tauri v2 hiện đóng vai trò harness desktop; Rust entrypoint khởi tạo ứng dụng và logging, chưa thấy command/native service điều khiển thiết bị sân khấu.
- Nhìn chung cấu trúc phù hợp để tiếp tục phát triển ứng dụng show-calling và preview. Nên duy trì ranh giới giữa mô phỏng/gọi cue và điều khiển thiết bị thật.

### Phạm vi sản phẩm và mức sẵn sàng live

- Hiện GO cập nhật trạng thái cue và đồng hồ trong ứng dụng; preview sân khấu phản ánh trạng thái nội bộ. Trong phạm vi mã đã đọc, chưa thấy output DMX, sACN/Art-Net, OSC hoặc MIDI.
- Import nhận CSV/TSV/TXT và dữ liệu dán từ bảng tính; không thấy parser đọc trực tiếp workbook `.xlsx` ([`ImportModal.tsx`](../src/components/importer/ImportModal.tsx#L55)).
- Vì vậy nên mô tả rõ đây là công cụ rundown/show-calling/preview nếu chưa có tích hợp phần cứng. Không nên hàm ý GO tự điều khiển thiết bị vật lý.

### Bảo mật và ranh giới dữ liệu

- Tauri capability mặc định chỉ khai báo `core:default` ([`default.json`](../src-tauri/capabilities/default.json)); quality audit cũng không phát hiện secret file được track trong Git ở lần chạy review.
- Dữ liệu dự án được xử lý cục bộ; exporter có xử lý escape HTML và phòng CSV formula injection trong các luồng đã đọc.
- CSP hiện cho phép `script-src 'unsafe-inline'` ([`tauri.conf.json`](../src-tauri/tauri.conf.json#L25)). Đây là cơ hội hardening defense-in-depth, không phải bằng chứng về một lỗ hổng khai thác đã xác nhận.
- Không chạy dependency CVE scan, CodeQL/SAST hoặc kiểm toán bảo mật chuyên sâu trong đợt review này.

### Hiệu năng và trải nghiệm

- Production frontend build thành công, nhưng Vite cảnh báo các chunk JavaScript chính và Three.js vượt ngưỡng 500 kB sau minify. Nên cân nhắc lazy-load phần Stage 3D hoặc tách chunk để giảm chi phí tải ban đầu; mức độ ảnh hưởng thực tế chưa được đo trên thiết bị mục tiêu.
- Tài liệu có kịch bản kiểm thử bố cục nhiều viewport và log tiến độ ghi nhận bằng chứng CDP trước đó. Review này không chạy lại kiểm thử browser tương tác hoặc đo hiệu năng runtime.

### Kiểm thử và quy trình

- Chạy `bash scripts/check.sh`: TypeScript type-check đạt; **34 test files / 317 tests đạt**; `cargo check` đạt; `npm run build` đạt; workflow audit và drift guard không có failure.
- Production build báo cảnh báo chunk lớn. Workflow audit tại lần chạy review báo cảnh báo PLAN chưa có section Round/Đợt. Sau đó workspace hiện có thay đổi `PLAN.md` và section Đợt 16; thay đổi đó được giữ nguyên và chưa chạy lại audit sau khi cập nhật.
- Lần kiểm tra chạy trên macOS; Windows packaging/runtime chưa được xác minh trong review này. `bash scripts/check.sh` không thay thế cho việc build và mở app Tauri thực tế.

## Kết luận và thứ tự khuyến nghị

1. Sửa Operator Lock và thêm kiểm thử cho toàn bộ đường gọi cue.
2. Sửa luồng autosave để chỉ báo đã lưu khi lưu thành công; kiểm thử lỗi storage.
3. Siết xác thực file `.lightstage` và bảo đảm lỗi import luôn có thông báo rõ ràng.
4. Chốt phạm vi sản phẩm với người dùng: preview/show-calling hay có điều khiển thiết bị vật lý.
5. Sau các sửa đổi, chạy lại quality gate, user journey trên app thật và kiểm thử đóng gói trên các nền tảng mục tiêu.

Đây là ghi nhận theo snapshot review ngày 2026-11-19; không sửa mã nguồn trong lần đánh giá ban đầu. Các kết luận trên không thay thế kiểm thử tại địa điểm biểu diễn hoặc xác nhận an toàn của hệ thống thiết bị thực tế.
