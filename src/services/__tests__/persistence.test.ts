import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializeShow,
  parseLightStageFile,
  saveAutoSave,
  loadAutoSave,
  hasAutoSave,
  clearAutoSave,
  getAutoSaveMeta,
  exportToLightStageBlob,
  LIGHTSTAGE_FILE_TYPE,
} from '../persistence';
import { createDefaultShow } from '../../types/stage';

describe('Persistence Service (.lightstage & Auto-Save)', () => {
  beforeEach(() => {
    clearAutoSave();
  });

  describe('Serialization and Parsing', () => {
    it('serializes a show into .lightstage JSON format', () => {
      const show = createDefaultShow('Concert 2026');
      const json = serializeShow(show);

      const parsed = JSON.parse(json);
      expect(parsed.fileType).toBe(LIGHTSTAGE_FILE_TYPE);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.show.id).toBe(show.id);
      expect(parsed.show.metadata.title).toBe('Concert 2026');
    });

    it('parses a valid .lightstage file successfully', () => {
      const show = createDefaultShow('Theatre Night');
      const json = serializeShow(show);

      const result = parseLightStageFile(json);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.metadata.title).toBe('Theatre Night');
      expect(result.data?.acts.length).toBe(1);
    });

    it('parses a raw show object fallback', () => {
      const show = createDefaultShow('Raw Show');
      const rawJson = JSON.stringify(show);

      const result = parseLightStageFile(rawJson);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(show.id);
      expect(result.data?.metadata.title).toBe('Raw Show');
    });

    it('rejects unsupported future schema versions', () => {
      const show = createDefaultShow('Future Show');
      const futureFile = {
        fileType: LIGHTSTAGE_FILE_TYPE,
        schemaVersion: 99,
        exportedAt: new Date().toISOString(),
        show,
      };

      const result = parseLightStageFile(JSON.stringify(futureFile));
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported file schema version');
    });

    it('rejects invalid or corrupted JSON gracefully', () => {
      const corrupted = '{"fileType": "lightstage_project", "broken...';
      const result = parseLightStageFile(corrupted);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON format');

      const nonObject = JSON.stringify('just a string');
      const nonObjResult = parseLightStageFile(nonObject);
      expect(nonObjResult.success).toBe(false);
    });

    it('creates an exportable Blob', () => {
      const show = createDefaultShow('Blob Show');
      const blob = exportToLightStageBlob(show);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });
  });

  describe('Auto-Save Local Engine', () => {
    it('saves and recovers a show in localStorage', () => {
      expect(hasAutoSave()).toBe(false);
      expect(loadAutoSave()).toBeNull();

      const show = createDefaultShow('AutoSave Test');
      const saved = saveAutoSave(show);
      expect(saved).toBe(true);
      expect(hasAutoSave()).toBe(true);

      const meta = getAutoSaveMeta();
      expect(meta).toBeDefined();
      expect(meta?.showTitle).toBe('AutoSave Test');
      expect(meta?.cueCount).toBe(1);

      const recovered = loadAutoSave();
      expect(recovered).toBeDefined();
      expect(recovered?.id).toBe(show.id);
      expect(recovered?.metadata.title).toBe('AutoSave Test');

      clearAutoSave();
      expect(hasAutoSave()).toBe(false);
      expect(loadAutoSave()).toBeNull();
    });

    it('migrates legacy colorPreset hex into LightingColor rgb object', () => {
      const legacyShowJson = JSON.stringify({
        fileType: LIGHTSTAGE_FILE_TYPE,
        schemaVersion: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        show: {
          id: 'legacy-1',
          metadata: { title: 'Legacy Show', author: 'Test' },
          acts: [
            {
              id: 'act-1',
              title: 'Act 1',
              cues: [
                {
                  id: 'cue-1',
                  cueNumber: '1.0',
                  title: 'Opening',
                  status: 'pending',
                  durationMs: 30000,
                  departments: {
                    lx: {
                      fixtureCount: 8,
                      colorPreset: '#ffaa00',
                    },
                  },
                },
              ],
            },
          ],
        },
      });

      const result = parseLightStageFile(legacyShowJson);
      expect(result.success).toBe(true);
      const cue = result.data?.acts[0].cues[0];
      expect(cue?.departments.lx?.color).toEqual({ mode: 'rgb', hex: '#ffaa00' });
      expect(cue?.departments.lx?.colorPreset).toBe('#ffaa00');
    });
  });
});
