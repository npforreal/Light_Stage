import { Show, Act } from '../types/stage';
import { calculateShowHardwareInventory } from './hardwareParser';
import { getCueLightingCount, getCueScreenCount } from './fixtureModel';
import { formatDuration } from '../store/useClockStore';

/**
 * Escapes HTML characters to prevent XSS in printable views
 */
export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes a cell value for RFC-4180 CSV and prevents formula injection (DDE attacks)
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Prevent CSV injection: if cell starts with =, +, -, @, \t, or \r, prefix with single quote '
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates formatted CSV for the complete Run of Show (Cue Sheet)
 */
export function generateCueSheetCsv(show: Show, role: 'ALL' | 'LX' | 'VX' | 'SQ' | 'ST' = 'ALL'): string {
  const headers = ['STT / Cue #', 'Act / Màn', 'Tiết mục / Title', 'Thời lượng (Duration)'];

  if (role === 'ALL' || role === 'LX') {
    headers.push('Ánh sáng (LX)', 'Số đèn (LX Fixtures)');
  }
  if (role === 'ALL' || role === 'VX') {
    headers.push('Màn LED (VX)', 'Số màn (VX Screens)');
  }
  if (role === 'ALL' || role === 'SQ') {
    headers.push('Âm thanh (SQ)');
  }
  if (role === 'ALL' || role === 'ST') {
    headers.push('Sân khấu / Action (ST)');
  }
  headers.push('Ghi chú (Notes)');

  const rows: string[][] = [
    [`# SHOW: ${show.metadata.title} | VENUE: ${show.metadata.venue || 'Main Stage'} | REPORT: ${role}`],
    headers,
  ];

  for (const act of show.acts) {
    for (const cue of act.cues) {
      const row: string[] = [
        cue.cueNumber,
        act.title,
        cue.title,
        formatDuration(cue.durationMs),
      ];

      if (role === 'ALL' || role === 'LX') {
        row.push(cue.departments.lx?.sceneName || '', String(getCueLightingCount(cue)));
      }
      if (role === 'ALL' || role === 'VX') {
        row.push(cue.departments.vx?.contentName || '', String(getCueScreenCount(cue)));
      }
      if (role === 'ALL' || role === 'SQ') {
        row.push(cue.departments.sq?.trackName || '');
      }
      if (role === 'ALL' || role === 'ST') {
        row.push(cue.departments.st?.actionDescription || '');
      }
      row.push(cue.notes || '');

      rows.push(row);
    }
  }

  // Prepend UTF-8 BOM so Excel opens with proper Vietnamese encoding
  return '\uFEFF' + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
}

/**
 * Generates formatted CSV for Hardware Inventory and Peak Concurrent Equipment
 */
export function generateHardwareInventoryCsv(acts: Act[]): string {
  const stats = calculateShowHardwareInventory(acts);

  const headers = [
    'Thiết bị (Equipment)',
    'Phân loại (Category)',
    'Kiểu (Type)',
    'Tổng lượt dùng (Total Instances)',
    'Đỉnh dùng đồng thời (Peak Concurrent)',
  ];

  const rows: string[][] = [
    ['--- TỔNG KẾT TRANG THIẾT BỊ SÂN KHẤU (SHOW HARDWARE SUMMARY) ---'],
    [`Tổng số lượt đèn (Total Lighting Fixtures): ${stats.totalLighting}`],
    [`Tổng số lượt màn LED (Total Screens): ${stats.totalScreens}`],
    [`Đỉnh đèn đồng thời (Peak Concurrent Lighting): ${stats.peakLighting}`],
    [`Đỉnh màn LED đồng thời (Peak Concurrent Screens): ${stats.peakScreens}`],
    [''],
    headers,
  ];

  const items = Object.values(stats.inventory).sort((a, b) => b.totalInstances - a.totalInstances);

  for (const item of items) {
    rows.push([
      item.name,
      item.category,
      item.subType,
      String(item.totalInstances),
      String(item.peakConcurrent),
    ]);
  }

  return '\uFEFF' + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
}

/**
 * Generates a clean, standalone, printable HTML document for Run of Show reports (ready for window.print())
 */
export function generatePrintableCueSheetHtml(show: Show, role: 'ALL' | 'LX' | 'VX' | 'SQ' | 'ST' = 'ALL'): string {
  const generatedAt = new Date().toLocaleString();
  const allCues = show.acts.flatMap((a) => a.cues);
  const totalDurationMs = allCues.reduce((sum, c) => sum + c.durationMs, 0);

  let departmentColumnsHtml = '';
  if (role === 'ALL' || role === 'LX') {
    departmentColumnsHtml += '<th style="width: 18%;">Lighting (LX)</th>';
  }
  if (role === 'ALL' || role === 'VX') {
    departmentColumnsHtml += '<th style="width: 18%;">Visual LED (VX)</th>';
  }
  if (role === 'ALL' || role === 'SQ') {
    departmentColumnsHtml += '<th style="width: 14%;">Sound (SQ)</th>';
  }
  if (role === 'ALL' || role === 'ST') {
    departmentColumnsHtml += '<th style="width: 14%;">Stage Action</th>';
  }

  let tableRowsHtml = '';
  for (const act of show.acts) {
    tableRowsHtml += `
      <tr class="act-header">
        <td colspan="10"><strong>${escapeHtml(act.title)}</strong> (${act.cues.length} cues)</td>
      </tr>
    `;

    for (const cue of act.cues) {
      let deptCells = '';
      if (role === 'ALL' || role === 'LX') {
        deptCells += `<td>${cue.departments.lx ? `${escapeHtml(cue.departments.lx.sceneName || 'Preset')} (${getCueLightingCount(cue)} fix)` : '—'}</td>`;
      }
      if (role === 'ALL' || role === 'VX') {
        deptCells += `<td>${cue.departments.vx ? `${escapeHtml(cue.departments.vx.contentName || 'Loop')} (${cue.totalScreens} scr)` : '—'}</td>`;
      }
      if (role === 'ALL' || role === 'SQ') {
        deptCells += `<td>${cue.departments.sq ? escapeHtml(cue.departments.sq.trackName || 'Audio') : '—'}</td>`;
      }
      if (role === 'ALL' || role === 'ST') {
        deptCells += `<td>${cue.departments.st ? escapeHtml(cue.departments.st.actionDescription || 'Action') : '—'}</td>`;
      }

      tableRowsHtml += `
        <tr>
          <td style="font-weight: bold; font-family: monospace;">${escapeHtml(cue.cueNumber)}</td>
          <td>
            <strong>${escapeHtml(cue.title)}</strong>
            ${cue.notes ? `<br/><small style="color: #64748b; font-style: italic;">${escapeHtml(cue.notes)}</small>` : ''}
          </td>
          <td style="font-family: monospace;">${formatDuration(cue.durationMs)}</td>
          ${deptCells}
        </tr>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(show.metadata.title)} — Cue Sheet (${role})</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 20px; font-weight: bold; text-transform: uppercase; }
    .meta { font-size: 11px; color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 10px; }
    td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
    tr.act-header td { background-color: #e2e8f0; font-size: 12px; text-transform: uppercase; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${escapeHtml(show.metadata.title)}</div>
      <div class="meta">Venue: ${escapeHtml(show.metadata.venue || 'Main Stage')} | Report: ${role === 'ALL' ? 'Master Cue Sheet' : `${role} Department Cue Sheet`}</div>
    </div>
    <div class="meta" style="text-align: right;">
      Total Cues: ${allCues.length} | Total Duration: ${formatDuration(totalDurationMs, { includeHours: true })}<br/>
      Generated: ${generatedAt}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 70px;">Cue #</th>
        <th style="min-width: 180px;">Title & Notes</th>
        <th style="width: 80px;">Duration</th>
        ${departmentColumnsHtml}
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `.trim();
}
