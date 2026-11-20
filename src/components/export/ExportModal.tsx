import React, { useState } from 'react';
import { useShowStore } from '../../store/useShowStore';
import { useStageStore } from '../../store/useStageStore';
import {
  generateCueSheetCsv,
  generateHardwareInventoryCsv,
  generateLightPlotHtml,
  generatePrintableCueSheetHtml,
} from '../../services/exporter';
import { downloadLightStageFile } from '../../services/persistence';
import {
  Download,
  Printer,
  FileSpreadsheet,
  PackageCheck,
  X,
  FileCode,
  Map as MapIcon,
} from 'lucide-react';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const show = useShowStore((s) => s.show);
  const stageConfig = useStageStore((s) => s.config);
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'LX' | 'VX' | 'SQ' | 'ST'>('ALL');

  if (!isOpen) return null;

  const triggerDownload = (content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printHtml = (html: string) => {
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
  };

  const handlePrintPdf = () => {
    printHtml(generatePrintableCueSheetHtml(show, selectedRole));
  };

  const handlePrintLightPlot = () => {
    printHtml(generateLightPlotHtml(show, stageConfig));
  };

  const handleDownloadCueSheetCsv = () => {
    const csv = generateCueSheetCsv(show, selectedRole);
    const filename = `${show.metadata.title}_CueSheet_${selectedRole}.csv`.replace(/\s+/g, '_');
    triggerDownload(csv, filename);
  };

  const handleDownloadHardwareCsv = () => {
    const csv = generateHardwareInventoryCsv(show.acts);
    const filename = `${show.metadata.title}_Hardware_Inventory.csv`.replace(/\s+/g, '_');
    triggerDownload(csv, filename);
  };

  const handleDownloadProjectFile = () => {
    downloadLightStageFile(show, stageConfig);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded border border-border-default bg-surface-1 p-6 shadow-lg text-content-1 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-default pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/20 text-accent">
              <Download className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="export-modal-title" className="font-bold text-content-1 text-base">
                Xuất & In báo cáo (Export & Print Reports)
              </h3>
              <p className="text-xs text-content-3">Báo cáo kịch bản PDF, sơ đồ ánh sáng, CSV và file dự án .lightstage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng xuất báo cáo"
            className="rounded p-1 text-content-3 hover:text-content-1 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Role Selector for Cue Sheets */}
        <div className="mb-4 space-y-1.5">
          <label className="text-xs font-semibold text-content-3">Lọc theo bộ phận / vai trò:</label>
          <div className="inline-flex w-full rounded bg-surface-0 p-1 text-xs border border-border-default gap-1">
            {(['ALL', 'LX', 'VX', 'SQ', 'ST'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`flex-1 rounded py-1.5 font-medium transition-colors ${
                  selectedRole === r
                    ? 'bg-accent text-surface-0 font-bold shadow'
                    : 'text-content-3 hover:text-content-1 hover:bg-surface-2'
                }`}
              >
                {r === 'ALL' ? 'Master (All)' : r === 'ST' ? 'Stage (ST)' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Export Options Grid */}
        <div className="space-y-2.5">
          {/* Printable PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="group w-full text-left flex items-center justify-between rounded border border-border-default bg-surface-0 p-3 hover:border-accent hover:bg-surface-2/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-surface-2 text-content-1 group-hover:scale-105 transition-transform border border-border-default">
                <Printer className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-bold text-content-1 group-hover:text-accent">
                  In / Lưu PDF Kịch bản Cue Sheet (Print / Save PDF Cue Sheet)
                </div>
                <div className="text-xs text-content-3">
                  Định dạng A4 ngang tối ưu cho ekip với bộ lọc theo bộ phận
                </div>
              </div>
            </div>
          </button>

          {/* Light Plot */}
          <button
            type="button"
            onClick={handlePrintLightPlot}
            className="group w-full text-left flex items-center justify-between rounded border border-border-default bg-surface-0 p-3 hover:border-accent hover:bg-surface-2/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-surface-2 text-content-1 group-hover:scale-105 transition-transform border border-border-default">
                <MapIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-bold text-content-1 group-hover:text-accent">
                  In / Lưu PDF Sơ đồ Bố trí Đèn (Print / Save PDF Light Plot)
                </div>
                <div className="text-xs text-content-3">
                  Sơ đồ giàn đèn từ trên xuống, ký hiệu đánh số và bảng thống kê thiết bị
                </div>
              </div>
            </div>
          </button>

          {/* Cue Sheet CSV */}
          <button
            type="button"
            onClick={handleDownloadCueSheetCsv}
            className="group w-full text-left flex items-center justify-between rounded border border-border-default bg-surface-0 p-3 hover:border-accent hover:bg-surface-2/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-surface-2 text-content-1 group-hover:scale-105 transition-transform border border-border-default">
                <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-bold text-content-1 group-hover:text-accent">
                  Tải Kịch bản Cue Sheet (CSV) / Download Cue Sheet (CSV)
                </div>
                <div className="text-xs text-content-3">
                  Đầy đủ các cột rundown, mã hóa UTF-8 BOM giữ nguyên tiếng Việt
                </div>
              </div>
            </div>
          </button>

          {/* Hardware Inventory CSV */}
          <button
            type="button"
            onClick={handleDownloadHardwareCsv}
            className="group w-full text-left flex items-center justify-between rounded border border-border-default bg-surface-0 p-3 hover:border-accent hover:bg-surface-2/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-surface-2 text-content-1 group-hover:scale-105 transition-transform border border-border-default">
                <PackageCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-bold text-content-1 group-hover:text-accent">
                  Tải Bảng Thiết bị (CSV) / Download Hardware Inventory (CSV)
                </div>
                <div className="text-xs text-content-3">
                  Thống kê công suất cao điểm và tổng số lượng thiết bị show
                </div>
              </div>
            </div>
          </button>

          {/* .lightstage Project File */}
          <button
            type="button"
            onClick={handleDownloadProjectFile}
            className="group w-full text-left flex items-center justify-between rounded border border-border-default bg-surface-0 p-3 hover:border-accent hover:bg-surface-2/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-surface-2 text-content-1 group-hover:scale-105 transition-transform border border-border-default">
                <FileCode className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-bold text-content-1 group-hover:text-accent">
                  Lưu File Dự án (.lightstage) / Save Project (.lightstage)
                </div>
                <div className="text-xs text-content-3">
                  Bản sao lưu cấu trúc JSON đầy đủ dữ liệu show và cài đặt
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-border-default pt-3 mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-surface-2 px-4 py-1.5 text-xs font-semibold text-content-2 hover:bg-surface-3 transition-colors border border-border-default"
          >
            Đóng (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
