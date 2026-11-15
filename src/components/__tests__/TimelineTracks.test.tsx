import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineTracks } from '../timeline/TimelineTracks';
import { useShowStore } from '../../store/useShowStore';
import { createDefaultShow } from '../../types/stage';

describe('TimelineTracks Component', () => {
  beforeEach(() => {
    const show = createDefaultShow('Timeline Test');
    useShowStore.getState().loadShow(show);
  });

  it('renders track lanes and cue block', () => {
    render(<TimelineTracks />);

    expect(screen.getByText('Master Cue')).toBeInTheDocument();
    expect(screen.getByText('LX Lighting')).toBeInTheDocument();
    expect(screen.getByText('VX Visuals')).toBeInTheDocument();
    expect(screen.getByText('SQ Sound')).toBeInTheDocument();

    // Cue title displayed in block
    expect(screen.getByText('Pre-Show / Walk-in')).toBeInTheDocument();
  });

  it('adjusts zoom level on zoom button clicks', () => {
    render(<TimelineTracks />);

    expect(screen.getByText('8 px/s')).toBeInTheDocument();

    const zoomInBtn = screen.getByTitle('Zoom In');
    fireEvent.click(zoomInBtn);

    expect(screen.getByText('11 px/s')).toBeInTheDocument();

    const zoomOutBtn = screen.getByTitle('Zoom Out');
    fireEvent.click(zoomOutBtn);

    expect(screen.getByText('8 px/s')).toBeInTheDocument();
  });
});
