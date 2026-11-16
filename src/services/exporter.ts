import { Show, Act } from '../types/stage';
import { StageConfig, Fixture } from '../types/virtualStage';
import { calculateShowHardwareInventory } from './hardwareParser';
import { getCueLightingCount, getCueScreenCount } from './fixtureModel';
import { FIXTURE_SYMBOLS } from './stageSymbols';
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

const PLOT_TYPE_COLORS: Record<string, string> = {
  Beam: '#7c3aed',
  Spot: '#0ea5e9',
  Wash: '#f59e0b',
  Follow: '#ef4444',
  Blinder: '#84cc16',
  Strobe: '#ec4899',
  Par: '#14b8a6',
  Laser: '#a855f7',
  Smoke: '#64748b',
};

function plotFixtureShape(fixture: Fixture, cx: number, cy: number): string {
  const color = PLOT_TYPE_COLORS[fixture.type] ?? '#334155';
  const stroke = '#0f172a';
  switch (fixture.type) {
    case 'Beam':
    case 'Laser':
      return `<polygon points="${cx},${cy - 7} ${cx + 6},${cy + 5} ${cx - 6},${cy + 5}" fill="${color}" stroke="${stroke}" stroke-width="1"/>`;
    case 'Wash':
      return `<polygon points="${cx},${cy - 7} ${cx + 6},${cy - 3.5} ${cx + 6},${cy + 3.5} ${cx},${cy + 7} ${cx - 6},${cy + 3.5} ${cx - 6},${cy - 3.5}" fill="${color}" stroke="${stroke}" stroke-width="1"/>`;
    case 'Blinder':
      return `<rect x="${cx - 5}" y="${cy - 5}" width="10" height="10" rx="1" fill="${color}" stroke="${stroke}" stroke-width="1"/>`;
    case 'Par':
      return `<polygon points="${cx},${cy - 7} ${cx + 7},${cy} ${cx},${cy + 7} ${cx - 7},${cy}" fill="${color}" stroke="${stroke}" stroke-width="1"/>`;
    case 'Strobe':
      return `<g stroke="${stroke}" stroke-width="1.5"><line x1="${cx - 5}" y1="${cy}" x2="${cx + 5}" y2="${cy}"/><line x1="${cx}" y1="${cy - 5}" x2="${cx}" y2="${cy + 5}"/></g>`;
    case 'Follow':
      return `<circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="${stroke}" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="${color}"/>`;
    case 'Smoke':
      return `<rect x="${cx - 6}" y="${cy - 4}" width="12" height="8" rx="2" fill="${color}" stroke="${stroke}" stroke-width="1"/>`;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="5" fill="${color}" stroke="${stroke}" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="1.5" fill="#ffffff"/>`;
  }
}

/**
 * Generates a printable Light Plot: top-down rig drawing (screens, trusses,
 * numbered fixtures) plus a numbered fixture schedule. Standalone HTML.
 */
export function generateLightPlotHtml(show: Show, config: StageConfig): string {
  const generatedAt = new Date().toLocaleString();
  const width = Math.max(5, config.widthMeters);
  const depth = Math.max(5, config.depthMeters);

  const stageLeft = 80;
  const stageRight = 820;
  const stageTop = 90;
  const stageBottom = 470;
  const scaleX = (stageRight - stageLeft) / width;
  const scaleY = (stageBottom - stageTop) / depth;
  const sx = (meters: number) => (stageLeft + stageRight) / 2 + meters * scaleX;
  const sy = (meters: number) => stageBottom - meters * scaleY;

  const fixtures = (config.fixtures ?? []).filter((fixture) => fixture.enabled !== false);
  const ordered = fixtures
    .slice()
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

  const screensHtml = (config.screens ?? [])
    .filter((screen) => screen.enabled)
    .map((screen) => {
      const w = Math.max(4, (screen.widthMeters ?? 6) * scaleX);
      const h = Math.max(4, (screen.heightMeters ?? 3) * scaleY);
      const cx = sx(screen.xMeters ?? 0);
      const cy = sy(screen.yMeters ?? 0);
      return `<g>
        <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="#312e81" fill-opacity="0.25" stroke="#4338ca" stroke-width="1.5"/>
        <text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="9" fill="#312e81">${escapeHtml(screen.name)}</text>
      </g>`;
    })
    .join('');

  const trussesHtml = (config.trusses ?? [])
    .filter((truss) => truss.enabled)
    .map((truss) => {
      const half = ((truss.widthMeters ?? 12) / 2) * scaleX;
      const cx = sx(truss.xMeters ?? 0);
      const cy = sy(truss.yMeters ?? 0);
      return `<g>
        <line x1="${cx - half}" y1="${cy}" x2="${cx + half}" y2="${cy}" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
        <text x="${cx - half}" y="${cy - 5}" font-size="8" fill="#64748b">${escapeHtml(truss.name)}</text>
      </g>`;
    })
    .join('');

  const fixturesHtml = ordered
    .map((fixture, index) => {
      const cx = sx(fixture.x);
      const cy = sy(fixture.y);
      return `<g>
        ${plotFixtureShape(fixture, cx, cy)}
        <text x="${cx + 7}" y="${cy - 5}" font-size="8" font-family="monospace" fill="#0f172a">${index + 1}</text>
      </g>`;
    })
    .join('');

  const legendTypes = Array.from(new Set(ordered.map((fixture) => fixture.type))).sort();
  const legendHtml = legendTypes
    .map((type) => {
      const sample: Fixture = {
        id: 'legend',
        type,
        position: 'Truss',
        slot: 0,
        x: 0,
        y: 0,
        z: 0,
        beamAngle: 25,
        loadWatts: 0,
        role: 'wash',
        aim: {},
      };
      return `<span class="legend-item">${plotFixtureShape(sample, 10, 10)}<span>${escapeHtml(
        FIXTURE_SYMBOLS[type]?.label ?? type
      )}</span></span>`;
    })
    .join('');

  const tableRowsHtml = ordered
    .map((fixture, index) => {
      const watts = Number(fixture.loadWatts) || 0;
      return `<tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(FIXTURE_SYMBOLS[fixture.type]?.label ?? fixture.type)}</td>
        <td>${escapeHtml(fixture.position)}</td>
        <td class="num">${fixture.x.toFixed(1)}</td>
        <td class="num">${fixture.y.toFixed(1)}</td>
        <td class="num">${(fixture.z ?? 0).toFixed(1)}</td>
        <td class="num">${Math.round(Number(fixture.beamAngle) || 0)}°</td>
        <td class="num">${watts} W</td>
        <td class="num">${fixture.slot}</td>
      </tr>`;
    })
    .join('');

  const totalWatts = ordered.reduce((sum, fixture) => sum + (Number(fixture.loadWatts) || 0), 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(show.metadata.title)} — Light Plot</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px; }
    .title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
    .meta { font-size: 10px; color: #475569; }
    .plot { width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; }
    .legend { display: flex; flex-wrap: wrap; gap: 10px; font-size: 10px; margin: 6px 0; color: #334155; }
    .legend-item { display: inline-flex; align-items: center; gap: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; text-transform: uppercase; font-size: 8.5px; }
    td { border: 1px solid #cbd5e1; padding: 3px 6px; }
    td.num { text-align: right; font-family: monospace; }
    .footer { margin-top: 6px; font-size: 8.5px; color: #64748b; font-style: italic; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${escapeHtml(show.metadata.title)} — Light Plot</div>
      <div class="meta">Venue: ${escapeHtml(show.metadata.venue || 'Main Stage')} | Rig: ${ordered.length} fixtures · ${(totalWatts / 1000).toFixed(1)} kW</div>
    </div>
    <div class="meta" style="text-align: right;">
      Stage: ${width.toFixed(1)}m × ${depth.toFixed(1)}m<br/>
      Generated: ${generatedAt}
    </div>
  </div>

  <svg class="plot" viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="900" height="620" fill="#f8fafc"/>
    <rect x="${stageLeft}" y="${stageTop}" width="${stageRight - stageLeft}" height="${stageBottom - stageTop}" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="${(stageLeft + stageRight) / 2}" y="${stageTop - 8}" text-anchor="middle" font-size="9" fill="#64748b">UPSTAGE (US)</text>
    <text x="${(stageLeft + stageRight) / 2}" y="${stageBottom + 16}" text-anchor="middle" font-size="9" fill="#64748b">PLASTER LINE / DOWNSTAGE (DS)</text>
    <text x="${stageLeft - 6}" y="${stageTop + 12}" text-anchor="end" font-size="9" fill="#64748b">SL</text>
    <text x="${stageRight + 6}" y="${stageTop + 12}" font-size="9" fill="#64748b">SR</text>
    <line x1="${(stageLeft + stageRight) / 2}" y1="${stageTop}" x2="${(stageLeft + stageRight) / 2}" y2="${stageBottom}" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="6 4"/>
    <text x="${(stageLeft + stageRight) / 2 + 4}" y="${stageTop + 10}" font-size="8" fill="#0284c7">CL</text>
    <rect x="${stageLeft}" y="${stageBottom}" width="${stageRight - stageLeft}" height="80" fill="#eef2f7"/>
    <text x="${(stageLeft + stageRight) / 2}" y="${stageBottom + 50}" text-anchor="middle" font-size="9" fill="#94a3b8">AUDIENCE / FOH</text>
    ${screensHtml}
    ${trussesHtml}
    ${fixturesHtml}
  </svg>

  <div class="legend">${legendHtml}</div>

  <table>
    <thead>
      <tr>
        <th style="width: 44px;">#</th>
        <th>Type</th>
        <th>Position</th>
        <th>X (m)</th>
        <th>Y (m)</th>
        <th>Trim (m)</th>
        <th>Beam</th>
        <th>Power</th>
        <th>Slot</th>
      </tr>
    </thead>
    <tbody>
      ${
        tableRowsHtml ||
        '<tr><td colspan="9" style="text-align:center;color:#94a3b8;">Rig chưa khai báo đèn.</td></tr>'
      }
    </tbody>
  </table>

  <div class="footer">
    Sơ đồ tham khảo từ cấu hình Rig — kiểm tra vị trí, tải trọng và góc chiếu thực tế trước khi treo.
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>
  `.trim();
}
