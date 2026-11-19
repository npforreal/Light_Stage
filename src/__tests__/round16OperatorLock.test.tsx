/**
 * Đợt 16.1 — Operator Lock chặn ĐÚNG 5 lệnh gọi cue.
 *
 * Ngữ nghĩa đã chốt trong PLAN.md:
 *  - Khóa = chặn GO / Standby / Hold / Prev / Next (phím, chuột, menu, Stage Clock).
 *  - KHÔNG chặn: xem/cuộn, đồng hồ đang chạy, Ctrl/Cmd+S, `?`, `i`, Esc đóng modal,
 *    và VX panic (F1–F4, Alt+F) vì đây là đường thoát sự cố live.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { useShowStore, handleGlobalKeyDown } from '../store/useShowStore';
import { useClockStore } from '../store/useClockStore';
import { useVisualStore } from '../store/useVisualStore';

interface Seed {
  ids: string[];
}

function seedThreeCues(): Seed {
  useShowStore.getState().newShow('Lock Semantics Test');
  const actId = useShowStore.getState().show.acts[0].id;
  useShowStore.getState().addCue(actId, { cueNumber: '1.1', title: 'Second Cue' });
  useShowStore.getState().addCue(actId, { cueNumber: '1.2', title: 'Third Cue' });
  return { ids: useShowStore.getState().getAllCues().map((c) => c.id) };
}

function cueSnapshot() {
  const s = useShowStore.getState();
  return {
    show: JSON.parse(JSON.stringify(s.show)),
    activeCueId: s.activeCueId,
    standbyCueId: s.standbyCueId,
  };
}

const isDirtyState = () => useShowStore.getState().isDirty;

describe('16.1 — Operator Lock: tầng store chặn 5 lệnh gọi cue', () => {
  let seed: Seed;

  beforeEach(() => {
    useClockStore.getState().resetClock();
    seed = seedThreeCues();
    useShowStore.getState().setOperatorLocked(false);
    useShowStore.getState().standbyCue(seed.ids[1]);
  });

  it('goCue() là no-op khi khóa (không đổi trạng thái cue, không chạy đồng hồ)', () => {
    useShowStore.getState().setOperatorLocked(true);
    const before = cueSnapshot();

    useShowStore.getState().goCue(seed.ids[0]);

    expect(cueSnapshot()).toEqual(before);
    expect(useClockStore.getState().isRunning).toBe(false);
  });

  it('standbyCue() là no-op khi khóa', () => {
    useShowStore.getState().setOperatorLocked(true);
    const before = cueSnapshot();

    useShowStore.getState().standbyCue(seed.ids[2]);

    expect(cueSnapshot()).toEqual(before);
  });

  it('holdCue() là no-op khi khóa (không pause đồng hồ)', () => {
    // Chuẩn bị: cue 0 đang chạy để hold có tác dụng nếu không khóa
    useShowStore.getState().goCue(seed.ids[0]);
    expect(useShowStore.getState().activeCueId).toBe(seed.ids[0]);

    useShowStore.getState().setOperatorLocked(true);
    const before = cueSnapshot();
    useClockStore.setState({ isRunning: true });

    useShowStore.getState().holdCue(seed.ids[0]);

    expect(cueSnapshot()).toEqual(before);
    expect(useClockStore.getState().isRunning).toBe(true);
  });

  it('nextCue()/prevCue() là no-op khi khóa', () => {
    useShowStore.getState().setOperatorLocked(true);
    const before = cueSnapshot();

    useShowStore.getState().nextCue();
    expect(cueSnapshot()).toEqual(before);

    useShowStore.getState().prevCue();
    expect(cueSnapshot()).toEqual(before);
  });

  it('goNextCue() bị chặn gián tiếp qua goCue khi khóa', () => {
    useShowStore.getState().setOperatorLocked(true);
    const before = cueSnapshot();

    useShowStore.getState().goNextCue();

    expect(cueSnapshot()).toEqual(before);
    expect(useClockStore.getState().isRunning).toBe(false);
  });

  it('mở khóa → cả 5 lệnh hoạt động lại', () => {
    useShowStore.getState().setOperatorLocked(true);
    useShowStore.getState().goCue(seed.ids[0]);
    expect(useShowStore.getState().activeCueId).toBeNull();

    useShowStore.getState().setOperatorLocked(false);

    useShowStore.getState().goCue(seed.ids[0]);
    expect(useShowStore.getState().activeCueId).toBe(seed.ids[0]);

    useShowStore.getState().standbyCue(seed.ids[1]);
    expect(useShowStore.getState().standbyCueId).toBe(seed.ids[1]);

    useShowStore.getState().nextCue();
    expect(useShowStore.getState().standbyCueId).toBe(seed.ids[2]);

    useShowStore.getState().prevCue();
    expect(useShowStore.getState().standbyCueId).toBe(seed.ids[1]);

    useShowStore.getState().holdCue(seed.ids[0]);
    expect(useShowStore.getState().getCueById(seed.ids[0])?.status).toBe('Hold');
  });

  it('không đánh dấu dirty khi lệnh cue bị chặn', () => {
    seedThreeCues();
    useShowStore.setState({ isDirty: false });
    useShowStore.getState().setOperatorLocked(true);

    useShowStore.getState().goCue(seed.ids[0]);
    useShowStore.getState().holdCue(seed.ids[0]);
    useShowStore.getState().nextCue();
    useShowStore.getState().prevCue();
    useShowStore.getState().standbyCue(seed.ids[2]);

    expect(isDirtyState()).toBe(false);
  });
});

describe('16.1 — handleGlobalKeyDown: khóa chỉ chặn lệnh cue, không chặn lưu/undo', () => {
  beforeEach(() => {
    seedThreeCues();
    useShowStore.setState({ isOperatorLocked: true, canUndo: true, canRedo: true });
  });

  it('Ctrl/Cmd+S không bị khóa chặn và gọi luồng lưu thật (onSave)', () => {
    const onSave = vi.fn();
    const markSavedSpy = vi.spyOn(useShowStore.getState(), 'markSaved');

    const evt = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    expect(handleGlobalKeyDown(evt, { onSave })).toBe(true);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(markSavedSpy).not.toHaveBeenCalled();
  });

  it('Ctrl+S khi khóa KHÔNG tự markSaved nếu không có luồng lưu', () => {
    const markSavedSpy = vi.spyOn(useShowStore.getState(), 'markSaved');

    const evt = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    handleGlobalKeyDown(evt);

    expect(markSavedSpy).not.toHaveBeenCalled();
  });

  it('Undo/Redo vẫn chạy khi khóa (không phải lệnh gọi cue)', () => {
    const undoSpy = vi.spyOn(useShowStore.getState(), 'undo');
    const redoSpy = vi.spyOn(useShowStore.getState(), 'redo');

    expect(handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))).toBe(true);
    expect(undoSpy).toHaveBeenCalledTimes(1);

    expect(
      handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }))
    ).toBe(true);
    expect(redoSpy).toHaveBeenCalledTimes(1);
  });
});

describe('16.1 — App: phím và nút trên Header bị chặn khi khóa', () => {
  beforeEach(() => {
    seedThreeCues();
    useClockStore.getState().resetClock();
    useVisualStore.setState({
      isFrozen: false,
      isBlackout: false,
      activeLayers: { background: true, slide: true, overlay: true },
    });
  });

  function lockViaHeader() {
    render(<App />);
    const lockBtn = screen.getByTitle(/Unlocked: Hotkeys active/i);
    fireEvent.click(lockBtn);
    expect(useShowStore.getState().isOperatorLocked).toBe(true);
    return lockBtn;
  }

  it('Space / Enter / B / mũi tên / Esc không gọi cue khi khóa', () => {
    lockViaHeader();
    const before = cueSnapshot();

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
    fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(cueSnapshot()).toEqual(before);
  });

  it('`?` vẫn mở Help, `i` vẫn toggle Inspector khi khóa', () => {
    lockViaHeader();
    expect(useShowStore.getState().isInspectorOpen).toBe(false);

    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
    expect(document.getElementById('help-modal-title')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'i' });
    expect(useShowStore.getState().isInspectorOpen).toBe(true);

    fireEvent.keyDown(window, { key: 'i' });
    expect(useShowStore.getState().isInspectorOpen).toBe(false);
  });

  it('VX panic (F1–F4, Alt+F) vẫn chạy khi khóa', () => {
    lockViaHeader();
    useVisualStore.setState({
      isFrozen: false,
      activeLayers: { background: true, slide: true, overlay: true },
    });

    fireEvent.keyDown(window, { key: 'F1' });
    expect(useVisualStore.getState().activeLayers.background).toBe(false);

    fireEvent.keyDown(window, { key: 'F4' });
    expect(useVisualStore.getState().activeLayers).toEqual({
      background: false,
      slide: false,
      overlay: false,
    });

    fireEvent.keyDown(window, { key: 'f', altKey: true });
    expect(useVisualStore.getState().isFrozen).toBe(true);
  });

  it('nút GO / STBY / Hold trên Header bị disabled + aria-disabled khi khóa', () => {
    lockViaHeader();

    const go = screen.getByTestId('header-hero-go-button');
    const standby = screen.getByTestId('header-standby-button');
    const hold = screen.getByTestId('header-hold-button');

    for (const btn of [go, standby, hold]) {
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      expect(btn).toHaveAttribute('title', 'Đang khóa — mở khóa để gọi cue');
    }
  });

  it('click nút GO/STBY/Hold khi khóa không đổi cue; mở khóa thì chạy lại', () => {
    const lockBtn = lockViaHeader();
    const before = cueSnapshot();

    fireEvent.click(screen.getByTestId('header-hero-go-button'));
    fireEvent.click(screen.getByTestId('header-standby-button'));
    fireEvent.click(screen.getByTestId('header-hold-button'));

    expect(cueSnapshot()).toEqual(before);

    // Mở khóa qua chip Lock
    fireEvent.click(screen.getByTitle(/Operator Locked: Hotkeys disabled/i));
    expect(useShowStore.getState().isOperatorLocked).toBe(false);
    expect(lockBtn).toHaveAttribute('title');
  });

  it('mở khóa → Space gọi được cue (lưới an toàn cho đợt 17)', () => {
    lockViaHeader();
    fireEvent.click(screen.getByTitle(/Operator Locked: Hotkeys disabled/i));

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });

    expect(useShowStore.getState().activeCueId).not.toBeNull();
  });
});
