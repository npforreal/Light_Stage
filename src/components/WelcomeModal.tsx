import React, { useState } from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  Sliders,
  Tv,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSample?: () => void;
}

export const WELCOME_STORAGE_KEY = 'lightstage_welcome_seen';

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLoadSample,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: '1. Nhập Kịch Bản (Import Rundown)',
      subtitle: 'Nạp kịch bản show diễn từ CSV/TSV hoặc file .lightstage',
      icon: <FileSpreadsheet className="h-6 w-6 text-accent" />,
      description:
        'Nhập kịch bản sẵn có từ ban tổ chức chỉ với 1 thao tác. Light Stage tự động nhận diện các cột Ánh sáng (LX), Màn LED (VX), Âm thanh (SQ), Diễn viên / Hoạt cảnh (ST) và đếm tức thì số lượng fixture / màn hình.',
    },
    {
      step: 2,
      title: '2. Tinh Chỉnh Phân Hệ (Fine-tune Departments)',
      subtitle: 'Chỉnh sửa trực tiếp LX, VX, SQ, ST ngay trên hàng cue',
      icon: <Sliders className="h-6 w-6 text-dept-lx" />,
      description:
        'Nhấp đúp hoặc gõ Enter để chỉnh sửa tên cảnh, fixture, nhiệt độ màu Kelvin (1000K-10000K), gel Lee/Rosco, bộ đếm màn hình LED, và track nhạc nền với giao diện trực quan, không cần chuyển trang.',
    },
    {
      step: 3,
      title: '3. Giám Sát Chế Độ Kép (Dual View & Stage 3D)',
      subtitle: 'Xem cùng lúc bảng Rundown, Timeline Tracks và Sân Khấu Ảo 3D',
      icon: <Tv className="h-6 w-6 text-dept-vx" />,
      description:
        'Chuyển đổi linh hoạt giữa chế độ Master Rundown, Timeline Tracks thời gian thực hoặc Sân khấu ảo 3D (FOH, Top-down, Backstage) mô phỏng chính xác khối sân khấu, giàn truss, chùm sáng (beam cones) và màn hình LED.',
    },
    {
      step: 4,
      title: '4. Vận Hành Live Show (Calling & Clocks)',
      subtitle: 'Bộ đếm thời gian chuyên nghiệp, phím tắt nhanh và Stage Confidence',
      icon: <Clock className="h-6 w-6 text-status-go" />,
      description:
        'Gọi cue bằng phím Space (GO), B (Standby) hoặc mở đồng hồ màn hình lớn Stage Confidence Monitor cho MC / ca sĩ phía sau cánh gà. Bật Operator Lock để tuyệt đối an toàn trong các khoảnh khắc nhạy cảm. GO/Standby chỉ đổi trạng thái cue trong app, không gửi lệnh tới thiết bị thật.',
    },
  ];

  const handleFinish = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
      } catch (err) {
        console.error('Failed to set localStorage', err);
      }
    }
    onClose();
  };

  const current = steps[currentStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border-default bg-surface-1 p-6 shadow-2xl text-content-1 flex flex-col relative overflow-hidden">
        {/* Accent background glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleFinish}
          aria-label="Đóng hướng dẫn"
          className="absolute top-4 right-4 rounded-lg p-1 text-content-3 hover:text-content-1 hover:bg-surface-2 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent shadow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 id="welcome-modal-title" className="font-bold text-base text-content-1">
              Chào mừng bạn đến với Light Stage
            </h2>
            <p className="text-xs text-content-3">
              Hướng dẫn nhanh 4 bước làm chủ hệ thống điều phối sân khấu
            </p>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {steps.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'bg-accent shadow-sm'
                  : idx < currentStep
                  ? 'bg-accent/50'
                  : 'bg-surface-3'
              }`}
              title={`Bước ${idx + 1}`}
            />
          ))}
        </div>

        {/* Step Card Content */}
        <div className="rounded-xl border border-border-default bg-surface-0 p-5 mb-5 min-h-[170px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 border border-border-subtle">
                {current.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm text-content-1">{current.title}</h3>
                <p className="text-xs text-accent font-medium">{current.subtitle}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-content-2 mt-2">
              {current.description}
            </p>
          </div>
        </div>

        {/* Scope footnote */}
        <p className="mb-3 text-[10px] leading-relaxed text-content-3">
          Light Stage là công cụ rundown, gọi cue và preview. Chưa xuất DMX / sACN / Art-Net / OSC / MIDI và
          chưa đọc trực tiếp file .xlsx (hãy xuất CSV/TSV hoặc dán bảng từ Excel/Sheets).
        </p>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-border-default">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-content-3">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-border-strong text-accent focus:ring-accent"
            />
            <span>Không hiển thị lại lần sau</span>
          </label>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((c) => c - 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-default px-3 py-1.5 text-xs font-semibold text-content-2 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Trước</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((c) => c + 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-accent hover:bg-accent/90 text-surface-0 px-4 py-1.5 text-xs font-bold shadow transition-colors"
              >
                <span>Tiếp theo</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {onLoadSample && (
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSample();
                      handleFinish();
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-surface-3 hover:bg-surface-2 border border-border-default px-3 py-1.5 text-xs font-semibold text-accent transition-colors"
                  >
                    <span>Mở Show Mẫu</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center gap-1 rounded-lg bg-status-go hover:bg-status-go/90 text-surface-0 px-4 py-1.5 text-xs font-bold shadow transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>Bắt đầu ngay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
