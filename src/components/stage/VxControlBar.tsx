import React from 'react';
import { useVisualStore } from '../../store/useVisualStore';
import { getOutputStatusDotClass } from '../../services/visualEngine';
import { Lock, Unlock, EyeOff, Power, Monitor } from 'lucide-react';

export interface VxControlBarProps {
  className?: string;
}

export const VxControlBar: React.FC<VxControlBarProps> = ({ className }) => {
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
      data-testid="vx-floating-dock"
      className={
        className ??
        'absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded bg-surface-1/95 border border-white/10 px-4 py-2 shadow-lg select-none text-xs'
      }
    >
      <div data-testid="vx-control-bar" className="contents">
        {/* Output status chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="flex items-center gap-1 text-xs font-semibold text-content-3 mr-1">
            <Monitor className="h-3.5 w-3.5 text-dept-vx" aria-hidden="true" />
            <span>Outputs:</span>
          </span>
          {outputs.map((out) => (
            <div
              key={out.id}
              className={`flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-mono transition-colors ${
                out.enabled
                  ? 'border-border-subtle bg-surface-2 text-content-1'
                  : 'border-transparent bg-surface-0/60 text-content-3 line-through opacity-60'
              }`}
              title={`${out.name} (${out.aspectRatio}, ${out.resolution.width}x${out.resolution.height}) — ${out.status}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${getOutputStatusDotClass(out.status)}`} />
              <span className="truncate max-w-[90px]">{out.name}</span>
              <span className="text-xs text-content-3">[{out.aspectRatio}]</span>
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Layer switches */}
        <div className="flex items-center rounded bg-surface-2/80 border border-border-subtle p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => toggleLayer('background')}
            className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeLayers.background
                ? 'bg-dept-vx/20 text-dept-vx font-bold'
                : 'text-content-3 hover:text-content-2 line-through'
            }`}
            title="Lớp Nền Video/Loop (F1)"
            data-testid="vx-layer-background"
          >
            Nền (F1)
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('slide')}
            className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeLayers.slide
                ? 'bg-dept-vx/20 text-dept-vx font-bold'
                : 'text-content-3 hover:text-content-2 line-through'
            }`}
            title="Lớp Slide / Nội dung chính (F2)"
            data-testid="vx-layer-slide"
          >
            Slide (F2)
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('overlay')}
            className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeLayers.overlay
                ? 'bg-dept-vx/20 text-dept-vx font-bold'
                : 'text-content-3 hover:text-content-2 line-through'
            }`}
            title="Lớp Phủ / Lower Third (F3)"
            data-testid="vx-layer-overlay"
          >
            Overlay (F3)
          </button>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Panic actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Clear VX Button */}
          <button
            type="button"
            onClick={clearAllVx}
            disabled={!anyLayerActive}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
              anyLayerActive
                ? 'bg-status-standby hover:opacity-90 active:scale-[0.98] text-surface-0 animate-pulse'
                : 'bg-surface-2 text-content-3 cursor-not-allowed opacity-50'
            }`}
            title="Xoá tất cả các lớp VX trên màn hình (F4)"
            data-testid="vx-panic-clear"
          >
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear VX (F4)</span>
          </button>

          {/* Freeze VX Button */}
          <button
            type="button"
            onClick={toggleFreezeVx}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
              isFrozen
                ? 'bg-status-standby text-surface-0 active:scale-[0.98]'
                : 'bg-surface-2 hover:bg-surface-3 text-content-2'
            }`}
            title="Freeze VX: Đóng băng hình ảnh trên màn hình, không đổi khi chuyển cue (Alt+F)"
            data-testid="vx-panic-freeze"
          >
            {isFrozen ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <Unlock className="h-3.5 w-3.5 text-content-3" aria-hidden="true" />}
            <span>{isFrozen ? 'ĐÃ KHÓA VX' : 'Freeze VX (Alt+F)'}</span>
          </button>

          {/* Blackout VX Button */}
          <button
            type="button"
            onClick={toggleBlackoutVx}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${
              isBlackout
                ? 'bg-status-danger text-surface-0 active:scale-[0.98]'
                : 'bg-surface-2 hover:bg-surface-3 text-content-2'
            }`}
            title="Blackout VX: Tắt toàn bộ tín hiệu ra màn hình LED"
            data-testid="vx-panic-blackout"
          >
            <Power className="h-3.5 w-3.5 text-status-danger" aria-hidden="true" />
            <span>Blackout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
