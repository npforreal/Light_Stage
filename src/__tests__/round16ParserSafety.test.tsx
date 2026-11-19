/**
 * Đợt 16.3 — Parser .lightstage an toàn tại biên.
 *
 * Mọi dữ liệu sai phải trả `ParseResult` lỗi có ĐƯỜNG DẪN cụ thể
 * (vd `acts[2].cues[0].id`), tuyệt đối không ném exception, và dự án
 * đang mở phải nguyên vẹn khi import thất bại.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import {
  parseLightStageFile,
  readLightStageFile,
  LIGHTSTAGE_FILE_TYPE,
} from '../services/persistence';
import { useShowStore } from '../store/useShowStore';
import { createDefaultShow } from '../types/stage';

function wrapShow(show: unknown): string {
  return JSON.stringify({
    fileType: LIGHTSTAGE_FILE_TYPE,
    schemaVersion: 1,
    exportedAt: '2026-01-01T00:00:00.000Z',
    show,
  });
}

const validCue = {
  id: 'cue-1',
  cueNumber: '1.0',
  title: 'Opening',
  status: 'Pending',
  durationMs: 30000,
  departments: {},
};

const validAct = (overrides: Record<string, unknown> = {}) => ({
  id: 'act-1',
  title: 'Act 1',
  cues: [validCue],
  ...overrides,
});

describe('16.3 — parseLightStageFile: lỗi có đường dẫn, không ném', () => {
  it('acts:[null] → lỗi nêu acts[0], không throw', () => {
    let result: ReturnType<typeof parseLightStageFile> | undefined;
    expect(() => {
      result = parseLightStageFile(wrapShow({ id: 'show-1', acts: [null] }));
    }).not.toThrow();

    expect(result?.success).toBe(false);
    expect(result?.error).toMatch(/acts\[0\]/);
  });

  it('cues:[null] → lỗi nêu acts[0].cues[0]', () => {
    const result = parseLightStageFile(
      wrapShow({ id: 'show-1', acts: [validAct({ cues: [null] })] })
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/acts\[0\]\.cues\[0\]/);
  });

  it('id sai kiểu → lỗi nêu đúng field id', () => {
    const cueBadId = parseLightStageFile(
      wrapShow({ id: 'show-1', acts: [validAct({ cues: [{ ...validCue, id: 42 }] })] })
    );
    expect(cueBadId.success).toBe(false);
    expect(cueBadId.error).toMatch(/acts\[0\]\.cues\[0\]\.id/);

    const actBadId = parseLightStageFile(
      wrapShow({ id: 'show-1', acts: [validAct({ id: null })] })
    );
    expect(actBadId.success).toBe(false);
    expect(actBadId.error).toMatch(/acts\[0\]\.id/);
  });

  it('act/cue thiếu id → lỗi nêu đường dẫn thay vì tự bịa id', () => {
    const noCueId = parseLightStageFile(
      wrapShow({ id: 'show-1', acts: [validAct({ cues: [{ ...validCue, id: undefined }] })] })
    );
    expect(noCueId.success).toBe(false);
    expect(noCueId.error).toMatch(/acts\[0\]\.cues\[0\]\.id/);

    const noActId = parseLightStageFile(
      wrapShow({
        id: 'show-1',
        acts: [validAct(), { title: 'Act 2', cues: [] }],
      })
    );
    expect(noActId.success).toBe(false);
    expect(noActId.error).toMatch(/acts\[1\]\.id/);
  });

  it('departments sai kiểu → lỗi nêu đường dẫn bộ phận', () => {
    const deptBad = parseLightStageFile(
      wrapShow({
        id: 'show-1',
        acts: [validAct({ cues: [{ ...validCue, departments: { lx: 'nope' } }] })],
      })
    );
    expect(deptBad.success).toBe(false);
    expect(deptBad.error).toMatch(/acts\[0\]\.cues\[0\]\.departments\.lx/);

    const deptArray = parseLightStageFile(
      wrapShow({
        id: 'show-1',
        acts: [validAct({ cues: [{ ...validCue, departments: [] }] })],
      })
    );
    expect(deptArray.success).toBe(false);
    expect(deptArray.error).toMatch(/acts\[0\]\.cues\[0\]\.departments/);
  });

  it('số lượng sai kiểu (durationMs, fixtureCount) → lỗi nêu field', () => {
    const badDuration = parseLightStageFile(
      wrapShow({
        id: 'show-1',
        acts: [validAct({ cues: [{ ...validCue, durationMs: '30000' }] })],
      })
    );
    expect(badDuration.success).toBe(false);
    expect(badDuration.error).toMatch(/acts\[0\]\.cues\[0\]\.durationMs/);

    const badCount = parseLightStageFile(
      wrapShow({
        id: 'show-1',
        acts: [
          validAct({
            cues: [
              { ...validCue, departments: { lx: { fixtureCount: 'many' } } },
            ],
          }),
        ],
      })
    );
    expect(badCount.success).toBe(false);
    expect(badCount.error).toMatch(/acts\[0\]\.cues\[0\]\.departments\.lx\.fixtureCount/);
  });

  it('stageConfig sai (màn hình null / không phải mảng) → lỗi nêu stage.*', () => {
    const badScreen = parseLightStageFile(
      JSON.stringify({
        fileType: LIGHTSTAGE_FILE_TYPE,
        schemaVersion: 1,
        show: { id: 'show-1', acts: [validAct()] },
        stage: { screens: [null] },
      })
    );
    expect(badScreen.success).toBe(false);
    expect(badScreen.error).toMatch(/stage\.screens\[0\]/);

    const badTrusses = parseLightStageFile(
      JSON.stringify({
        fileType: LIGHTSTAGE_FILE_TYPE,
        schemaVersion: 1,
        show: { id: 'show-1', acts: [validAct()] },
        stage: { trusses: 'nope' },
      })
    );
    expect(badTrusses.success).toBe(false);
    expect(badTrusses.error).toMatch(/stage\.trusses/);
  });

  it('JSON hỏng / file rỗng vẫn trả lỗi thân thiện', () => {
    expect(parseLightStageFile('{"broken...').success).toBe(false);
    expect(parseLightStageFile('').success).toBe(false);
    expect(parseLightStageFile('   ').success).toBe(false);
    expect(parseLightStageFile('null').success).toBe(false);
  });

  it('file hợp lệ vẫn parse bình thường (không hồi quy)', () => {
    const result = parseLightStageFile(wrapShow({ id: 'show-1', acts: [validAct()] }));
    expect(result.success).toBe(true);
    expect(result.data?.acts[0].cues[0].id).toBe('cue-1');
  });
});

describe('16.3 — readLightStageFile: bọc FileReader, không ném', () => {
  it('file rỗng → lỗi rõ ràng', async () => {
    const file = new File([''], 'empty.lightstage', { type: 'application/json' });
    const result = await readLightStageFile(file);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('file JSON hỏng → lỗi parser, không reject', async () => {
    const file = new File(['{"fileType": "lightstage_project",'], 'bad.lightstage', {
      type: 'application/json',
    });
    const result = await readLightStageFile(file);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid JSON/i);
  });
});

describe('16.3 — App: import lỗi hiện modal, giữ nguyên dự án hiện tại', () => {
  beforeEach(() => {
    useShowStore.getState().loadShow(createDefaultShow('Keep Me Safe'));
  });

  it('chọn file hỏng → modal nêu nguyên nhân + cách xử lý, show không đổi', async () => {
    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = new File([wrapShow({ id: 's2', acts: [null] })], 'broken.lightstage', {
      type: 'application/json',
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Không mở được dự án/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/acts\[0\]/)).toBeInTheDocument();
    expect(screen.getByText(/Chọn lại file hoặc mở bản autosave/i)).toBeInTheDocument();
    expect(useShowStore.getState().show.metadata.title).toBe('Keep Me Safe');
  });

  it('import file hợp lệ vẫn thay show như cũ', async () => {
    const { container } = render(<App />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const goodShow = createDefaultShow('Imported Show');
    const file = new File(
      [
        JSON.stringify({
          fileType: LIGHTSTAGE_FILE_TYPE,
          schemaVersion: 1,
          show: goodShow,
        }),
      ],
      'good.lightstage',
      { type: 'application/json' }
    );
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(useShowStore.getState().show.metadata.title).toBe('Imported Show');
    });
    expect(screen.queryByText(/Không mở được dự án/i)).toBeNull();
  });
});
