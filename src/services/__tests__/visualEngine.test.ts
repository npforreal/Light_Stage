import { describe, it, expect, beforeEach } from 'vitest';
import { renderVxTemplate, checkAspectMismatch, getOutputStatusDotClass } from '../visualEngine';
import { useVisualStore } from '../../store/useVisualStore';

describe('Visual LED (VX) Engine & Store — Inspired by FreeShow', () => {
  beforeEach(() => {
    // Reset store
    useVisualStore.setState({
      isFrozen: false,
      isBlackout: false,
      activeLayers: { background: true, slide: true, overlay: true },
    });
  });

  describe('11.0e & 11.5 Dynamic Template Variables', () => {
    it('interpolates {cue_title}, {cue_no}, {speaker} dynamically', () => {
      const template = 'CUE #{cue_no}: {cue_title} | Diễn giả: {speaker}';
      const rendered = renderVxTemplate(template, {
        cue_no: '04',
        cue_title: 'Keynote Tech Trends',
        speaker: 'John Doe',
      });
      expect(rendered).toBe('CUE #04: Keynote Tech Trends | Diễn giả: John Doe');
    });

    it('keeps unknown variable tokens intact without crashing', () => {
      const template = 'Hello {unknown_var}';
      const rendered = renderVxTemplate(template, {});
      expect(rendered).toBe('Hello {unknown_var}');
    });
  });

  describe('11.1 Aspect Ratio Warning', () => {
    it('detects 16:9 on 4:3 mismatch and produces warning', () => {
      const res = checkAspectMismatch('16:9', '4:3');
      expect(res.mismatch).toBe(true);
      expect(res.warning).toContain('lệch tỉ lệ');
    });

    it('considers matching ratios as valid', () => {
      const res = checkAspectMismatch('16:9', '16:9');
      expect(res.mismatch).toBe(false);
      expect(res.warning).toBeUndefined();
    });
  });

  describe('11.2 Multi-Layer Control & Panic Hotkeys', () => {
    it('toggles freeze mode and updates output statuses', () => {
      const store = useVisualStore.getState();
      expect(store.isFrozen).toBe(false);

      store.toggleFreezeVx();
      expect(useVisualStore.getState().isFrozen).toBe(true);
      expect(useVisualStore.getState().outputs[0].status).toBe('frozen');

      store.toggleFreezeVx();
      expect(useVisualStore.getState().isFrozen).toBe(false);
      expect(useVisualStore.getState().outputs[0].status).toBe('active');
    });

    it('clears specific layer or all layers when panic button is clicked', () => {
      const store = useVisualStore.getState();
      expect(store.activeLayers.background).toBe(true);
      expect(store.activeLayers.slide).toBe(true);

      store.clearLayer('background');
      expect(useVisualStore.getState().activeLayers.background).toBe(false);
      expect(useVisualStore.getState().activeLayers.slide).toBe(true);

      store.clearAllVx();
      expect(useVisualStore.getState().activeLayers.slide).toBe(false);
      expect(useVisualStore.getState().activeLayers.overlay).toBe(false);
    });

    it('returns appropriate dot class for output status', () => {
      expect(getOutputStatusDotClass('active')).toContain('bg-status-go');
      expect(getOutputStatusDotClass('frozen')).toContain('bg-status-standby');
      expect(getOutputStatusDotClass('blackout')).toContain('bg-status-danger');
      expect(getOutputStatusDotClass('standby')).toContain('bg-content-3');
    });
  });
});
