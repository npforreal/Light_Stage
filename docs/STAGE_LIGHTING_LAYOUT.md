# Khoá học Bố trí Đèn & Sân khấu cho Sân khấu ảo 2D của Light Stage

> Mục đích: hiểu cách người làm đèn thật **đặt vị trí, hướng và vai trò** từng loại đèn/giàn truss/màn LED, để thiết kế lại Stage 2D cho hợp lý.
> Trung thực về nguồn: không có một khoá học duy nhất trên mạng; đây là giáo trình tự ghép từ các bài viết. Phần lớn nguồn về rig concert là blog nhà sản xuất (có thể thiên vị sản phẩm) và số liệu giữa các nguồn **không thống nhất**. Mục nào là kiến thức tổng hợp của tôi, chưa trích thẳng từ nguồn, được đánh dấu **[tổng hợp]**. Mọi con số cụ thể cần kiểm với bản vẽ rigging/datasheet của show thật.

## 0. Hiện trạng Stage 2D và vì sao thấy "không hợp lý"

Đọc từ `src/types/virtualStage.ts` và `VirtualStagePreview.tsx`, kết hợp quan sát trên browser:

| # | Vấn đề | Chi tiết |
|---|---|---|
| 1 | **Mọi chùm sáng đều toả xuống dưới** | Front view vẽ cone cố định từ mỗi đèn xuống (`trussY + 280`). Thực tế đèn back hắt **về phía khán giả**, đèn FOH hắt **về phía diễn viên** (góc ~45°), đèn side hắt **ngang sân khấu**. Hướng không đổi theo vị trí/loại đèn. |
| 2 | **FOH đặt trên sân khấu** | Top-down đặt "FOH Front Truss" ở `y=80%` *bên trong* hình chữ nhật sân khấu. FOH thật nằm **ngoài** sân khấu, phía khán giả. |
| 3 | **Truss giữa che màn LED** | Mid Truss (`y=35%`) cắt ngang trước màn Main LED trong front view, trong khi thực tế màn LED nằm sau/cạnh truss và đèn không che hình. |
| 4 | **Không có hệ trục sân khấu** | Không có plaster line, đường tâm, nhãn Stage Left/Right, Upstage/Downstage, khu vực diễn xuất; "trên/dưới" trong SVG không có nghĩa rõ. |
| 5 | **Số liệu mét bị bỏ phí** | `widthMeters/depthMeters` có nhưng vị trí chỉ là % tuỳ ý; không có độ cao treo (trim), không đo được khoảng cách/góc. |
| 6 | **Số đèn cố định, không theo cue** | `fixtureCount` cứng (12/8/16/8), không liên quan số lượng trong cue hay kiểm kê. Không có loại đèn thật (beam/spot/wash) với góc chùm khác nhau. |
| 7 | **Thiếu các vị trí treo thật** | Chỉ 4 loại: Back, Mid, FOH, Floor. Không có side boom/ladder, box boom, truss cánh, hàng LED bar, haze. |
| 8 | **Preset không khác nhau về logic** | Festival/Thrust chỉ đổi con số, không đổi cấu trúc (thrust cần khán giả 3 phía, FOH nhiều hướng). |

## 1. Lộ trình học (≈ 5 buổi)

| Buổi | Chủ đề | Học xong làm được gì |
|---|---|---|
| 1 | Hệ trục sân khấu: up/down, left/right, 9 khu vực | Đặt nhãn và lưới đúng quy ước |
| 2 | Hướng chiếu: front, back, side, McCandless | Biết đèn ở vị trí nào thì hắt hướng nào |
| 3 | Vị trí treo: truss, FOH, boom, floor | Chọn vị trí hợp lý cho từng nhóm đèn |
| 4 | Loại đèn: beam / spot / wash / blinder / strobe và góc chùm | Vẽ cone đúng góc và đúng vai trò |
| 5 | Bản vẽ light plot & đánh số (USITT) | Hiển thị/xuất sơ đồ theo quy ước nghề |

## 2. Hệ trục sân khấu (buổi 1)

- Hướng luôn tính theo **diễn viên đứng quay mặt về khán giả**: Stage Left (SL) là bên trái của diễn viên, tức bên **phải** của khán giả.
- **Upstage** là nửa phía sau (xa khán giả), **downstage** là nửa phía trước (gần khán giả). Thuật ngữ bắt nguồn từ sân khấu dốc thời xưa.
- Lưới **9 khu vực**: UR, UC, UL / R, C, L / DR, DC, DL (hoặc 5 cột nếu cần). Đèn được nhóm theo khu vực này (acting area).
- Lưu ý: lưới 9 ô là quy ước của sân khấu **proscenium (end stage)**; thrust, catwalk, in-the-round không có tường sau nên cách gọi thay đổi.
- Quy ước USITT dùng **plaster line** (mép proscenium) làm mốc để đánh số đèn FOH và đo khoảng cách; **centerline** (đường tâm) là trục đối xứng. **[tổng hợp]**: hai đường này nên là gốc toạ độ của mô hình dữ liệu (x tính từ centerline, y tính từ plaster line, z là độ cao).

Nguồn: [Backstage, 9 Main Theater Stage Positions](https://www.backstage.com/magazine/article/main-theater-stage-positions-77893/), [Revision World, nine stage positions](https://revisionworld.com/gcse-revision/drama-gcse-revision/nine-stage-positions), [Cursa, Upstage/Downstage/Stage Left](https://cursa.app/en/article/upstage-downstage-stage-left-theater-stage-map), [USITT Lighting Documentation RP](https://usitt.org/sites/default/files/2025-04/USITT%20-%20Lighting%20Documentation%20Recommended%20Practice%20%282%29.pdf).

## 3. Hướng chiếu sáng (buổi 2)

| Loại | Vai trò | Hướng/vị trí điển hình |
|---|---|---|
| **Front light** | Nhìn rõ mặt, hình khối | Từ phía khán giả, **~45° trên đầu** và **~45° sang bên** (McCandless: hai đèn cho mỗi khu vực, lệch nhau khoảng 90°) |
| **Back light** | Tách diễn viên khỏi nền, viền sáng quanh đầu và vai | Từ phía sau, trên cao, **~45° phía sau** đối xứng với front |
| **Side light** | Tạo khối, rất quan trọng với nhảy múa | Từ hai bên ngang tầm người (boom/ladder) |
| **Wash/Fill** | Phủ màu đều, làm nền | Rộng, mềm |
| **Beam/aerial effect** | Tia nhìn thấy trong khói | Hắt lên/ra khán giả hoặc chéo sân khấu |

- Ánh sáng chiếu thẳng từ phía trước làm phẳng khuôn mặt; từ thẳng trên đầu làm tối hốc mắt.
- McCandless thường dùng một đèn ấm (hổ phách nhạt) và một đèn lạnh (xanh nhạt). Các nguồn cảnh báo **45° chỉ là quy ước khởi điểm, không phải luật**, và cách gọi key/fill khác nhau giữa các tác giả.
- **Hệ quả cho mô phỏng:** hướng chiếu phải là thuộc tính của từng đèn (pan/tilt/azimuth, elevation) hoặc suy ra từ vai trò (front/back/side), không phải "luôn xuống dưới".

Nguồn: [ETC, Lighting Design Part 5: Lighting Angles](https://blog.etcconnect.com/stage-lighting-design-part-5), [Illuminated Integration, McCandless method](https://illuminated-integration.com/blog/mccandless-method-stage-lighting/), [On Stage Lighting, lighting the stage](https://onstagelighting.co.uk/lighting-design/lighting-the-stage/), [UMN Handbook of Dance Stagecraft](https://www.d.umn.edu/~mharvey/handbook5511.html), [Church Production, theatrical lighting](https://churchproduction.com/education/theatrical_lighting).

## 4. Vị trí treo đèn (buổi 3)

| Vị trí | Nằm ở đâu | Dùng cho | Ghi chú |
|---|---|---|---|
| **FOH (front of house)** | Phía khán giả: trần khán phòng, "beam", ban công/rail, truss FOH | Front light, follow spot | **Ngoài** sân khấu; góc gắn khuyến nghị 40–50° để chiếu mặt không gắt |
| **Back truss (upstage)** | Truss phía sau ban nhạc/diễn viên, thường cao nhất | Back light, beam, wash lên khán giả, strobe/blinder | Nhiều nguồn coi là vị trí chính của concert; không nên bỏ trống |
| **Mid/overhead truss** | Phía trên khu diễn chính | Spot/wash đổ xuống và chéo | Treo nhiều độ cao khác nhau để tạo chiều sâu |
| **Side boom / ladder / side arm** | Hai cánh, đứng thẳng | Side light | Đánh số từ **trên xuống dưới** |
| **Floor package** | Sàn, sát mép sân khấu hoặc sau LED | Blinder, strobe, up-light, shin-buster | Hắt lên hoặc ra khán giả |
| **Box boom / catwalk** | Bên hông khán phòng | Front chéo | Tuỳ nhà hát |

- Đối xứng (symmetry) trái/phải là mặc định; một nguồn gợi ý khung tối thiểu cho sân khấu nhỏ: 4 moving head ở mép downstage và các góc upstage.
- Số đèn mỗi truss **không có chuẩn chung**: các nguồn nói từ khoảng 6 đến 12 moving wash mỗi truss, hoặc 1 đèn mỗi 2–3 m bề rộng sân khấu (tối thiểu 4 đèn). Phải coi là gợi ý ban đầu, tính theo tải trọng truss và thiết kế thật.
- Bố cục festival 4 truss một nhà thiết kế mô tả: wash ở ba truss đầu, blinder ở truss phía trước, spot ở truss giữa, truss cuối dành cho banner.
- Cân bằng tải trên truss và tôn trọng tải trọng định mức của hãng truss. Đây là việc của kỹ sư rigging, ứng dụng chỉ nên **cảnh báo**, không thay thế.

Nguồn: [Live Design, Designing festival lighting](https://www.livedesignonline.com/designing-festival-lighting), [Chauvet Professional, Anatomy of a Rig (Halestorm)](https://www.chauvetprofessional.com/?p=88767), [SHEHDS, Concert Stage Lighting](https://shehds.com/blogs/news/concert-stage-lighting), [SHEHDS, bao nhiêu đèn cho festival](https://shehds.com/blogs/news/outdoor-music-festival-stage-lighting-setup-how-many-stage-lights-do-you-actually-need), [Ticket Fairy, Rigging 101](https://www.ticketfairy.com/da/blog/rigging-101-safely-hanging-lights-and-speakers-on-festival-stages.md), [Blue Room, basic lighting layout](https://www.blue-room.org.uk/topic/59541-basic-lighting-layout/).

## 5. Màn LED và quan hệ với đèn

- LED wall rất sáng; nhiều show phải **hạ độ sáng video** để cân bằng với đèn, và dựng rig vừa khít cấu trúc màn.
- **[tổng hợp]**: Màn LED thường đặt **sau** diễn viên (upstage) hoặc hai cánh; truss đèn đặt **trước hoặc trên** màn sao cho thân truss không che nội dung chính (trừ khi truss nằm sau màn trong suốt). Đèn back truss đặt cao hơn mép trên màn hoặc ngay trước màn.
- Với màn lớn gần khán giả: chọn pitch mịn hoặc nâng/lùi màn để hàng ghế đầu không quá sát. Số trim và khoảng cách phải lấy từ bản vẽ nhà sản xuất/rigging, nguồn tìm được **không** đưa con số chuẩn.

Nguồn: [Live Design, Building Mothership](https://www.livedesignonline.com/building-mothership), [Ticket Fairy, festival sightlines](https://branded.ticketfairy.com/blog/festival-sightlines-and-viewing-angles-designing-for-audience-experience), [Ticket Fairy, Projection & LED for festivals](https://www.ticketfairy.com/blog/projection-led-for-festivals-content-pipelines-that-dont-break.md).

## 6. Loại đèn và góc chùm (buổi 4)

| Loại | Góc chùm điển hình (nguồn khác nhau) | Đặc trưng | Cách vẽ cone |
|---|---|---|---|
| **Beam** | ~2–5° | Tia mảnh như laser, nhìn rõ trong khói | Cone rất hẹp, kéo dài, độ sáng đậm |
| **Spot** | ~8–20° (một nguồn nói 1,5–15°) | Điểm sáng sắc nét, gobo, pick-out | Cone vừa, mép rõ |
| **Wash** | ~10–60° (hay 25–60°+) | Phủ màu mềm, đều | Cone rộng, mép mờ |
| **Hybrid/zoom** | 3° đến 45° | Đổi giữa beam và wash | Góc là tham số có thể đổi theo cue |
| **Blinder / Strobe** | nguồn tìm được chưa mô tả | **[tổng hợp]**: blinder là nguồn sáng ấm rộng chiếu thẳng khán giả, strobe là nháy sáng | Cone rất rộng, cường độ/nháy theo hiệu ứng |
| **Follow spot** | **[tổng hợp]** góc hẹp, người điều khiển | Theo diễn viên từ FOH | Cone từ FOH tới điểm di chuyển |

- Số liệu góc giữa các nguồn khác nhau, nên lưu trong dữ liệu dạng **mặc định có thể sửa** (mỗi loại một giá trị), không hard-code.
- Haze/khói quyết định tia có nhìn thấy không; nên có công tắc "Haze" ảnh hưởng độ rõ của cone.

Nguồn: [Bounce, Spot/Beam/Wash/Hybrid](https://bounceonline.co.za/moving-heads-spot-beam-wash-and-hybrid), [Betopper, Beam vs Spot vs Wash](https://betopperdj.com/blogs/news/beam-spot-wash-what-s-the-actual-difference-a-practical-guide-for-djs-and-lighting-designers), [Uplus, choose beam spot wash](https://www.upluslighting.com/article/choose-beam-spot-wash-led-moving-heads/), [Stage Supply, moving heads buying guide](https://stagesupply.co.uk/?p=164197).

## 7. Light plot và đánh số theo USITT (buổi 5)

- Light plot là bản vẽ tổng hợp cho biết mỗi đèn **treo ở đâu, hướng đâu, màu gì, mạch nào**.
- Bản vẽ nên thể hiện: vị trí treo có sẵn (rails, booms, side arms, catwalk), khu vực diễn, mốc **centerline và plaster line**.
- **Ký hiệu** phải thể hiện đúng kích thước/hình dạng tương đối của đèn; ống/pipe vẽ màu đen; chỉ dùng màu tiết kiệm để làm rõ thông tin.
- **Đánh số:** onstage electrics và onstage booms đánh từ **downstage → upstage**; vị trí chia theo SL/SR (nêu SL trước); đèn FOH song song centerline đánh từ gần plaster line; đèn trên boom đứng đánh **từ trên xuống dưới**.
- Có thêm mặt cắt (section) dọc theo centerline cho biết cao độ treo so với phông cảnh và kiến trúc.
- **Gói tài liệu** có thể gồm light plot, section, bảng đèn (instrument schedule), chi tiết LED tape/boom.
- Chưa tìm được ký hiệu chuẩn cho LED wall hay floor package; dùng quy ước riêng của show và ghi chú vào legend.

Nguồn: [USITT Lighting Documentation RP (2025)](https://usitt.org/sites/default/files/2025-04/USITT%20-%20Lighting%20Documentation%20Recommended%20Practice%20%282%29.pdf), [USITT Lighting Documentation RP review draft 2024](https://www.usitt.org/sites/default/files/2024-10/USITT%20Lighting%20Documentation%20RP-Review%20Draft%202024-10-17.pdf), [USITT Lighting Design Graphics](https://www.stagelightingprimer.com/USITT_Lighting_Design_Graphics.pdf), [Sundrax, Building a Stage Lighting Plot](https://entertainment.sundrax.com/blog/building-stage-lighting-plot-step-by-step-guide-beginners).

## 8. Áp dụng cho mô hình dữ liệu và hiển thị của Light Stage

### 8.1 Mô hình dữ liệu đề xuất **[tổng hợp]**
- **Toạ độ thật theo mét:** `x` từ centerline (âm = SL từ góc nhìn diễn viên), `y` từ plaster line (âm = phía khán giả/FOH, dương = upstage), `z` = cao độ treo (trim). Phần trăm chỉ là cách hiển thị.
- **Vị trí treo (`RigPosition`)**: `FOH`, `Truss` (Back/Mid/…), `SideBoom`, `Ladder`, `Floor`, `BoxBoom`; có `zone` (SL/SR/C), `trim`, `loadLimit?`.
- **Đèn (`Fixture`)**: `type` (Beam/Spot/Wash/Blinder/Strobe/Follow/Par), `beamAngle` (mặc định theo loại, sửa được), `role` (front/back/side/wash/effect/aerial), `aim` (azimuth, elevation hoặc điểm nhắm theo khu vực 9 ô), `groupId`.
- **Màn LED**: có `z`, `depth` (khoảng cách tới plaster line), mặt hướng về đâu.
- **Preset kiến trúc** có cấu trúc riêng: End Stage (khán giả 1 phía), Thrust/Catwalk (nhiều phía, FOH nhiều hướng), Festival (nhiều truss, side tower).

### 8.2 Quy tắc hiển thị
1. Top-down: vẽ **centerline, plaster line, nhãn SL/SR/US/DS, lưới 9 khu vực**, vùng **khán giả** bên ngoài; FOH nằm ngoài khung sân khấu.
2. Cone vẽ theo `aim` và `beamAngle`; front view vẽ chiếu bằng phối cảnh đơn giản (hướng về khán giả/diễn viên), không chỉ cone xuống dưới.
3. Màu cone theo pipeline màu của Đợt 7 (cộng sáng trong linear); độ rõ của tia phụ thuộc haze.
4. Số đèn sáng trong từng nhóm tỉ lệ với `fixtureCount` của cue và kiểm kê; không vượt số đèn của rig.
5. Truss không vẽ đè lên nội dung màn LED; truss trước màn vẽ mỏng/mờ hoặc xếp theo trim.
6. Chế độ xem "Light plot (USITT-lite)": ký hiệu theo loại, đánh số theo quy tắc downstage→upstage và SL trước, xuất cùng báo cáo.
7. Cảnh báo (không chặn): truss quá nhiều đèn so với `loadLimit`, bố cục lệch trái/phải, thiếu back light hay front light cho khu vực diễn chính.

### 8.3 Việc nguồn chưa trả lời (cần tự xác minh)
- Trim và khoảng cách chuẩn giữa truss và màn LED; tải trọng thực tế.
- Mô tả chính thức của blinder/strobe trong light plot; ký hiệu LED wall.
- Số đèn mỗi truss theo quy mô show (mỗi nguồn khác nhau, chủ yếu là blog nhà sản xuất).
- Luật 45° chỉ là quy ước; có thể cần ghi chú trong UI.
