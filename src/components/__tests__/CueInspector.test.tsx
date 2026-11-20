import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CueInspector } from '../CueInspector';
import { useShowStore } from '../../store/useShowStore';
import { createDefaultShow } from '../../types/stage';

describe('CueInspector Component (Đợt 15.1 & 15.2 / R4)', () => {
  beforeEach(() => {
    const show = createDefaultShow('Concert Gala Live');
    useShowStore.getState().loadShow(show);
    useShowStore.getState().setInspectorOpen(true);
  });

  it('renders empty state placeholder when isInspectorOpen is true but no cue is selected', () => {
    useShowStore.getState().selectCue(null);
    render(<CueInspector />);

    expect(screen.getByTestId('cue-inspector-drawer')).toBeInTheDocument();
    expect(screen.getByText('Chưa chọn Cue nào')).toBeInTheDocument();
    expect(
      screen.getByText(/Nhấp vào bất kỳ hàng nào trong bảng Rundown để xem và chỉnh sửa/i)
    ).toBeInTheDocument();

    // Provides quick action to select standby cue
    const selectStandbyBtn = screen.getByText('Chọn Cue Standby');
    expect(selectStandbyBtn).toBeInTheDocument();

    fireEvent.click(selectStandbyBtn);
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    expect(useShowStore.getState().selectedCueId).toBe(firstCue.id);
  });

  it('renders nothing when isInspectorOpen is false', () => {
    useShowStore.getState().setInspectorOpen(false);
    const { container } = render(<CueInspector />);

    expect(container.firstChild).toBeNull();
  });

  it('renders selected cue header, number badge, status badge, and title', () => {
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    useShowStore.getState().selectCue(firstCue.id);

    render(<CueInspector />);

    expect(screen.getByTestId('cue-inspector-drawer')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByTitle('Pre-Show / Walk-in')).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByTitle('Đóng Inspector (I)');
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(useShowStore.getState().isInspectorOpen).toBe(false);
  });

  it('executes fast calling actions: Set Standby, Hold, Skip', () => {
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    useShowStore.getState().selectCue(firstCue.id);

    const standbySpy = vi.spyOn(useShowStore.getState(), 'standbyCue');
    const holdSpy = vi.spyOn(useShowStore.getState(), 'holdCue');
    const skipSpy = vi.spyOn(useShowStore.getState(), 'skipCue');

    render(<CueInspector />);

    // Click Set Standby
    const setStandbyBtn = screen.getByText('Set Standby');
    fireEvent.click(setStandbyBtn);
    expect(standbySpy).toHaveBeenCalledWith(firstCue.id);

    // Click Hold
    const holdBtn = screen.getByText('Hold');
    fireEvent.click(holdBtn);
    expect(holdSpy).toHaveBeenCalledWith(firstCue.id);

    // Click Skip (18.4: requires confirmation step)
    const skipBtn = screen.getByText('Skip');
    fireEvent.click(skipBtn);
    const confirmSkipBtn = screen.getByTestId('skip-confirm-button');
    fireEvent.click(confirmSkipBtn);
    expect(skipSpy).toHaveBeenCalledWith(firstCue.id);
  });

  it('edits General & Timing: Title, Duration seconds, Scheduled Time, and Auto-Advance', () => {
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    useShowStore.getState().selectCue(firstCue.id);

    render(<CueInspector />);

    // Title input
    const titleInput = screen.getByLabelText(/Tiêu đề Cue/i);
    fireEvent.change(titleInput, { target: { value: 'Grand Opening Spectacular' } });
    expect(useShowStore.getState().show.acts[0].cues[0].title).toBe('Grand Opening Spectacular');

    // Duration input (seconds)
    const durationInput = screen.getByLabelText(/Thời lượng \(Giây\)/i);
    fireEvent.change(durationInput, { target: { value: '180' } });
    expect(useShowStore.getState().show.acts[0].cues[0].durationMs).toBe(180000);

    // Scheduled Wall Time input
    const scheduledInput = screen.getByLabelText(/Thời gian thực/i);
    fireEvent.change(scheduledInput, { target: { value: '20:15:00' } });
    expect(useShowStore.getState().show.acts[0].cues[0].scheduledTime).toBe('20:15:00');

    // Auto-advance toggle
    const autoAdvanceCheckbox = screen.getByLabelText(/Tự động chuyển tiếp khi hết thời lượng/i);
    fireEvent.click(autoAdvanceCheckbox);
    expect(useShowStore.getState().show.acts[0].cues[0].notes).toContain('[Auto-Advance]');
  });

  it('edits Lighting (LX): Scene Name, Intensity slider, Kelvin slider, Color Presets, and Fixtures', () => {
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    useShowStore.getState().selectCue(firstCue.id);

    render(<CueInspector />);

    // Scene Name
    const sceneInput = screen.getByLabelText(/Tên Cảnh Sáng/i);
    fireEvent.change(sceneInput, { target: { value: 'Warm Amber Chorus Wash' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.lx?.sceneName).toBe(
      'Warm Amber Chorus Wash'
    );

    // Master Intensity slider
    const intensitySlider = screen.getByLabelText(/Master Intensity/i);
    fireEvent.change(intensitySlider, { target: { value: '85' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.lx?.intensity).toBe(85);

    // Kelvin Temperature slider
    const kelvinSlider = screen.getByLabelText(/Nhiệt Độ Màu \(Kelvin\)/i);
    fireEvent.change(kelvinSlider, { target: { value: '5600' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.lx?.color).toEqual({
      mode: 'kelvin',
      kelvin: 5600,
    });

    // Color Preset button (e.g. Amber)
    const amberBtn = screen.getByRole('button', { name: /Amber/i });
    fireEvent.click(amberBtn);
    expect(useShowStore.getState().show.acts[0].cues[0].departments.lx?.color).toEqual({
      mode: 'rgb',
      hex: '#ff9900',
    });

    // Add Fixture (+Beam)
    const addBeamBtn = screen.getByRole('button', { name: /\+Beam/i });
    fireEvent.click(addBeamBtn);
    const updatedCue = useShowStore.getState().show.acts[0].cues[0];
    const beamSpec = updatedCue.departments.lx?.fixtures?.find((f) => f.subType === 'Beam');
    expect(beamSpec).toBeDefined();
    expect(beamSpec?.count).toBe(4);
  });

  it('edits Visual LED (VX): Content Name, Screen Target, Screen Count, Loop, and Layer', () => {
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    useShowStore.getState().selectCue(firstCue.id);

    render(<CueInspector />);

    // Content Name
    const contentInput = screen.getByLabelText(/Tên Nội Dung \/ Media/i);
    fireEvent.change(contentInput, { target: { value: 'Keynote 4K Video Loop.mp4' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.vx?.contentName).toBe(
      'Keynote 4K Video Loop.mp4'
    );

    // Screen Target dropdown
    const targetSelect = screen.getByLabelText(/Mục Tiêu Màn Hình/i);
    fireEvent.change(targetSelect, { target: { value: 'Main LED' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.vx?.screenTarget).toBe(
      'Main LED'
    );

    // Screen Count input
    const countInput = screen.getByLabelText(/Số Lượng Màn Hình/i);
    fireEvent.change(countInput, { target: { value: '3' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.vx?.screenCount).toBe(3);

    // Loop Video toggle
    const loopCheckbox = screen.getByLabelText(/Lặp lại video liên tục/i);
    fireEvent.click(loopCheckbox);
    expect(useShowStore.getState().show.acts[0].cues[0].departments.vx?.loop).toBe(false);

    // Layer mapping button (Overlay)
    const overlayLayerBtn = screen.getByRole('button', { name: /^Overlay$/i });
    fireEvent.click(overlayLayerBtn);
    expect(useShowStore.getState().show.acts[0].cues[0].departments.vx?.notes).toContain(
      'Layer: Overlay'
    );
  });

  it('edits Sound (SQ): Track Name, Volume slider, Fade Duration, and Mic Channels', () => {
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    useShowStore.getState().selectCue(firstCue.id);

    render(<CueInspector />);

    // Track Name
    const trackInput = screen.getByLabelText(/Tên Bản Nhạc \/ Âm Thanh/i);
    fireEvent.change(trackInput, { target: { value: 'Epic Cinematic Theme.wav' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.sq?.trackName).toBe(
      'Epic Cinematic Theme.wav'
    );

    // Volume slider
    const volumeSlider = screen.getByLabelText(/Âm Lượng/i);
    fireEvent.change(volumeSlider, { target: { value: '95' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.sq?.volume).toBe(95);

    // Fade Duration input
    const fadeInput = screen.getByLabelText(/Thời gian Fade In \/ Fade Out/i);
    fireEvent.change(fadeInput, { target: { value: '3.5' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.sq?.fadeDurationSec).toBe(3.5);

    // Mic Channel checklist (MC 1)
    const mc1Label = screen.getByText('MC 1 (Ch 1)');
    fireEvent.click(mc1Label);
    expect(useShowStore.getState().show.acts[0].cues[0].departments.sq?.micChannels).toContain(
      'MC 1 (Ch 1)'
    );
  });

  it('edits Stage Action (ST): Blocking description, Cast members, Props, and Notes', () => {
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    useShowStore.getState().selectCue(firstCue.id);

    render(<CueInspector />);

    // Blocking description
    const descInput = screen.getByLabelText(/Hoạt cảnh \/ Di chuyển Sân Khấu/i);
    fireEvent.change(descInput, {
      target: { value: 'MC bước ra từ Cánh Trái chào khán giả' },
    });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.st?.actionDescription).toBe(
      'MC bước ra từ Cánh Trái chào khán giả'
    );

    // Cast members
    const castInput = screen.getByLabelText(/Diễn viên \/ Nhân sự/i);
    fireEvent.change(castInput, { target: { value: 'MC Minh Hà, Ca sĩ Noo Phước Thịnh' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.st?.castMembers).toEqual([
      'MC Minh Hà',
      'Ca sĩ Noo Phước Thịnh',
    ]);

    // Props
    const propsInput = screen.getByLabelText(/Đạo Cụ/i);
    fireEvent.change(propsInput, { target: { value: 'Micro vàng, Bục danh dự' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.st?.props).toEqual([
      'Micro vàng',
      'Bục danh dự',
    ]);

    // Director Notes
    const notesInput = screen.getByLabelText(/Chỉ Đạo Sân Khấu/i);
    fireEvent.change(notesInput, { target: { value: 'Follow Spot 1 bám sát MC khi di chuyển' } });
    expect(useShowStore.getState().show.acts[0].cues[0].departments.st?.notes).toBe(
      'Follow Spot 1 bám sát MC khi di chuyển'
    );
  });

  it('supports collapsing and expanding accordion sections', () => {
    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    useShowStore.getState().selectCue(firstCue.id);

    render(<CueInspector />);

    // General & Timing is initially open
    expect(screen.getByLabelText(/Tiêu đề Cue/i)).toBeInTheDocument();

    // Click General header button to collapse
    const generalHeaderBtn = screen.getByRole('button', { name: /General & Timing/i });
    fireEvent.click(generalHeaderBtn);

    // Title input should no longer be rendered
    expect(screen.queryByLabelText(/Tiêu đề Cue/i)).not.toBeInTheDocument();

    // Click again to re-expand
    fireEvent.click(generalHeaderBtn);
    expect(screen.getByLabelText(/Tiêu đề Cue/i)).toBeInTheDocument();
  });
});
