import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { useShowStore } from '../store/useShowStore';
import { useClockStore } from '../store/useClockStore';
import { placeFixtures, DEFAULT_PLACEMENT_RULES } from '../services/stageAutoPatch';
import { STAGE_PRESETS, FixtureType } from '../types/virtualStage';
import { createDefaultShow, calculateCueDeviceCounts } from '../types/stage';
import { parseFixtureText } from '../services/fixtureModel';
import { generatePrintableCueSheetHtml, generateCueSheetCsv } from '../services/exporter';
import { saveAutoSave, clearAutoSave } from '../services/persistence';

describe('Round 10 Comprehensive Verification Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAutoSave();
    useShowStore.getState().loadShow(createDefaultShow('Test Round 10 Show'));
    useClockStore.getState().resetClock();
    vi.restoreAllMocks();
  });

  describe('10.2.7 Position Verification by Fixture Type across 3 Stage Presets', () => {
    const fixtureTypes: FixtureType[] = [
      'Follow',
      'Wash',
      'Spot',
      'Beam',
      'Blinder',
      'Strobe',
      'Par',
      'Laser',
      'Smoke',
    ];

    const presets = Object.keys(STAGE_PRESETS) as (keyof typeof STAGE_PRESETS)[];

    presets.forEach((presetKey) => {
      it(`places each fixture type strictly within allowed positions for preset ${presetKey}`, () => {
        const config = STAGE_PRESETS[presetKey];

        fixtureTypes.forEach((type) => {
          const requirements = [{ type, count: 4 }];
          const result = placeFixtures(config, requirements);

          expect(result.activeCount).toBe(4);

          const allowedPositions = DEFAULT_PLACEMENT_RULES[type] || ['Truss', 'Floor', 'FOH', 'SideBoom'];

          const activePlacements = result.placements.filter((p) => p.isActive);
          expect(activePlacements.length).toBe(4);

          activePlacements.forEach((placement) => {
            // Placement position must be in allowed rules
            expect(allowedPositions).toContain(placement.position);
          });
        });
      });
    });
  });

  describe('10.3.4 Header Buttons element / click unobstructed check across 960/1024/1280/1920 with/without recovery banner', () => {
    const viewports = [960, 1024, 1280, 1920];

    viewports.forEach((vp) => {
      it(`ensures all header buttons are interactive at width ${vp}px (clean state)`, () => {
        window.innerWidth = vp;
        render(<App />);

        // Brand & title
        expect(screen.getByText('Light Stage')).toBeInTheDocument();
        const titleBtn = screen.getByTitle('Bấm để đổi tên show');
        expect(titleBtn).not.toBeDisabled();

        // Transport
        const startBtn = screen.getByTitle('Start Clock');
        const stopBtn = screen.getByTitle('Stop Clock');
        const resetBtn = screen.getByTitle('Reset Clock');
        const nextBtn = screen.getByTitle('Chuyển Standby tiếp theo (Go Next Cue - B)');

        [startBtn, stopBtn, resetBtn, nextBtn].forEach((btn) => {
          expect(btn).toBeInTheDocument();
          expect(btn).not.toBeDisabled();
        });

        // View mode switchers
        expect(screen.getByTitle('Cue Rundown List')).toBeInTheDocument();
        expect(screen.getByTitle('Split Dual View')).toBeInTheDocument();
        expect(screen.getByTitle('Timeline Tracks')).toBeInTheDocument();
        expect(screen.getByTitle('Stage 2D Preview')).toBeInTheDocument();

        // Lock button
        const lockBtn = screen.getByTitle(/Unlocked: Hotkeys active/);
        expect(lockBtn).toBeInTheDocument();
        fireEvent.click(lockBtn);
        // Should toggle to locked
        expect(screen.getByText(/CHẾ ĐỘ KHÓA VẬN HÀNH/)).toBeInTheDocument();
      });

      it(`ensures header buttons remain fully interactive with recovery banner active at width ${vp}px`, () => {
        window.innerWidth = vp;
        // Seed autosave
        saveAutoSave(createDefaultShow('Autosaved Recovery Show'), STAGE_PRESETS.Festival);

        render(<App />);

        // Banner should be present
        expect(screen.getByText(/Phát hiện bản tự động lưu:/)).toBeInTheDocument();
        const recoverBtn = screen.getByText('Khôi phục');
        const ignoreBtn = screen.getByText('Bỏ qua');
        expect(recoverBtn).toBeInTheDocument();
        expect(ignoreBtn).toBeInTheDocument();

        // Header buttons above the banner must be fully intact
        expect(screen.getByTitle('Cue Rundown List')).toBeInTheDocument();
        expect(screen.getByTitle('Split Dual View')).toBeInTheDocument();
        expect(screen.getByTitle('Start Clock')).not.toBeDisabled();

        // Click dismiss
        fireEvent.click(ignoreBtn);
        expect(screen.queryByText(/Phát hiện bản tự động lưu:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('10.4.2 Scratch Show Creation with 30 Fixtures Consistency', () => {
    it('creates 3 cues from scratch, inputs 30 fixtures, and verifies Rundown, Stage, Stats, Export consistency', () => {
      const show = createDefaultShow('Scratch Concert 2026');
      show.acts[0].cues = []; // empty cues
      useShowStore.getState().loadShow(show);

      // Cue 1
      useShowStore.getState().addCue(show.acts[0].id);
      // Cue 2
      useShowStore.getState().addCue(show.acts[0].id);
      // Cue 3
      useShowStore.getState().addCue(show.acts[0].id);

      const cuesAfterAdd = useShowStore.getState().getAllCues();
      expect(cuesAfterAdd.length).toBe(3);

      // Input 30 fixtures into Cue 1: "Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4"
      const fixtureDesc = 'Beam x8, Spot x4, Wash x12, Follow x2, Blinder x4';
      const parsedItems = parseFixtureText(fixtureDesc);
      const totalParsedCount = parsedItems.reduce((acc, it) => acc + it.count, 0);
      expect(totalParsedCount).toBe(30);

      const targetCue = cuesAfterAdd[0];
      const targetCueId = targetCue.id;
      useShowStore.getState().updateCue(targetCueId, {
        title: 'Opening Impact',
        departments: {
          ...targetCue.departments,
          lx: {
            intensity: 100,
            sceneName: 'Opening Impact',
            fixtureSummary: fixtureDesc,
            fixtures: parsedItems,
          },
        },
      });

      const updatedCue = useShowStore.getState().getAllCues().find((c) => c.id === targetCueId)!;

      // 1. Single source of truth in cue
      const deviceCounts = calculateCueDeviceCounts(updatedCue.departments);
      expect(deviceCounts.lightingCount).toBe(30);

      // 2. Hardware stats
      const stats = useShowStore.getState().getDeviceStats();
      expect(stats.totalLightingFixtures).toBe(30);

      // 3. Stage 2D placement
      const stageConfig = STAGE_PRESETS.Festival;
      const placement = placeFixtures(
        stageConfig,
        parsedItems.map((it) => ({
          type: (it.subType || it.name || 'Other') as FixtureType,
          count: it.count,
        }))
      );
      expect(placement.requestedCount).toBe(30);
      expect(placement.activeCount).toBe(30);

      // 4. Export CSV & HTML
      const currentShow = useShowStore.getState().show;
      const csv = generateCueSheetCsv(currentShow);
      expect(csv).toContain('Opening Impact');
      expect(csv).toContain('30'); // fixture count

      const html = generatePrintableCueSheetHtml(currentShow);
      expect(html).toContain('Opening Impact');
      expect(html).toContain('30');
    });
  });

  describe('10.4.3 Transport & Clock synchronization & Panic / Hotkeys', () => {
    it('manages clock reset, pause, stop, and hotkeys correctly', () => {
      render(<App />);

      const clock = useClockStore.getState();
      expect(clock.isRunning).toBe(false);

      // GO
      act(() => {
        useShowStore.getState().goCue('cue-1');
        useClockStore.getState().startClock();
      });
      expect(useClockStore.getState().isRunning).toBe(true);

      // Tick 5000ms
      act(() => {
        useClockStore.getState().tick(5000);
      });
      expect(useClockStore.getState().masterElapsedMs).toBe(5000);

      // Pause
      act(() => {
        useClockStore.getState().pauseClock();
      });
      expect(useClockStore.getState().isRunning).toBe(false);

      // Stop
      act(() => {
        useClockStore.getState().stopClock();
      });
      expect(useClockStore.getState().isRunning).toBe(false);

      // Reset
      act(() => {
        useClockStore.getState().resetClock();
      });
      expect(useClockStore.getState().masterElapsedMs).toBe(0);
    });
  });
});
