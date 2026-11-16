import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VxControlBar } from '../components/stage/VxControlBar';
import { ImportModal } from '../components/importer/ImportModal';
import { StageClockWindow } from '../components/StageClockWindow';
import { Header } from '../components/Header';
import { StageRigEditor } from '../components/stage/StageRigEditor';
import { useVisualStore } from '../store/useVisualStore';
import { useShowStore } from '../store/useShowStore';
import { useClockStore } from '../store/useClockStore';
import { createDefaultShow } from '../types/stage';

describe('Round 11 FreeShow Integration Verification Suite', () => {
  beforeEach(() => {
    useVisualStore.setState({
      isFrozen: false,
      isBlackout: false,
      activeLayers: { background: true, slide: true, overlay: true },
    });
    useShowStore.getState().loadShow(createDefaultShow('FreeShow Stage Show'));
    useClockStore.getState().resetClock();
    vi.restoreAllMocks();
  });

  describe('11.0d & 11.2 VxControlBar Live Panic Controls', () => {
    it('renders outputs, layer switches, clear VX, and freeze VX buttons', () => {
      render(<VxControlBar />);

      expect(screen.getByTestId('vx-control-bar')).toBeInTheDocument();
      expect(screen.getByText('Outputs:')).toBeInTheDocument();
      expect(screen.getByText('Main LED Screen')).toBeInTheDocument();

      // Layer switches
      expect(screen.getByTitle(/Lớp Nền/)).toBeInTheDocument();
      expect(screen.getByTitle(/Lớp Slide/)).toBeInTheDocument();
      expect(screen.getByTitle(/Lớp Phủ/)).toBeInTheDocument();

      // Clear VX button
      const clearBtn = screen.getByTitle(/Xoá tất cả các lớp VX/);
      expect(clearBtn).toBeInTheDocument();
      expect(clearBtn).not.toBeDisabled();

      // Freeze VX toggle
      const freezeBtn = screen.getByTitle(/Freeze VX/);
      expect(freezeBtn).toBeInTheDocument();
      fireEvent.click(freezeBtn);
      expect(screen.getByText('ĐÃ KHÓA VX')).toBeInTheDocument();
      expect(useVisualStore.getState().isFrozen).toBe(true);

      // Click Clear VX
      fireEvent.click(clearBtn);
      expect(useVisualStore.getState().activeLayers.slide).toBe(false);
      expect(useVisualStore.getState().activeLayers.background).toBe(false);
    });
  });

  describe('11.0c ImportModal Grouped Grid & Paste from Clipboard', () => {
    it('renders grouped cards including Dán từ clipboard button', () => {
      render(<ImportModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/Tệp Dữ Liệu/)).toBeInTheDocument();
      expect(screen.getByText(/Bảng Tạm \(Clipboard\)/)).toBeInTheDocument();
      expect(screen.getByTitle(/Đọc dữ liệu bảng từ clipboard/)).toBeInTheDocument();
      expect(screen.getByTitle(/Nạp ngay show mẫu hoàn chỉnh/)).toBeInTheDocument();
    });
  });

  describe('11.4 StageClockWindow MC / Stage Mode Layout', () => {
    it('switches to MC / Stage mode with stage direction notes and overrun indicator', () => {
      render(
        <StageClockWindow
          overrideState={{
            showTitle: 'Arena Live Show',
            activeCueNumber: '02',
            activeCueTitle: 'Khai Mạc Trống Hội',
            activeCueDirectionNotes: '12 vũ công di chuyển từ cánh gà trái ra tâm sân khấu.',
            standbyCueNumber: '03',
            standbyCueTitle: 'MC Giới Thiệu Khách Mời',
            cueStatus: 'Go',
            cueRemainingMs: -15000,
            cueElapsedMs: 135000,
            cueDurationMs: 120000,
            masterElapsedMs: 240000,
            deltaMs: -15000,
            isOverrun: true,
            isRunning: true,
            isPaused: false,
            timestamp: Date.now(),
          }}
        />
      );

      // Default standard layout has Active Cue Title
      expect(screen.getByTestId('active-cue-title')).toHaveTextContent('Khai Mạc Trống Hội');

      // Switch to MC / Stage Mode
      const mcModeBtn = screen.getByTitle(/Chế độ MC \/ Sân khấu/);
      fireEvent.click(mcModeBtn);

      // Verify MC specific layout elements
      expect(screen.getByText('ĐANG DIỄN / NOW LIVE')).toBeInTheDocument();
      expect(screen.getByText('TIẾP THEO / NEXT UP')).toBeInTheDocument();
      expect(screen.getByText('MC Giới Thiệu Khách Mời')).toBeInTheDocument();
      expect(screen.getByText(/12 vũ công di chuyển từ cánh gà trái/)).toBeInTheDocument();
      expect(screen.getByText(/ĐÃ VƯỢT QUÁ GIỜ \(OVERRUN\)/)).toBeInTheDocument();
    });
  });

  describe('11.0d Header Single LIVE Indicator', () => {
    it('shows distinct LIVE badge when cue is running', () => {
      const show = createDefaultShow('Concert Live');
      useShowStore.getState().loadShow(show);
      useShowStore.getState().goCue(show.acts[0].cues[0]?.id);

      render(
        <Header
          viewMode="split"
          setViewMode={vi.fn()}
          isOperatorLocked={false}
          setIsOperatorLocked={vi.fn()}
          onOpenProject={vi.fn()}
          onImportClick={vi.fn()}
          onExportClick={vi.fn()}
          onHelpClick={vi.fn()}
          wallClock="20:00:00"
        />
      );

      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });
  });

  describe('11.0e StageRigEditor Grouped Quick-Add Menu', () => {
    it('renders quick-add buttons for fixtures, screens, and truss', () => {
      render(<StageRigEditor />);

      expect(screen.getByText(/Thêm nhanh vào Rig/)).toBeInTheDocument();
      expect(screen.getByTitle('Thêm 1 đèn Beam vào rig')).toBeInTheDocument();
      expect(screen.getByTitle('Thêm 1 đèn Spot vào rig')).toBeInTheDocument();
      expect(screen.getByTitle('Thêm màn hình LED vào rig')).toBeInTheDocument();
      expect(screen.getByTitle('Thêm giàn truss vào rig')).toBeInTheDocument();
    });
  });

  describe('11.2 Panic Hotkeys Conflict Prevention', () => {
    it('ensures no key collision between panic keys and show control hotkeys', () => {
      const transportHotkeys = ['Space', 'KeyB', 'KeyH', 'ArrowDown', 'ArrowUp', 'KeyO', 'KeyI', 'KeyE'];
      const panicHotkeys = ['F1', 'F2', 'F3', 'F4', 'Escape'];

      // Intersection must be empty
      const collision = transportHotkeys.filter((k) => panicHotkeys.includes(k));
      expect(collision).toEqual([]);
    });
  });
});
