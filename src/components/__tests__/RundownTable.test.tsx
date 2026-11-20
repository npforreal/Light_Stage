import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RundownTable } from '../rundown/RundownTable';
import { useShowStore } from '../../store/useShowStore';
import { createDefaultShow } from '../../types/stage';

describe('RundownTable Component', () => {
  beforeEach(() => {
    const show = createDefaultShow('Concert Gala');
    useShowStore.getState().loadShow(show);
  });

  it('renders cue list with act and initial cue', () => {
    render(<RundownTable />);

    expect(screen.getByText('Act 1')).toBeInTheDocument();
    expect(screen.getByText('Pre-Show / Walk-in')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
  });

  it('switches role filter tabs', () => {
    render(<RundownTable />);

    // Initially Master View shows Lighting, Visual, Sound
    expect(screen.getByText(/Lighting \(LX\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Visual LED \(VX\)/i)).toBeInTheDocument();

    // Click LX filter tab
    const lxTab = screen.getByRole('button', { name: 'LX' });
    fireEvent.click(lxTab);

    expect(screen.getByText(/Lighting \(LX\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Visual LED \(VX\)/i)).not.toBeInTheDocument();
  });

  it('arms Standby on cue and selects row without firing GO (Đợt 15.2 / R4 live safety)', () => {
    render(<RundownTable />);

    const firstCue = useShowStore.getState().show.acts[0].cues[0];

    // Standby button arms cue
    const stbyBtn = screen.getByText('STBY');
    fireEvent.click(stbyBtn);
    expect(useShowStore.getState().standbyCueId).toBe(firstCue.id);

    // Row-level GO button is removed for live safety
    const goButtons = screen.queryAllByRole('button', { name: /^GO$/i });
    expect(goButtons).toHaveLength(0);

    // Clicking row selects cue and opens Inspector, NEVER firing GO
    const cueRow = screen.getByText('Pre-Show / Walk-in').closest('tr');
    expect(cueRow).not.toBeNull();
    fireEvent.click(cueRow!);

    expect(useShowStore.getState().selectedCueId).toBe(firstCue.id);
    expect(useShowStore.getState().isInspectorOpen).toBe(true);
    expect(useShowStore.getState().activeCueId).toBeNull(); // Strict rule: NEVER triggers playback
  });

  it('supports inline editing of Title, LX, VX, SQ, and ST cells', () => {
    render(<RundownTable />);

    // Double-click on Title
    const titleCell = screen.getByText('Pre-Show / Walk-in');
    fireEvent.doubleClick(titleCell);

    const titleInput = screen.getByDisplayValue('Pre-Show / Walk-in');
    expect(titleInput).toBeInTheDocument();

    fireEvent.change(titleInput, { target: { value: 'Opening Act Live' } });
    fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Opening Act Live')).toBeInTheDocument();

    // Double-click on Lighting (LX)
    const lxCell = screen.getByText('Walk-in Ambience');
    fireEvent.doubleClick(lxCell);

    expect(screen.getByText('Chỉnh sửa Ánh sáng (LX)')).toBeInTheDocument();
    const lxInput = screen.getByDisplayValue('Walk-in Ambience');
    fireEvent.change(lxInput, { target: { value: 'Grand Finale Wash' } });
    fireEvent.keyDown(lxInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Grand Finale Wash')).toBeInTheDocument();

    // Double-click on Visual (VX)
    const vxCell = screen.getByText('Event Logo Loop');
    fireEvent.doubleClick(vxCell);

    expect(screen.getAllByText('Visual LED (VX)').length).toBeGreaterThanOrEqual(2);
    const vxInput = screen.getByDisplayValue('Event Logo Loop');
    fireEvent.change(vxInput, { target: { value: '3D Particle Stream' } });
    fireEvent.keyDown(vxInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('3D Particle Stream')).toBeInTheDocument();

    // Double-click on Sound (SQ)
    const sqCell = screen.getByText('BGM Lounge Playlist');
    fireEvent.doubleClick(sqCell);

    expect(screen.getByText('Âm thanh (SQ)')).toBeInTheDocument();
    const sqInput = screen.getByDisplayValue('BGM Lounge Playlist');
    fireEvent.change(sqInput, { target: { value: 'Symphony No. 5' } });
    fireEvent.keyDown(sqInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Symphony No. 5')).toBeInTheDocument();

    // Double-click on Stage Action (ST)
    const stCell = screen.getByText(/House doors open/i);
    fireEvent.doubleClick(stCell);

    expect(screen.getByText('Hoạt cảnh Sân khấu (ST)')).toBeInTheDocument();
    const stTextarea = screen.getByDisplayValue(/House doors open/i);
    fireEvent.change(stTextarea, { target: { value: 'MC walks to Center Stage' } });
    fireEvent.keyDown(stTextarea, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('MC walks to Center Stage')).toBeInTheDocument();
  });

  it('prevents Space key from triggering GO when focused inside an input', () => {
    render(<RundownTable />);

    const titleCell = screen.getByText('Pre-Show / Walk-in');
    fireEvent.doubleClick(titleCell);

    const titleInput = screen.getByDisplayValue('Pre-Show / Walk-in');
    const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

    // Press Space inside the input
    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(spaceEvent, 'stopPropagation');
    titleInput.dispatchEvent(spaceEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(goCueSpy).not.toHaveBeenCalled();
  });

  it('supports row actions via ··· menu: Add Below, Duplicate, and Delete cue (Đợt 15.2 / R4)', () => {
    render(<RundownTable />);

    expect(screen.getByText('1.0')).toBeInTheDocument();
    const initialCueCount = useShowStore.getState().show.acts[0].cues.length;

    // 1. Add Cue Below via ··· menu
    const menuBtn1 = screen.getAllByTitle('Tùy chọn khác')[0];
    fireEvent.click(menuBtn1);

    const addBelowBtn = screen.getByTitle('Thêm Cue bên dưới');
    fireEvent.click(addBelowBtn);

    expect(useShowStore.getState().show.acts[0].cues.length).toBe(initialCueCount + 1);

    // 2. Duplicate Cue via ··· menu
    const menuBtn2 = screen.getAllByTitle('Tùy chọn khác')[0];
    fireEvent.click(menuBtn2);

    const duplicateBtn = screen.getByTitle('Nhân đôi Cue');
    fireEvent.click(duplicateBtn);

    expect(useShowStore.getState().show.acts[0].cues.length).toBe(initialCueCount + 2);
    expect(screen.getByText(/Pre-Show \/ Walk-in \(Copy\)/i)).toBeInTheDocument();

    // 3. Delete Cue via ··· menu
    const menuBtn3 = screen.getAllByTitle('Tùy chọn khác')[0];
    fireEvent.click(menuBtn3);

    const deleteBtn = screen.getByTitle('Xóa Cue');
    fireEvent.click(deleteBtn);

    expect(useShowStore.getState().show.acts[0].cues.length).toBe(initialCueCount + 1);
  });

  it('enforces touch target >= 40px and visual row highlight matrix (Đợt 15.2 / R4)', () => {
    render(<RundownTable />);

    const cueRow = screen.getByText('Pre-Show / Walk-in').closest('tr');
    expect(cueRow).not.toBeNull();
    // Class includes min-h-[44px] or h-11
    expect(cueRow?.className).toMatch(/min-h-\[44px\]|h-11/);

    // Click to select
    fireEvent.click(cueRow!);
    // Selected highlight has border-l-accent
    expect(cueRow?.className).toMatch(/border-l-accent/);
  });

  it('keeps the Rundown count in sync with the 30-fixture quick entry (Đợt 10.1)', () => {
    render(<RundownTable />);

    fireEvent.doubleClick(screen.getByText('Walk-in Ambience'));

    const quickInput = screen.getByPlaceholderText('Beam x8, Spot x4 @FOH, Wash x12');
    fireEvent.change(quickInput, {
      target: {
        value: 'Beam x8, Spot x4 @FOH, Wash x12, Follow x2, Blinder x4',
      },
    });

    expect(screen.getByText(/Tổng: 30 đèn/)).toBeInTheDocument();

    fireEvent.keyDown(quickInput, { key: 'Enter', code: 'Enter' });

    const cue = useShowStore.getState().getAllCues()[0];
    expect(cue.totalLightingFixtures).toBe(30);
    expect(cue.departments.lx?.fixtureCount).toBe(30);
    expect(cue.departments.lx?.fixtures).toHaveLength(5);
    expect(screen.getByText('30 fix')).toBeInTheDocument();
  });

  it('reflects structured row edits in the summary and totals', () => {
    render(<RundownTable />);

    fireEvent.doubleClick(screen.getByText('Walk-in Ambience'));

    const countInputs = screen.getAllByTitle('Số lượng');
    expect(countInputs.length).toBe(2); // default cue: 8 Wash + 4 Spot

    fireEvent.change(countInputs[0], { target: { value: '10' } });
    expect(screen.getByText(/Tổng: 14 đèn/)).toBeInTheDocument();

    fireEvent.keyDown(countInputs[0], { key: 'Enter', code: 'Enter' });

    const cue = useShowStore.getState().getAllCues()[0];
    expect(cue.totalLightingFixtures).toBe(14);
    expect(cue.departments.lx?.fixtureCount).toBe(14);
  });
});

describe('RundownTable auto-scroll (PLAN 18.5, reopened 2026-11-20)', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  let scrollSpy: ReturnType<typeof vi.fn>;

  const seedCues = (count: number) => {
    const store = useShowStore.getState();
    store.loadShow(createDefaultShow('Rapid Fire Show'));
    const actId = useShowStore.getState().show.acts[0].id;
    for (let i = 2; i <= count; i++) {
      useShowStore.getState().addCue(actId, { title: `Cue ${i}`, durationMs: 2000 });
    }
    const cues = useShowStore.getState().getAllCues();
    expect(cues).toHaveLength(count);
    useShowStore.setState({ standbyCueId: cues[0].id });
  };

  beforeEach(() => {
    scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy as unknown as Element['scrollIntoView'];
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
    vi.useRealTimers();
  });

  it('scrolls again on back-to-back GO calls even when the table emits scroll events', () => {
    seedCues(12);
    render(<RundownTable />);
    const container = screen.getByTestId('rundown-scroll-container');
    scrollSpy.mockClear();

    act(() => {
      useShowStore.getState().goCue();
    });
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'center' });

    // A real browser emits `scroll` for the programmatic scrollIntoView above.
    // That must NOT be mistaken for a manual scroll (root cause of review #2).
    fireEvent.scroll(container);

    act(() => {
      useShowStore.getState().goCue();
    });
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });

  it('centers the live cue so the next standby cue stays visible', () => {
    seedCues(12);
    render(<RundownTable />);
    scrollSpy.mockClear();

    act(() => {
      useShowStore.getState().goCue();
    });

    const options = scrollSpy.mock.calls.at(-1)?.[0] as ScrollIntoViewOptions;
    expect(options.block).toBe('center');
    // Standby cue (the next one) is armed automatically, so no second scroll
    expect(useShowStore.getState().standbyCueId).toBe(useShowStore.getState().getAllCues()[1].id);
  });

  it('pauses after a real wheel scroll, then catches up once the pause expires', () => {
    vi.useFakeTimers();
    seedCues(12);
    render(<RundownTable />);
    const container = screen.getByTestId('rundown-scroll-container');
    scrollSpy.mockClear();

    fireEvent.wheel(container, { deltaY: 320 });

    act(() => {
      useShowStore.getState().goCue();
    });
    expect(scrollSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(6100);
    });
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it('does not treat a row click (pointerdown) as a manual table scroll', () => {
    seedCues(12);
    render(<RundownTable />);
    const cueRow = screen.getByText('Pre-Show / Walk-in').closest('tr');
    expect(cueRow).not.toBeNull();
    scrollSpy.mockClear();

    fireEvent.pointerDown(cueRow!);

    act(() => {
      useShowStore.getState().goCue();
    });
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });
});
