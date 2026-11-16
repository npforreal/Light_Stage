import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualStagePreview } from '../stage/VirtualStagePreview';
import { useShowStore } from '../../store/useShowStore';
import { useStageStore } from '../../store/useStageStore';
import { createDefaultShow } from '../../types/stage';

describe('VirtualStagePreview Component', () => {
  beforeEach(() => {
    const show = createDefaultShow('Concert 2D');
    useShowStore.getState().loadShow(show);
    useStageStore.getState().applyPreset('EndStage');
    useStageStore.getState().setCameraView('front');
  });

  it('renders SVG canvas, camera toggle and preset options', () => {
    render(<VirtualStagePreview />);

    expect(screen.getByText('Front View')).toBeInTheDocument();
    expect(screen.getByText('Top-Down Plan')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Festival')).toBeInTheDocument();
    expect(screen.getByText('Thrust')).toBeInTheDocument();
  });

  it('switches camera view to Top-Down Plan', () => {
    render(<VirtualStagePreview />);

    const topDownBtn = screen.getByText('Top-Down Plan');
    fireEvent.click(topDownBtn);

    expect(useStageStore.getState().cameraView).toBe('topDown');
    expect(screen.getByText(/STAGE FRONT \/ AUDIENCE DIRECTION/i)).toBeInTheDocument();
  });

  it('applies Festival preset on click', () => {
    render(<VirtualStagePreview />);

    const festivalBtn = screen.getByText('Festival');
    fireEvent.click(festivalBtn);

    expect(useStageStore.getState().config.preset).toBe('Festival');
  });

  it('opens and closes config drawer', () => {
    render(<VirtualStagePreview />);

    const configBtn = screen.getByRole('button', { name: /Config/i });
    fireEvent.click(configBtn);

    expect(screen.getByText(/Stage Rig Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/LED Screens/i)).toBeInTheDocument();
    expect(screen.getByText(/Lighting Trusses/i)).toBeInTheDocument();
  });

  it('reflects truth: does not emit beams when cue has no LX and does not claim LIVE FEED when cue has no VX', () => {
    // Cue with no LX and no VX
    const actId = useShowStore.getState().show.acts[0].id;
    const emptyCueId = useShowStore.getState().addCue(actId, {
      cueNumber: '2.0',
      title: 'Dark Cue',
      departments: {},
    });
    useShowStore.getState().goCue(emptyCueId);

    const { container } = render(<VirtualStagePreview />);
    expect(screen.queryByText(/LIVE FEED ACTIVE/i)).not.toBeInTheDocument();
    // No beam cones in DOM
    const beams = container.querySelectorAll('polygon[fill="url(#beamGradient)"]');
    expect(beams.length).toBe(0);
  });

  it('renders beams and LIVE FEED when cue has active LX and VX', () => {
    const actId = useShowStore.getState().show.acts[0].id;
    const liveCueId = useShowStore.getState().addCue(actId, {
      cueNumber: '3.0',
      title: 'Full Production',
      departments: {
        lx: { sceneName: 'Rock Concert', fixtureCount: 12 },
        vx: { contentName: 'Hero Loop', screenCount: 2 },
      },
    });
    useShowStore.getState().goCue(liveCueId);

    const { container } = render(<VirtualStagePreview />);
    expect(screen.getAllByText(/LIVE FEED ACTIVE/i).length).toBeGreaterThan(0);
    const beams = container.querySelectorAll('polygon[fill="url(#beamGradient)"]');
    expect(beams.length).toBeGreaterThan(0);
  });

  it('displays accurate color label and optical simulation legend for active lighting cue', () => {
    const actId = useShowStore.getState().show.acts[0].id;
    const kelvinCueId = useShowStore.getState().addCue(actId, {
      cueNumber: '4.0',
      title: 'Warm Acoustic',
      departments: {
        lx: {
          sceneName: 'Warm Front',
          fixtureCount: 8,
          color: { mode: 'kelvin', kelvin: 3200 },
        },
      },
    });
    useShowStore.getState().goCue(kelvinCueId);

    render(<VirtualStagePreview />);
    expect(screen.getByText(/3200K/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Mô phỏng xấp xỉ quang học, không thay thế đo đạc thực tế/i)
    ).toBeInTheDocument();
  });
});
