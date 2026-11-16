# FreeShow — ghi chú học hỏi cho Light Stage

> Nguồn: tài liệu chính thức freeshow.app (docs/output, features, functions, styles, stage, groups, views, shortcuts) — đã diễn giải lại, không chép nguyên văn. FreeShow đã cài trên máy (v1.6.7) nhưng **chưa bật và bấm thử được** vì phiên này không có công cụ điều khiển màn hình. Mọi điểm dưới đây là từ tài liệu, **chưa kiểm chứng bằng thao tác thật**. Khi có thể chạy app, đối chiếu lại mục "Cần xem tận mắt".

## 1. FreeShow làm gì (phần giống Light Stage)
Phần mềm trình chiếu mã nguồn mở cho nhà thờ / sự kiện: điều khiển nội dung ra màn hình LED/máy chiếu, có Stage display cho người trên sân khấu, timer, điều khiển từ xa qua trình duyệt. Light Stage rộng hơn (LX, SQ, cue list, sân khấu 2D) nhưng phần **Visual LED (VX)** có thể học nhiều.

## 2. Ý tưởng đáng học (theo mức hữu dụng cho VX)

| # | FreeShow | Gợi ý cho Light Stage |
|---|---|---|
| 1 | **Output = cửa sổ độc lập** gắn với màn hình vật lý hoặc NDI; thêm/xoá nhiều output, tô màu từng output, trạng thái bằng chấm màu (xanh hoạt động, đỏ tắt, vàng khoá) | Mỗi màn LED trong rig (Main, Wing L/R) là một "output" có tên, màu, trạng thái; hiện chấm trạng thái cạnh cue VX |
| 2 | **Lớp (layer)**: Background → Slide → Overlay, mỗi lớp bật/tắt và xoá riêng (Clear All / Background / Slide / Overlay) | Cue VX tách "nền loop" và "lớp phủ"; phím/nút xoá từng lớp khi chạy live |
| 3 | **Lock output**: giữ nguyên nội dung đang chiếu cho tới khi mở khoá | "Freeze VX": đóng băng màn LED khi chuyển cue LX/SQ, tránh lỡ tay |
| 4 | **Phím xoá nhanh**: Esc = xoá tất cả, F1–F4 = xoá nền/slide/overlay/âm thanh; Ctrl+O bật/tắt output, Ctrl+L khoá, Ctrl+R cập nhật | Bộ phím "panic": Blackout VX, Clear lớp, Freeze; ghi vào bảng Trợ giúp |
| 5 | **Chuyển cảnh theo thứ tự ưu tiên** Textbox > Slide > Output > Global; có In/Out/Between riêng | Cue VX có thời gian vào/ra; mặc định toàn show, ghi đè từng cue |
| 6 | **Output style**: tỉ lệ khung (mặc định 16:9, khác tỉ lệ thì letterbox), nền luôn hiện khi Clear | Mỗi màn LED có tỉ lệ/độ phân giải riêng; cảnh báo khi video khác tỉ lệ màn (sẽ bị viền/cắt) |
| 7 | **Stage display riêng** cho MC/nhạc công: slide hiện tại + kế tiếp, đồng hồ, ghi chú; nhiều layout, chọn bằng URL | Đã có Stage Clock Window; mở rộng: layout cho MC/nhạc công (cue hiện tại + kế tiếp + ghi chú ST), thiết bị khác vào bằng URL trong mạng LAN |
| 8 | **Timer** dựng sẵn: đếm xuôi/ngược, tới giờ cụ thể, tới sự kiện; cho phép chạy quá 0 (overflow) | Đã có countdown; thêm "đếm tới giờ" và overrun hiển thị rõ |
| 9 | **Điều khiển từ xa bằng trình duyệt** (điện thoại/tablet) trong LAN: Remote, Stage, Control, Output | Hướng dài hạn: trang điều khiển nhẹ cho người gọi phụ (Standby/Go) |
| 10 | **Actions/trigger**: chạy khi khởi động, khi nhận MIDI, khi kích hoạt slide; gửi HTTP để gọi preset camera | Gắn "hành động" vào cue (gửi HTTP/OSC/MIDI) — chỉ ghi nhận, chưa làm |
| 11 | **Biến (variables)**: giá trị text/số chèn vào slide (tỉ số, tên MC) | Trường biến cho cue VX (tên diễn giả, số thứ tự) |
| 12 | **Template** ghi đè kiểu hiển thị (lower third) cho cùng một nội dung | Mẫu hiển thị VX có sẵn (logo loop, lower third, countdown) |
| 13 | **Nhóm slide + màu + phím gán** (Verse/Chorus), đổi 1 nhóm cập nhật mọi lần dùng | Nhóm cue theo Act đã có; có thể thêm màu/gán phím cho nhóm cue hay dùng |
| 14 | **Nhiều kiểu xem** (Grid/Simple/List/Lyrics) cho cùng một nội dung | Rundown có chế độ gọn "Live" (đã làm 9.5.4) — có thể thêm "Simple" cho VX |
| 15 | Bố cục: **Drawer** (Media/Overlay/Template/Timer...) + Show + preview output + đồng hồ âm thanh | Thư viện media VX (loop/visual) dạng drawer, kéo thả vào cue |

## 3. Không nên bê nguyên
- FreeShow tập trung **slide/lyrics**; Light Stage tập trung **cue theo thời gian + đếm đèn**. Chỉ lấy khái niệm output/layer/lock/phím tắt/stage display.
- Tài liệu có vài phím trùng (Ctrl+D, Ctrl+I, F2) — bài học: bảng phím của ta phải kiểm tra trùng lặp tự động (thêm test).

## 4. Quan sát từ ảnh chụp màn hình thật (FreeShow v1.6.7, macOS, 2 ảnh màn hình chính — người dùng gửi)
Chỉ là màn hình chờ (chưa mở show, chưa trình chiếu), nên **chưa thấy** Edit/Stage/Output settings.

- **Bố cục 3 vùng + drawer**: trái = Projects; giữa = nội dung show; phải = preview output + điều khiển; đáy = drawer (Shows, Media, Audio, Overlays, Templates, Scripture, Calendar, Functions) + ô Search. Bản này tab thời gian tên là **Functions**, không phải "Timers" như docs.
- **Chế độ ở đầu cửa sổ chỉ 3 tab: Show / Edit / Stage**; bên phải 3 icon: bút vẽ (Draw), bánh răng (Settings), nút Present (gạch chân khi bật). Không có thanh công cụ dày.
- **Khối điều khiển nhỏ gọn bên phải**: preview 16:9 đen khi chưa chiếu; hàng 5 nút (trước, sau, play, khoá, chuyển cảnh); dưới là **"Clear all" + 5 icon lớp** (nền, slide, overlay, audio, timer) — mỗi lớp xoá riêng chỉ bằng 1 icon. Đây đúng là mẫu "Clear lớp" cho VX.
- **Giao diện rất ít màu**: nền xanh đen, **một màu nhấn hồng duy nhất** (icon, tab đang chọn, chữ logo), chữ trắng/xám. Mỗi tab = icon + nhãn ngắn. Ngược với Light Stage (nhiều màu LX/VX/SQ/ST + trạng thái) — đây là bài học trực tiếp cho mục "UI rối mắt".
- **Trạng thái rỗng có hướng dẫn**: "Nothing here", màn hình chào có phiên bản, link Documentation và 3 hành động (Quick search, New project, New show); nút "+" nổi.
- **Nút phụ hiện khi rê chuột**: ảnh 2 xuất hiện "Import" và "New show" ở đáy danh sách (ảnh 1 chưa có), kèm tooltip cột. Giảm rối khi không dùng.
- **Đồng hồ lớn + ngày** ở góc dưới phải (luôn thấy giờ thực), icon chỉnh nhỏ bên dưới.
- Dock macOS có tooltip tên output "**Primary**" — output có tên.
- Thư viện show dạng bảng Name/Modified, nhóm theo Categories (Presentations/Songs) và "All" có đếm số lượng.

**Áp dụng cho Light Stage (bổ sung 11.x):** giảm bảng màu còn 1 màu nhấn + màu trạng thái tối thiểu; chuẩn hoá tab = icon + nhãn; hàng "Clear lớp" bằng icon trong vùng điều khiển VX; nút phụ chỉ hiện khi hover/chọn; đồng hồ thực luôn hiện.

### 4b. Ảnh đợt 2: hộp thoại Import, chế độ Edit, chế độ Stage
- **Import** là một lưới ô lớn, chia nhóm có tiêu đề: hàng đầu **Show / Project / More options**; một ô riêng **Clipboard** (dán nội dung); nhóm **MEDIA** (Lessons.church, PDF, PowerPoint); nhóm **TEXT** (Text file, CSV, ChordPro, Word và hơn chục định dạng của phần mềm khác như ProPresenter, EasyWorship, OpenLP…). Biểu tượng riêng cho từng định dạng. → Import của ta nên là một hộp thoại dạng lưới theo nhóm, có **"Dán từ clipboard"** (dán bảng từ Excel/Google Sheets) và thêm định dạng nhập từ phần mềm khác nếu cần.
- **Edit** (đã nhập một bài PowerPoint tiếng Việt, hiển thị đúng dấu): trái = **dải ảnh thu nhỏ các slide có số thứ tự**; giữa = slide cỡ lớn, có tab **Slide / Chords / Text edit** và tên file kèm menu "⋮"; phải = **bảng thuộc tính (inspector)** với 2 tab **Textbox | Item**, gồm các mục gập/mở: Font family, Font size, Auto size, B/I/U/S, Align, Text, Lines, List, Outline, Shadow (Blur, Offset X/Y), Chords, Scrolling, Special, CSS, kèm nút Copy/Reset. Mục tắt dùng dấu "+" (bật thêm), mục có nội dung dùng mũi tên. Nút nổi **"New slide"**, "+" và kính lúp (zoom) ở góc. **Preview + nút điều khiển bên phải trên cùng vẫn giữ nguyên khi sửa**; drawer đáy thu thành một thanh tab.
- **Stage** (chưa có layout): trái = danh sách layout có ảnh nhỏ ("Unnamed"); giữa = canvas đen; phải = inspector "**No items selected**"; đáy = hai nút hành động **New layout** và **Create stage output**. Tooltip nút play: "**Start show** + phím **SPACE**" (phím hiện thành chip màu xanh).
- **Khung 3 cột thống nhất** cho cả Show / Edit / Stage (danh sách trái – canvas giữa – thuộc tính/điều khiển phải), chỉ đổi nội dung theo chế độ.

**Áp dụng cho Light Stage (bổ sung):**
1. Rig Editor / Stage 2D dùng đúng khung này: danh sách (truss, màn LED, đèn) bên trái, sân khấu ở giữa, **inspector gập/mở** bên phải; khi chưa chọn gì hiện "Chưa chọn mục nào" + nút hành động.
2. Preview và nút Standby/Go giữ cố định khi chuyển giữa Rundown/Timeline/Stage (hiện header đã làm một phần).
3. Tooltip luôn có chip phím tắt (đã có ở 9.6.3 — kiểm tra phủ hết nút).
4. Nhập dữ liệu: hộp thoại Import dạng lưới theo nhóm + "Dán từ clipboard".
5. Trạng thái rỗng luôn có nút hành động rõ ràng (New layout / Create stage output).

### 4c. Ảnh đợt 3: Settings > Outputs, Show đang chiếu, Overlays, Functions, Stage khi đang chiếu
- **Settings > Outputs**: menu trái có icon (General, Outputs, Styles, Audio, Connection, Files, Profiles, Theme, Smart, Other); phải là **form một cột**, nhãn nhỏ màu nhấn nằm trên giá trị. Output mặc định chỉ có: **Use style** (tách "kiểu hiển thị" khỏi output, có nút xoá), mục **WINDOW** gồm **Output screen = 1920x1080** (chọn màn hình bằng icon) và công tắc **Always on top**; nút **New output** ở đáy. Không thấy ô nhập X/Y hay gamma ở màn này — độ phân giải lấy từ màn hình thật; màu/khung nằm ở **Styles**.
- **Show đang mở một bài 19 slide**: slide hiện **lưới 4 cột có số**, slide đang chọn viền nhấn; slide từ số 5 có **huy hiệu chuyển cảnh** góc trái trên; tên file kèm bộ đếm **"1/19"** ở khối điều khiển.
- **Trạng thái đang chiếu rất dễ đọc**: nút **"Clear all" chuyển sang nền nhấn đậm**, và **icon lớp đang chiếu (slide) sáng lên** kèm mũi tên chi tiết bên dưới; preview hiện đúng nội dung đang ra. Cả hàng nút (trước, sau, **làm mới output**, khoá, chuyển cảnh) vẫn ngay dưới preview.
- **Khung phải dưới preview**: tab **Groups | Metadata** ("No groups" khi trống). Thanh công cụ nổi nhỏ ở đáy lưới (mũi tên, đồng hồ, lưới) đổi cách xem; nút nổi **New arrangement**.
- **Bảng thông tin show** ở drawer: Created, Modified, Used, Category, **Slides 19, Words 1316**, Template — số liệu tổng hợp hiện sẵn khi chọn file.
- **Drawer > Overlays**: trái là danh sách có icon màu: All, **Effects (19)**, Categories (**Notice, Offers, Visuals**), New category; phải "Nothing here" + nút **New overlay**.
- **Drawer > Functions**: Actions, **Timers**, Variables, Scenes, Interactions; trống thì "Nothing here" + **New action**. (Timers nằm trong Functions.)
- **Stage khi đang chiếu**: cột phải hiện **mỗi output là một ô có tên ("Primary") và chấm trạng thái đỏ** + icon loại output (màn hình/Stage), hai preview cạnh nhau (output chính có nội dung, ô Stage đen vì chưa có layout). Nút điều khiển đè lên đáy preview (hơi che hình — nên tránh).

**Áp dụng cho Light Stage (bổ sung):**
1. **Nhìn một lần biết cái gì đang LIVE**: nút "Clear all" đổi màu + icon lớp đang sáng. Ta làm tương tự cho VX: "Clear VX" sáng khi có visual đang chiếu, icon từng lớp (nền/overlay/video) sáng riêng; header cũng nên có một chỉ báo LIVE duy nhất.
2. **Settings dạng menu trái + form một cột**, nhãn nhỏ trên giá trị; tách "Style" khỏi "Output" (một kiểu hiển thị dùng cho nhiều output).
3. **Danh sách output có tên + chấm trạng thái + loại** (cho mục 11.1).
4. **Bộ đếm "n/tổng"** và **số liệu tổng hợp** (Slides, Words) → ta có "Cue n/N", tổng đèn/màn/thời lượng cho show đang chọn.
5. **Huy hiệu nhỏ trên thẻ** cho thuộc tính đặc biệt (chuyển cảnh) → huy hiệu cue có transition/đèn chưa phân loại.
6. **Khái niệm Scenes / Actions / Variables / Interactions** gom chung trong "Functions" — ta có thể gom Scene (nhóm trạng thái LX+VX+SQ) và Action sau này; chỉ ghi nhận.
7. Tránh: nút điều khiển **đè lên preview** (ảnh 8/10).

### 4d. Ảnh đợt 4: Templates, Styles, menu thêm mục ở Stage
- **Settings > Styles** (một "kiểu hiển thị" dùng lại được cho nhiều output): **Background color** (ô màu, mặc định đen), **Background media**, **Transition**, **Media fit = Contain**, **Aspect ratio = 16:9**, **Active layers** là 3 công tắc **Background / Slide / Overlays** (gạch chân nhấn khi bật). Mục **SLIDE**: Max lines per textbox, Override slide with template, Override scripture with template, Display metadata (Default). Nút **New style** ở đáy. → "Media fit: Contain" nghĩa là giữ nguyên tỉ lệ, chừa viền; đây chính là chỗ xử lý video khác tỉ lệ màn.
- **Drawer > Templates**: lưới thẻ xem trước (Scripture, Scripture 2/3/4, Scripture Lower Third…), nhóm Presentations / Scripture / Songs, đếm theo nhóm, nút **New template**. Trong mẫu có **biến giữ chỗ** dạng `{scripture1_text}`, `{scripture_reference}` (giá trị động điền lúc chiếu).
- **Stage > nút "+" nổi bung menu thêm mục**, chia nhóm bằng khoảng cách: **Slide text, Textbox, Dynamic values** | **Media, Camera** | **Timer, Clock** | **Output window** (nhúng bản sao output) | **More**. Danh sách layout bên trái giờ có 2 mục "Unnamed".

**Áp dụng cho Light Stage (bổ sung):**
1. **Output style dùng chung** cho màn LED: màu nền, media fit (Contain/Cover), tỉ lệ khung, lớp bật sẵn — một style gán cho nhiều màn (cho 11.1).
2. **Menu "+" nổi dạng nhóm** để thêm vật thể vào Rig Editor / Stage Clock layout: nhóm Đèn (Beam/Spot/Wash/…), nhóm Màn LED, nhóm Truss; layout Stage Clock thêm được: cue hiện tại, cue kế, ghi chú ST, Timer, Clock, bản sao output.
3. **Mẫu có biến** `{cue_title}`, `{cue_no}`, `{speaker}` cho cue VX/lower third (cho "biến cue" ở 11.5).
4. Nhãn công tắc lớp **Background / Slide / Overlays** ↔ VX: **Nền / Nội dung / Overlay**.

## 5. Vẫn cần xem tận mắt (chưa kiểm chứng)
Bảng **Transition** (kiểu, thời gian), thêm output thứ hai/NDI (nút "New output"), chế độ Draw, Stage sau khi đã thêm mục, MIDI/OSC, độ trễ và phím tắt thật khi gọi live liên tục, cảnh báo khi video khác tỉ lệ màn (Styles chỉ cho thấy tuỳ chọn Contain, chưa thấy cảnh báo).
