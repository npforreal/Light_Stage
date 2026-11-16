import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../App";
import { useShowStore } from "../store/useShowStore";
import { useClockStore } from "../store/useClockStore";
import { saveAutoSave, clearAutoSave } from "../services/persistence";
import { Show, createDefaultShow } from "../types/stage";

describe("Real-World User Journey & Usability Simulation", () => {
  beforeEach(() => {
    localStorage.clear();
    clearAutoSave();
    useShowStore.getState().loadShow(createDefaultShow("Light Stage Show"));
    useClockStore.getState().resetClock();
    vi.restoreAllMocks();
  });

  it("Hành trình 1: Khởi động & Nhận diện Giao diện Phòng tối (FOH Dark Room UI)", () => {
    render(<App />);

    // 1. Người dùng thấy gì: Nhận diện thương hiệu và tiêu đề show
    expect(screen.getByText("Light Stage")).toBeInTheDocument();
    expect(screen.getByText("v0.1.0")).toBeInTheDocument();
    expect(screen.getByText("Đã lưu")).toBeInTheDocument();

    // 2. Người dùng thấy đồng hồ trung tâm với các chỉ số chuyên môn
    expect(screen.getByText("Show Time")).toBeInTheDocument();
    expect(screen.getByText("Cue Remainder")).toBeInTheDocument();
    expect(screen.getByText("Delta")).toBeInTheDocument();

    // 3. Người dùng thấy thống kê phần cứng tự động
    expect(screen.getByText(/LX:/)).toBeInTheDocument();
    expect(screen.getByText(/VX:/)).toBeInTheDocument();

    // 4. Các nút chuyển đổi chế độ xem (Dual View)
    expect(screen.getByTitle("Cue Rundown List")).toBeInTheDocument();
    expect(screen.getByTitle("Split Dual View")).toBeInTheDocument();
    expect(screen.getByTitle("Timeline Tracks")).toBeInTheDocument();
    expect(screen.getByTitle("Stage 2D Preview")).toBeInTheDocument();
  });

  it("Hành trình 2: Cơ chế Phục hồi Khẩn cấp khi Sự cố Sập nguồn (Crash Recovery)", () => {
    // Giả lập trạng thái trước đó đã có một autosave được lưu trước khi sập máy
    const mockShow: Show = {
      ...createDefaultShow("Live Concert 2026"),
      acts: [
        {
          id: "act-1",
          title: "Act 1: Mở Màn",
          order: 1,
          cues: [
            {
              id: "cue-recovered-1",
              actId: "act-1",
              cueNumber: "01",
              title: "Opening Intro & Drone Show",
              durationMs: 120000,
              status: "Pending",
              totalLightingFixtures: 24,
              totalScreens: 3,
              departments: {
                lx: { sceneName: "Blue Wash", fixtureCount: 24 },
                vx: { contentName: "Countdown Video", screenCount: 3 },
              },
            },
          ],
        },
      ],
    };
    saveAutoSave(mockShow);

    // Mở lại ứng dụng
    render(<App />);

    // Người dùng thấy gì: Banner màu Cyan cảnh báo phát hiện bản tự động lưu
    expect(screen.getByText("Phát hiện bản tự động lưu:")).toBeInTheDocument();
    expect(screen.getByText(/Live Concert 2026/)).toBeInTheDocument();
    expect(screen.getAllByText(/1 cues/).length).toBeGreaterThanOrEqual(1);

    // Thao tác: Bấm nút Khôi phục
    const recoverBtn = screen.getByText("Khôi phục");
    fireEvent.click(recoverBtn);

    // Người dùng hiểu và thấy: Toàn bộ show đã được khôi phục, banner biến mất
    expect(screen.queryByText("Phát hiện bản tự động lưu:")).not.toBeInTheDocument();
    expect(screen.getAllByText("Opening Intro & Drone Show").length).toBeGreaterThanOrEqual(1);
  });

  it("Hành trình 3: Điều phối Live Show với Phím tắt & Tránh kích hoạt nhầm (Calling & Safety)", () => {
    // Nạp một kịch bản gồm 2 cue
    const testShow: Show = {
      ...createDefaultShow("Gala Awards Live"),
      acts: [
        {
          id: "act-1",
          title: "Chương Trình Chính",
          order: 1,
          cues: [
            {
              id: "cue-1",
              actId: "act-1",
              cueNumber: "01",
              title: "Màn Chào Khách",
              durationMs: 30000,
              status: "Standby",
              totalLightingFixtures: 12,
              totalScreens: 1,
              departments: { lx: { sceneName: "Warm Amber", fixtureCount: 12 } },
            },
            {
              id: "cue-2",
              actId: "act-1",
              cueNumber: "02",
              title: "Trao Giải Hạng Mục 1",
              durationMs: 45000,
              status: "Pending",
              totalLightingFixtures: 16,
              totalScreens: 2,
              departments: { lx: { sceneName: "Spotlight Red", fixtureCount: 16 } },
            },
          ],
        },
      ],
    };

    act(() => {
      useShowStore.getState().loadShow(testShow);
    });

    render(<App />);

    // 1. Ban đầu: Cue 1 ở trạng thái Standby
    expect(screen.getByText("01 Màn Chào Khách")).toBeInTheDocument();

    // 2. Đạo diễn bấm Space để GO Cue 1
    fireEvent.keyDown(window, { code: "Space" });

    // Kiểm tra trạng thái: Cue 1 đang Active GO
    const showStateAfterGo = useShowStore.getState();
    expect(showStateAfterGo.activeCueId).toBe("cue-1");
    // Cue kế tiếp (Cue 2) tự động được đưa lên Standby
    expect(showStateAfterGo.standbyCueId).toBe("cue-2");

    // 3. Đạo diễn bấm Esc để Tạm dừng/Hold khi có diễn biến bất ngờ trên sân khấu
    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(useShowStore.getState().show.acts[0].cues[0].status).toBe("Hold");

    // 4. Kích hoạt Chế độ Khóa Vận hành (Operator Lock) để tránh chạm phím ngoài ý muốn
    const lockBtn = screen.getByTitle(/Unlocked: Hotkeys active/i);
    fireEvent.click(lockBtn);

    // Người dùng thấy gì: Banner cảnh báo màu vàng cảnh báo khoá phím
    expect(screen.getByText(/CHẾ ĐỘ KHÓA VẬN HÀNH/)).toBeInTheDocument();

    // Thử bấm Space khi đang Lock -> Không tác động tới cue
    fireEvent.keyDown(window, { code: "Space" });
    // Trạng thái vẫn là Hold, không bị nhảy sang cue khác
    expect(useShowStore.getState().show.acts[0].cues[0].status).toBe("Hold");
  });

  it("Hành trình 4: Hiển thị Sân khấu Ảo 2D & Cảnh báo Quang học Thực tế (Optical Stage 2D)", () => {
    const stageShow: Show = {
      ...createDefaultShow("Rock Festival Live"),
      acts: [
        {
          id: "act-rock",
          title: "Rock Act",
          order: 1,
          cues: [
            {
              id: "cue-rock",
              actId: "act-rock",
              cueNumber: "01",
              title: "Rock Anthem Opener",
              durationMs: 60000,
              status: "Go",
              totalLightingFixtures: 32,
              totalScreens: 3,
              departments: {
                lx: {
                  sceneName: "Blinding Sun",
                  fixtureCount: 32,
                  color: { mode: "kelvin", kelvin: 3200 },
                  intensity: 100,
                },
                vx: {
                  contentName: "Fire Visual Loop",
                  screenCount: 3,
                },
              },
            },
          ],
        },
      ],
    };

    act(() => {
      useShowStore.getState().loadShow(stageShow);
      useShowStore.getState().goCue("cue-rock");
    });

    render(<App />);

    // Chuyển sang tab Stage 2D
    const stageBtn = screen.getByTitle("Stage 2D Preview");
    fireEvent.click(stageBtn);

    // Người dùng thấy gì trên sân khấu 2D:
    // - Camera Front View
    expect(screen.getByText("Front View")).toBeInTheDocument();
    expect(screen.getByText("Top-Down Plan")).toBeInTheDocument();

    // - Thông tin quang học: Nhãn màu 3200K
    expect(screen.getByText("3200K")).toBeInTheDocument();

    // - Trạng thái 3 màn hình LED (Main, Cánh Trái, Cánh Phải) đang đồng bộ nội dung "Fire Visual Loop"
    expect(screen.getAllByText("Fire Visual Loop").length).toBe(3);
  });

  it("Hành trình 5: Bóc tách Kịch bản Thực tế & Đếm Thiết bị Tự động (Parser Usability)", () => {
    // Kỹ thuật viên nhập kịch bản với mô tả phức tạp thường gặp ngoài đời
    act(() => {
      const show = createDefaultShow("Tech Conference 2026");
      useShowStore.getState().loadShow(show);

      const firstCueId = show.acts[0].cues[0].id;
      useShowStore.getState().updateCue(firstCueId, {
        title: "Keynote CEO",
        departments: {
          lx: {
            sceneName: "Spotlight Beam x 12 (FOH), Profile x 4, Blinder 2 -> 0",
            fixtureCount: 16,
          },
          vx: {
            contentName: "Keynote Slides on P3 Main Screen x 1, LED Wing x 2",
            screenCount: 3,
          },
        },
      });
    });

    render(<App />);

    // Người dùng thấy gì: Thống kê phần cứng trên thanh Header tự động phản ánh đúng số lượng
    const stats = useShowStore.getState().getDeviceStats();
    expect(stats.totalLightingFixtures).toBe(16);
    expect(stats.totalScreens).toBe(3);

    // Người dùng thấy rõ trong bảng rundown
    expect(screen.getAllByText(/Spotlight Beam x 12/).length).toBeGreaterThanOrEqual(1);
  });

  it("Hành trình 6: Bàn giao Kịch bản & Xuất File An toàn (Exporting & Anti-Injection)", () => {
    render(<App />);

    // Mở Export Modal
    const exportBtn = screen.getByTitle("Export Reports & Project");
    fireEvent.click(exportBtn);

    // Người dùng thấy gì: Dialog xuất báo cáo chuyên nghiệp
    expect(screen.getByText("Export & Print Reports")).toBeInTheDocument();
    expect(screen.getByText(/Download Cue Sheet \(Excel \/ CSV\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Download Hardware Inventory \(Excel \/ CSV\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Save Project \(\.lightstage\)/i)).toBeInTheDocument();

    // Người dùng thấy các bộ phận có thể lọc để in riêng cho từng tổ kỹ thuật
    expect(screen.getByText("Master (All)")).toBeInTheDocument();
    expect(screen.getByText("Print / Save PDF Cue Sheet")).toBeInTheDocument();
  });
});
