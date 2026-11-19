import React, { useEffect } from 'react';
import {
  X,
  Keyboard,
  HelpCircle,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Pause,
  FastForward,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded border border-border-default bg-surface-1 p-6 shadow-lg text-content-1 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-default pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/20 text-accent">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="help-modal-title" className="font-bold text-content-1 text-base">
                Hướng dẫn & Phím tắt Vận hành (Help & Hotkeys)
              </h2>
              <p className="text-xs text-content-3">
                Cẩm nang điều phối sân khấu trực tiếp Light Stage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng trợ giúp"
            className="rounded p-1 text-content-3 hover:text-content-1 hover:bg-surface-2 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
          {/* Scope statement */}
          <section>
            <div className="flex items-center gap-2 mb-2.5 text-accent font-semibold text-xs">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              <span>Phạm vi sử dụng (Scope)</span>
            </div>
            <div className="rounded border border-border-default bg-surface-0 p-3 text-content-2 space-y-1.5 text-xs leading-relaxed">
              <p>
                Light Stage là công cụ <span className="font-semibold text-content-1">rundown + show-calling + preview</span> cho người điều phối sân khấu. GO / Standby / Hold chỉ đổi trạng thái cue trong app và đồng hồ đếm ngược — <span className="font-semibold text-content-1">không gửi lệnh tới thiết bị thật</span>.
              </p>
              <p>
                Chưa hỗ trợ xuất điều khiển <span className="font-mono">DMX</span> / <span className="font-mono">sACN</span> / <span className="font-mono">Art-Net</span> / <span className="font-mono">OSC</span> / <span className="font-mono">MIDI</span>. Đây là kế hoạch tương lai, chưa có trong bản hiện tại.
              </p>
            </div>
          </section>

          {/* Hotkey Table */}
          <section>
            <div className="flex items-center gap-2 mb-2.5 text-accent font-semibold text-xs">
              <Keyboard className="h-4 w-4" aria-hidden="true" />
              <span>Phím tắt Vận hành Live (Keyboard Shortcuts)</span>
            </div>
            <div className="rounded border border-border-default bg-surface-0 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-2 text-content-3 border-b border-border-default">
                  <tr>
                    <th className="py-2 px-3 w-40 font-mono">Phím (Hotkey)</th>
                    <th className="py-2 px-3">Tác vụ (Action)</th>
                    <th className="py-2 px-3">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-sans">
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-status-go">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Enter</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-content-1">Kích hoạt GO (Go Cue)</td>
                    <td className="py-2 px-3 text-content-3">Chạy cue đang Standby, bắt đầu đồng hồ đếm ngược.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-status-standby">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">B</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-content-1">Chuẩn bị (Standby Next)</td>
                    <td className="py-2 px-3 text-content-3">Đưa cue tiếp theo vào trạng thái sẵn sàng Standby.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-status-hold">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Escape</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-content-1">Tạm dừng (Hold Cue)</td>
                    <td className="py-2 px-3 text-content-3">Tạm giữ cue đang chạy khi có sự cố phát sinh.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-content-2">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">↓</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">↑</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-content-1">Chuyển Cue (Next / Prev)</td>
                    <td className="py-2 px-3 text-content-3">Di chuyển lựa chọn lên/xuống danh sách cue.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-content-2">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Z</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-content-1">Hoàn tác (Undo)</td>
                    <td className="py-2 px-3 text-content-3">Khôi phục trạng thái chỉnh sửa trước đó.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-content-2">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Y</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Shift+Z</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-content-1">Làm lại (Redo)</td>
                    <td className="py-2 px-3 text-content-3">Lấy lại thay đổi vừa hoàn tác.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-content-2">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">S</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-content-1">Lưu dự án (Save Show)</td>
                    <td className="py-2 px-3 text-content-3">Lưu trạng thái show hiện tại.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-dept-vx">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">F1</kbd> .. <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">F4</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-dept-vx">Panic Xoá Lớp VX (Clear Layers)</td>
                    <td className="py-2 px-3 text-content-3">F1: Xoá Nền | F2: Xoá Slide | F3: Xoá Overlay | F4: Xoá Tất cả VX.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-dept-vx">
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">Alt</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-content-1">F</kbd>
                    </td>
                    <td className="py-2 px-3 font-semibold text-dept-vx">Freeze VX (Đóng băng Output)</td>
                    <td className="py-2 px-3 text-content-3">Khóa cố định hình ảnh màn hình LED khi chuyển đổi cue.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Cue Status Guide */}
          <section>
            <div className="flex items-center gap-2 mb-2.5 text-accent font-semibold text-xs">
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>Ý nghĩa Trạng thái Cue (Cue Status Lifecycle)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded border border-border-default bg-surface-0 p-2.5 flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-status-go/20 text-status-go font-bold text-xs mt-0.5">
                  <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-bold text-status-go">GO (Đang diễn ra)</div>
                  <div className="text-content-3 text-xs">Cảnh đang phát trên sân khấu. Đồng hồ chạy đếm ngược.</div>
                </div>
              </div>
              <div className="rounded border border-border-default bg-surface-0 p-2.5 flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-status-standby/20 text-status-standby font-bold text-xs mt-0.5">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-bold text-status-standby">STANDBY (Sẵn sàng)</div>
                  <div className="text-content-3 text-xs">Cảnh kế tiếp chuẩn bị kích hoạt. Ekip sẵn sàng nhận lệnh.</div>
                </div>
              </div>
              <div className="rounded border border-border-default bg-surface-0 p-2.5 flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-status-hold/20 text-status-hold font-bold text-xs mt-0.5">
                  <Pause className="h-3 w-3" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-bold text-status-hold">HOLD (Tạm dừng)</div>
                  <div className="text-content-3 text-xs">Đang tạm hoãn cue để xử lý tình huống phát sinh trên sân khấu.</div>
                </div>
              </div>
              <div className="rounded border border-border-default bg-surface-0 p-2.5 flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-2 text-content-3 font-bold text-xs mt-0.5">
                  <FastForward className="h-3 w-3" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-bold text-content-2">SKIP (Bỏ qua)</div>
                  <div className="text-content-3 text-xs">Tiết mục bị cắt bỏ hoặc bỏ qua trong kịch bản trực tiếp.</div>
                </div>
              </div>
              <div className="rounded border border-border-default bg-surface-0 p-2.5 flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-2 text-content-3 font-bold text-xs mt-0.5">
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-bold text-content-2">DONE (Hoàn thành)</div>
                  <div className="text-content-3 text-xs">Cảnh đã thực hiện xong và chuyển sang cue mới.</div>
                </div>
              </div>
              <div className="rounded border border-border-default bg-surface-0 p-2.5 flex items-start gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-2 text-content-3 font-bold text-xs mt-0.5">
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-bold text-content-3">PENDING (Chưa đến)</div>
                  <div className="text-content-3 text-xs">Cảnh còn lại trong danh sách đang chờ đến lượt.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Operator Lock Guide */}
          <section>
            <div className="flex items-center gap-2 mb-2.5 text-accent font-semibold text-xs">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span>Chế độ Khóa Vận Hành (Operator Lock)</span>
            </div>
            <div className="rounded border border-status-standby/40 bg-status-standby/10 p-3 text-content-2 space-y-1.5">
              <p className="font-medium text-status-standby">
                Bảo vệ tối đa chống cấn phím ngoài ý muốn:
              </p>
              <p className="text-xs leading-relaxed text-content-2">
                Khi kích hoạt <span className="font-semibold text-content-1">Operator Lock</span>, 5 lệnh gọi cue bị vô hiệu hóa ở mọi đường: phím tắt (Space, Enter, B, Esc, Arrows), nút GO / STBY / Hold trên Header, Stage Clock và Inspector. Muốn gọi cue phải mở khóa lại.
              </p>
              <p className="text-xs leading-relaxed text-content-2">
                Vẫn hoạt động khi khóa: xem/cuộn rundown, Help (<span className="font-mono">?</span>), Inspector (<span className="font-mono">i</span>), Undo/Redo, lưu <span className="font-mono">Ctrl/Cmd+S</span>, và VX panic (<span className="font-mono">F1</span>–<span className="font-mono">F4</span>, <span className="font-mono">Alt+F</span>).
              </p>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border-default pt-3 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-surface-2 hover:bg-surface-3 border border-border-default px-4 py-1.5 text-xs font-semibold text-content-1 transition-colors"
          >
            Đóng (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
