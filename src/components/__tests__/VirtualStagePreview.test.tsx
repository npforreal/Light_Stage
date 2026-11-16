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

  it('renders centerline, plaster line, SL/SR/US/DS markers and 9 grid zones in top-down view', () => {
    useStageStore.getState().setCameraView('topDown');
    render(<VirtualStagePreview />);

    expect(screen.getByText(/PL \(Plaster Line\)/i)).toBeInTheDocument();
    expect(screen.getByText('CL')).toBeInTheDocument();
    expect(screen.getByText(/US \(Upstage\)/i)).toBeInTheDocument();
    expect(screen.getByText(/DS \(Downstage\)/i)).toBeInTheDocument();
    expect(screen.getByText('SL')).toBeInTheDocument();
    expect(screen.getByText('SR')).toBeInTheDocument();

    // 9 Acting areas
    expect(screen.getByText('UR')).toBeInTheDocument();
    expect(screen.getByText('UC')).toBeInTheDocument();
    expect(screen.getByText('UL')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('DR')).toBeInTheDocument();
    expect(screen.getByText('DC')).toBeInTheDocument();
    expect(screen.getByText('DL')).toBeInTheDocument();

    // Audience / FOH zone
    expect(screen.getByText(/STAGE FRONT \/ AUDIENCE DIRECTION/i)).toBeInTheDocument();
    expect(screen.getByText(/FOH CONTROL & AUDIENCE ZONE/i)).toBeInTheDocument();
  });

  it('displays fixture counter badge matching requested cue fixtures and power consumption', () => {
    const actId = useShowStore.getState().show.acts[0].id;
    const testCueId = useShowStore.getState().addCue(actId, {
      cueNumber: '5.0',
      title: 'Counter Test Cue',
      departments: {
        lx: {
          sceneName: 'Rock Show',
          fixtureCount: 12,
          fixtureSummary: '8 Spot + 4 Beam',
        },
      },
    });
    useShowStore.getState().goCue(testCueId);

    render(<VirtualStagePreview />);
    expect(screen.getByText(/Nhập 12 · Hiển thị 12/i)).toBeInTheDocument();
    // Power consumption badge: 8*1000W + 4*350W = 9400W -> 9.4 kW
    expect(screen.getAllByText(/9\.4 kW/i).length).toBeGreaterThan(0);
  });

  it('shows "Nhập 30 · Hiển thị 30" for a 30-fixture device list (Đợt 10.1)', () => {
    const actId = useShowStore.getState().show.acts[0].id;
    const cueId = useShowStore.getState().addCue(actId, {
      cueNumber: '6.0',
      title: 'Thirty Fixtures',
      departments: {
        lx: {
          sceneName: 'Full Rig',
          fixtures: [
            { id: 'a', name: 'Beam', category: 'Lighting', subType: 'Beam', count: 8 },
            { id: 'b', name: 'Spot', category: 'Lighting', subType: 'Spot', count: 4, position: 'FOH' },
            { id: 'c', name: 'Wash', category: 'Lighting', subType: 'Wash', count: 12 },
            { id: 'd', name: 'Follow', category: 'Lighting', subType: 'Follow', count: 2 },
            { id: 'e', name: 'Blinder', category: 'Lighting', subType: 'Blinder', count: 4 },
          ],
        },
      },
    });
    useShowStore.getState().goCue(cueId);

    render(<VirtualStagePreview />);
    expect(screen.getByText(/Nhập 30 · Hiển thị 30/i)).toBeInTheDocument();
  });

  it('toggles haze on and off in toolbar', () => {
    render(<VirtualStagePreview />);
    const hazeBtn = screen.getByRole('button', { name: /Haze: ON/i });
    expect(hazeBtn).toBeInTheDocument();

    fireEvent.click(hazeBtn);
    expect(screen.getByRole('button', { name: /Haze: OFF/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Haze: OFF/i }));
    expect(screen.getByRole('button', { name: /Haze: ON/i })).toBeInTheDocument();
  });

  it('allows selecting optical dimmer curves', () => {
    render(<VirtualStagePreview />);
    const dimmerSelect = screen.getByTitle(/Đường cong dimmer quang học/i) as HTMLSelectElement;
    expect(dimmerSelect).toBeInTheDocument();
    expect(dimmerSelect.value).toBe('square');

    fireEvent.change(dimmerSelect, { target: { value: 'linear' } });
    expect(dimmerSelect.value).toBe('linear');
    expect(screen.getByText(/Dimmer: linear/i)).toBeInTheDocument();
  });
});
