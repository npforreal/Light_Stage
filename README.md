# Light Stage 🎭✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: Tauri v2](https://img.shields.io/badge/Framework-Tauri%20v2-24C8DB.svg?logo=tauri)](https://v2.tauri.app/)
[![Frontend: React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react)](https://react.dev/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript%205.7-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Styling: TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v3-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests: 99/99 Passing](https://img.shields.io/badge/Tests-99%2F99%20Passed-brightgreen.svg)]()

> **Light Stage** là ứng dụng desktop siêu nhẹ (Offline-First) chuyên dụng cho **Điều phối Sân khấu & Show Calling** (Stage Management & Live Show Control) trên **macOS** và **Windows**. Ứng dụng hỗ trợ hiển thị kịch bản cue rundown, đếm tự động thiết bị đèn/màn hình LED, chế độ hiển thị kép (Dual View: Bảng Rundown & Dải Timeline), sân khấu ảo 2D và hệ thống phím tắt tiêu chuẩn phòng điều khiển.

---

## 📑 Mục Lục

- [Phần 1: Hướng Dẫn Cho Người Dùng (Non-Tech Guide)](#phần-1-hướng-dẫn-cho-người-dùng-non-tech-guide)
  - [1. Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
  - [2. Tải về & Cài đặt](#2-tải-về--cài-đặt)
  - [3. Giao diện làm việc](#3-giao-diện-làm-việc)
  - [4. Nhập kịch bản (Thủ công hoặc từ Excel/CSV)](#4-nhập-kịch-bản-thủ-công-hoặc-từ-excelcsv)
  - [5. Tính năng tự động đếm đèn & màn hình LED](#5-tính-năng-tự-động-đếm-đèn--màn-hình-led)
  - [6. Điều khiển trực tiếp trong Live Show (Show Calling)](#6-điều-khiển-trực-tiếp-trong-live-show-show-calling)
  - [7. Sân khấu ảo 2D (Virtual Stage Preview)](#7-sân-khấu-ảo-2d-virtual-stage-preview)
  - [8. Xuất báo cáo & Lưu trữ file dự án](#8-xuất-báo-cáo--lưu-trữ-file-dự-án)
- [Phần 2: Hướng Dẫn Cho Lập Trình Viên (Developer Guide)](#phần-2-hướng-dẫn-cho-lập-trình-viên-developer-guide)
  - [1. Kiến trúc hệ thống](#1-kiến-trúc-hệ-thống)
  - [2. Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
  - [3. Yêu cầu môi trường](#3-yêu-cầu-môi-trường)
  - [4. Khởi chạy & Phát triển](#4-khởi-chạy--phát-triển)
  - [5. Kiểm thử & Kiểm soát chất lượng](#5-kiểm-thử--kiểm-soát-chất-lượng)
  - [6. Đóng gói ứng dụng Desktop](#6-đóng-gói-ứng-dụng-desktop)
  - [7. Quy chuẩn đóng góp mã nguồn](#7-quy-chuẩn-đóng-góp-mã-nguồn)
- [Chính sách Bảo mật & Giấy phép](#chính-sách-bảo-mật--giấy-phép)

---

# Phần 1: Hướng Dẫn Cho Người Dùng (Non-Tech Guide)

> Dành cho Đạo diễn sân khấu, Stage Manager (Show Caller), Kỹ thuật viên Ánh sáng (LX), Màn hình Visual LED (VX), Âm thanh (SQ) và Điều phối viên sự kiện.

### 1. Giới thiệu tổng quan

Trong một buổi biểu diễn trực tiếp hoặc sự kiện quy mô lớn, việc phối hợp nhịp nhàng giữa các bộ phận Âm thanh, Ánh sáng, Màn hình LED và Diễn viên là yếu tố quyết định thành bại. **Light Stage** được thiết kế để giải quyết các khó khăn thường gặp:
- **Không còn lúng túng khi gọi cue**: Giao diện trực quan hiển thị rõ từng trạng thái: chuẩn bị (*Standby*), kích hoạt (*GO*), giữ nhịp (*Hold*) hay bỏ qua (*Skip*).
- **Tự động đếm trang thiết bị**: Chỉ cần dán bảng kịch bản từ Excel/CSV, hệ thống tự động bóc tách và tính toán xem show đang dùng bao nhiêu đèn Beam, Spot, Par LED, bao nhiêu màn hình cánh/màn hình chính.
- **Mô phỏng 2D trực quan**: Xem sơ đồ sân khấu phát sáng và đổi màu tức thì khi gọi lệnh GO, giúp đạo diễn quan sát trước hiệu ứng thị giác.
- **An toàn tuyệt đối**: Chạy 100% Offline (không sợ mất mạng), tính năng tự động sao lưu chống mất nguồn và chế độ khóa an toàn chống bấm nhầm phím trong phòng tối.

> **Phạm vi của bản hiện tại (Scope)**
> Light Stage là công cụ **rundown + show-calling + preview**: quản lý kịch bản, gọi cue (GO / Standby / Hold), đếm thời gian và mô phỏng sân khấu. Lệnh GO **không** truyền tới thiết bị thật.
> Chưa hỗ trợ xuất điều khiển **DMX / sACN / Art-Net / OSC / MIDI**.
> Import nhận **CSV / TSV / TXT** hoặc dán bảng sao chép từ Excel / Google Sheets; **chưa đọc trực tiếp file `.xlsx`** (hãy lưu sang CSV/TSV trước).

---

### 2. Tải về & Cài đặt

1. Truy cập mục **[Releases](https://github.com/npforreal/Light_Stage/releases)** của dự án.
2. Tải bản cài đặt phù hợp với máy tính của bạn:
   - **macOS**: Tải tệp `.dmg` (hỗ trợ cả chip Apple Silicon M1/M2/M3/M4 và Intel). Mở tệp `.dmg` và kéo biểu tượng **Light Stage** vào thư mục `Applications`.
   - **Windows**: Tải tệp `.msi` hoặc `.exe` (hỗ trợ Windows 10/11 64-bit). Chạy bộ cài đặt và làm theo hướng dẫn trên màn hình.
3. Mở ứng dụng **Light Stage** để bắt đầu làm việc. Ứng dụng không yêu cầu đăng nhập tài khoản hay kết nối Internet.

---

### 3. Giao diện làm việc

Giao diện của Light Stage được thiết kế theo tông nền tối (Dark Theme) tối ưu cho không gian phòng điều khiển:

```
+-----------------------------------------------------------------------------------------+
| [LOGO] Light Stage | Show: Đại Nhạc Hội | Master Clock: 00:15:20 | Delta: +00:00:30 | 🔓 |
+-----------------------------------------------------------------------------------------+
| [Rundown Table]  [Timeline Tracks]  [Stage 2D]  [Split View] | [+ Cue] [Import] [Export]|
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  Khu vực hiển thị chính (Bảng kịch bản / Dải Timeline / Sân khấu ảo 2D)                 |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| [Spacebar: GO]   [B: Standby]   [Up/Down: Chuyển Cue]   [Esc: Tạm dừng/Hold]            |
+-----------------------------------------------------------------------------------------+
```

- **Thanh tiêu đề (Header Bar)**:
  - Hiển thị tên chương trình, ngày biểu diễn.
  - **Đồng hồ thực (Wall Clock)**: Giờ hiện tại theo thời gian thực.
  - **Master Elapsed Clock**: Tổng thời gian chương trình đã chạy từ lúc bấm Play.
  - **Active Cue Countdown**: Thời gian đếm ngược của cue đang kích hoạt.
  - **Delta Time (Độ lệch thời gian)**: Cảnh báo show đang chạy sớm (+) hay trễ (-) bao nhiêu giây so với kịch bản gốc.
  - **Biểu tượng Ổ khóa (Operator Lock)**: Bật/tắt chế độ khóa an toàn.
- **Thanh chuyển đổi chế độ xem (View Mode Switcher)**:
  - **Rundown Table**: Xem bảng kịch bản chi tiết theo từng dòng cue.
  - **Timeline Tracks**: Xem dải thời gian tuyến tính trực quan cho 4 làn (Master, LX, VX, SQ).
  - **Stage 2D**: Xem mô phỏng 2D tương tác của màn hình LED và giàn đèn.
  - **Dual Split**: Hiển thị song song Bảng kịch bản và Sân khấu ảo trên cùng một màn hình.

---

### 4. Nhập kịch bản (Thủ công hoặc từ Excel/CSV)

Bạn có thể xây dựng kịch bản biểu diễn bằng 2 cách:

#### Cách 1: Nhập từ file CSV / TSV (Xuất từ Excel hoặc Google Sheets)
1. Bấm nút **Import** trên thanh công cụ.
2. Kéo thả file `.csv` / `.tsv` (hoặc dán trực tiếp dữ liệu dạng bảng sao chép từ Excel / Google Sheets).
3. Hệ thống sẽ tự động phát hiện các cột tương ứng:
   - `Cue / Số thứ tự`: Số hiệu cue (ví dụ: `1.0`, `1.1`, `2.0`).
   - `Tiêu đề / Tên tiết mục`: Tên phân cảnh (ví dụ: `Intro Mở Màn`, `Ca khúc 1`).
   - `Thời lượng`: Hỗ trợ đa dạng cách viết thời gian:
     - `00:03:30` (3 phút 30 giây)
     - `3m20s` hoặc `180s`
     - `2 phút 30 giây`
   - `Ánh sáng (LX)`: Mô tả hiệu ứng đèn và số lượng fixture.
   - `Màn hình (VX)`: Tên clip visual hoặc số lượng màn hình LED.
   - `Âm thanh (SQ)`: Tên bài nhạc, hiệu ứng sound effect, mic diễn viên.
   - `Sân khấu (ST)`: Di chuyển của MC, ca sĩ hoặc đạo cụ.

#### Cách 2: Nhập thủ công
- Bấm nút **+ Cue** để thêm một dòng cue mới vào phân đoạn (Act) hiện tại.
- Bấm đúp vào ô tiêu đề hoặc thời lượng để chỉnh sửa trực tiếp nội dung (Inline edit).

---

### 5. Tính năng tự động đếm đèn & màn hình LED

Bạn không cần lập một bảng tính riêng để đếm số lượng bóng đèn hay màn hình. Hệ thống tích hợp sẵn công nghệ nhận diện thông minh:

- **Đèn sân khấu**: Khi bạn nhập text tự do vào cột Ánh sáng (LX):
  - Ví dụ: `4 Beam 350W + 2 Follow + 8 Par LED`
  - Hệ thống tự động bóc tách:
    - 4 Đèn Beam
    - 2 Đèn Follow
    - 8 Đèn Par LED
- **Màn hình LED**: Khi nhập vào cột Visual (VX):
  - Ví dụ: `Màn LED Main hiển thị visual vũ trụ + 2 LED Cánh loop logo`
  - Hệ thống tự động ghi nhận: 1 Màn hình chính, 2 Màn hình cánh.
- **Xem thống kê**:
  - Tại bảng điều khiển, bạn có thể xem ngay **Tải đỉnh (Peak Concurrent Usage)** — thời điểm nào trong show tiêu thụ lượng đèn lớn nhất, và **Tổng trang thiết bị show**.

---

### 6. Điều khiển trực tiếp trong Live Show (Show Calling)

Trong lúc chương trình đang diễn ra, bạn có thể gọi lệnh cực kỳ nhanh chóng:

#### 1. Các trạng thái Cue
- 🟡 **STANDBY (Hổ phách)**: Báo cho kỹ thuật viên chuẩn bị sẵn sàng cho cue kế tiếp.
- 🟢 **GO (Xanh lá - Active)**: Kích hoạt chạy cue. Đồng hồ đếm ngược bắt đầu chạy, sân khấu 2D bật sáng.
- 🔴 **HOLD (Đỏ - Tạm dừng)**: Giữ trạng thái khẩn cấp khi MC hoặc ca sĩ kéo dài thời gian giao lưu.
- ⚪ **COMPLETED (Xám)**: Cue đã diễn ra xong.
- ⚪ **SKIPPED**: Bỏ qua cue nếu chương trình bị cắt bớt tiết mục.

#### 2. Phím tắt bàn phím (Chuẩn quốc tế)
| Phím tắt | Thao tác | Mô tả |
| :--- | :--- | :--- |
| **`Spacebar` (Phím cách)** | **GO** | Kích hoạt ngay cue đang Standby hoặc cue kế tiếp |
| **`B`** | **STANDBY** | Đặt cue tiếp theo vào trạng thái sẵn sàng |
| **`Mũi tên Xuống` (↓)** | **Next Cue** | Chọn cue tiếp theo trong danh sách |
| **`Mũi tên Lên` (↑)** | **Prev Cue** | Chọn lại cue trước đó |
| **`Esc`** | **Hold / Tạm dừng** | Tạm dừng hoặc giữ nhịp cue hiện tại |

#### 3. Chế độ Khóa An Toàn (Operator Lock Mode) 🔒
- Trước khi show chính thức bắt đầu, bấm vào biểu tượng **Ổ khóa** ở góc trên bên phải để kích hoạt **Operator Lock**.
- Khi khóa bật, tất cả các phím bấm và thao tác chỉnh sửa vô tình trên bàn phím sẽ bị vô hiệu hóa, đảm bảo **không ai có thể lỡ tay bấm nhầm** làm thay đổi kịch bản giữa show.

---

### 7. Sân khấu ảo 2D & Hệ Thống Khoa Học Màu Sắc (Color Science)

Chế độ xem **Stage 2D** mô phỏng không gian biểu diễn trực tiếp với độ chính xác quang học cao:
- **Thư viện Preset bố cục**:
  - `End Stage (Tiêu chuẩn)`: Sân khấu hộp chữ nhật truyền thống cho hội nghị, nhà hát.
  - `Festival / Concert`: Sân khấu ngoài trời với hệ thống màn hình cánh lớn và giàn đèn truss đa tầng.
  - `Arena / Thrust`: Sân khấu có sàn catwalk nhô ra giữa khán giả.
- **Hai góc nhìn camera**:
  - **Mặt trước (Front View)**: Nhìn trực diện từ phía khán phòng FOH về sân khấu.
  - **Từ trên xuống (Top-down View)**: Nhìn sơ đồ mặt bằng kỹ thuật bố trí vị trí các giàn đèn và màn hình.
- **Hệ thống Khoa học Màu & Mô phỏng Quang học (Color Science Pipeline)**:
  - **Không gian màu OKLCH & Tuyến tính (Linear Light)**: Quá trình pha màu, cộng sáng chùm đèn chồng nhau diễn ra trong không gian ánh sáng tuyến tính (Linear RGB + Tone mapping Reinhard), phản ánh trung thực hiện tượng quang học thực tế (pha màu đỏ + lục tạo ánh sáng vàng rực rỡ, không bị xỉn màu như cộng gamma).
  - **Đa dạng nguồn màu**: Hỗ trợ nhiệt độ màu Kelvin (1000K–40000K, thuật toán Helland), lọc màu CMY, hệ đèn đa emitter RGBW/RGBA và gel màu sân khấu (Lee Filters, Rosco Supergel).
  - **Gamut Mapping thông minh**: Tự động đưa các màu laser/LED bão hòa cao vượt gam sRGB về vùng hiển thị an toàn bằng cách giữ nguyên Độ sáng ($L$) và Sắc thái ($h$), giảm Độ bão hòa ($C$) trong không gian OKLCH. Kèm cờ cảnh báo *"Màu vượt gam sRGB (thực tế rực rỡ hơn)"*.
  - **Độ tin cậy giao diện**: Thiết kế hệ thống semantic tokens OKLCH tối ưu phòng điều khiển tối, đạt chuẩn tương phản cao WCAG 2.2 ($\ge 4.5:1$) và APCA ($L_c \ge 75$), đảm bảo người khiếm thị màu (protanopia/deuteranopia) vẫn phân biệt chính xác trạng thái show nhờ nhãn trạng thái và biểu tượng đi kèm.
  - *Tham khảo tài liệu chuyên sâu*: [Giáo trình Khoa học Màu Sắc Stage & Live Show](docs/COLOR_COURSE.md).
  - *Lưu ý*: Mô phỏng trên đồ họa 2D là xấp xỉ quang học, không thay thế hoàn toàn máy đo phổ hay thiết kế DMX thực địa.

---

### 8. Xuất báo cáo & Lưu trữ file dự án

#### Xuất Báo Cáo (In PDF & Excel)
Bấm nút **Export** trên thanh công cụ để mở hộp thoại xuất báo cáo:
- **In Run of Show (ROS) ra PDF**:
  - Hệ thống tạo ra một trang in chuẩn khổ giấy A4 ngang (Landscape) cực kỳ sắc nét.
  - Có thể lọc riêng bản in cho từng bộ phận:
    - *Bản in Tổng thể (Master Cue Sheet)*: Đầy đủ các phân hệ cho Đạo diễn.
    - *Bản in Ánh sáng (LX Sheet)*: Chỉ chứa thông tin đèn và hiệu ứng.
    - *Bản in Màn hình (VX Sheet)*: Dành riêng cho kỹ thuật viên visual LED.
    - *Bản in Âm thanh (SQ Sheet)*: Dành cho bàn mixer âm thanh.
- **Xuất bảng tính CSV/Excel**:
  - Xuất toàn bộ kịch bản đã chuẩn hóa hoặc Bảng tổng hợp số lượng thiết bị show (đã mã hóa chuẩn UTF-8 BOM, mở bằng Excel không bao giờ bị lỗi font tiếng Việt).

#### Lưu trữ file dự án `.lightstage`
- Toàn bộ dữ liệu show, cài đặt sân khấu và ghi chú được lưu trong tệp độc lập có đuôi `.lightstage`.
- Bạn có thể gửi tệp này qua email hoặc USB cho các thành viên khác trong ekip để cùng mở trên máy của họ.
- **Cơ chế Auto-save**: Ứng dụng tự động lưu liên tục từng giây vào bộ nhớ máy, nếu mất điện đột ngột hoặc tắt máy bất ngờ, khi mở lại phần mềm toàn bộ kịch bản và tiến độ đang chạy sẽ được khôi phục ngay lập tức.

---

# Phần 2: Hướng Dẫn Cho Lập Trình Viên (Developer Guide)

> Dành cho kỹ sư phần mềm phát triển, bảo trì và tích hợp hệ thống.

### 1. Kiến trúc hệ thống

Light Stage được xây dựng trên nền tảng **Tauri v2**, kết hợp sức mạnh tối ưu tài nguyên của **Rust** ở tầng backend và sự linh hoạt của **React 19 / TypeScript** ở tầng frontend:

```
+-------------------------------------------------------------------------------+
|                       REACT 19 + TYPESCRIPT FRONTEND                          |
|                                                                               |
|  [Components]      RundownTable, TimelineTracks, VirtualStagePreview         |
|  [State Engine]    Zustand (useShowStore, useClockStore, useStageStore)       |
|  [Domain Logic]    Hardware Regex Parser, Time Formatter, Importer, Exporter  |
|  [Styling]         TailwindCSS v3 + Lucide Icons                              |
+-------------------------------------------------------------------------------+
                                    | IPC Boundary
+-------------------------------------------------------------------------------+
|                           TAURI v2 (RUST CORE)                                |
|                                                                               |
|  [Native Window]   macOS WebKit / Windows WebView2                            |
|  [OS Integration]  Native File Dialogs, System Clocks, File I/O               |
+-------------------------------------------------------------------------------+
```

- **Tối ưu RAM/CPU**: Giao diện không sử dụng các thư viện biểu đồ hay engine 3D cồng kềnh; toàn bộ Timeline và Sân khấu ảo 2D được vẽ bằng **SVG nguyên bản** (60fps, bundle chỉ ~314kB).
- **Phân tách Store**: 
  - `useShowStore`: Quản lý danh sách Cues, Acts, logic playback state machine và thống kê tải thiết bị.
  - `useClockStore`: Quản lý đồng hồ thời gian thực tần số cao (100ms) độc lập, tránh hiện tượng re-render thừa sang bảng rundown.
  - `useStageStore`: Quản lý cấu hình màn hình LED, vị trí giàn truss và góc nhìn camera sân khấu.

---

### 2. Cấu trúc thư mục

```
Light_Stage/
├── src/
│   ├── components/            # UI Components
│   │   ├── export/            # Hộp thoại in PDF & xuất Excel/CSV
│   │   ├── importer/          # Hộp thoại import CSV & ánh xạ cột
│   │   ├── rundown/           # Bảng Rundown Table & Cue Row
│   │   ├── stage/             # Sân khấu ảo 2D SVG (Front & Top-Down)
│   │   └── timeline/          # Dải Timeline Tracks tuyến tính
│   ├── services/              # Business Logic & Core Services
│   │   ├── exporter.ts        # Service xuất báo cáo CSV & HTML Print
│   │   ├── hardwareParser.ts  # Bộ phân tích Regex bóc tách số lượng đèn/LED
│   │   ├── importer.ts        # Parser đọc CSV & phân tích định dạng thời gian
│   │   └── persistence.ts     # Engine lưu file .lightstage & auto-save
│   ├── store/                 # Zustand Stores
│   │   ├── useClockStore.ts   # Đồng hồ Master, Countdown, Delta Time
│   │   ├── useShowStore.ts    # State machine điều phối Show & Cue
│   │   └── useStageStore.ts   # Presets & bố cục sân khấu 2D
│   ├── types/                 # TypeScript Domain Definitions
│   │   ├── stage.ts           # Schema Show, Act, Cue, DepartmentCue
│   │   └── virtualStage.ts    # Schema Screen, Truss, StagePreset
│   ├── App.tsx                # Giao diện chính & tích hợp Hotkeys
│   └── main.tsx               # Điểm khởi động React
├── src-tauri/                 # Rust Backend (Tauri v2)
│   ├── src/lib.rs             # Rust handlers
│   └── tauri.conf.json        # Cấu hình cửa sổ & quyền hạn native
├── scripts/                   # Công cụ quản lý chất lượng tự động
│   ├── check.sh               # Fast quality gate (type-check, tests, audit)
│   ├── audit_workflow.py      # Bộ quét sức khỏe token & workflow
│   ├── archive_logs.py        # Tự động lưu trữ log không mất mát
│   └── handoff.py             # Trích xuất snapshot bàn giao phiên
├── archive/                   # Lịch sử các đợt phát triển đã lưu trữ
├── AGENTS.md                  # Quy chuẩn kỹ thuật & ngữ cảnh cho AI agent
├── PLAN.md                    # Kế hoạch phát triển đợt hiện tại
└── PROGRESS.md                # Nhật ký tiến độ đảo ngược thời gian
```

---

### 3. Yêu cầu môi trường

Để phát triển và biên dịch Light Stage, máy tính của bạn cần cài đặt:
- **Node.js**: Phiên bản `18.0.0` trở lên (khuyên dùng Node 20 LTS).
- **npm**: Phiên bản `9.0.0` trở lên.
- **Rust Toolchain** *(Bắt buộc nếu muốn biên dịch gói cài đặt Tauri native)*:
  - Cài đặt qua [rustup.rs](https://rustup.rs/): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
  - macOS: Cần cài đặt Xcode Command Line Tools (`xcode-select --install`).
  - Windows: Cần cài đặt C++ Build Tools (qua Visual Studio Installer) và WebView2 Runtime.

---

### 4. Khởi chạy & Phát triển

1. **Clone repository**:
   ```bash
   git clone https://github.com/npforreal/Light_Stage.git
   cd Light_Stage
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Chạy ở chế độ Web Development (Nhanh nhất để code UI/Logic)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại địa chỉ: `http://localhost:5173`.

4. **Chạy ở chế độ Desktop App với Tauri v2**:
   ```bash
   npm run tauri dev
   ```
   Lệnh này sẽ khởi tạo Webview native cùng với backend Rust.

---

### 5. Kiểm thử & Kiểm soát chất lượng

Dự án áp dụng quy chuẩn kiểm thử nghiêm ngặt:

- **Chạy toàn bộ Unit Tests (Vitest)**:
  ```bash
  npm test
  ```
  *(Hiện tại 14 test suites với 74/74 unit tests bao phủ 100% domain models, regex parser, time parser, state transitions, stress test 1000+ cues, và xuất file).*

- **Chạy kiểm tra kiểu tĩnh (TypeScript Type Check)**:
  ```bash
  npm run type-check
  ```

- **Chạy Cổng Kiểm Soát Nhanh (Fast Quality Gate)**:
  ```bash
  bash scripts/check.sh --fast
  ```
  Script này sẽ tự động chạy: Type Check ➔ Unit Tests ➔ Workflow Audit Doctor.

- **Quét sức khỏe Workflow & Token**:
  ```bash
  python3 scripts/audit_workflow.py
  ```

---

### 6. Đóng gói ứng dụng Desktop

Để tạo bản cài đặt phân phối chính thức cho người dùng cuối:

1. **Biên dịch bundle frontend**:
   ```bash
   npm run build
   ```

2. **Biên dịch bộ cài đặt native qua Tauri CLI**:
   ```bash
   npm run tauri build
   ```
   Tệp đầu ra sẽ nằm tại thư mục `src-tauri/target/release/bundle/`:
   - Trên **macOS**: `dmg/Light Stage_0.1.0_universal.dmg` (hoặc `.app`).
   - Trên **Windows**: `msi/Light Stage_0.1.0_x64_en-US.msi` (hoặc `.exe`).

---

### 7. Quy chuẩn đóng góp mã nguồn

- **Conventional Commits**: Tất cả commit phải tuân thủ chuẩn commit rõ ràng:
  - `feat(...)`: Thêm tính năng mới.
  - `fix(...)`: Sửa lỗi.
  - `test(...)`: Bổ sung hoặc cập nhật bài kiểm thử.
  - `docs(...)`: Cập nhật tài liệu hướng dẫn.
  - `refactor(...)`: Tối ưu mã nguồn nhưng không đổi hành vi.
- **Git Pre-commit Hook**: Dự án đã tích hợp sẵn `.git/hooks/pre-commit` tự động chặn commit nếu phát hiện rò rỉ mã bí mật (`.env`, private keys) và tự động kích hoạt `check.sh --fast`.

---

## 🔒 Chính sách Bảo mật & Giấy phép

- **Bảo mật**: Xem chi tiết tại [SECURITY.md](SECURITY.md). Mọi phát hiện về lỗ hổng an toàn vui lòng báo cáo có trách nhiệm qua GitHub Security Advisories hoặc email bảo mật.
- **Giấy phép bản quyền**: Dự án được phân phối dưới giấy phép mã nguồn mở **MIT License**. Xem chi tiết tại tệp [LICENSE](LICENSE).

---

*Phát triển và bảo trợ kỹ thuật bởi [npforreal](https://github.com/npforreal) & Light Stage Contributors.*
