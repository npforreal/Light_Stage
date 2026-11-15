import { describe, it, expect, beforeEach } from 'vitest';
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
});
