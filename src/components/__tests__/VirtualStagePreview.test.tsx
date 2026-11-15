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
});
