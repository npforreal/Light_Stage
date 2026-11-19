import { Show, LightStageFile } from '../types/stage';
import { StageConfig, migrateLegacyStageConfig } from '../types/virtualStage';
import { normalizeShow } from './fixtureModel';
import { useShowStore } from '../store/useShowStore';
import { useStageStore } from '../store/useStageStore';

export const LIGHTSTAGE_FILE_TYPE = 'lightstage_project';
export const CURRENT_SCHEMA_VERSION = 1;
export const AUTOSAVE_STORAGE_KEY = 'lightstage_autosave_v1';
export const AUTOSAVE_META_KEY = 'lightstage_autosave_meta_v1';

/** Single source of truth for the autosave failure message shown in the UI. */
export const AUTOSAVE_FAILURE_MESSAGE =
  'Chưa lưu — lỗi lưu tự động: không ghi được bộ nhớ cục bộ (đầy hoặc bị chặn).';

export interface ParseResult {
  success: boolean;
  data?: Show;
  /** Stage rig config bundled with the file, when present. */
  stage?: StageConfig;
  error?: string;
}

// ---------------------------------------------------------------------------
// Boundary validation: every failure names the exact JSON path (PLAN 16.3)
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

const DEPARTMENT_KEYS = ['lx', 'vx', 'sq', 'st'] as const;

function validateCueShape(cue: unknown, path: string): string | null {
  if (!isPlainObject(cue)) return `${path} must be an object`;

  if (!isNonEmptyString(cue.id)) return `${path}.id is missing or not a string`;
  if (cue.actId !== undefined && typeof cue.actId !== 'string') {
    return `${path}.actId must be a string`;
  }
  if (cue.cueNumber !== undefined && typeof cue.cueNumber !== 'string') {
    return `${path}.cueNumber must be a string`;
  }
  if (cue.title !== undefined && typeof cue.title !== 'string') {
    return `${path}.title must be a string`;
  }
  if (cue.durationMs !== undefined && !isFiniteNumber(cue.durationMs)) {
    return `${path}.durationMs must be a number`;
  }
  if (cue.status !== undefined && typeof cue.status !== 'string') {
    return `${path}.status must be a string`;
  }

  if (cue.departments !== undefined && cue.departments !== null) {
    if (!isPlainObject(cue.departments)) return `${path}.departments must be an object`;
    for (const key of DEPARTMENT_KEYS) {
      const deptPath = `${path}.departments.${key}`;
      const dept = cue.departments[key];
      if (dept === undefined || dept === null) continue;
      if (!isPlainObject(dept)) return `${deptPath} must be an object`;

      if (dept.fixtureCount !== undefined && !isFiniteNumber(dept.fixtureCount)) {
        return `${deptPath}.fixtureCount must be a number`;
      }
      if (dept.screenCount !== undefined && !isFiniteNumber(dept.screenCount)) {
        return `${deptPath}.screenCount must be a number`;
      }
      if (dept.fixtures !== undefined) {
        if (!Array.isArray(dept.fixtures)) return `${deptPath}.fixtures must be an array`;
        for (let i = 0; i < dept.fixtures.length; i++) {
          if (!isPlainObject(dept.fixtures[i])) {
            return `${deptPath}.fixtures[${i}] must be an object`;
          }
        }
      }
    }
  }

  return null;
}

function validateShowShape(show: Record<string, unknown>): string | null {
  if (!Array.isArray(show.acts)) return 'Show must contain an array of acts';

  for (let i = 0; i < show.acts.length; i++) {
    const actPath = `acts[${i}]`;
    const act = show.acts[i];
    if (!isPlainObject(act)) return `${actPath} must be an object`;
    if (!isNonEmptyString(act.id)) return `${actPath}.id is missing or not a string`;
    if (act.title !== undefined && typeof act.title !== 'string') {
      return `${actPath}.title must be a string`;
    }
    if (act.order !== undefined && !isFiniteNumber(act.order)) {
      return `${actPath}.order must be a number`;
    }
    if (act.cues !== undefined && !Array.isArray(act.cues)) {
      return `${actPath}.cues must be an array`;
    }
    const cues = Array.isArray(act.cues) ? act.cues : [];
    for (let j = 0; j < cues.length; j++) {
      const cueError = validateCueShape(cues[j], `${actPath}.cues[${j}]`);
      if (cueError) return cueError;
    }
  }

  return null;
}

function validateStageShape(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (!isPlainObject(raw)) return 'stage must be an object';
  for (const key of ['screens', 'trusses'] as const) {
    const list = raw[key];
    if (list === undefined || list === null) continue;
    if (!Array.isArray(list)) return `stage.${key} must be an array`;
    for (let i = 0; i < list.length; i++) {
      if (!isPlainObject(list[i])) return `stage.${key}[${i}] must be an object`;
    }
  }
  return null;
}

export interface AutoSaveProject {
  show: Show;
  stage?: StageConfig;
}

export interface AutoSaveMeta {
  savedAt: string;
  showTitle: string;
  cueCount: number;
}

/**
 * Serializes a Show domain object into a formatted .lightstage JSON string
 */
export function serializeShow(show: Show, pretty = true, stage?: StageConfig): string {
  const file: LightStageFile = {
    fileType: LIGHTSTAGE_FILE_TYPE,
    schemaVersion: show.schemaVersion || CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    show,
    ...(stage ? { stage } : {}),
  };

  return pretty ? JSON.stringify(file, null, 2) : JSON.stringify(file);
}

/** Largest .lightstage file we will read into memory (25 MB). */
export const MAX_LIGHTSTAGE_FILE_BYTES = 25 * 1024 * 1024;

/**
 * Reads a `.lightstage` file from disk and parses it. FileReader errors and
 * empty files are reported as a failed ParseResult instead of throwing, so the
 * UI always has something to show the operator (PLAN 16.3).
 */
export function readLightStageFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    if (!file || typeof file.size !== 'number') {
      resolve({ success: false, error: 'No file selected' });
      return;
    }
    if (file.size === 0) {
      resolve({ success: false, error: 'File is empty' });
      return;
    }
    if (file.size > MAX_LIGHTSTAGE_FILE_BYTES) {
      resolve({
        success: false,
        error: `File is too large — tối đa ${Math.round(MAX_LIGHTSTAGE_FILE_BYTES / (1024 * 1024))} MB. Dùng file .lightstage xuất từ app này.`,
      });
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      resolve({
        success: false,
        error: `Could not read file: ${reader.error?.message || 'unknown read error'}`,
      });
    };

    reader.onabort = () => {
      resolve({ success: false, error: 'File read was cancelled' });
    };

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') {
        resolve({ success: false, error: 'File content is not readable text' });
        return;
      }
      resolve(parseLightStageFile(content));
    };

    try {
      reader.readAsText(file);
    } catch (err) {
      resolve({
        success: false,
        error: `Could not read file: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  });
}

/**
 * Validates and parses a .lightstage JSON string into a Show domain object
 */
export function parseLightStageFile(jsonString: string): ParseResult {
  if (!jsonString || typeof jsonString !== 'string') {
    return { success: false, error: 'Empty or invalid file content' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { success: false, error: `Invalid JSON format: ${(err as Error).message}` };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { success: false, error: 'File content must be a valid JSON object' };
  }

  const obj = parsed as Record<string, unknown>;

  // Check if wrapped in LightStageFile or raw Show
  let showData: unknown;
  let rawStage: unknown;
  if (obj.fileType === LIGHTSTAGE_FILE_TYPE && obj.show) {
    if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
      return {
        success: false,
        error: `Unsupported file schema version (${obj.schemaVersion}). This app supports up to version ${CURRENT_SCHEMA_VERSION}.`,
      };
    }
    showData = obj.show;
    rawStage = obj.stage;
  } else if (obj.id && Array.isArray(obj.acts)) {
    // Direct Show object fallback
    showData = obj;
  } else {
    return {
      success: false,
      error: 'Not a valid .lightstage project file (missing fileType identifier or acts list)',
    };
  }

  const showObj = showData as Partial<Show>;

  // Structural sanity check
  if (!showObj.id || typeof showObj.id !== 'string') {
    return { success: false, error: 'Missing or invalid show id' };
  }

  if (!Array.isArray(showObj.acts)) {
    return { success: false, error: 'Show must contain an array of acts' };
  }

  const shapeError = validateShowShape(showObj as Record<string, unknown>);
  if (shapeError) {
    return { success: false, error: `Invalid project data: ${shapeError}` };
  }

  const stageError = validateStageShape(rawStage);
  if (stageError) {
    return { success: false, error: `Invalid project data: ${stageError}` };
  }

  // Normalize defaults if optional sections are missing
  try {
    const normalizedShow: Show = {
    id: showObj.id,
    schemaVersion: showObj.schemaVersion || CURRENT_SCHEMA_VERSION,
    metadata: {
      title: showObj.metadata?.title || 'Untitled Show',
      venue: showObj.metadata?.venue || '',
      version: showObj.metadata?.version || '1.0.0',
      createdAt: showObj.metadata?.createdAt || new Date().toISOString(),
      updatedAt: showObj.metadata?.updatedAt || new Date().toISOString(),
      director: showObj.metadata?.director,
      lightingDirector: showObj.metadata?.lightingDirector,
      soundEngineer: showObj.metadata?.soundEngineer,
      visualOperator: showObj.metadata?.visualOperator,
      date: showObj.metadata?.date,
    },
    settings: {
      autoStandbyNext: showObj.settings?.autoStandbyNext ?? true,
      countdownWarningSec: showObj.settings?.countdownWarningSec ?? 10,
      defaultCueDurationMs: showObj.settings?.defaultCueDurationMs ?? 60000,
    },
    acts: showObj.acts.map((act, index) => ({
      id: act.id || `act-${index + 1}`,
      title: act.title || `Act ${index + 1}`,
      order: typeof act.order === 'number' ? act.order : index + 1,
      notes: act.notes,
      cues: Array.isArray(act.cues)
        ? act.cues.map((cue, cIdx) => ({
            id: cue.id || `cue-${index + 1}-${cIdx + 1}`,
            actId: cue.actId || act.id || `act-${index + 1}`,
            cueNumber: cue.cueNumber || `${index + 1}.${cIdx + 1}`,
            title: cue.title || 'Untitled Cue',
            status: cue.status || 'Pending',
            durationMs: typeof cue.durationMs === 'number' ? cue.durationMs : 60000,
            scheduledTime: cue.scheduledTime,
            notes: cue.notes,
            departments: {
              ...cue.departments,
              lx: cue.departments?.lx
                ? {
                    ...cue.departments.lx,
                    color:
                      cue.departments.lx.color ||
                      (cue.departments.lx.colorPreset
                        ? { mode: 'rgb' as const, hex: cue.departments.lx.colorPreset }
                        : undefined),
                  }
                : undefined,
            },
            totalLightingFixtures:
              typeof cue.totalLightingFixtures === 'number'
                ? cue.totalLightingFixtures
                : (cue.departments?.lx?.fixtureCount ?? 0),
            totalScreens:
              typeof cue.totalScreens === 'number'
                ? cue.totalScreens
                : (cue.departments?.vx?.screenCount ?? 0),
          }))
        : [],
    })),
  };

    return { success: true, data: normalizeShow(normalizedShow), stage: parseStageConfig(rawStage) };
  } catch (err) {
    return {
      success: false,
      error: `Invalid project data: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Sanitizes a persisted stage rig config. Returns undefined when absent/invalid.
 */
function parseStageConfig(raw: unknown): StageConfig | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const candidate = raw as Partial<StageConfig>;
  if (!Array.isArray(candidate.screens) && !Array.isArray(candidate.trusses)) return undefined;
  return migrateLegacyStageConfig(candidate);
}

/**
 * Creates a downloadable Blob for the .lightstage project file
 */
export function exportToLightStageBlob(show: Show, stage?: StageConfig): Blob {
  const json = serializeShow(show, true, stage);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Downloads the project as a `.lightstage` file. Shared by the Export modal and
 * the "save now" recovery action, so there is a single save path.
 */
export function downloadLightStageFile(
  show: Show,
  stage?: StageConfig,
  filenameTitle = show.metadata.title
): void {
  if (typeof document === 'undefined') return;
  const blob = exportToLightStageBlob(show, stage);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameTitle.replace(/\s+/g, '_')}.lightstage`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Safe local storage accessor
 */
function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore access error
  }
  return null;
}

/**
 * Saves current show (and optional stage rig) to auto-save local storage
 */
export function saveAutoSave(show: Show, stage?: StageConfig): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    const serialized = serializeShow(show, false, stage);
    const totalCues = show.acts.reduce((acc, act) => acc + act.cues.length, 0);
    const meta: AutoSaveMeta = {
      savedAt: new Date().toISOString(),
      showTitle: show.metadata.title,
      cueCount: totalCues,
    };

    storage.setItem(AUTOSAVE_STORAGE_KEY, serialized);
    storage.setItem(AUTOSAVE_META_KEY, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads the auto-saved show + stage rig from local storage.
 */
export function loadAutoSaveProject(): AutoSaveProject | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return null;
    const result = parseLightStageFile(raw);
    if (!result.success || !result.data) return null;
    return { show: result.data, stage: result.stage };
  } catch {
    return null;
  }
}

/**
 * Loads the auto-saved show from local storage
 */
export function loadAutoSave(): Show | null {
  return loadAutoSaveProject()?.show ?? null;
}

/**
 * Checks whether an auto-save entry exists
 */
export function hasAutoSave(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return Boolean(storage.getItem(AUTOSAVE_STORAGE_KEY));
}

/**
 * Retrieves metadata about the auto-save
 */
export function getAutoSaveMeta(): AutoSaveMeta | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(AUTOSAVE_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AutoSaveMeta;
  } catch {
    return null;
  }
}

/**
 * Clears auto-save data from local storage
 */
export function clearAutoSave(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(AUTOSAVE_STORAGE_KEY);
    storage.removeItem(AUTOSAVE_META_KEY);
  } catch {
    // Ignore error
  }
}

let autoSaveUnsubscribe: (() => void) | null = null;
let stageAutoSaveUnsubscribe: (() => void) | null = null;
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Subscribes to useShowStore / useStageStore mutations and automatically saves
 * whenever show or stage rig data changes.
 * Debounced to optimize disk/storage writes during rapid edits.
 */
export function setupAutoSaveSubscription(debounceMs = 200): () => void {
  if (autoSaveUnsubscribe) {
    autoSaveUnsubscribe();
    autoSaveUnsubscribe = null;
  }
  if (stageAutoSaveUnsubscribe) {
    stageAutoSaveUnsubscribe();
    stageAutoSaveUnsubscribe = null;
  }

  const schedule = (show: Show) => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      const ok = saveAutoSave(show, useStageStore.getState().config);
      if (!ok) {
        // Surface the failure in the UI instead of swallowing it (PLAN 16.2).
        useShowStore.getState().setAutosaveError(AUTOSAVE_FAILURE_MESSAGE);
      }
    }, debounceMs);
  };

  autoSaveUnsubscribe = useShowStore.subscribe((state, prevState) => {
    if (state.show !== prevState?.show) {
      schedule(state.show);
    }
  });

  // Stage rig edits (presets, screens, trusses, fixtures) must survive reloads too.
  stageAutoSaveUnsubscribe = useStageStore.subscribe((state, prevState) => {
    if (state.config !== prevState?.config) {
      schedule(useShowStore.getState().show);
    }
  });

  return () => {
    if (autoSaveUnsubscribe) {
      autoSaveUnsubscribe();
      autoSaveUnsubscribe = null;
    }
    if (stageAutoSaveUnsubscribe) {
      stageAutoSaveUnsubscribe();
      stageAutoSaveUnsubscribe = null;
    }
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  };
}

export function stopAutoSaveSubscription(): void {
  if (autoSaveUnsubscribe) {
    autoSaveUnsubscribe();
    autoSaveUnsubscribe = null;
  }
  if (stageAutoSaveUnsubscribe) {
    stageAutoSaveUnsubscribe();
    stageAutoSaveUnsubscribe = null;
  }
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
}

/**
 * Explicit autosave wiring. The renderer (App.tsx) calls this once on mount
 * and relies on the returned unsubscribe for cleanup — no module side effects
 * on import, so tests and tooling stay deterministic.
 */
export function initAutoSaveSubscription(debounceMs = 200): () => void {
  return setupAutoSaveSubscription(debounceMs);
}
