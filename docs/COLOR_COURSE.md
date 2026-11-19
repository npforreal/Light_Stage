# Khoá học Màu sắc cho Light Stage

> Mục đích: (A) thiết kế lại màu UI cho bớt rối mắt, (B) hiển thị ánh sáng đèn chính xác, gồm cả pha màu.
> Ghi chú trung thực: **không có một khoá học nào trên mạng bao trọn cả hai mảng**. Tài liệu này là giáo trình tự ghép từ các nguồn bên dưới. Mục nào là kiến thức tổng hợp của tôi (không trích thẳng từ nguồn) được đánh dấu **[tổng hợp]**. Hệ số và ngưỡng nên kiểm lại với nguồn gốc trước khi chốt vào code.

## Lộ trình học (≈ 6 buổi)

| Buổi | Chủ đề | Học xong làm được gì | Nguồn chính |
|---|---|---|---|
| 1 | Nền tảng màu & không gian màu (sRGB, linear, OKLCH) | Giải thích vì sao HSL "nói dối" về độ sáng | Ottosson, CSS Color 4 |
| 2 | Contrast & dark theme (WCAG 2.2 + APCA) | Chọn text/nền đạt chuẩn trên nền tối | WCAG, APCA |
| 3 | Hệ token ngữ nghĩa (primitive → semantic → dark) | Dọn bảng màu rối thành hệ thống nhỏ | Skillshare, Toptal |
| 4 | Pha màu ánh sáng: cộng (RGB/RGBW/RGBAL) vs trừ (CMY, gel) | Biết mỗi loại đèn pha màu thế nào | ETC, Knight, Elation |
| 5 | Nhiệt độ màu (Kelvin) & đồ thị Planck | Đổi 3200K/5600K/CTO sang màu hiển thị | Tanner Helland |
| 6 | Pipeline mô phỏng chùm sáng trên màn hình | Beam chồng nhau cộng sáng đúng, không bão hoà bậy | Phần B bên dưới |

Nguồn học (đã tìm được):
- Skillshare, [Create Amazing Color Schemes for Your UI/UX Design Projects](https://www.skillshare.com/classes/Create-Amazing-Color-Schemes-for-Your-UIUX-Design-Projects/750596981): lớp gần nhất với một "khoá học" (color modes, harmonies, contrast, semantic colors). Chưa thấy nhắc OKLCH hay dark theme trong mô tả, cần xem syllabus.
- Toptal, [Color theory for designers](https://www.toptal.com/designers/ui/color-theory-for-designers): nền tảng, nhắc OKLCH/LCH và WCAG 2.2/APCA.
- Calvin University HCI, [reading về màu](https://cs.calvin.edu/courses/cs/300hci/24fa/assets/readings/color/): cảnh báo nền tối dễ làm hỏng contrast; giới thiệu oklch.com.
- Björn Ottosson, [A perceptual color space for image processing](https://bottosson.github.io/posts/oklab): nguồn gốc Oklab/Oklch (đã vào CSS Color 4/5).
- Tanner Helland, [Converting temperature (Kelvin) to RGB](https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html): thuật toán Kelvin→RGB, dùng cho 1000–40000K.
- ETC, [Stage Lighting Design, Part 6: Color](https://blog.etcconnect.com/stage-lighting-design-part-6) và Learn Stage Lighting, [rules for color](https://www.learnstagelighting.com/blog/how-do-i-use-color-effectively%2F): màu trong thiết kế đèn sân khấu.
- Betopper, [CMY, RGBL, RGBALC trên sân khấu](https://betopperdj.com/blogs/news/why-some-festival-lighting-looks-richer-than-others-cmy-vs-rgbl-vs-rgbalc), Elation, [Full Spectrum additive color](https://www.elationlighting.com/blogs/resources/behind-the-innovation-full-spectrum-additive-color-development), Knight, [VLS SmartColor white paper](https://goknight.com/content/documentation/vls-white-paper-smartcolor.pdf): cộng vs trừ, thêm emitter Amber/Lime.
- Rosco/GamColor datasheet, ví dụ [Rosco #3114](https://au.rosco.com/sites/default/files/content/resource/2017-03/%233114%20data%20sheet.pdf): gel có toạ độ CIE xy dưới tungsten (Source A) và D65 cùng đường truyền sáng. Chưa tìm thấy datasheet Roscolux; chưa tìm tài liệu TM-30/CRI cho đèn LED sân khấu.
- Thảo luận APCA vs WCAG cho dark mode: [Myndex WhyAPCA](https://www.github.com/Myndex/SAPC-APCA/blob/master/documentation/WhyAPCA.md), [UI/UX Atlas](https://uiux-atlas.pages.dev/lessons/color/contrast-and-accessibility-wcag-2x-and-apca). Nhiều nguồn trong nhóm này là blog thương mại, chỉ dùng làm tham khảo.

---

# PHẦN A. Màu cho giao diện (hết rối mắt)

## A1. Vì sao UI hiện tại rối
Đo từ code hiện tại (~227 lớp màu Tailwind thô trong 5 component) và test trên browser:
- **Một màu mang nhiều nghĩa.** Cyan vừa là accent thương hiệu, vừa là phân hệ SQ, vừa là Show Time. Amber vừa là LX, vừa là Standby. Xanh lục vừa là Go vừa là countdown bình thường. Người vận hành không đọc được "màu này nghĩa là gì".
- **Quá nhiều hue cùng bão hoà.** Header có amber, emerald, cyan, rose, slate cùng lúc; mỗi hàng cue lại thêm tím, cyan, vàng.
- **Màu phân hệ trùng màu trạng thái.** Trạng thái an toàn (Go/Standby/Overrun) phải tách khỏi màu nhận diện phân hệ.
- **Không có trục sáng nhất quán.** Các màu Tailwind cùng số 400 không cùng độ sáng cảm nhận, nên mắt thấy chỗ chói chỗ chìm.

## A2. Nguyên tắc (rút từ nguồn)
1. **Làm việc trong OKLCH, không phải HSL.** Oklab/Oklch được thiết kế để L (độ sáng), C (độ đậm), H (hue) gần độc lập nhau, nên đổi hue mà độ sáng cảm nhận không nhảy. Nó đã nằm trong CSS Color 4/5. Lưu ý từ Wikipedia: Oklab không phù hợp để blend ảnh, phép cộng/blend ánh sáng làm trong **linear RGB** (xem Phần B).
2. **Bảng màu nhỏ: 1 hue thương hiệu + 1 dải neutral pha chút màu + 4 màu trạng thái (success / warning / error / info).** Đề xuất này có trong một hướng dẫn thiết kế token mà tôi đọc ở kết quả tìm kiếm.
3. **Ba tầng token:** primitive (dải OKLCH thô) → semantic (`--surface`, `--text-muted`, `--status-go`) → override dark. Component chỉ gọi semantic.
4. **Nền tối:** đừng dùng đen tuyệt đối/trắng tuyệt đối; chữ dùng shade sáng; kiểm tra contrast ở cả chế độ tối chứ không đảo ngược từ sáng. **[tổng hợp]**: tăng độ sáng dần cho các lớp nổi (elevation) thay vì dùng đổ bóng; giảm chroma của accent trên nền tối để khỏi "rung" mắt.
5. **Contrast:** WCAG 2.2 vẫn là chuẩn tuân thủ (chữ thường ≥ 4.5:1, chữ lớn/UI ≥ 3:1), APCA là phép kiểm thứ hai vì nó tính cả cực tính sáng/tối, cỡ chữ, độ đậm. Nhiều nguồn nói chữ sáng trên nền tối thường cần Lc cao hơn để đọc thoải mái. Ngưỡng Lc cụ thể (**[tổng hợp]**: ~75 cho chữ thân, ~60 cho nội dung vừa, ~45 cho chữ lớn) cần xác nhận lại với tài liệu APCA trước khi hardcode.
6. **Không dùng màu làm kênh duy nhất.** Trạng thái luôn có chữ/icon/hình đi kèm (STBY, GO, HOLD). Khoảng 8% nam giới thiếu một phần thị lực màu đỏ-lục; Go (lục) và Overrun (đỏ) là cặp nguy hiểm nhất. **[tổng hợp]**

## A3. Đề xuất hệ màu Light Stage (bản nháp, cần chỉnh khi implement)
Nguyên tắc: **màu bão hoà chỉ dành cho trạng thái và cho "ánh sáng thật" trên Stage 2D; phần còn lại gần xám.**

| Vai trò | Token | Hướng OKLCH (đã triển khai 2026-11-19, đợt 17.1) | Ghi chú |
|---|---|---|---|
| Nền ứng dụng | `--surface-0/1/2/3` | L 0.16 / 0.21 / 0.26 / 0.31, C ≤ 0.004, H 285° | 4 nấc nâng gần trung tính, không đen tuyệt đối |
| Viền | `--border` | L ≈ 0.34 / 0.42, C 0.005 / 0.012 / 0.025, H 285° | |
| Chữ chính / phụ / mờ | `--text-1/2/3` | L 0.95 / 0.78 / 0.60 | text-3 chỉ cho nhãn phụ, kiểm Lc |
| Accent | `--accent` | L 0.80, C 0.02, H 285° | **chỉ** cho focus ring / lựa chọn đang chọn (không còn màu thương hiệu xanh dương riêng) |
| Phân hệ LX / VX / SQ / ST | `--dept-*` | **cùng L ≈ 0.72, cùng C ≈ 0.06**, 4 hue cách đều ~90° | màu nhạt, chỉ dùng cho chấm nhận diện + dải timeline mờ |
| Go | `--status-go` | xanh lục, C ≈ 0.14 | luôn kèm chữ GO |
| Standby | `--status-standby` | hổ phách, C ≈ 0.13 | luôn kèm chữ STBY |
| Hold | `--status-hold` | xanh dương nhạt, C ≈ 0.10 | |
| Overrun / lỗi | `--status-danger` | đỏ, C ≈ 0.17 | nhấp nháy chỉ khi Overrun |

Quy tắc: màu phân hệ **không được trùng hue** với 4 màu trạng thái; nếu buộc trùng thì phân hệ dùng độ nhạt khác (nền mờ 12% + viền) còn trạng thái dùng nền đặc.

## A4. Quy trình kiểm
1. Sinh dải OKLCH → hex bằng script (`scripts/gen_tokens`), không chỉnh tay hex.
2. Test tự động: mọi cặp (text token, surface token) được dùng thật phải đạt WCAG ≥ 4.5 (chữ thường) / 3 (UI) và báo APCA Lc.
3. Mô phỏng thiếu màu (protanopia/deuteranopia) cho Go/Standby/Overrun; xác nhận phân biệt được nhờ chữ/icon.
4. Chụp màn hình trước/sau ở 1280×800 và 960×600.

---

# PHẦN B. Hiển thị ánh sáng chính xác và pha màu

## B1. Hai họ pha màu
- **Cộng (additive):** RGB, RGBW, RGBA, RGBAL/RGBALC… Mỗi emitter là một nguồn sáng, tổng ánh sáng là phép cộng. Cho màu đậm tốt; thêm Amber/Lime/Cyan mở rộng gam pastel.
- **Trừ (subtractive):** CMY (đèn moving head dùng nguồn trắng + flag Cyan/Magenta/Yellow), gel/dichroic. Bắt đầu từ ánh sáng trắng rồi **lọc bớt**, nên màu đậm tốn nhiều lượng sáng.
- Cảnh báo từ nguồn: cùng một con số DMX trên hai họ đèn **không** cho cùng màu; màu thật còn phụ thuộc vào đèn cụ thể. Vì vậy mô hình dữ liệu phải lưu **ý định màu** (đích xy/RGB) và **phương thức pha**, không chỉ lưu 1 chuỗi hex.

## B2. Chế độ màu cần hỗ trợ trong dữ liệu cue
| Mode | Trường | Cách ra màu hiển thị |
|---|---|---|
| `rgb` | r,g,b 0–255 (hoặc hex) | giải mã sRGB → linear → nhân intensity |
| `rgbw` / `rgba` | + w / a | cộng thêm emitter trắng/hổ phách vào linear RGB (điểm xy từng emitter là tham số gần đúng) |
| `cmy` | c,m,y 0–100% | **[tổng hợp]** mô hình trừ gần đúng: kênh = (1 − c/m/y) trên ánh sáng trắng của đèn; ghi rõ là xấp xỉ |
| `kelvin` | K, tuỳ chọn tint | thuật toán Helland (B4) |
| `gel` | mã gel (Rosco/Lee/GamColor) | tra bảng xy + độ truyền sáng; thiếu dữ liệu thì dùng ước lượng và gắn cờ |
| `name` | "Amber", "CTO", "Đỏ"… | tra bảng tên → một trong các mode trên (cho importer) |

## B3. Pipeline hiển thị (quan trọng nhất)
```
giá trị cue (mode + kênh + intensity)
  → màu đích ở linear-light RGB   (giải mã gamma sRGB trước khi tính)
  → nhân intensity qua đường cong dimmer
  → CỘNG các chùm chồng nhau trong linear-light
  → gamut map (nếu vượt sRGB)
  → tone-map nhẹ (tránh cháy trắng) + bloom
  → mã hoá lại sang sRGB để hiển thị
```
Điểm then chốt:
1. **Pha màu và cộng ánh sáng phải làm trong linear RGB, không làm trên giá trị hex/gamma.** Cộng đỏ + lục trong sRGB-gamma cho vàng tối hơn sự thật. Trong SVG/CSS, các lớp beam nên dùng chế độ blend cộng (`mix-blend-mode: plus-lighter` hoặc `screen` làm xấp xỉ) trên nền tối, chứ không alpha-over thường.
2. **Intensity ≠ alpha tuyến tính.** Dimmer đèn sợi đốt không tuyến tính theo cảm nhận; **[tổng hợp]** dùng đường cong bình phương làm mặc định, cho phép đổi. Tuỳ chọn: đèn tungsten ngả ấm khi dim (≈ xuống 2200–2700K ở mức thấp).
3. **Vượt gam sRGB.** Lime, deep blue, laser, đỏ rất đậm nằm ngoài sRGB. Cách xử lý: giữ L và H, giảm C trong OKLCH cho tới khi vào gam (gamut mapping), và hiện **cảnh báo "màu thật rực hơn màn hình"** cạnh swatch. Không clip từng kênh vì sẽ lệch hue.
4. **Gel/dichroic tính theo nguồn sáng.** Datasheet Rosco/GamColor cho xy dưới tungsten (Source A) và D65 khác nhau; mặc định dùng Source A cho đèn tungsten/CTO, D65 cho LED trắng 6500K.
5. **Hiển thị luôn có swatch số.** Cạnh mỗi cue LX: ô màu + nhãn (ví dụ "R255 G90 B20", "3200K", "L201") để người vận hành không phải suy ra từ chùm sáng.
6. **Thông số xấp xỉ phải được ghi.** Không có đồ thị phổ thật của từng đèn, nên mô phỏng chỉ là "xem trước đáng tin cậy", không phải đo đạc. Ghi rõ ở UI.

## B4. Kelvin → RGB (Helland, 1000–40000K, xấp xỉ)
Với `t = K / 100`, kết quả kẹp về 0–255 **[công thức nhớ từ bài gốc, cần đối chiếu lại với bài Helland khi code]**:
- R: `t ≤ 66` → 255; ngược lại `329.698727446 · (t − 60)^−0.1332047592`
- G: `t ≤ 66` → `99.4708025861 · ln(t) − 161.1195681661`; ngược lại `288.1221695283 · (t − 60)^−0.0755148492`
- B: `t ≥ 66` → 255; `t ≤ 19` → 0; ngược lại `138.5177312231 · ln(t − 10) − 305.0447927307`

Kết quả này đã ở dạng sRGB-gamma; đổi sang linear trước khi nhân intensity/cộng chùm. Điểm kiểm: 2500K ≈ (255, 159, 70) theo một bản port Rust (`tempergb`). Test đơn vị nên có 2700K, 3200K, 5600K, 6500K và so sánh với bản tham chiếu.

## B5. xy → linear sRGB (cho gel và emitter)
**[tổng hợp]** Từ xy và Y: `X = Y·x/y`, `Z = Y·(1−x−y)/y`. Sau đó ma trận XYZ(D65) → linear sRGB:
```
R =  3.2406 X − 1.5372 Y − 0.4986 Z
G = −0.9689 X + 1.8758 Y + 0.0415 Z
B =  0.0557 X − 0.2040 Y + 1.0570 Z
```
Giá trị âm = ngoài gam sRGB → đưa qua bước gamut map (B3.3). Nếu xy đo dưới Source A, cần chuyển thích nghi sắc (Bradford) sang D65 trước; ghi chú trong code, có thể làm bản đơn giản trước.

## B6. Thuật ngữ nhanh
- **Additive/subtractive:** cộng emitter vs lọc bớt từ nguồn trắng.
- **CTO/CTB:** gel chuyển nhiệt độ màu (Orange/Blue).
- **xy (CIE 1931):** toạ độ sắc độ, không phụ thuộc độ sáng.
- **Gamut:** vùng màu một thiết bị hiển thị được.
- **Linear-light:** giá trị tỉ lệ thuận với năng lượng ánh sáng, nơi phép cộng có nghĩa vật lý.

## B7. Việc nguồn chưa trả lời (cần tự xác minh)
- Công thức/ngưỡng APCA chính xác và độ tương thích với CSS.
- Dữ liệu Roscolux/Lee đầy đủ; TM-30/CRI cho LED sân khấu.
- Kỹ thuật gamut mapping chuẩn của CSS Color 4 (nên đọc spec).
- Đường cong dimmer thực tế của từng loại đèn.
