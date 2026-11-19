import React from 'react';
import { useStageStore } from '../../store/useStageStore';
import { useShowStore } from '../../store/useShowStore';
import {
  FixtureType,
  RigPosition,
  StagePreset,
  DEFAULT_BEAM_ANGLES,
  DEFAULT_FIXTURE_WATTS,
} from '../../types/virtualStage';
import { getCueLightingCount } from '../../services/fixtureModel';
import { AlertTriangle, Lightbulb, Plus, Ruler, Trash2, Tv } from 'lucide-react';

const FIXTURE_TYPES: FixtureType[] = [
  'Beam',
  'Spot',
  'Wash',
  'Follow',
  'Blinder',
  'Strobe',
  'Par',
  'Laser',
  'Smoke',
];

const RIG_POSITIONS: RigPosition[] = [
  'FOH',
  'Truss',
  'SideBoom',
  'Ladder',
  'Floor',
  'BoxBoom',
  'Mid',
  'Back',
];

const PRESETS: StagePreset[] = ['EndStage', 'Festival', 'Thrust'];

const inputClass =
  'w-full rounded border border-border-default bg-surface-0 px-1 py-0.5 text-[11px] text-content-1 focus:border-accent focus:outline-none';

const labelClass = 'text-[10px] font-semibold text-content-3';

const NumberField: React.FC<{
  label: string;
  value: number | undefined;
  step?: number;
  min?: number;
  onChange: (value: number) => void;
  title?: string;
}> = ({ label, value, step = 0.5, min, onChange, title }) => (
  <label className="block" title={title}>
    <span className={labelClass}>{label}</span>
    <input
      type="number"
      step={step}
      min={min}
      value={Number.isFinite(Number(value)) ? value : 0}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isFinite(next)) onChange(next);
      }}
      className={inputClass}
    />
  </label>
);

/**
 * Editable rig inventory (Đợt 10.2.3): stage dimensions, LED screens, trusses and
 * individual fixtures. The inventory is cross-checked against the active cue so an
 * operator can see immediately when a cue asks for more fixtures than the rig has.
 */
export const StageRigEditor: React.FC = () => {
  const config = useStageStore((s) => s.config);
  const applyPreset = useStageStore((s) => s.applyPreset);
  const updateDimensions = useStageStore((s) => s.updateDimensions);

  const addScreen = useStageStore((s) => s.addScreen);
  const updateScreen = useStageStore((s) => s.updateScreen);
  const removeScreen = useStageStore((s) => s.removeScreen);
  const toggleScreen = useStageStore((s) => s.toggleScreen);

  const addTruss = useStageStore((s) => s.addTruss);
  const updateTruss = useStageStore((s) => s.updateTruss);
  const removeTruss = useStageStore((s) => s.removeTruss);
  const toggleTruss = useStageStore((s) => s.toggleTruss);

  const addFixture = useStageStore((s) => s.addFixture);
  const updateFixture = useStageStore((s) => s.updateFixture);
  const removeFixture = useStageStore((s) => s.removeFixture);

  const selectedFixtureId = useStageStore((s) => s.selectedFixtureId);
  const selectedScreenId = useStageStore((s) => s.selectedScreenId);
  const selectFixture = useStageStore((s) => s.selectFixture);
  const selectScreen = useStageStore((s) => s.selectScreen);

  const activeCue = useShowStore((s) => s.getActiveCue());
  const standbyCue = useShowStore((s) => s.getStandbyCue());
  const referenceCue = activeCue ?? standbyCue;
  const cueCount = referenceCue ? getCueLightingCount(referenceCue) : 0;

  const fixtures = config.fixtures ?? [];
  const rigCount = fixtures.filter((fixture) => fixture.enabled !== false).length;
  const rigLoadKw =
    fixtures
      .filter((fixture) => fixture.enabled !== false)
      .reduce((sum, fixture) => sum + (fixture.loadWatts || 0), 0) / 1000;

  return (
    <div className="space-y-4">
      {/* Grouped Quick-Add Menu (FreeShow Feature) */}
      <section className="rounded-lg border border-border-default bg-surface-2/80 p-2 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] uppercase tracking-wider text-accent flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Thêm nhanh vào Rig (Grouped Add)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {/* Group 1: Fixtures */}
          <div className="flex flex-col gap-1 rounded bg-surface-0/60 p-1.5 border border-border-subtle">
            <span className="text-[9px] font-bold text-dept-lx uppercase">Đèn (Fixtures)</span>
            <div className="flex flex-wrap gap-1">
              {(['Beam', 'Spot', 'Wash'] as FixtureType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addFixture({ type: t, beamAngle: DEFAULT_BEAM_ANGLES[t], loadWatts: DEFAULT_FIXTURE_WATTS[t] })}
                  className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold text-content-1 hover:bg-dept-lx/20 hover:text-dept-lx"
                  title={`Thêm 1 đèn ${t} vào rig`}
                >
                  +{t}
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: Screens */}
          <div className="flex flex-col gap-1 rounded bg-surface-0/60 p-1.5 border border-border-subtle">
            <span className="text-[9px] font-bold text-dept-vx uppercase">Màn LED</span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => addScreen()}
                className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold text-content-1 hover:bg-dept-vx/20 hover:text-dept-vx"
                title="Thêm màn hình LED vào rig"
              >
                +Screen
              </button>
            </div>
          </div>

          {/* Group 3: Truss */}
          <div className="flex flex-col gap-1 rounded bg-surface-0/60 p-1.5 border border-border-subtle">
            <span className="text-[9px] font-bold text-content-3 uppercase">Truss</span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => addTruss()}
                className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold text-content-1 hover:bg-surface-3"
                title="Thêm giàn truss vào rig"
              >
                +Truss
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stage dimensions & preset */}
      <section className="space-y-1.5 rounded-lg bg-surface-2 p-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-content-1">
            <Ruler className="h-3.5 w-3.5 text-accent" />
            Sân khấu
          </span>
          <select
            value={config.preset}
            onChange={(e) => applyPreset(e.target.value as StagePreset)}
            className="rounded border border-border-default bg-surface-0 px-1 py-0.5 text-[11px] text-content-2"
            title="Áp preset cấu trúc sân khấu"
          >
            {PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset === 'EndStage' ? 'Standard' : preset}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <NumberField
            label="Rộng (m)"
            value={config.widthMeters}
            min={5}
            step={1}
            onChange={(value) => updateDimensions(value, config.depthMeters)}
          />
          <NumberField
            label="Sâu (m)"
            value={config.depthMeters}
            min={5}
            step={1}
            onChange={(value) => updateDimensions(config.widthMeters, value)}
          />
        </div>
      </section>

      {/* Inventory cross-check */}
      <section
        className="rounded-lg border border-border-default bg-surface-2 p-2.5 text-[11px]"
        data-testid="rig-inventory"
      >
        <div className="flex items-center justify-between font-mono">
          <span className="text-content-2">
            Rig <strong className="text-content-1">{rigCount}</strong> đèn
          </span>
          <span className="text-content-2">
            Cue cần <strong className="text-dept-lx">{cueCount}</strong>
          </span>
          <span className="text-content-3">{rigLoadKw.toFixed(1)} kW</span>
        </div>
        {cueCount > rigCount && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded border border-status-standby/50 bg-status-standby/10 px-1.5 py-1 text-[10px] text-status-standby">
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>
              Cue {referenceCue?.cueNumber} cần {cueCount} đèn nhưng rig chỉ khai báo {rigCount}.
              Stage 2D sẽ mở rộng slot ảo — nên bổ sung đèn vào rig.
            </span>
          </div>
        )}
      </section>

      {/* LED screens */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-dept-vx">
            <Tv className="h-3.5 w-3.5" />
            LED Screens
          </span>
          <button
            type="button"
            onClick={() => addScreen()}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-dept-vx hover:bg-surface-2"
            title="Thêm màn LED"
          >
            <Plus className="h-3 w-3" /> Thêm
          </button>
        </div>
        {config.screens.length === 0 && (
          <p className="text-[10px] italic text-content-3">Chưa có màn LED.</p>
        )}
        {config.screens.map((screen) => {
          const isSelected = selectedScreenId === screen.id;
          return (
            <div
              key={screen.id}
              onClick={() => selectScreen(screen.id)}
              className={`space-y-1 rounded border p-1.5 transition-colors cursor-pointer ${
                isSelected
                  ? 'border-accent ring-1 ring-accent bg-accent/10'
                  : 'border-border-default bg-surface-0/60 hover:border-border-default/80'
              }`}
            >
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={screen.enabled}
                onChange={() => toggleScreen(screen.id)}
                className="h-3 w-3 accent-accent"
                title="Bật/tắt màn LED"
              />
              <input
                type="text"
                value={screen.name}
                onChange={(e) => updateScreen(screen.id, { name: e.target.value })}
                className={inputClass}
                title="Tên màn LED"
              />
              <button
                type="button"
                onClick={() => removeScreen(screen.id)}
                className="rounded p-0.5 text-content-3 hover:bg-surface-2 hover:text-status-hold"
                title="Xoá màn LED"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <NumberField
                label="X (m)"
                value={screen.xMeters}
                step={0.5}
                onChange={(value) => updateScreen(screen.id, { xMeters: value })}
              />
              <NumberField
                label="Y (m)"
                value={screen.yMeters}
                step={0.5}
                onChange={(value) => updateScreen(screen.id, { yMeters: value })}
              />
              <NumberField
                label="Rộng"
                value={screen.widthMeters}
                min={0.5}
                step={0.5}
                onChange={(value) => updateScreen(screen.id, { widthMeters: value })}
              />
              <NumberField
                label="Cao"
                value={screen.heightMeters}
                min={0.5}
                step={0.5}
                onChange={(value) => updateScreen(screen.id, { heightMeters: value })}
              />
            </div>
          </div>
        );
      })}
      </section>

      {/* Trusses */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-dept-lx">
            <Lightbulb className="h-3.5 w-3.5" />
            Trusses
          </span>
          <button
            type="button"
            onClick={() => addTruss()}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-dept-lx hover:bg-surface-2"
            title="Thêm truss"
          >
            <Plus className="h-3 w-3" /> Thêm
          </button>
        </div>
        {config.trusses.length === 0 && (
          <p className="text-[10px] italic text-content-3">Chưa có truss.</p>
        )}
        {config.trusses.map((truss) => (
          <div key={truss.id} className="space-y-1 rounded border border-border-default bg-surface-0/60 p-1.5">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={truss.enabled}
                onChange={() => toggleTruss(truss.id)}
                className="h-3 w-3 accent-accent"
                title="Bật/tắt truss"
              />
              <input
                type="text"
                value={truss.name}
                onChange={(e) => updateTruss(truss.id, { name: e.target.value })}
                className={inputClass}
                title="Tên truss"
              />
              <select
                value={truss.position}
                onChange={(e) =>
                  updateTruss(truss.id, { position: e.target.value as RigPosition })
                }
                className="rounded border border-border-default bg-surface-0 px-1 py-0.5 text-[10px] text-content-2"
                title="Vị trí rig"
              >
                {RIG_POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeTruss(truss.id)}
                className="rounded p-0.5 text-content-3 hover:bg-surface-2 hover:text-status-hold"
                title="Xoá truss"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <NumberField
                label="X (m)"
                value={truss.xMeters}
                step={0.5}
                onChange={(value) => updateTruss(truss.id, { xMeters: value })}
              />
              <NumberField
                label="Y (m)"
                value={truss.yMeters}
                step={0.5}
                onChange={(value) => updateTruss(truss.id, { yMeters: value })}
              />
              <NumberField
                label="Trim (m)"
                value={truss.zMeters}
                min={0}
                step={0.5}
                onChange={(value) => updateTruss(truss.id, { zMeters: value })}
              />
              <NumberField
                label="Tải (kW)"
                value={(truss.loadLimitWatts ?? 0) / 1000}
                min={0}
                step={0.5}
                onChange={(value) =>
                  updateTruss(truss.id, { loadLimitWatts: Math.max(0, value) * 1000 })
                }
              />
            </div>
          </div>
        ))}
      </section>

      {/* Fixtures */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-content-1">
            <Lightbulb className="h-3.5 w-3.5 text-status-go" />
            Đèn trong rig
          </span>
          <button
            type="button"
            onClick={() => addFixture()}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-status-go hover:bg-surface-2"
            title="Thêm đèn vào rig"
          >
            <Plus className="h-3 w-3" /> Thêm
          </button>
        </div>
        {fixtures.length === 0 && (
          <p className="text-[10px] italic text-content-3">
            Rig chưa khai báo đèn — Stage 2D sẽ dựng slot ảo theo cue.
          </p>
        )}
        {fixtures.map((fixture) => {
          const isSelected = selectedFixtureId === fixture.id;
          return (
            <div
              key={fixture.id}
              onClick={() => selectFixture(fixture.id)}
              className={`space-y-1 rounded border p-1.5 transition-colors cursor-pointer ${
                isSelected
                  ? 'border-accent ring-1 ring-accent bg-accent/10'
                  : 'border-border-default bg-surface-0/60 hover:border-border-default/80'
              }`}
            >
            <div className="flex items-center gap-1">
              <span className="w-6 flex-shrink-0 font-mono text-[10px] font-bold text-content-3">
                #{fixture.slot}
              </span>
              <select
                value={fixture.type}
                onChange={(e) => {
                  const type = e.target.value as FixtureType;
                  updateFixture(fixture.id, {
                    type,
                    beamAngle: DEFAULT_BEAM_ANGLES[type],
                    loadWatts: DEFAULT_FIXTURE_WATTS[type],
                  });
                }}
                className="rounded border border-border-default bg-surface-0 px-1 py-0.5 text-[10px] text-content-2"
                title="Loại đèn"
              >
                {FIXTURE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={fixture.position}
                onChange={(e) =>
                  updateFixture(fixture.id, { position: e.target.value as RigPosition })
                }
                className="rounded border border-border-default bg-surface-0 px-1 py-0.5 text-[10px] text-content-2"
                title="Vị trí treo"
              >
                {RIG_POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              <input
                type="checkbox"
                checked={fixture.enabled !== false}
                onChange={(e) => updateFixture(fixture.id, { enabled: e.target.checked })}
                className="ml-auto h-3 w-3 accent-accent"
                title="Bật/tắt đèn"
              />
              <button
                type="button"
                onClick={() => removeFixture(fixture.id)}
                className="rounded p-0.5 text-content-3 hover:bg-surface-2 hover:text-status-hold"
                title="Xoá đèn khỏi rig"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <NumberField
                label="X (m)"
                value={fixture.x}
                step={0.5}
                onChange={(value) => updateFixture(fixture.id, { x: value })}
              />
              <NumberField
                label="Y (m)"
                value={fixture.y}
                step={0.5}
                onChange={(value) => updateFixture(fixture.id, { y: value })}
              />
              <NumberField
                label="Trim (m)"
                value={fixture.z}
                min={0}
                step={0.5}
                onChange={(value) => updateFixture(fixture.id, { z: value })}
              />
              <NumberField
                label="Góc (°)"
                value={fixture.beamAngle}
                min={1}
                step={1}
                onChange={(value) => updateFixture(fixture.id, { beamAngle: value })}
              />
            </div>
          </div>
        );
      })}
      </section>
    </div>
  );
};
