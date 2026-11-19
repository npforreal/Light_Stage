/**
 * Đợt 16.2 — Autosave trung thực.
 *
 * Quy tắc: chỉ `markSaved()` khi bytes thực sự được ghi. Khi ghi lỗi:
 *  - giữ `isDirty = true`
 *  - đặt `autosaveError` và hiện chip cảnh báo (icon + chữ) + banner một lần
 *  - `beforeunload` vẫn cảnh báo
 * Khi lưu thành công trở lại: xoá lỗi, chip trở về "Đã lưu".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { useShowStore } from '../store/useShowStore';
import { saveAutoSave, AUTOSAVE_STORAGE_KEY } from '../services/persistence';
import { createDefaultShow } from '../types/stage';

const ERROR_TEXT = 'Chưa lưu — lỗi lưu tự động';

function failStorage() {
  return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota exceeded', 'QuotaExceededError');
  });
}

describe('16.2 — saveAutoSave báo lỗi trung thực', () => {
  beforeEach(() => {
    useShowStore.getState().loadShow(createDefaultShow('Autosave Test'));
    useShowStore.setState({ autosaveError: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('trả false và không ghi khi storage ném QuotaExceededError', () => {
    const spy = failStorage();
    const ok = saveAutoSave(useShowStore.getState().show);
    expect(ok).toBe(false);
    expect(spy).toHaveBeenCalled();
  });

  it('trả true và ghi đúng key khi storage hoạt động', () => {
    const ok = saveAutoSave(useShowStore.getState().show);
    expect(ok).toBe(true);
    expect(localStorage.getItem(AUTOSAVE_STORAGE_KEY)).toBeTruthy();
  });
});

describe('16.2 — App: autosave lỗi thì không được nói "Đã lưu"', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useShowStore.getState().loadShow(createDefaultShow('Autosave Test'));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('lỗi ghi → giữ isDirty, đặt autosaveError, có chip + banner + nút lưu file', () => {
    const spy = failStorage();
    render(<App />);

    act(() => {
      useShowStore.setState({ isDirty: true });
    });
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(spy).toHaveBeenCalled();
    expect(useShowStore.getState().isDirty).toBe(true);
    expect(useShowStore.getState().autosaveError).toMatch(/lỗi lưu tự động/i);

    // Chip trạng thái: icon cảnh báo + chữ, không chỉ đổi màu
    expect(screen.getAllByText(ERROR_TEXT).length).toBeGreaterThan(0);
    const chip = screen.getByTestId('header-save-status');
    expect(chip).toHaveAttribute('data-state', 'error');
    expect(chip.querySelector('svg')).not.toBeNull();

    // Banner hành động: nút lưu file .lightstage
    expect(screen.getByRole('button', { name: /Lưu file \.lightstage/i })).toBeInTheDocument();
  });

  it('Ctrl/Cmd+S không lưu được → vẫn dirty và báo lỗi (không markSaved)', () => {
    failStorage();
    render(<App />);

    act(() => {
      useShowStore.setState({ isDirty: true });
    });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    expect(useShowStore.getState().isDirty).toBe(true);
    expect(useShowStore.getState().autosaveError).toMatch(/lỗi lưu tự động/i);
  });

  it('phục hồi storage → Ctrl+S xoá lỗi và đánh dấu đã lưu', () => {
    const spy = failStorage();
    render(<App />);

    act(() => {
      useShowStore.setState({ isDirty: true });
    });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(useShowStore.getState().autosaveError).toBeTruthy();

    spy.mockRestore();

    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    expect(useShowStore.getState().autosaveError).toBeNull();
    expect(useShowStore.getState().isDirty).toBe(false);
    expect(screen.queryByText(ERROR_TEXT)).toBeNull();
  });

  it('autosave thành công bình thường → không có lỗi, isDirty=false', () => {
    render(<App />);

    act(() => {
      useShowStore.setState({ isDirty: true });
    });
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(useShowStore.getState().autosaveError).toBeNull();
    expect(useShowStore.getState().isDirty).toBe(false);
    expect(screen.queryByText(ERROR_TEXT)).toBeNull();
  });

  it('beforeunload vẫn chặn khi đang có lỗi lưu', () => {
    failStorage();
    render(<App />);

    act(() => {
      useShowStore.setState({ isDirty: true });
    });
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    const event = new Event('beforeunload', { cancelable: true });
    const prevented = !window.dispatchEvent(event);
    expect(prevented).toBe(true);
  });
});
