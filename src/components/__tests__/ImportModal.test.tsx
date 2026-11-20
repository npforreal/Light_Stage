import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportModal } from '../importer/ImportModal';
import { useShowStore } from '../../store/useShowStore';
import { createDefaultShow } from '../../types/stage';

describe('ImportModal Component', () => {
  beforeEach(() => {
    const show = createDefaultShow('Import Show');
    useShowStore.getState().loadShow(show);
  });

  it('renders sample CSV download link and sample demo show button', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Tải file CSV mẫu/i)).toBeInTheDocument();
    expect(screen.getByText(/Nạp Show Mẫu \(Load Demo Show\)/i)).toBeInTheDocument();
  });

  it('populates and processes CSV when Load Demo Show is clicked', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    const loadDemoBtn = screen.getByText(/Nạp Show Mẫu \(Load Demo Show\)/i);
    fireEvent.click(loadDemoBtn);

    expect(screen.getByText(/Headers detected! Verify or adjust column mappings below/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm & Import Cues/i)).toBeInTheDocument();
  });
});
