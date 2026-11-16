import React from 'react';
import { useVisualStore } from '../../store/useVisualStore';
import { getOutputStatusDotClass } from '../../services/visualEngine';
import { Lock, Unlock, EyeOff, Power, Monitor } from 'lucide-react';

export const VxControlBar: React.FC = () => {
  const outputs = useVisualStore((s) => s.outputs);
  const isFrozen = useVisualStore((s) => s.isFrozen);
  const isBlackout = useVisualStore((s) => s.isBlackout);
  const activeLayers = useVisualStore((s) => s.activeLayers);
  const toggleFreezeVx = useVisualStore((s) => s.toggleFreezeVx);
  const toggleBlackoutVx = useVisualStore((s) => s.toggleBlackoutVx);
  const toggleLayer = useVisualStore((s) => s.toggleLayer);
  const clearAllVx = useVisualStore((s) => s.clearAllVx);

  const anyLayerActive = activeLayers.background || activeLayers.slide || activeLayers.overlay;

  return (
    <div
      data-testid="vx-control-bar"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default/80 bg-surface-1/90 px-3 py-1.5 text-xs select-none backdrop-blur z-20"
    >
      {/* Left: Output status chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-content-3 uppercase tracking-wider mr-1">
          <Monitor className="h-3.5 w-3.5 text-dept-vx" />
          Outputs:
        </span>
        {outputs.map((out) => (
          <div
            key={out.id}
            className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-mono transition-colors ${
              out.enabled
                ? 'border-border-default bg-surface-2 text-content-1'
                : 'border-transparent bg-surface-0/60 text-content-3 line-through opacity-60'
            }`}
            title={`${out.name} (${out.aspectRatio} · ${out.resolution.width}x${out.resolution.height}) - ${out.status.toUpperCase()}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${getOutputStatusDotClass(out.status)}`} />
            <span className="truncate max-w-[90px]">{out.name}</span>
            <span className="text-[9px] text-content-3">[{out.aspectRatio}]</span>
          </div>
        ))}
      </div>

      {/* Right: Panic actions & Layer toggles */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Layer icon switches */}
        <div className="flex items-center rounded-lg bg-surface-2 border border-border-subtle p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => toggleLayer('background')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
              activeLayers.background
                ? 'bg-dept-vx/20 text-dept-vx font-bold'
                : 'text-content-3 hover:text-content-2 line-through'
            }`}
            title="Lớp Nền Video/Loop (F1)"
          >
            Nền
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('slide')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
              activeLayers.slide
                ? 'bg-dept-vx/20 text-dept-vx font-bold'
                : 'text-content-3 hover:text-content-2 line-through'
            }`}
            title="Lớp Slide / Nội dung chính (F2)"
          >
            Slide
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('overlay')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
              activeLayers.overlay
                ? 'bg-dept-vx/20 text-dept-vx font-bold'
                : 'text-content-3 hover:text-content-2 line-through'
            }`}
            title="Lớp Phủ / Lower Third (F3)"
          >
            Overlay
          </button>
        </div>

        {/* Clear VX Button */}
        <button
          type="button"
          onClick={clearAllVx}
          disabled={!anyLayerActive}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-sm ${
            anyLayerActive
              ? 'bg-amber-600/90 hover:bg-amber-500 text-white animate-pulse'
              : 'bg-surface-2 text-content-3 cursor-not-allowed opacity-50'
          }`}
          title="Xoá tất cả các lớp VX trên màn hình (F4)"
        >
          <EyeOff className="h-3.5 w-3.5" />
          Clear VX
        </button>

        {/* Freeze VX Button */}
        <button
          type="button"
          onClick={toggleFreezeVx}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
            isFrozen
              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
              : 'bg-surface-2 hover:bg-surface-3 text-content-2'
          }`}
          title="Freeze VX: Đóng băng hình ảnh trên màn hình, không đổi khi chuyển cue (Alt+F)"
        >
          {isFrozen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 text-content-3" />}
          <span>{isFrozen ? 'ĐÃ KHÓA VX' : 'Freeze VX'}</span>
        </button>

        {/* Blackout VX Button */}
        <button
          type="button"
          onClick={toggleBlackoutVx}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-colors ${
            isBlackout
              ? 'bg-rose-600 text-white ring-2 ring-rose-400'
              : 'bg-surface-2 hover:bg-surface-3 text-content-2'
          }`}
          title="Blackout VX: Tắt toàn bộ tín hiệu ra màn hình LED"
        >
          <Power className="h-3.5 w-3.5 text-rose-400" />
          <span className="hidden sm:inline">Blackout</span>
        </button>
      </div>
    </div>
  );
};
