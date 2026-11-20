import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpModal } from '../HelpModal';

describe('HelpModal Component', () => {
  it('renders modal content when open', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText(/Hướng dẫn & Phím tắt Vận hành/i)).toBeInTheDocument();
    expect(screen.getByText(/Kích hoạt GO \(Go Cue\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Chuẩn bị \(Standby Next\)/i)).toBeInTheDocument();
    expect(screen.getByText('Tạm dừng / Tiếp tục (Hold / Resume)')).toBeInTheDocument();
    expect(screen.getByText(/Chế độ Khóa Vận Hành \(Operator Lock\)/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<HelpModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /Đóng \(Close\)/i });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
