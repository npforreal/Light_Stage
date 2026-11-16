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
    expect(screen.getByText('Download Cue Sheet (CSV)')).toBeInTheDocument();
    expect(screen.getByText('Download Hardware Inventory (CSV)')).toBeInTheDocument();
    expect(screen.getByText('Print / Save PDF Light Plot')).toBeInTheDocument();
    expect(screen.getByText('Save Project (.lightstage)')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ExportModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('switches role filter button including Stage (ST)', () => {
    render(<ExportModal isOpen={true} onClose={vi.fn()} />);

    const lxButton = screen.getByRole('button', { name: 'LX' });
    fireEvent.click(lxButton);
    expect(lxButton).toHaveClass('bg-accent');

    const stButton = screen.getByRole('button', { name: 'Stage (ST)' });
    expect(stButton).toBeInTheDocument();
    fireEvent.click(stButton);
    expect(stButton).toHaveClass('bg-accent');
  });

  it('uses accessible button elements for export cards', () => {
    render(<ExportModal isOpen={true} onClose={vi.fn()} />);

    const pdfButton = screen.getByRole('button', { name: /Print \/ Save PDF Cue Sheet/i });
    expect(pdfButton).toBeInTheDocument();
    expect(pdfButton.tagName.toLowerCase()).toBe('button');

    const csvButton = screen.getByRole('button', { name: /Download Cue Sheet \(CSV\)/i });
    expect(csvButton).toBeInTheDocument();
    expect(csvButton.tagName.toLowerCase()).toBe('button');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
