import { describe, it, expect } from 'vitest';
import {
  generateCueSheetCsv,
  generateHardwareInventoryCsv,
  generatePrintableCueSheetHtml,
} from '../exporter';
import { createDefaultShow } from '../../types/stage';

describe('Exporter Service', () => {
  const show = createDefaultShow('Summer Gala 2026');

  describe('generateCueSheetCsv', () => {
    it('generates CSV with UTF-8 BOM and correct headers', () => {
      const csv = generateCueSheetCsv(show, 'ALL');

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('STT / Cue #');
      expect(csv).toContain('Pre-Show / Walk-in');
      expect(csv).toContain('Summer Gala 2026');
    });

    it('filters department columns when a specific role is selected', () => {
      const lxCsv = generateCueSheetCsv(show, 'LX');
      expect(lxCsv).toContain('Ánh sáng (LX)');
      expect(lxCsv).not.toContain('Màn LED (VX)');
      expect(lxCsv).not.toContain('Âm thanh (SQ)');

      const vxCsv = generateCueSheetCsv(show, 'VX');
      expect(vxCsv).toContain('Màn LED (VX)');
      expect(vxCsv).not.toContain('Ánh sáng (LX)');
    });
  });

  describe('generateHardwareInventoryCsv', () => {
    it('generates summary and equipment listing', () => {
      const csv = generateHardwareInventoryCsv(show.acts);

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('TỔNG KẾT TRANG THIẾT BỊ SÂN KHẤU');
      expect(csv).toContain('Tổng số lượt đèn (Total Lighting Fixtures): 12');
      expect(csv).toContain('Tổng số lượt màn LED (Total Screens): 1');
    });
  });

  describe('generatePrintableCueSheetHtml', () => {
    it('generates valid printable HTML document with @media print CSS', () => {
      const html = generatePrintableCueSheetHtml(show, 'ALL');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Summer Gala 2026 — Cue Sheet');
      expect(html).toContain('@media print');
      expect(html).toContain('window.print()');
      expect(html).toContain('Pre-Show / Walk-in');
    });
  });
});
