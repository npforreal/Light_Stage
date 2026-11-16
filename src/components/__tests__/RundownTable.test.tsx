import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('triggers Standby and GO actions on cue', () => {
    render(<RundownTable />);

    const stbyBtn = screen.getByText('STBY');
    fireEvent.click(stbyBtn);

    const firstCue = useShowStore.getState().show.acts[0].cues[0];
    expect(useShowStore.getState().standbyCueId).toBe(firstCue.id);

    const goBtn = screen.getByRole('button', { name: /GO/i });
    fireEvent.click(goBtn);

    expect(useShowStore.getState().activeCueId).toBe(firstCue.id);
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

  it('supports row actions: Add Below, Duplicate, and Delete cue', () => {
    render(<RundownTable />);

    expect(screen.getByText('1.0')).toBeInTheDocument();
    const initialCueCount = useShowStore.getState().show.acts[0].cues.length;

    // 1. Add Cue Below
    const addBelowBtn = screen.getByTitle('Thêm Cue bên dưới');
    fireEvent.click(addBelowBtn);

    expect(useShowStore.getState().show.acts[0].cues.length).toBe(initialCueCount + 1);

    // 2. Duplicate Cue
    const duplicateBtns = screen.getAllByTitle('Nhân đôi Cue');
    fireEvent.click(duplicateBtns[0]);

    expect(useShowStore.getState().show.acts[0].cues.length).toBe(initialCueCount + 2);
    expect(screen.getByText(/Pre-Show \/ Walk-in \(Copy\)/i)).toBeInTheDocument();

    // 3. Delete Cue
    const deleteBtns = screen.getAllByTitle('Xóa Cue');
    fireEvent.click(deleteBtns[0]);

    expect(useShowStore.getState().show.acts[0].cues.length).toBe(initialCueCount + 1);
  });
});
