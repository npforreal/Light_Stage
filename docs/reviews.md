# Review Light Stage — Persona: Freelancer mới (FM)

**Ngày review:** 2026-11-19
**Môi trường:** trình duyệt, `http://localhost:1420`, phiên sạch (xoá dữ liệu lưu sẵn trước khi mở).
**Cỡ cửa sổ đã thử:** 1280×800 và 960×640.
**Ảnh chụp:** `scratch/review-screenshots/` (số thứ tự + cỡ cửa sổ, được trỏ tới ở Bảng phát hiện).
**Đã thử:** mở lần đầu, tour chào mừng, dán rundown bẩn, GO / Hold, Khóa vận hành, Inspector, Stage 3D, Export, Help.
**Chưa thử được / chưa kiểm chứng:** tải file CSV/PDF thật (mình không bấm tải xuống), cửa sổ Stage Confidence Clock (xem #11), nạp file `.csv` từ ổ đĩa, đổi thứ tự cue bằng kéo-thả.

---

## Ấn tượng đầu tiên

Mở lên là hiện ngay hộp chào mừng 4 bước, nói rõ app làm gì và **không làm gì** (không xuất DMX/OSC, không đọc `.xlsx`). Mình đánh giá cao việc nói thẳng như vậy. Tắt tour xong thì **bảng rundown không trống** — có sẵn 1 cue mẫu "Pre-Show / Walk-in" — nhưng người mới như mình sẽ không biết đó là dữ liệu mẫu hay của mình (`01-first-load-1280x800`). Bố cục 3 phần (bảng cue, timeline, nút GO to màu xanh) nhìn là hiểu đây là app gọi cue.

## Điều mình thích

- **Tour 4 bước + câu giới hạn phạm vi ngay từ đầu** (`02-welcome-1280x800`): freelancer như mình sợ nhất là tưởng app điều khiển được đèn thật rồi lên show mới biết không. Nói trước như vậy là đúng.
- **Dán từ Excel khá thông minh** (`03`, `04`): header tiếng Việt (`Tiết mục`, `Thời lượng`, `Ánh sáng`, `Màn LED`, `Âm thanh`, `Diễn viên`) tự khớp cột đúng hết, có bước xem trước và cho sửa mapping. Có cả "Thay thế / Nối tiếp".
- **Đếm đèn / màn LED đúng với chuỗi mô tả**: "6 Par RGB + 4 Beam 350W" → 10 fix; "12 Spot + 6 Beam" → 18; "LED chính x 1 + LED cánh x 2" → 3 màn. Đây là phần đỡ phải tính tay nhất (`04`, `05`).
- **Đọc trạng thái cue**: GO màu xanh lá, Standby màu vàng, Completed xám, nhìn bảng là biết đang ở đâu. Cue đang live tự đẩy cue kế tiếp lên Standby (`06-first-go-1280x800`). Bấm Space chuyển cue không trễ.
- **Bộ đếm LX / VX trên thanh trên đổi theo cue đang live** (0 → 10/1 → 18/3), hữu ích để báo kỹ thuật "cue này bật bao nhiêu đèn".
- **Banner Khóa vận hành** vàng, to, chữ rõ, có nút "Mở khóa" ngay trên banner (`08-locked-1280x800`). Khi khóa, bấm STBY trong Inspector không đổi trạng thái cue (đã thử, cue 2 vẫn giữ nguyên) — phần "chặn lệnh" thì ổn.
- **Help ngắn, thẳng, có bảng phím** (`16-help-960x640`), lặp lại đúng phạm vi app.

## Điều mình chưa thích / Cần cải thiện

1. **Khóa vận hành mất tác dụng chỉ bằng một cái Space.** Nếu mình vừa bấm nút Khóa bằng chuột (đúng cách ai cũng làm), rồi tay quen bấm Space để GO, thì **Space lại mở khóa** thay vì bị chặn. Banner biến mất, GO sáng lại. Mình thử 2 lần, lần nào cũng vậy; chỉ khi click ra chỗ trống trước rồi mới bấm Space thì khóa mới giữ (`09-lock-lost-after-space-1280x800`). Cả mục đích của Khóa là chống bấm nhầm khi live — mà chính phím GO lại tháo khóa. Ngoài ra bấm nhầm kiểu này xong **không có bất kỳ thông báo nào** là khóa đã tắt, nên mình tưởng vẫn đang an toàn.
2. **Ở cỡ 960×640, cue đang live không nằm trong tầm nhìn.** Bảng chỉ hiện ~2 cue, và danh sách **không tự cuộn** tới cue đang GO/Standby: mình đang chạy cue 4 mà màn hình chỉ thấy cue 1–2 (`14-dual-960x640`). Gọi cue mà phải tự cuộn tìm cue đang chạy thì hỏng nhịp.
3. **Cũng ở 960×640, thanh trên mất thông tin:** không còn chữ "Hold", "Khóa", "Đã lưu", mất bộ đếm LX/VX và Delta — chỉ còn icon trần. Nút Hold và Khóa đều chỉ là hình, người mới không đoán được (`13`, `14`). Cột "Stage Action" bị cắt khỏi bảng, phải cuộn ngang mới thấy.
4. **Trạng thái Hold nhìn không ra.** Bấm Esc xong chỉ thấy đồng hồ đứng lại và chữ "GO" mờ đi; không có chữ HOLD to nào. Esc lần 2 **không** tiếp tục; mình phải bấm chuột vào nút Hold mới thấy nút hơi xanh lên, và vẫn không rõ đã tiếp tục hay chưa (`07-hold-state-1280x800`). Giữa show có sự cố mà phải đoán "đang hold hay đang chạy" là nguy hiểm. Help cũng không nói bấm gì để tiếp tục.
5. **Import âm thầm nuốt dữ liệu xấu.** Mình dán 6 dòng, 1 dòng không có tên tiết mục → app báo "5 cues detected" mà không nói dòng nào bị bỏ. Dòng có thời lượng sai chữ ("abc") **tự thành 01:00** mà không cảnh báo (`04-import-preview`, `05-after-import`). Show thật 120 cue thì mình không thể phát hiện ra cue nào bị đổi giờ.
6. **Nút Skip đứng ngay cạnh nút đóng Inspector, không hỏi lại.** Khi mở khóa, banner biến mất làm layout nhảy lên; mình bấm để đóng Inspector thì trúng Skip, cue 2 thành SKIP luôn, không xác nhận, không Undo (`11-stage3d-inspector-open-1280x800`). Live không có Undo thì cần ít nhất cái xác nhận cho Skip.
7. **Nút khi đang Khóa vẫn trông như bấm được.** Các nút STBY ở từng hàng và trong Inspector vẫn sáng vàng như bình thường (`10-locked-inspector-buttons`). Bấm vào thì không có gì xảy ra, không báo lý do. Người mới sẽ nghĩ app bị đơ.
8. **"Bảng trống" thực ra có cue mẫu** (`01`). Cần nút xoá sạch / bắt đầu từ trắng rõ ràng, hoặc gắn nhãn "Dữ liệu mẫu". Người mới dễ chạy show với cue mẫu lẫn cue thật.
9. **Stage 3D chật ở 960×640:** thanh công cụ nổi che mất tên cue đang live ("Cue #4 Biểu diễn…" bị cắt), các nút FOH / Config / Blackout bị cắt mép (`12`, `13`). Nút Blackout là nút quan trọng nhất mà lại là nút bị cắt.
10. **Ngôn ngữ trộn lẫn:** Export dùng tiếng Anh gần hết ("Export & Print Reports", "Target Role / Department Filter"), import báo "Headers detected!", trong khi menu và tour là tiếng Việt (`03`, `15`). Freelancer Việt đọc được nhưng cảm giác thiếu chỉn chu.
11. **Stage Confidence Clock:** mình bấm trong menu nhưng **không thấy chỗ nào hiện ra màn hình đồng hồ** (có thể là cửa sổ riêng bị trình duyệt chặn — mình không chắc). Với persona này đây là mục tiêu "xem đồng hồ ekip sân khấu thấy" nên mình ghi lại là chưa xác nhận được; cần thử lại trên bản desktop thật.
12. **"Delta +03:22" không có giải thích.** Hiện ra trên thanh trên nhưng người mới không biết đang sớm hay trễ so với kế hoạch (và hiện số dương trong khi mình mới chạy 7 giây).

## So sánh với tool đang dùng

- **So với Excel rundown:** đếm đèn/LED tự động và trạng thái cue có màu là cái Excel không làm được. Nhưng Excel không bao giờ tự mở khóa khi mình gõ phím, và Excel lúc nào cũng thấy toàn bộ bảng. Dán thì ngon, nhưng **xuất Excel thì chỉ ra CSV** (UTF-8 BOM giữ được tiếng Việt, hợp lý), producer vẫn phải mở rồi lưu lại.
- **So với Qlab:** Qlab không đếm đèn, nhưng Qlab *điều khiển được thiết bị*, còn Light Stage thì chỉ đổi trạng thái trong app (đúng như app tự nói). Hold/Pause của Qlab hiển thị rõ ràng hơn nhiều.
- **So với StageCaller / Cuez:** hai tool đó có cue-to-cue đồng hồ và màn hình ekip rõ ràng; Light Stage có hướng tương tự (Stage Confidence Clock) nhưng mình chưa xác nhận được nó chạy.

## Bảng phát hiện

| # | Mức | Loại | Vấn đề (ngôn ngữ người dùng) | Bước tái hiện / ảnh | Persona bị ảnh hưởng |
|---|-----|------|------------------------------|---------------------|----------------------|
| 1 | Critical | Bug | Bấm nút Khóa bằng chuột rồi bấm Space: khóa bị **tắt** thay vì chặn GO; không có thông báo | Import cue → bấm "Khóa" → bấm Space ngay. Ảnh `08`, `09-lock-lost-after-space-1280x800` | SM, FM, TD |
| 2 | High | UX | Ở 960×640 danh sách cue không tự cuộn tới cue đang live/standby; chỉ thấy cue 1–2 trong khi cue 4 đang chạy | Resize 960×640 → GO tới cue 4 → xem bảng. Ảnh `14-dual-960x640` | SM, FM |
| 3 | High | UX | Trạng thái Hold không rõ: không có chữ HOLD; Esc lần 2 không tiếp tục; Help không nói cách tiếp tục | GO → Esc → chờ vài giây → Esc lần nữa → bấm Hold. Ảnh `07-hold-state-1280x800` | SM, FM |
| 4 | High | Bug | Import bỏ dòng thiếu tên và đổi thời lượng sai ("abc") thành 01:00 mà không cảnh báo | Dán 6 dòng (dòng 3 trống tên, dòng 5 thời lượng "abc") → phân tích → import. Ảnh `04-import-preview-1280x800`, `05-after-import-1280x800` | FM, TD, PM |
| 5 | High | UX | Nút Skip nằm sát nút đóng Inspector, bấm là skip luôn, không xác nhận/Undo; layout nhảy khi mở khóa làm dễ bấm nhầm | Mở Inspector → mở khóa (banner biến mất) → bấm góc phải trên Inspector. Ảnh `11-stage3d-inspector-open-1280x800` | SM, FM |
| 6 | Medium | UX | Ở 960×640 thanh trên mất chữ Hold/Khóa/Đã lưu và mất bộ đếm LX/VX + Delta; cột Stage Action bị cắt | Resize 960×640. Ảnh `13-stage3d-960x640`, `14-dual-960x640` | FM, SM |
| 7 | Medium | UX | Khi Khóa, các nút STBY vẫn sáng như bình thường, bấm không có phản hồi nào | Khóa → bấm STBY trong Inspector. Ảnh `10-locked-inspector-buttons-1280x800` | FM |
| 8 | Medium | UX | "Bảng trống" thực ra có sẵn cue mẫu, không gắn nhãn là dữ liệu mẫu, không thấy nút xoá nhanh | Xoá dữ liệu lưu → mở app → tắt tour. Ảnh `01-first-load-1280x800` | FM |
| 9 | Medium | UX | Stage 3D ở 960×640: thanh công cụ che tên cue, nút Blackout/Config/FOH bị cắt mép | Stage 3D ở 960×640. Ảnh `13-stage3d-960x640`, `12-stage3d-1280x800` | LD, SM |
| 10 | Low | UX | Tiếng Anh/tiếng Việt trộn lẫn trong Export, Import | Mở Export / Import. Ảnh `03`, `15-export-dialog-960x640` | FM, PM |
| 11 | Medium | Thiếu tính năng / chưa xác nhận | Bấm "Stage Confidence Clock" không thấy cửa sổ/màn hình đồng hồ nào hiện ra | Menu "…" → Stage Confidence Clock. Không có ảnh của màn hình đồng hồ (chưa xác nhận được) | SM, TD |
| 12 | Low | UX | "Delta" không có giải thích, hiện +03:22 sau 7 giây chạy | Chạy 3 cue liên tiếp. Ảnh `06-first-go`, `07-hold-state-1280x800` | FM |

Ghi chú: các cue chạy nhanh trong lúc test nên các con số thời gian không phản ánh show thật; mình chỉ dùng chúng để kiểm tra chuyển trạng thái.

## Mình có dùng cho show thật không?

**Chưa sẵn sàng cho show live; dùng thử ở buổi tech run nhỏ thì được.**

Phần nhập liệu và đếm đèn tốt, tiết kiệm thật. Nhưng việc quan trọng nhất của app gọi cue là *không để bấm nhầm khi live*, mà cái Khóa lại bị Space tháo mất lặng lẽ (#1). Thêm Hold khó nhìn (#3) và cue đang chạy lọt khỏi màn hình ở cỡ nhỏ (#2) thì mình không dám để nó gọi show có khán giả. Sửa xong 3 cái đó, mình sẽ chạy thử một show nhỏ cạnh bảng Excel dự phòng.
