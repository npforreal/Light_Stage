import React, { useState } from 'react';
import { parseCsv, autoDetectColumnMapping, convertRowsToActs, ColumnMapping } from '../../services/importer';
import { useShowStore } from '../../store/useShowStore';
import { Upload, FileSpreadsheet, X, Check, Download, Sparkles } from 'lucide-react';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SAMPLE_CSV_CONTENT = `STT,Tiết mục,Thời lượng,Ánh sáng,Màn LED,Âm thanh,Hoạt cảnh sân khấu
1.0,Pre-Show / Đón Khách,05:00,12 Wash 3200K + 4 Spot @FOH,Event Logo Loop (1 screen),BGM Lounge Playlist,Mở cửa đón khách vào khán phòng
1.1,Opening Video & Countdown,02:00,16 Beam 350W Strobing + Full Blue,Intro Motion Video (3 screens),Intro Stinger & Countdown 10s,Tắt đèn khán phòng
1.2,Tiết mục Trống Hội Khai Mạc,04:30,24 ParLED Red/Gold + 8 Beam,Visual Lửa Đỏ Cuộn Trào (Main LED),Trống hội live + BGM Hào Hùng,12 vũ công trống hội xuất hiện
1.3,MC Chào Mừng & Giới Thiệu,03:00,Warm Tungsten 3200K + 2 Follow Spot,Key Visual Gala Night (Main Screen),BGM Nhẹ Dưới Lời MC,MC bước ra vị trí Center
1.4,Phát biểu Khai mạc,05:00,Studio Halogen 5600K Key Light,Slide Trình Chiếu Khách Mời,Mic Chủ Tịch 1,Chủ tịch bước lên bục phát biểu
2.0,Văn Nghệ Chào Mừng,04:00,Chùm Beam Hồng/Tím + Haze 40%,Visual Hạt Bụi Vàng Lung Linh,Ca sĩ đơn ca + Mic 2,Ca sĩ bước ra từ cánh gà trái
2.1,Lễ Vinh Danh & Trao Giải,06:00,Spotlight Trao Giải + Pháo Kim Tuyến,Banner Vinh Danh 10 Tập Thể Xuất Sắc,Nhạc Trao Giải Chiến Thắng,Đại diện các đơn vị lên sân khấu`;

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const loadShow = useShowStore((s) => s.loadShow);
  const appendActs = useShowStore((s) => s.appendActs);
  const currentShow = useShowStore((s) => s.show);
  const isDirty = useShowStore((s) => s.isDirty);

  const [rawText, setRawText] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ title: '' });
  const [step, setStep] = useState<'input' | 'mapping' | 'preview'>('input');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  if (!isOpen) return null;

  const handleProcessCsv = (text: string) => {
    const table = parseCsv(text);
    if (table.length < 2) return;

    const headers = table[0];
    const dataRows = table.slice(1).map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h] = row[i] || '';
      });
      return record;
    });

    const detected = autoDetectColumnMapping(headers);
    setParsedHeaders(headers);
    setParsedRows(dataRows);
    setMapping(detected);
    setStep('mapping');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        handleProcessCsv(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LightStage_Sample_Rundown.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          setRawText(text);
          handleProcessCsv(text);
          return;
        }
      }
    } catch {
      // Fallback if clipboard permission denied
    }
    // If clipboard read failed or empty, focus textarea
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.focus();
  };

  const handleLoadDemoShow = () => {
    setRawText(SAMPLE_CSV_CONTENT);
    handleProcessCsv(SAMPLE_CSV_CONTENT);
  };

  const handleConfirmImport = () => {
    const result = convertRowsToActs(parsedRows, mapping, 'Act 1');
    if (result.acts.length === 0) return;

    if (importMode === 'replace') {
      if (isDirty && typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(
          'Dự án hiện tại có thay đổi chưa lưu. Bạn có chắc chắn muốn thay thế toàn bộ show bằng dữ liệu import?'
        );
        if (!confirmed) return;
      }
      loadShow({
        ...currentShow,
        acts: result.acts,
        metadata: {
          ...currentShow.metadata,
          updatedAt: new Date().toISOString(),
        },
      });
    } else {
      appendActs(result.acts);
    }

    onClose();
    setStep('input');
    setRawText('');
  };

  const previewResult = step === 'mapping' ? convertRowsToActs(parsedRows, mapping) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-2xl rounded-xl border border-border-default bg-surface-1 p-6 shadow-2xl text-content-1 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-default pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 id="import-modal-title" className="font-bold text-content-1 text-base">
                Import Rundown / Cue Sheet
              </h3>
              <p className="text-xs text-content-3">CSV / TSV / TXT, hoặc dán bảng từ Excel / Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bảng import"
            className="rounded p-1 text-content-3 hover:text-content-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {step === 'input' && (
            <div className="space-y-4">
              {/* Grouped Grid (FreeShow Inspiration) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Card 1: Files */}
                <div className="border border-border-default hover:border-accent rounded-xl p-4 bg-surface-0 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-content-3">
                        Tệp Dữ Liệu (File)
                      </span>
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-mono text-accent">
                        .CSV / .TSV / .TXT
                      </span>
                    </div>
                    <div className="flex items-center gap-3 my-2">
                      <Upload className="h-6 w-6 text-accent flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-content-1">Kéo thả tệp hoặc bấm chọn</p>
                        <p className="text-[10px] text-content-3">Định dạng UTF-8 phân tách bằng dấu phẩy hoặc tab. Chưa đọc trực tiếp .xlsx — hãy lưu sang CSV/TSV.</p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {/* Card 2: Clipboard (FreeShow Feature) */}
                <div className="border border-border-default hover:border-accent rounded-xl p-4 bg-surface-0 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-content-3">
                      Bảng Tạm (Clipboard)
                    </span>
                    <span className="rounded bg-status-go/20 text-status-go px-1.5 py-0.5 text-[9px] font-mono">
                      Excel / Google Sheets
                    </span>
                  </div>
                  <p className="text-[10px] text-content-3 mb-2">
                    Copy các cột bảng từ Excel hoặc Sheets rồi bấm nút bên dưới để nạp tức thì:
                  </p>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-bold text-xs border border-accent/40 transition-colors"
                    title="Đọc dữ liệu bảng từ clipboard (Dán từ clipboard)"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Dán từ clipboard (Paste from Clipboard)</span>
                  </button>
                </div>
              </div>

              {/* Sample Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-0 border border-border-default text-xs">
                <span className="text-content-3 font-medium text-[11px]">Bạn chưa có sẵn file kịch bản?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-content-2 hover:text-content-1 border border-border-default transition-colors text-xs"
                    title="Tải file mẫu CSV chuẩn UTF-8"
                  >
                    <Download className="h-3.5 w-3.5 text-accent" />
                    <span>Tải file CSV mẫu (Download Sample)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemoShow}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/20 hover:bg-accent/30 text-accent font-semibold border border-accent/40 transition-colors text-xs"
                    title="Nạp ngay show mẫu hoàn chỉnh"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Nạp Show Mẫu (Load Demo Show)</span>
                  </button>
                </div>
              </div>

              {/* Text Area Manual Paste */}
              <div className="relative">
                <div className="text-[11px] text-content-3 font-semibold mb-1">
                  Hoặc dán trực tiếp chuỗi CSV / TSV vào đây:
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`STT,Tiết mục,Thời lượng,Ánh sáng,Màn LED,Âm thanh\n1.0,Opening,00:03:00,4 Beam 350W + 2 Follow,Màn LED cánh x 2,BGM Intro\n1.1,Speech,05:00,Follow,Logo Loop,Mic 1`}
                  rows={4}
                  className="w-full rounded-lg border border-border-default bg-surface-0 p-3 font-mono text-xs text-content-1 focus:border-accent focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={() => handleProcessCsv(rawText)}
                className="w-full rounded-lg bg-surface-3 hover:bg-surface-2 disabled:opacity-50 text-content-1 font-semibold py-2.5 text-xs transition-colors shadow border border-border-default"
              >
                Phân tích Cột & Xem trước (Analyze Columns)
              </button>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-lg bg-surface-2 border border-border-default p-3 text-content-2">
                Headers detected! Verify or adjust column mappings below:
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-content-3 font-semibold mb-1 block">Title / Tiết mục (Required)</label>
                  <select
                    value={mapping.title}
                    onChange={(e) => setMapping({ ...mapping, title: e.target.value })}
                    className="w-full rounded border border-border-default bg-surface-0 p-2 text-content-1"
                  >
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-content-3 font-semibold mb-1 block">Cue Number / STT</label>
                  <select
                    value={mapping.cueNumber || ''}
                    onChange={(e) => setMapping({ ...mapping, cueNumber: e.target.value || undefined })}
                    className="w-full rounded border border-border-default bg-surface-0 p-2 text-content-1"
                  >
                    <option value="">(None - Auto generate)</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-content-3 font-semibold mb-1 block">Duration / Thời lượng</label>
                  <select
                    value={mapping.duration || ''}
                    onChange={(e) => setMapping({ ...mapping, duration: e.target.value || undefined })}
                    className="w-full rounded border border-border-default bg-surface-0 p-2 text-content-1"
                  >
                    <option value="">(None - Default 1 min)</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-content-3 font-semibold mb-1 block">Lighting / Ánh sáng (LX)</label>
                  <select
                    value={mapping.lx || ''}
                    onChange={(e) => setMapping({ ...mapping, lx: e.target.value || undefined })}
                    className="w-full rounded border border-border-default bg-surface-0 p-2 text-content-1"
                  >
                    <option value="">(None)</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-content-3 font-semibold mb-1 block">Visual LED / Màn hình (VX)</label>
                  <select
                    value={mapping.vx || ''}
                    onChange={(e) => setMapping({ ...mapping, vx: e.target.value || undefined })}
                    className="w-full rounded border border-border-default bg-surface-0 p-2 text-content-1"
                  >
                    <option value="">(None)</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-content-3 font-semibold mb-1 block">Sound / Âm thanh (SQ)</label>
                  <select
                    value={mapping.sq || ''}
                    onChange={(e) => setMapping({ ...mapping, sq: e.target.value || undefined })}
                    className="w-full rounded border border-border-default bg-surface-0 p-2 text-content-1"
                  >
                    <option value="">(None)</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-content-3 font-semibold mb-1 block">Stage Action / Hoạt cảnh (ST)</label>
                  <select
                    value={mapping.stage || ''}
                    onChange={(e) => setMapping({ ...mapping, stage: e.target.value || undefined })}
                    className="w-full rounded border border-border-default bg-surface-0 p-2 text-content-1"
                  >
                    <option value="">(None)</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-content-3 font-semibold mb-1 block">Import Mode</label>
                  <div className="flex gap-2 mt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-accent"
                      />
                      <span>Thay thế toàn bộ (Replace Show)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-accent"
                      />
                      <span>Nối tiếp (Append Acts)</span>
                    </label>
                  </div>
                </div>
              </div>

              {previewResult && (
                <div className="border border-border-default rounded-lg p-3 bg-surface-0 mt-3">
                  <div className="font-semibold text-content-1 mb-2">
                    Preview: {previewResult.acts.reduce((acc, a) => acc + a.cues.length, 0)} cues detected across {previewResult.acts.length} acts
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {previewResult.acts.flatMap((a) => a.cues).slice(0, 5).map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] py-1 border-b border-border-subtle/40">
                        <span className="font-mono text-accent">{c.cueNumber}</span>
                        <span className="font-medium text-content-1 truncate max-w-[200px]">{c.title}</span>
                        <span className="text-dept-lx">{c.totalLightingFixtures} fixtures</span>
                        <span className="text-dept-vx">{c.totalScreens} screens</span>
                      </div>
                    ))}
                    {previewResult.acts.flatMap((a) => a.cues).length > 5 && (
                      <div className="text-[10px] text-content-3 text-center pt-1">
                        ... và {previewResult.acts.flatMap((a) => a.cues).length - 5} cues khác
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border-default pt-3 mt-4 flex items-center justify-between">
          {step === 'mapping' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-content-2 hover:bg-surface-3 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent hover:bg-accent/90 text-surface-0 px-4 py-1.5 text-xs font-bold shadow transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>Confirm & Import Cues</span>
              </button>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-surface-2 px-4 py-1.5 text-xs font-semibold text-content-2 hover:bg-surface-3 transition-colors border border-border-default"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
