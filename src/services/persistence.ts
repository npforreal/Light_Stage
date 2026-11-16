import { Show, LightStageFile } from '../types/stage';
import { useShowStore } from '../store/useShowStore';

export const LIGHTSTAGE_FILE_TYPE = 'lightstage_project';
export const CURRENT_SCHEMA_VERSION = 1;
export const AUTOSAVE_STORAGE_KEY = 'lightstage_autosave_v1';
export const AUTOSAVE_META_KEY = 'lightstage_autosave_meta_v1';

export interface ParseResult {
  success: boolean;
  data?: Show;
  error?: string;
}

export interface AutoSaveMeta {
  savedAt: string;
  showTitle: string;
  cueCount: number;
}

/**
 * Serializes a Show domain object into a formatted .lightstage JSON string
 */
export function serializeShow(show: Show, pretty = true): string {
  const file: LightStageFile = {
    fileType: LIGHTSTAGE_FILE_TYPE,
    schemaVersion: show.schemaVersion || CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    show,
  };

  return pretty ? JSON.stringify(file, null, 2) : JSON.stringify(file);
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
  if (obj.fileType === LIGHTSTAGE_FILE_TYPE && obj.show) {
    if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
      return {
        success: false,
        error: `Unsupported file schema version (${obj.schemaVersion}). This app supports up to version ${CURRENT_SCHEMA_VERSION}.`,
      };
    }
    showData = obj.show;
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

  // Normalize defaults if optional sections are missing
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

  return { success: true, data: normalizedShow };
}

/**
 * Creates a downloadable Blob for the .lightstage project file
 */
export function exportToLightStageBlob(show: Show): Blob {
  const json = serializeShow(show);
  return new Blob([json], { type: 'application/json' });
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
 * Saves current show to auto-save local storage
 */
export function saveAutoSave(show: Show): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    const serialized = serializeShow(show, false);
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
 * Loads the auto-saved show from local storage
 */
export function loadAutoSave(): Show | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return null;
    const result = parseLightStageFile(raw);
    return result.success && result.data ? result.data : null;
  } catch {
    return null;
  }
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
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Subscribes to useShowStore mutations and automatically saves whenever show data changes.
 * Debounced to optimize disk/storage writes during rapid edits.
 */
export function setupAutoSaveSubscription(debounceMs = 200): () => void {
  if (autoSaveUnsubscribe) {
    autoSaveUnsubscribe();
    autoSaveUnsubscribe = null;
  }

  autoSaveUnsubscribe = useShowStore.subscribe((state, prevState) => {
    if (state.show !== prevState?.show) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        saveAutoSave(state.show);
      }, debounceMs);
    }
  });

  return () => {
    if (autoSaveUnsubscribe) {
      autoSaveUnsubscribe();
      autoSaveUnsubscribe = null;
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
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
}

// Auto-initialize in browser/desktop environment
if (typeof window !== 'undefined') {
  setupAutoSaveSubscription();
}
