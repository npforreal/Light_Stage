/**
 * Visual LED (VX) Engine — Template variables, Aspect Ratio checks, Layer Logic
 */

import { VxOutputStatus } from '../types/visual';

/**
 * Renders dynamic variables within a template.
 * Supported variables: {cue_title}, {cue_no}, {speaker}, or custom keys in vars.
 */
export function renderVxTemplate(templateContent: string, vars: Record<string, string | number | undefined>): string {
  if (!templateContent) return '';
  return templateContent.replace(/\{(\w+)\}/g, (match, key) => {
    const val = vars[key];
    return val !== undefined && val !== null ? String(val) : match;
  });
}

/**
 * Checks for aspect ratio mismatch between source media and physical output screen.
 * For instance, 16:9 video on 4:3 screen will cause letterboxing/pillarboxing unless fitted.
 */
export function checkAspectMismatch(
  mediaRatio: string,
  outputRatio: string
): { mismatch: boolean; warning?: string } {
  if (!mediaRatio || !outputRatio || mediaRatio === 'custom' || outputRatio === 'custom') {
    return { mismatch: false };
  }

  const parseRatio = (r: string): number => {
    const parts = r.split(':').map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      return parts[0] / parts[1];
    }
    return 1;
  };

  const mediaVal = parseRatio(mediaRatio);
  const outputVal = parseRatio(outputRatio);

  const diff = Math.abs(mediaVal - outputVal);
  if (diff > 0.05) {
    return {
      mismatch: true,
      warning: `Video (${mediaRatio}) lệch tỉ lệ so với màn hình (${outputRatio}) — hình ảnh sẽ bị viền đen (Contain) hoặc cắt xén (Cover).`,
    };
  }

  return { mismatch: false };
}

/**
 * Returns the indicator color class for output status
 */
export function getOutputStatusDotClass(status: VxOutputStatus): string {
  switch (status) {
    case 'active':
      return 'bg-status-go shadow-[0_0_8px_var(--color-status-go)]';
    case 'frozen':
      return 'bg-status-standby shadow-[0_0_8px_var(--color-status-standby)]';
    case 'blackout':
      return 'bg-status-danger shadow-[0_0_8px_var(--color-status-danger)]';
    case 'standby':
    default:
      return 'bg-content-3';
  }
}
