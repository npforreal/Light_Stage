# Kiến trúc Dự án (ARCHITECTURE.md) — Light Stage

Bản đồ cấu trúc hệ thống dành cho **Developer** và **AI Agent**: giải thích vị trí mã nguồn, cách thức kiểm thử, và đăng ký các công cụ tự động hóa.

## 1. Tổng quan Dự án

- **Tên dự án**: Light Stage (Desktop App cho điều phối sự kiện & sân khấu trực tiếp).
- **Tech Stack**:
  - **Desktop Backend**: Tauri v2 (Rust) — native windowing, siêu nhẹ, tối ưu RAM/CPU cho show live.
  - **Frontend Client**: React 19 + TypeScript + Vite + TailwindCSS.
  - **State Management**: Zustand stores (Show, Stage, Clock).
  - **Testing**: Vitest + Testing Library + TypeScript `tsc --noEmit`.
- **Mã nguồn dự án**: Nằm trong `src/` (frontend/logic) và `src-tauri/` (native desktop harness).
- **Quy tắc phân tầng**: Tách bạch triệt để giữa pure logic (hardware parsing, cue calculation, import/export, color math) và UI presentation (components, SVG stage preview).

## 2. Cây thư mục dự án

```
.
├── AGENTS.md / ARCHITECTURE.md / README.md   Tài liệu cốt lõi tại gốc repo
├── PLAN.md, PROGRESS.md        Kế hoạch đợt & Nhật ký tiến độ
├── archive/                    Lịch sử PLAN/PROGRESS đã hoàn tất (tra cứu bằng grep)
├── docs/                       Tài liệu đặc tả, tài liệu thiết kế chi tiết
├── scripts/                    Bộ công cụ dòng lệnh dự án (phải đăng ký tại mục 4)
├── scratch/                    Script nháp dùng một lần (gitignored, xóa sau khi xong)
├── .githooks/                  Git hooks theo dõi trong Git (kích hoạt: git config core.hooksPath .githooks)
├── src/                        Toàn bộ mã nguồn giao diện & nghiệp vụ frontend
│   ├── types/                  TypeScript interfaces & domain models
│   ├── store/                  Zustand state stores (show, stage, clock)
│   ├── services/               Pure logic: parsers, importers, exporters, persistence
│   └── components/             UI components (rundown, timeline, stage 2D, import/export)
└── src-tauri/                  Native Rust backend cho Tauri v2
```

## 3. Các module chính (Phân tầng kiến trúc)

| Module | Vị trí | Trách nhiệm chính |
|---|---|---|
| Domain Types | `src/types/` | Định nghĩa kiểu dữ liệu Cue, Department (LX, VX, SQ, Stage), Fixture, Virtual Stage |
| State Stores | `src/store/` | Zustand stores quản lý trạng thái show (`useShowStore`), sân khấu 2D (`useStageStore`), và đồng hồ delta (`useClockStore`) |
| Core Services | `src/services/` | Logic thuần túy: bóc tách thiết bị (`hardwareParser`), đọc/ghi file (`importer`, `exporter`, `persistence`) |
| UI Presentation | `src/components/` | Giao diện Dual-View (Rundown Table, Timeline Tracks), Sân khấu ảo 2D (`VirtualStagePreview`), Modal Import/Export |
| Desktop Harness | `src-tauri/` | Tauri v2 Rust config, desktop window lifecycle, offline IPC bridge |

## 4. Đăng ký Công cụ & Scripts (Bắt buộc cho Guard Check R1)

Mọi công cụ trong `scripts/` hoặc `tools/` bắt buộc phải có 1 dòng trong bảng này và có `Usage:` trong nội dung script:

| Lệnh / Công cụ | Mục đích & Mô tả |
|---|---|
| `bash scripts/check.sh --fast` | Cổng kiểm tra nhanh: TypeScript + Vitest + audit workflow + guard check |
| `bash scripts/check.sh` | Cổng kiểm tra toàn diện: type-check, tests, cargo check, production build, audit & guard check |
| `python3 scripts/audit_workflow.py` | Bác sĩ quy trình: kiểm tra phình token, vệ sinh PLAN/PROGRESS, bảo mật Git |
| `python3 scripts/guard_check.py` | Drift guard: kiểm tra đăng ký công cụ, layout thư mục và kiến trúc phân tầng |
| `python3 scripts/entropy_report.py` | Báo cáo entropy định kỳ: phát hiện công cụ thừa, code trùng lặp |
| `python3 scripts/archive_logs.py` | Lưu trữ không mất mát các đợt đã hoàn thành sang `archive/` |
| `python3 scripts/handoff.py` | Tóm tắt bàn giao phiên làm việc hoặc trước khi chạy `/compact` |
| `python3 scripts/routing_check.py` | Kiểm tra tính toàn vẹn bảng định tuyến skill và test cases |
| `python3 scripts/skill_lint.py` | Kiểm tra ngân sách ký tự và token của các skill |

## 5. Quy tắc bất khả xâm phạm

- Không bao giờ commit file bí mật (`.env`, `*.key`, `*.pem`).
- Một commit cho một mục đích rõ ràng (Conventional Commits), dùng `git add <tệp cụ thể>`, không dùng `git add -A`.
- Không tự ý thêm script tùy tiện ngoài danh mục trên mà không đăng ký vào bảng này.
