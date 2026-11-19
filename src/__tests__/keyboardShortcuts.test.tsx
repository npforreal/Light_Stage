import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { useShowStore, handleGlobalKeyDown } from '../store/useShowStore';
import { useVisualStore } from '../store/useVisualStore';
import { createDefaultShow } from '../types/stage';
import {
  SYSTEM_SHORTCUTS,
  detectShortcutCollisions,
  isKeyboardProtected,
  isEditableTarget,
  normalizeShortcutSignature,
} from '../services/shortcutRegistry';

describe('Keyboard Shortcuts & Anti-Conflict Suite (Đợt 14.2 / R2)', () => {
  beforeEach(() => {
    const show = createDefaultShow('Test Live Show');
    useShowStore.getState().loadShow(show);
    useShowStore.setState({ isOperatorLocked: false });
    useVisualStore.setState({
      isFrozen: false,
      isBlackout: false,
      activeLayers: { background: true, slide: true, overlay: true },
    });
  });

  describe('1. Input & Textarea Protection (Anti-Interference Guard)', () => {
    it('NEVER triggers Go when Space is pressed inside an <input>', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: ' ', code: 'Space' });
      expect(goCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('NEVER triggers Go when Enter is pressed inside an <input>', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(goCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('NEVER switches Standby when B is pressed inside an <input>', () => {
      render(<App />);
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: 'b', code: 'KeyB' });
      fireEvent.keyDown(input, { key: 'B', code: 'KeyB' });
      expect(nextCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('NEVER triggers Go or Standby when typing in a <textarea>', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      fireEvent.keyDown(textarea, { key: ' ', code: 'Space' });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(textarea, { key: 'b', code: 'KeyB' });

      expect(goCueSpy).not.toHaveBeenCalled();
      expect(nextCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });

    it('NEVER triggers Go or Standby inside a contentEditable container or its children', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');

      const div = document.createElement('div');
      div.contentEditable = 'true';
      const childSpan = document.createElement('span');
      div.appendChild(childSpan);
      document.body.appendChild(div);
      childSpan.focus();

      fireEvent.keyDown(childSpan, { key: ' ', code: 'Space' });
      fireEvent.keyDown(childSpan, { key: 'b', code: 'KeyB' });

      expect(goCueSpy).not.toHaveBeenCalled();
      expect(nextCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('NEVER changes cue or holds cue when Arrow keys or Escape are pressed inside an input', () => {
      render(<App />);
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');
      const prevCueSpy = vi.spyOn(useShowStore.getState(), 'prevCue');
      const holdCueSpy = vi.spyOn(useShowStore.getState(), 'holdCue');

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(nextCueSpy).not.toHaveBeenCalled();
      expect(prevCueSpy).not.toHaveBeenCalled();
      expect(holdCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('NEVER toggles Inspector when I is pressed inside an <input>', () => {
      render(<App />);
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const toggleInspectorSpy = vi.spyOn(useShowStore.getState(), 'toggleInspector');

      fireEvent.keyDown(input, { key: 'i', code: 'KeyI', bubbles: true });
      expect(toggleInspectorSpy).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('NEVER triggers Go inside a <select> element', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

      const select = document.createElement('select');
      document.body.appendChild(select);
      select.focus();

      fireEvent.keyDown(select, { key: ' ', code: 'Space' });
      expect(goCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(select);
    });

    it('NEVER triggers Go when target is an <option> inside a <select>', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

      const select = document.createElement('select');
      const option = document.createElement('option');
      select.appendChild(option);
      document.body.appendChild(select);

      fireEvent.keyDown(option, { key: ' ', code: 'Space' });
      expect(goCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(select);
    });

    it('NEVER triggers Go or Standby inside an element with contenteditable="plaintext-only"', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'plaintext-only');
      const childSpan = document.createElement('span');
      div.appendChild(childSpan);
      document.body.appendChild(div);
      childSpan.focus();

      fireEvent.keyDown(childSpan, { key: ' ', code: 'Space' });
      fireEvent.keyDown(childSpan, { key: 'b', code: 'KeyB' });

      expect(goCueSpy).not.toHaveBeenCalled();
      expect(nextCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('NEVER triggers Go or Standby inside an element with uppercase contenteditable="TRUE"', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'TRUE');
      const childSpan = document.createElement('span');
      div.appendChild(childSpan);
      document.body.appendChild(div);
      childSpan.focus();

      fireEvent.keyDown(childSpan, { key: ' ', code: 'Space' });
      fireEvent.keyDown(childSpan, { key: 'b', code: 'KeyB' });

      expect(goCueSpy).not.toHaveBeenCalled();
      expect(nextCueSpy).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('does NOT intercept Ctrl+Z in input so browser native undo is preserved', () => {
      useShowStore.setState({ canUndo: true });
      const undoSpy = vi.spyOn(useShowStore.getState(), 'undo');

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      Object.defineProperty(undoEvent, 'target', { value: input });
      const handled = handleGlobalKeyDown(undoEvent);

      expect(handled).toBe(false);
      expect(undoSpy).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });
  });

  describe('2. Global Shortcuts when outside inputs (Live Show Ergonomics)', () => {
    it('triggers goCue when Space is pressed outside inputs', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

      document.body.focus();
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      expect(goCueSpy).toHaveBeenCalled();
    });

    it('triggers goCue when Enter is pressed outside inputs', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

      document.body.focus();
      fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
      expect(goCueSpy).toHaveBeenCalled();
    });

    it('triggers nextCue (Standby) when B is pressed outside inputs', () => {
      render(<App />);
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');

      document.body.focus();
      fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
      expect(nextCueSpy).toHaveBeenCalled();
    });

    it('triggers holdCue when Escape is pressed outside inputs', () => {
      render(<App />);
      const holdCueSpy = vi.spyOn(useShowStore.getState(), 'holdCue');

      document.body.focus();
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(holdCueSpy).toHaveBeenCalled();
    });

    it('triggers nextCue / prevCue on ArrowDown / ArrowUp outside inputs', () => {
      render(<App />);
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');
      const prevCueSpy = vi.spyOn(useShowStore.getState(), 'prevCue');

      document.body.focus();
      fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(nextCueSpy).toHaveBeenCalled();

      fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(prevCueSpy).toHaveBeenCalled();
    });

    it('opens Help Modal on "?" or "Shift+/"', () => {
      render(<App />);
      document.body.focus();

      fireEvent.keyDown(window, { key: '?', code: 'Slash', shiftKey: true });
      expect(screen.getByText(/Hướng dẫn & Phím tắt Vận hành/i)).toBeInTheDocument();
    });

    it('handles VX panic clear layers (F1 - F4) and Freeze (Alt+F)', () => {
      render(<App />);
      document.body.focus();

      // F1: Clear background
      act(() => {
        fireEvent.keyDown(window, { key: 'F1', code: 'F1' });
      });
      expect(useVisualStore.getState().activeLayers.background).toBe(false);

      // F2: Clear slide
      act(() => {
        fireEvent.keyDown(window, { key: 'F2', code: 'F2' });
      });
      expect(useVisualStore.getState().activeLayers.slide).toBe(false);

      // F3: Clear overlay
      act(() => {
        fireEvent.keyDown(window, { key: 'F3', code: 'F3' });
      });
      expect(useVisualStore.getState().activeLayers.overlay).toBe(false);

      // F4: Clear all VX
      act(() => {
        useVisualStore.setState({ activeLayers: { background: true, slide: true, overlay: true } });
      });
      act(() => {
        fireEvent.keyDown(window, { key: 'F4', code: 'F4' });
      });
      expect(useVisualStore.getState().activeLayers.background).toBe(false);
      expect(useVisualStore.getState().activeLayers.slide).toBe(false);
      expect(useVisualStore.getState().activeLayers.overlay).toBe(false);

      // Alt+F: Toggle freeze
      expect(useVisualStore.getState().isFrozen).toBe(false);
      act(() => {
        fireEvent.keyDown(window, { key: 'f', code: 'KeyF', altKey: true });
      });
      expect(useVisualStore.getState().isFrozen).toBe(true);
    });

    it('toggles Inspector Drawer when I or i is pressed outside inputs', () => {
      render(<App />);
      const toggleInspectorSpy = vi.spyOn(useShowStore.getState(), 'toggleInspector');

      document.body.focus();
      fireEvent.keyDown(window, { key: 'i', code: 'KeyI' });
      expect(toggleInspectorSpy).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'I', code: 'KeyI' });
      expect(toggleInspectorSpy).toHaveBeenCalledTimes(2);
    });

    it('performs Undo, Redo, and Save Show on Ctrl/Cmd combinations', () => {
      render(<App />);
      useShowStore.setState({ canUndo: true, canRedo: true });
      const undoSpy = vi.spyOn(useShowStore.getState(), 'undo');
      const redoSpy = vi.spyOn(useShowStore.getState(), 'redo');

      document.body.focus();

      // Ctrl+Z
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      expect(undoSpy).toHaveBeenCalled();

      // Ctrl+Y (Redo)
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      expect(redoSpy).toHaveBeenCalled();

      // Ctrl+Shift+Z (Redo variant)
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
      expect(redoSpy).toHaveBeenCalledTimes(2);

      // Ctrl+S (Save) — must actually persist, not just flip the flag
      useShowStore.setState({ isDirty: true });
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
      expect(setItemSpy).toHaveBeenCalled();
      expect(useShowStore.getState().isDirty).toBe(false);
      setItemSpy.mockRestore();
    });
  });

  describe('3. Operator Lock Guard (chỉ chặn lệnh gọi cue)', () => {
    it('suppresses cue shortcuts (Space, B) but keeps undo/redo/save when Operator Lock is active', () => {
      render(<App />);
      useShowStore.setState({ canUndo: true, canRedo: true });

      const lockBtn = screen.getByTitle(/Unlocked: Hotkeys active/i);
      fireEvent.click(lockBtn);
      expect(useShowStore.getState().isOperatorLocked).toBe(true);

      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');
      const nextCueSpy = vi.spyOn(useShowStore.getState(), 'nextCue');
      const undoSpy = vi.spyOn(useShowStore.getState(), 'undo');
      const redoSpy = vi.spyOn(useShowStore.getState(), 'redo');

      document.body.focus();

      // Playback hotkeys stay blocked
      fireEvent.keyDown(window, { key: ' ', code: 'Space' });
      fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
      expect(goCueSpy).not.toHaveBeenCalled();
      expect(nextCueSpy).not.toHaveBeenCalled();

      // Undo / Redo are edits, not cue commands -> still work while locked
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      expect(undoSpy).toHaveBeenCalled();
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      expect(redoSpy).toHaveBeenCalled();

      // Ctrl+S is never locked out; App wires it to a real autosave
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
      expect(setItemSpy).toHaveBeenCalled();
      setItemSpy.mockRestore();
    });

    it('handleGlobalKeyDown keeps undo/redo/save working when isOperatorLocked is true', () => {
      useShowStore.setState({ isOperatorLocked: true, canUndo: true, canRedo: true });
      const undoSpy = vi.spyOn(useShowStore.getState(), 'undo');
      const redoSpy = vi.spyOn(useShowStore.getState(), 'redo');
      const onSave = vi.fn();

      const undoEvt = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      const redoEvt = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true });
      const saveEvt = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });

      expect(handleGlobalKeyDown(undoEvt)).toBe(true);
      expect(handleGlobalKeyDown(redoEvt)).toBe(true);
      expect(handleGlobalKeyDown(saveEvt, { onSave })).toBe(true);
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(undoSpy).toHaveBeenCalled();
      expect(redoSpy).toHaveBeenCalled();
    });
  });

  describe('4. Button Blur Ergonomics', () => {
    it('blurs focused button and fires Go when Space is pressed', () => {
      render(<App />);
      const goCueSpy = vi.spyOn(useShowStore.getState(), 'goCue');

      const anyButton = screen.getByTitle('Cue Rundown List');
      anyButton.focus();
      expect(document.activeElement).toBe(anyButton);

      fireEvent.keyDown(anyButton, { key: ' ', code: 'Space' });
      expect(document.activeElement).not.toBe(anyButton);
      expect(goCueSpy).toHaveBeenCalled();
    });
  });

  describe('5. Collision Guard & Round 15 Pre-reservation', () => {
    it('freezes SYSTEM_SHORTCUTS preventing runtime mutations', () => {
      expect(Object.isFrozen(SYSTEM_SHORTCUTS)).toBe(true);
    });

    it('detects EXACTLY ZERO collisions across all system shortcuts', () => {
      const report = detectShortcutCollisions(SYSTEM_SHORTCUTS);
      if (report.hasCollisions) {
        console.error('Collisions found:', report.collisions);
      }
      expect(report.hasCollisions).toBe(false);
      expect(report.collisions).toHaveLength(0);
    });

    it('reserves "I" for Round 15 Right Inspector Drawer with zero conflict', () => {
      const inspectorDef = SYSTEM_SHORTCUTS.find((s) => s.id === 'inspector_drawer');
      expect(inspectorDef).toBeDefined();
      expect(inspectorDef?.key.toLowerCase()).toBe('i');
      expect(inspectorDef?.isReserved).toBe(true);

      // Verify no other shortcut in system maps to bare 'I' or 'i'
      const duplicates = SYSTEM_SHORTCUTS.filter(
        (s) => s.id !== 'inspector_drawer' && s.key.toLowerCase() === 'i' && !s.modifiers
      );
      expect(duplicates).toHaveLength(0);
    });

    it('correctly detects synthetic collisions if duplicate shortcuts exist', () => {
      const syntheticList = [
        ...SYSTEM_SHORTCUTS,
        {
          id: 'fake_conflict',
          label: 'Fake Conflict',
          description: 'Conflict with Space',
          category: 'playback' as const,
          key: ' ',
          code: 'Space',
        },
      ];
      const report = detectShortcutCollisions(syntheticList);
      expect(report.hasCollisions).toBe(true);
      expect(report.collisions.some((c) => c.signature === 'SPACE')).toBe(true);
    });
  });

  describe('6. Unit tests for predicate utilities', () => {
    it('isEditableTarget identifies editable elements and rejects buttons and non-editable elements', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const select = document.createElement('select');
      const option = document.createElement('option');
      select.appendChild(option);
      const button = document.createElement('button');
      const div = document.createElement('div');

      expect(isEditableTarget(input)).toBe(true);
      expect(isEditableTarget(textarea)).toBe(true);
      expect(isEditableTarget(select)).toBe(true);
      expect(isEditableTarget(option)).toBe(true);
      expect(isEditableTarget(button)).toBe(false);
      expect(isEditableTarget(div)).toBe(false);
      expect(isEditableTarget(null)).toBe(false);

      // plaintext-only
      const plaintextDiv = document.createElement('div');
      plaintextDiv.setAttribute('contenteditable', 'plaintext-only');
      expect(isEditableTarget(plaintextDiv)).toBe(true);

      // uppercase TRUE
      const uppercaseDiv = document.createElement('div');
      uppercaseDiv.setAttribute('contenteditable', 'TRUE');
      expect(isEditableTarget(uppercaseDiv)).toBe(true);

      // child inside contenteditable
      const childSpan = document.createElement('span');
      plaintextDiv.appendChild(childSpan);
      expect(isEditableTarget(childSpan)).toBe(true);
    });

    it('normalizeShortcutSignature standardizes modifier combinations and trims whitespace', () => {
      expect(normalizeShortcutSignature({ key: ' ', modifiers: {} })).toBe('SPACE');
      expect(normalizeShortcutSignature({ key: ' z ', modifiers: {} })).toBe('Z');
      expect(normalizeShortcutSignature({ key: 'z', modifiers: { ctrlOrMeta: true } })).toBe('CTRL+Z');
      expect(normalizeShortcutSignature({ key: 'z', modifiers: { ctrlOrMeta: true, shift: true } })).toBe('CTRL+SHIFT+Z');
      expect(normalizeShortcutSignature({ key: 'f', modifiers: { alt: true } })).toBe('ALT+F');
    });

    it('isKeyboardProtected checks both event target and document.activeElement', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      // Case A: target is input
      const fakeEvent1 = new KeyboardEvent('keydown', { key: 'a' });
      Object.defineProperty(fakeEvent1, 'target', { value: input });
      expect(isKeyboardProtected(fakeEvent1)).toBe(true);

      // Case B: activeElement is input
      input.focus();
      const fakeEvent2 = new KeyboardEvent('keydown', { key: 'a' });
      expect(isKeyboardProtected(fakeEvent2)).toBe(true);

      document.body.removeChild(input);
    });
  });
});
