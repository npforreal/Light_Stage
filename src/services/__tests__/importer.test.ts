import { describe, it, expect } from 'vitest';
import {
  parseTimeString,
  parseTimeToMs,
  parseCsv,
  autoDetectColumnMapping,
  convertRowsToActs,
} from '../importer';

describe('Importer Service (Time Parser, CSV Reader & Auto-Mapping)', () => {
  describe('parseTimeString & parseTimeToMs', () => {
    it('parses clock formats HH:MM:SS and MM:SS', () => {
      expect(parseTimeString('00:03:00')).toBe(180);
      expect(parseTimeString('03:00')).toBe(180);
      expect(parseTimeString('1:20:15')).toBe(4815);
      expect(parseTimeToMs('00:03:00')).toBe(180000);
    });

    it('parses combined unit string notation', () => {
      expect(parseTimeString('3m20s')).toBe(200);
      expect(parseTimeString('45s')).toBe(45);
      expect(parseTimeString('1h2m3s')).toBe(3723);
      expect(parseTimeString('1h 20m')).toBe(4800);
    });

    it('parses Vietnamese natural time expressions', () => {
      expect(parseTimeString('2 phút 30 giây')).toBe(150);
      expect(parseTimeString('5 phút')).toBe(300);
      expect(parseTimeString('45 giây')).toBe(45);
      expect(parseTimeString('1 giờ 10 phút')).toBe(4200);
    });

    it('parses numeric seconds and handles edge cases', () => {
      expect(parseTimeString('180s')).toBe(180);
      expect(parseTimeString('180')).toBe(180);
      expect(parseTimeString(180)).toBe(180);
      expect(parseTimeString('')).toBe(0);
      expect(parseTimeString(null)).toBe(0);
      expect(parseTimeString(undefined)).toBe(0);
      expect(parseTimeString('invalid')).toBe(0);
    });
  });

  describe('parseCsv', () => {
    it('parses comma-separated values', () => {
      const csv = 'Cue,Title,Duration\n1.0,Opening,3m\n1.1,Speech,5m';
      const rows = parseCsv(csv);

      expect(rows.length).toBe(3);
      expect(rows[0]).toEqual(['Cue', 'Title', 'Duration']);
      expect(rows[1]).toEqual(['1.0', 'Opening', '3m']);
      expect(rows[2]).toEqual(['1.1', 'Speech', '5m']);
    });

    it('handles commas and escaped quotes inside fields', () => {
      const csv = 'STT,Tiết mục,Ghi chú\n1,"Ca khúc ""Ánh Sáng"", Đơn ca","Gala 2026, VIP"';
      const rows = parseCsv(csv);

      expect(rows.length).toBe(2);
      expect(rows[1][0]).toBe('1');
      expect(rows[1][1]).toBe('Ca khúc "Ánh Sáng", Đơn ca');
      expect(rows[1][2]).toBe('Gala 2026, VIP');
    });

    it('handles tab and semicolon delimiters automatically', () => {
      const tsv = 'Cue\tTitle\tDuration\n1.0\tOpening\t180s';
      const tsvRows = parseCsv(tsv);
      expect(tsvRows.length).toBe(2);
      expect(tsvRows[0]).toEqual(['Cue', 'Title', 'Duration']);

      const semi = 'Cue;Title;Duration\n1.0;Opening;180s';
      const semiRows = parseCsv(semi);
      expect(semiRows.length).toBe(2);
      expect(semiRows[0]).toEqual(['Cue', 'Title', 'Duration']);
    });

    it('strips UTF-8 BOM if present', () => {
      const bomCsv = '\uFEFFCue,Title\n1,Intro';
      const rows = parseCsv(bomCsv);
      expect(rows[0][0]).toBe('Cue');
    });
  });

  describe('autoDetectColumnMapping', () => {
    it('auto-detects English cue sheet headers', () => {
      const headers = ['Cue No', 'Title', 'Act', 'Duration', 'LX', 'VX', 'SQ', 'Stage', 'Notes'];
      const mapping = autoDetectColumnMapping(headers);

      expect(mapping.cueNumber).toBe('Cue No');
      expect(mapping.title).toBe('Title');
      expect(mapping.act).toBe('Act');
      expect(mapping.duration).toBe('Duration');
      expect(mapping.lx).toBe('LX');
      expect(mapping.vx).toBe('VX');
      expect(mapping.sq).toBe('SQ');
      expect(mapping.stage).toBe('Stage');
      expect(mapping.notes).toBe('Notes');
    });

    it('auto-detects Vietnamese cue sheet headers', () => {
      const headers = ['STT', 'Tiết mục', 'Màn', 'Thời lượng', 'Ánh sáng', 'Màn LED', 'Âm thanh', 'Sân khấu', 'Ghi chú'];
      const mapping = autoDetectColumnMapping(headers);

      expect(mapping.cueNumber).toBe('STT');
      expect(mapping.title).toBe('Tiết mục');
      expect(mapping.act).toBe('Màn');
      expect(mapping.duration).toBe('Thời lượng');
      expect(mapping.lx).toBe('Ánh sáng');
      expect(mapping.vx).toBe('Màn LED');
      expect(mapping.sq).toBe('Âm thanh');
      expect(mapping.stage).toBe('Sân khấu');
      expect(mapping.notes).toBe('Ghi chú');
    });
  });

  describe('convertRowsToActs', () => {
    it('converts raw rows into structured Acts with extracted hardware counts', () => {
      const headers = ['STT', 'Tiết mục', 'Màn', 'Thời lượng', 'Ánh sáng', 'Màn LED'];
      const mapping = autoDetectColumnMapping(headers);

      const rows: Record<string, string>[] = [
        {
          STT: '1.0',
          'Tiết mục': 'Khai từ & Giới thiệu',
          Màn: 'Màn 1: Khởi động',
          'Thời lượng': '00:03:00',
          'Ánh sáng': '4 Beam 350W + 2 Follow',
          'Màn LED': 'Màn LED cánh x 2',
        },
        {
          STT: '2.0',
          'Tiết mục': 'Ca khúc chủ đề',
          Màn: 'Màn 2: Đỉnh cao',
          'Thời lượng': '4m15s',
          'Ánh sáng': '12 Par LED 54x3W, 4 Spot 1000W',
          'Màn LED': 'Màn LED Main P3',
        },
      ];

      const result = convertRowsToActs(rows, mapping);

      expect(result.acts.length).toBe(2);
      expect(result.totalCues).toBe(2);

      // First Act
      const act1 = result.acts[0];
      expect(act1.title).toBe('Màn 1: Khởi động');
      expect(act1.cues[0].title).toBe('Khai từ & Giới thiệu');
      expect(act1.cues[0].durationMs).toBe(180000);
      expect(act1.cues[0].totalLightingFixtures).toBe(6); // 4 beam + 2 follow
      expect(act1.cues[0].totalScreens).toBe(2); // 2 cánh

      // Second Act
      const act2 = result.acts[1];
      expect(act2.title).toBe('Màn 2: Đỉnh cao');
      expect(act2.cues[0].durationMs).toBe(255000); // 4m15s = 255s = 255000ms
      expect(act2.cues[0].totalLightingFixtures).toBe(16); // 12 par + 4 spot
      expect(act2.cues[0].totalScreens).toBe(1); // 1 main screen

      // Grand totals
      expect(result.totalLighting).toBe(22);
      expect(result.totalScreens).toBe(3);
    });
  });
});
