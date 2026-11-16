import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeModal, WELCOME_STORAGE_KEY } from '../WelcomeModal';

describe('WelcomeModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders 4-step first run guide when open', () => {
    render(<WelcomeModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Chào mừng bạn đến với Light Stage/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Nhập Kịch Bản/i)).toBeInTheDocument();
  });

  it('navigates through steps via Next and Prev buttons', () => {
    render(<WelcomeModal isOpen={true} onClose={vi.fn()} />);

    // Step 1 -> Step 2
    const nextBtn = screen.getByRole('button', { name: /Tiếp theo/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/2\. Tinh Chỉnh Phân Hệ/i)).toBeInTheDocument();

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo/i }));
    expect(screen.getByText(/3\. Giám Sát Chế Độ Kép/i)).toBeInTheDocument();

    // Step 3 -> Step 4
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo/i }));
    expect(screen.getByText(/4\. Vận Hành Live Show/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bắt đầu ngay/i })).toBeInTheDocument();

    // Step 4 -> Step 3 via Prev
    const prevBtn = screen.getByRole('button', { name: /Trước/i });
    fireEvent.click(prevBtn);
    expect(screen.getByText(/3\. Giám Sát Chế Độ Kép/i)).toBeInTheDocument();
  });

  it('dismisses and saves seen flag in localStorage on finish', () => {
    const onClose = vi.fn();
    render(<WelcomeModal isOpen={true} onClose={onClose} />);

    // Jump to step 4
    const nextBtn = screen.getByRole('button', { name: /Tiếp theo/i });
    fireEvent.click(nextBtn);
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo/i }));

    const finishBtn = screen.getByRole('button', { name: /Bắt đầu ngay/i });
    fireEvent.click(finishBtn);

    expect(onClose).toHaveBeenCalled();
    expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBe('true');
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<WelcomeModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
