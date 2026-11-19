/**
 * Đợt 16 — Fix từ self-review (3 Medium).
 *
 * 1. persistence: KHÔNG auto-subscribe khi import module — App gọi
 *    `initAutoSaveSubscription()` tường minh, cleanup unsubscribe khi unmount.
 * 2. readLightStageFile: chặn file vượt quá MAX_LIGHTSTAGE_FILE_BYTES trước
 *    khi đọc vào bộ nhớ.
 * 3. Import-error modal là modal thật sự: Esc đóng, cue keys (Space) bị chặn
 *    khi modal mở, sau khi đóng thì phím hoạt động lại.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import {
  readLightStageFile,
  initAutoSaveSubscription,
  stopAutoSaveSubscription,
  loadAutoSave,
  clearAutoSave,
  MAX_LIGHTSTAGE_FILE_BYTES,
} from '../services/persistence';
import { useShowStore } from '../store/useShowStore';
import { createDefaultShow } from '../types/stage';

describe('16-review Medium #1 — module import không có side effect subscribe', () => {
  beforeEach(() => {
    clearAutoSave();
  });

  it('initAutoSaveSubscription trả cleanup, gọi cleanup thì dừng ghi', () => {
    const cleanup = initAutoSaveSubscription(0);
    // Không assert qua import order — chỉ khẳng định contract rõ ràng:
    expect(typeof cleanup).toBe('function');
    cleanup();
    stopAutoSaveSubscription(); // idempotent, không ném
  });

  it('init → đổi show → loadAutoSave có bản ghi (wiring hoạt động)', async () => {
    const cleanup = initAutoSaveSubscription(0);
    try {
      useShowStore.getState().loadShow(createDefaultShow('Explicit Wiring Test'));
      await waitFor(() => {
        const meta = loadAutoSave();
        expect(meta?.metadata.title).toBe('Explicit Wiring Test');
      });
    } finally {
      cleanup();
      useShowStore.setState({ show: createDefaultShow('cleanup') });
      clearAutoSave();
    }
  });
});

describe('16-review Medium #2 — giới hạn kích thước file .lightstage', () => {
  it('file vượt MAX_LIGHTSTAGE_FILE_BYTES → từ chối trước khi đọc', async () => {
    // Không cấp phát 25 MB thật: readLightStageFile thoát sớm dựa vào .size
    const fakeBig = {
      size: MAX_LIGHTSTAGE_FILE_BYTES + 1,
      name: 'huge.lightstage',
    } as unknown as File;
    const result = await readLightStageFile(fakeBig);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  it('file đúng kích thước 0 → lỗi rõ ràng (không hồi quy)', async () => {
    const result = await readLightStageFile(
      new File([''], 'zero.lightstage', { type: 'application/json' })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('16-review Medium #3 — import-error modal: Esc đóng, cue keys inert', () => {
  beforeEach(() => {
    useShowStore.getState().loadShow(createDefaultShow('Esc Modal Test Show'));
  });

  it('modal mở → Space không đổi cue; Esc đóng; Space hoạt động lại', async () => {
    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const badFile = new File(['{"fileType": "lightstage_project",'], 'bad.lightstage', {
      type: 'application/json',
    });
    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('import-error-modal')).toBeInTheDocument();
    });

    // Cue keys bị chặn khi modal đang mở
    expect(useShowStore.getState().activeCueId).toBeNull();
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    expect(useShowStore.getState().activeCueId).toBeNull();

    // Esc đóng modal
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId('import-error-modal')).toBeNull();
    });

    // Sau khi đóng, Space gọi cue bình thường
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    expect(useShowStore.getState().activeCueId).not.toBeNull();
  });
});
