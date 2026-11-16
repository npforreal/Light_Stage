/**
 * Visual LED (VX) Domain Types — Inspired by FreeShow
 *
 * Implements Output configuration, Output Styles, Multi-layer controls,
 * Panic actions (Freeze/Blackout/Clear), and Dynamic Template Variables.
 */

export type VxOutputStatus = 'active' | 'standby' | 'blackout' | 'frozen';

export type VxMediaFit = 'contain' | 'cover' | 'fill';

export type VxTransitionType = 'cut' | 'fade' | 'slide' | 'wipe';

export interface VxResolution {
  width: number;
  height: number;
}

export interface VxOutputStyle {
  id: string;
  name: string;
  backgroundColor: string; // hex or rgb
  mediaFit: VxMediaFit;
  aspectRatio: string; // '16:9', '4:3', '32:9', 'custom'
  activeLayers: {
    background: boolean;
    slide: boolean;
    overlay: boolean;
  };
  transition: {
    type: VxTransitionType;
    durationMs: number;
  };
}

export interface VxOutput {
  id: string;
  name: string; // e.g., 'Main LED', 'Wing Left', 'Wing Right'
  color: string; // Badge & indicator color (hex)
  status: VxOutputStatus;
  aspectRatio: string; // '16:9', '4:3', '32:9', etc.
  resolution: VxResolution;
  styleId: string;
  enabled: boolean;
  screenTargetId?: string; // Links to StageConfig Screen
}

export interface VxLayerConfig {
  background: {
    mediaName?: string;
    loop: boolean;
    active: boolean;
  };
  slide: {
    title?: string;
    templateId?: string;
    variables?: Record<string, string>;
    active: boolean;
  };
  overlay: {
    text?: string;
    badge?: string;
    active: boolean;
  };
}

export interface VxTemplate {
  id: string;
  name: string;
  content: string; // e.g. "DIỄN GIẢ: {speaker}\nCUE {cue_no}: {cue_title}"
  category: 'LowerThird' | 'Title' | 'Countdown' | 'Notice';
}

export const DEFAULT_VX_STYLES: VxOutputStyle[] = [
  {
    id: 'style-default-16-9',
    name: 'Standard 16:9 (Contain)',
    backgroundColor: '#020617', // slate-950
    mediaFit: 'contain',
    aspectRatio: '16:9',
    activeLayers: { background: true, slide: true, overlay: true },
    transition: { type: 'fade', durationMs: 500 },
  },
  {
    id: 'style-banner-wide',
    name: 'Ultrawide Banner (Cover)',
    backgroundColor: '#090d16',
    mediaFit: 'cover',
    aspectRatio: '32:9',
    activeLayers: { background: true, slide: true, overlay: false },
    transition: { type: 'cut', durationMs: 0 },
  },
];

export const DEFAULT_VX_OUTPUTS: VxOutput[] = [
  {
    id: 'out-main',
    name: 'Main LED Screen',
    color: '#06b6d4', // cyan-500
    status: 'active',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    styleId: 'style-default-16-9',
    enabled: true,
  },
  {
    id: 'out-wing-l',
    name: 'Wing Left',
    color: '#a855f7', // purple-500
    status: 'active',
    aspectRatio: '4:3',
    resolution: { width: 1024, height: 768 },
    styleId: 'style-default-16-9',
    enabled: true,
  },
  {
    id: 'out-wing-r',
    name: 'Wing Right',
    color: '#a855f7', // purple-500
    status: 'active',
    aspectRatio: '4:3',
    resolution: { width: 1024, height: 768 },
    styleId: 'style-default-16-9',
    enabled: true,
  },
];

export const DEFAULT_VX_TEMPLATES: VxTemplate[] = [
  {
    id: 'tmpl-lower-third',
    name: 'Lower Third Diễn giả',
    content: '{speaker}\n{cue_title}',
    category: 'LowerThird',
  },
  {
    id: 'tmpl-cue-banner',
    name: 'Banner Tiêu đề Cue',
    content: 'CUE #{cue_no}: {cue_title}',
    category: 'Title',
  },
];
