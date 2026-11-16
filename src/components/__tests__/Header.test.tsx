import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { useShowStore } from '../../store/useShowStore';
import { createDefaultShow } from '../../types/stage';

describe('Header Component', () => {
  beforeEach(() => {
    const show = createDefaultShow('Concert Arena Gala');
    useShowStore.getState().loadShow(show);
  });

  it('renders Tier 1 and Tier 2 elements', () => {
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
        wallClock="19:30:00"
      />
    );

    // Tier 1: Brand & Show Title & Clocks
    expect(screen.getByText('Light Stage')).toBeInTheDocument();
    expect(screen.getByText('Concert Arena Gala')).toBeInTheDocument();
    expect(screen.getByText('Show Time')).toBeInTheDocument();
    expect(screen.getByText('Cue Remainder')).toBeInTheDocument();

    // Tier 2: View Switchers & Tools
    expect(screen.getByTitle('Cue Rundown List')).toBeInTheDocument();
    expect(screen.getByTitle('Split Dual View')).toBeInTheDocument();
    expect(screen.getByTitle('Timeline Tracks')).toBeInTheDocument();
    expect(screen.getByTitle('Stage 2D Preview')).toBeInTheDocument();
    expect(screen.getByTitle('Unlocked: Hotkeys active')).toBeInTheDocument();
  });

  it('allows inline editing of the show title', () => {
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
        wallClock="19:30:00"
      />
    );

    const titleBtn = screen.getByTitle('Bấm để đổi tên show');
    fireEvent.click(titleBtn);

    const input = screen.getByDisplayValue('Concert Arena Gala');
    fireEvent.change(input, { target: { value: 'Super Bowl Halftime Show' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(useShowStore.getState().show.metadata.title).toBe('Super Bowl Halftime Show');
  });

  it('toggles audio mute', () => {
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
        wallClock="19:30:00"
      />
    );

    const muteBtn = screen.getByTitle(/Mute Audio Alerts/i);
    expect(muteBtn).toBeInTheDocument();
    fireEvent.click(muteBtn);

    expect(screen.getByTitle(/Unmute Audio Alerts/i)).toBeInTheDocument();
  });
});
