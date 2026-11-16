import React, { useState } from 'react';
import { useShowStore } from '../../store/useShowStore';
import {
  generateCueSheetCsv,
  generateHardwareInventoryCsv,
  generatePrintableCueSheetHtml,
} from '../../services/exporter';
import { exportToLightStageBlob } from '../../services/persistence';
import {
  Download,
  Printer,
  FileSpreadsheet,
  PackageCheck,
  X,
  FileCode,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const show = useShowStore((s) => s.show);
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

  const handlePrintPdf = () => {
    const html = generatePrintableCueSheetHtml(show, selectedRole);
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
    const blob = exportToLightStageBlob(show);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${show.metadata.title.replace(/\s+/g, '_')}.lightstage`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Export & Print Reports</h3>
              <p className="text-xs text-slate-400">PDF Cue Sheets, Excel/CSV, .lightstage project</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Selector for Cue Sheets */}
        <div className="mb-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Target Role / Department Filter:</label>
          <div className="inline-flex w-full rounded-lg bg-slate-950 p-1 text-xs">
            {(['ALL', 'LX', 'VX', 'SQ'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`flex-1 rounded py-1.5 font-medium transition-colors ${
                  selectedRole === r
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'ALL' ? 'Master (All)' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Export Options Grid */}
        <div className="space-y-2.5">
          {/* Printable PDF */}
          <div
            onClick={handlePrintPdf}
            className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:border-cyan-500/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                  Print / Save PDF Cue Sheet
                </div>
                <div className="text-[11px] text-slate-400">
                  A4 Landscape formatted for stage crew with department filters
                </div>
              </div>
            </div>
          </div>

          {/* Cue Sheet CSV */}
          <div
            onClick={handleDownloadCueSheetCsv}
            className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:border-emerald-500/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                  Download Cue Sheet (Excel / CSV)
                </div>
                <div className="text-[11px] text-slate-400">
                  Full rundown columns encoded with UTF-8 BOM for Microsoft Excel
                </div>
              </div>
            </div>
          </div>

          {/* Hardware Inventory CSV */}
          <div
            onClick={handleDownloadHardwareCsv}
            className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:border-amber-500/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                  Download Hardware Inventory (Excel / CSV)
                </div>
                <div className="text-[11px] text-slate-400">
                  Equipment peak concurrent usage & total show fixture breakdown
                </div>
              </div>
            </div>
          </div>

          {/* .lightstage Project File */}
          <div
            onClick={handleDownloadProjectFile}
            className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:border-cyan-500/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                  Save Project (.lightstage)
                </div>
                <div className="text-[11px] text-slate-400">
                  Native JSON schema backup with full show data & settings
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
