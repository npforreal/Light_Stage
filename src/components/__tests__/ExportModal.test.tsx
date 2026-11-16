import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportModal } from '../export/ExportModal';
import { useShowStore } from '../../store/useShowStore';
import { createDefaultShow } from '../../types/stage';

describe('ExportModal Component', () => {
  beforeEach(() => {
    const show = createDefaultShow('Export Test Show');
    useShowStore.getState().loadShow(show);
  });

  it('renders modal options when open', () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Export & Print Reports')).toBeInTheDocument();
    expect(screen.getByText('Print / Save PDF Cue Sheet')).toBeInTheDocument();
    expect(screen.getByText('Download Cue Sheet (Excel / CSV)')).toBeInTheDocument();
    expect(screen.getByText('Download Hardware Inventory (Excel / CSV)')).toBeInTheDocument();
    expect(screen.getByText('Save Project (.lightstage)')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ExportModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('switches role filter button', () => {
    render(<ExportModal isOpen={true} onClose={vi.fn()} />);

    const lxButton = screen.getByRole('button', { name: 'LX' });
    fireEvent.click(lxButton);

    expect(lxButton).toHaveClass('bg-accent');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
