import { describe, it, expect } from 'vitest';
import {
  generateCueSheetCsv,
  generateHardwareInventoryCsv,
  generateLightPlotHtml,
  generatePrintableCueSheetHtml,
  escapeHtml,
  escapeCsvCell,
} from '../exporter';
import { createDefaultShow } from '../../types/stage';
import { STAGE_PRESETS } from '../../types/virtualStage';

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

    it('sanitizes CSV injection vectors starting with =, +, -, @, \\t, \\r', () => {
      expect(escapeCsvCell('=cmd|/C calc')).toBe("'=cmd|/C calc");
      expect(escapeCsvCell('+12345')).toBe("'+12345");
      expect(escapeCsvCell('-SUM(A1:A10)')).toBe("'-SUM(A1:A10)");
      expect(escapeCsvCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      expect(escapeCsvCell('Normal text')).toBe('Normal text');
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

    it('escapes user strings to prevent HTML injection and XSS', () => {
      const xssShow = createDefaultShow('<script>alert("PWNED")</script>');
      xssShow.acts[0].cues[0].title = '<img src=x onerror=alert(1)>';
      xssShow.acts[0].cues[0].notes = 'Danger & "quotes" \'apostrophe\' <tags>';

      const html = generatePrintableCueSheetHtml(xssShow, 'ALL');
      expect(html).not.toContain('<script>alert("PWNED")</script>');
      expect(html).toContain('&lt;script&gt;alert(&quot;PWNED&quot;)&lt;/script&gt;');
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).toContain('Danger &amp; &quot;quotes&quot; &#39;apostrophe&#39; &lt;tags&gt;');
    });

    it('pure escapeHtml works on diverse values', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('Normal')).toBe('Normal');
      expect(escapeHtml('A & B < C > D "E" \'F\'')).toBe('A &amp; B &lt; C &gt; D &quot;E&quot; &#39;F&#39;');
    });
  });

  describe('generateLightPlotHtml', () => {
    const config = JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage));

    it('renders a printable top-down plot with a numbered fixture schedule', () => {
      const html = generateLightPlotHtml(show, config);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Light Plot');
      expect(html).toContain('@media print');
      expect(html).toContain('window.print()');
      expect(html).toContain('<svg');
      expect(html).toContain('PLASTER LINE / DOWNSTAGE');
      expect(html).toContain('AUDIENCE / FOH');
      expect(html).toContain('<th>Type</th>');
      expect(html).toContain('W');
      expect(html).toContain('Sơ đồ tham khảo');
    });

    it('lists every enabled fixture and hides disabled ones', () => {
      const rig = JSON.parse(JSON.stringify(STAGE_PRESETS.EndStage));
      rig.fixtures = [
        { id: 'a', type: 'Beam', position: 'Truss', slot: 1, x: -2, y: 3, z: 7, beamAngle: 20, loadWatts: 350, role: 'back', aim: {}, enabled: true },
        { id: 'b', type: 'Wash', position: 'FOH', slot: 2, x: 0, y: -2, z: 6, beamAngle: 30, loadWatts: 500, role: 'front', aim: {}, enabled: false },
      ];

      const html = generateLightPlotHtml(show, rig);
      expect(html).toContain('Rig: 1 fixtures');
      expect(html).toContain('350 W');
      expect(html).not.toContain('500 W');
    });

    it('handles an empty rig without throwing', () => {
      const html = generateLightPlotHtml(show, { ...config, fixtures: [] });
      expect(html).toContain('Rig chưa khai báo đèn.');
      expect(html).toContain('Rig: 0 fixtures');
    });

    it('escapes show metadata to prevent HTML injection', () => {
      const xssShow = createDefaultShow('<script>alert("PLOT")</script>');
      const html = generateLightPlotHtml(xssShow, config);
      expect(html).not.toContain('<script>alert("PLOT")</script>');
      expect(html).toContain('&lt;script&gt;alert(&quot;PLOT&quot;)&lt;/script&gt;');
    });
  });
});
