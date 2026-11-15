import { Act, Cue, createCue } from '../types/stage';
import { parseHardwareFromText } from './hardwareParser';

export interface ColumnMapping {
  cueNumber?: string;
  title: string;
  act?: string;
  duration?: string;
  lx?: string;
  vx?: string;
  sq?: string;
  stage?: string;
  notes?: string;
}

export interface ImportResult {
  acts: Act[];
  totalCues: number;
  totalLighting: number;
  totalScreens: number;
  errors: string[];
}

/**
 * Parses diverse time string formats into total seconds.
 * Supported formats:
 * - '00:03:00' -> 180
 * - '03:00' -> 180
 * - '3m20s' -> 200
 * - '180s' -> 180
 * - '180' -> 180
 * - '1h 20m 10s' -> 4810
 * - '2 phút 30 giây' -> 150
 * - '45s' -> 45
 */
export function parseTimeString(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number') {
    return isNaN(input) || input < 0 ? 0 : input;
  }

  const str = input.toString().trim().toLowerCase();
  if (!str) return 0;

  // Pattern 1: HH:MM:SS or MM:SS (e.g. "00:03:00", "03:00", "1:25:30")
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(str)) {
    const parts = str.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
  }

  // Pattern 2: Unit-based (e.g. "3m20s", "1h 20m", "2 phút 30 giây", "180s")
  let totalSeconds = 0;
  let matchedAny = false;

  // Hours: "1h", "2 giờ", "2 hours"
  const hourMatch = str.match(/(\d+)\s*(?:hours?|hr|h|giờ|tiếng)/i);
  if (hourMatch) {
    totalSeconds += parseInt(hourMatch[1], 10) * 3600;
    matchedAny = true;
  }

  // Minutes: "3m", "3 min", "3 phút"
  const minMatch = str.match(/(\d+)\s*(?:minutes?|mins?|phút|m)/i);
  if (minMatch) {
    totalSeconds += parseInt(minMatch[1], 10) * 60;
    matchedAny = true;
  }

  // Seconds: "20s", "20 sec", "20 giây"
  const secMatch = str.match(/(\d+)\s*(?:seconds?|secs?|giây|s)/i);
  if (secMatch) {
    totalSeconds += parseInt(secMatch[1], 10);
    matchedAny = true;
  }

  if (matchedAny) {
    return totalSeconds;
  }

  // Pattern 3: Pure number string (e.g. "180")
  const numeric = parseFloat(str);
  if (!isNaN(numeric) && numeric >= 0) {
    return Math.round(numeric);
  }

  return 0;
}

/**
 * Parses time string and converts to milliseconds
 */
export function parseTimeToMs(input: string | number | null | undefined): number {
  return parseTimeString(input) * 1000;
}

/**
 * Parses CSV or TSV text with robust quoting, escaping, and line break handling (RFC 4180)
 */
export function parseCsv(text: string, customDelimiter?: string): string[][] {
  if (!text) return [];

  // Remove UTF-8 BOM if present
  let clean = text.replace(/^\uFEFF/, '');

  // Detect delimiter if not specified
  let delimiter = customDelimiter;
  if (!delimiter) {
    const firstLine = clean.split(/\r?\n/)[0] || '';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
    else delimiter = ',';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped double quote ("")
        currentField += '"';
        i++;
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in \r\n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push remaining field & row
  currentRow.push(currentField.trim());
  if (currentRow.some((field) => field.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Automatically inspects header columns and matches them to standard Cue fields
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    title: '',
  };

  const normalized = headers.map((h) => ({
    original: h,
    lower: h.toLowerCase().trim().replace(/[\s_-]+/g, ' '),
  }));

  for (const { original, lower } of normalized) {
    // Cue Number
    if (!mapping.cueNumber && /(^cue(\s*no|\s*num|\s*#)?$|^stt$|^số cue$|^cues$|^no$|^index$)/i.test(lower)) {
      mapping.cueNumber = original;
    }
    // Title / Scene / Item
    else if (!mapping.title && /(tiêu đề|tên tiết mục|tiết mục|tên cảnh|cảnh|scene|title|name|nội dung|mô tả)/i.test(lower)) {
      mapping.title = original;
    }
    // Act / Session
    else if (!mapping.act && /(^act$|^màn$|^phần$|^chương$|^session$|^part$)/i.test(lower)) {
      mapping.act = original;
    }
    // Duration
    else if (!mapping.duration && /(thời lượng|thời gian|duration|time|length|tg)/i.test(lower)) {
      mapping.duration = original;
    }
    // Lighting (LX)
    else if (!mapping.lx && /(^lx$|lighting|ánh sáng|chùm đèn|^đèn$)/i.test(lower)) {
      mapping.lx = original;
    }
    // Visual (VX)
    else if (!mapping.vx && /(^vx$|visual|màn led|màn hình|video|^led$)/i.test(lower)) {
      mapping.vx = original;
    }
    // Sound (SQ)
    else if (!mapping.sq && /(^sq$|sound|âm thanh|nhạc|audio|mic|stinger)/i.test(lower)) {
      mapping.sq = original;
    }
    // Stage / Action (ST)
    else if (!mapping.stage && /(^stage$|^action$|sân khấu|đạo cụ|diễn viên|mc|kịch bản)/i.test(lower)) {
      mapping.stage = original;
    }
    // Notes
    else if (!mapping.notes && /(ghi chú|lưu ý|notes?|remark)/i.test(lower)) {
      mapping.notes = original;
    }
  }

  // Fallback: if no title matched, use first non-cue column as title
  if (!mapping.title) {
    const candidate = headers.find((h) => h !== mapping.cueNumber) || headers[0] || 'Title';
    mapping.title = candidate;
  }

  return mapping;
}

/**
 * Converts tabular rows into structured Acts and Cues with auto-extracted hardware
 */
export function convertRowsToActs(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  defaultActTitle = 'Act 1'
): ImportResult {
  const actsMap = new Map<string, Act>();
  const errors: string[] = [];
  let totalLighting = 0;
  let totalScreens = 0;
  let totalCues = 0;

  let actOrder = 1;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rawTitle = (row[mapping.title] || '').trim();
    if (!rawTitle) {
      continue; // Skip empty rows
    }

    const rawAct = mapping.act && row[mapping.act] ? row[mapping.act].trim() : defaultActTitle;
    const actTitle = rawAct || defaultActTitle;

    if (!actsMap.has(actTitle)) {
      actsMap.set(actTitle, {
        id: `act-${Date.now()}-${actOrder}`,
        title: actTitle,
        order: actOrder++,
        cues: [],
      });
    }

    const targetAct = actsMap.get(actTitle)!;
    const cueIndex = targetAct.cues.length + 1;
    const cueNumber = (mapping.cueNumber && row[mapping.cueNumber]?.trim()) || `${targetAct.order}.${cueIndex}`;
    const durationMs = mapping.duration ? parseTimeToMs(row[mapping.duration]) || 60000 : 60000;

    // Extract LX hardware & notes
    const lxText = (mapping.lx && row[mapping.lx]?.trim()) || '';
    const lxDevices = lxText ? parseHardwareFromText(lxText, 'Lighting') : [];
    const lxCount = lxDevices.reduce((sum, d) => sum + d.count, 0);

    // Extract VX hardware & notes
    const vxText = (mapping.vx && row[mapping.vx]?.trim()) || '';
    const vxDevices = vxText ? parseHardwareFromText(vxText, 'Visual') : [];
    const vxCount = vxDevices.reduce((sum, d) => sum + d.count, 0);

    // Extract SQ & Stage
    const sqText = (mapping.sq && row[mapping.sq]?.trim()) || '';
    const stageText = (mapping.stage && row[mapping.stage]?.trim()) || '';
    const notesText = (mapping.notes && row[mapping.notes]?.trim()) || '';

    const newCue: Cue = {
      ...createCue(targetAct.id, cueNumber, rawTitle, durationMs),
      departments: {
        lx: lxText
          ? {
              sceneName: lxText,
              fixtureCount: lxCount,
              fixtures: lxDevices,
            }
          : undefined,
        vx: vxText
          ? {
              contentName: vxText,
              screenCount: vxCount,
              screens: vxDevices,
            }
          : undefined,
        sq: sqText ? { trackName: sqText } : undefined,
        st: stageText ? { actionDescription: stageText } : undefined,
      },
      notes: notesText || undefined,
      totalLightingFixtures: lxCount,
      totalScreens: vxCount,
    };

    targetAct.cues.push(newCue);
    totalLighting += lxCount;
    totalScreens += vxCount;
    totalCues++;
  }

  return {
    acts: Array.from(actsMap.values()),
    totalCues,
    totalLighting,
    totalScreens,
    errors,
  };
}
