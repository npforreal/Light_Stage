import React, { useState } from 'react';
import { parseCsv, autoDetectColumnMapping, convertRowsToActs, ColumnMapping } from '../../services/importer';
import { useShowStore } from '../../store/useShowStore';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Import Rundown / Cue Sheet</h3>
              <p className="text-xs text-slate-400">Support CSV, TSV & auto-hardware counter</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {step === 'input' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40 relative">
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-200">
                  Drop CSV file here or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-1">UTF-8 encoded CSV / TSV formats</p>
              </div>

              <div className="relative">
                <div className="text-xs text-slate-400 font-semibold mb-1">
                  Or paste CSV / TSV text directly:
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`STT,Tiết mục,Thời lượng,Ánh sáng,Màn LED,Âm thanh\n1.0,Opening,00:03:00,4 Beam 350W + 2 Follow,Màn LED cánh x 2,BGM Intro\n1.1,Speech,05:00,Follow,Logo Loop,Mic 1`}
                  rows={6}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                disabled={!rawText.trim()}
                onClick={() => handleProcessCsv(rawText)}
                className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-2.5 text-xs transition-colors shadow"
              >
                Analyze Columns & Preview
              </button>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-lg bg-cyan-950/30 border border-cyan-800/40 p-3 text-cyan-200">
                Headers detected! Verify or adjust column mappings below:
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Title / Tiết mục (Required)</label>
                  <select
                    value={mapping.title}
                    onChange={(e) => setMapping({ ...mapping, title: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                  >
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Cue Number (STT)</label>
                  <select
                    value={mapping.cueNumber || ''}
                    onChange={(e) => setMapping({ ...mapping, cueNumber: e.target.value || undefined })}
                    className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                  >
                    <option value="">-- Auto generate --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Act / Màn</label>
                  <select
                    value={mapping.act || ''}
                    onChange={(e) => setMapping({ ...mapping, act: e.target.value || undefined })}
                    className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                  >
                    <option value="">-- Default Act 1 --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold mb-1 block">Duration / Thời lượng</label>
                  <select
                    value={mapping.duration || ''}
                    onChange={(e) => setMapping({ ...mapping, duration: e.target.value || undefined })}
                    className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                  >
                    <option value="">-- None (Default 1 min) --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-amber-400 font-semibold mb-1 block">Lighting / Ánh sáng (LX)</label>
                  <select
                    value={mapping.lx || ''}
                    onChange={(e) => setMapping({ ...mapping, lx: e.target.value || undefined })}
                    className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                  >
                    <option value="">-- None --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-purple-400 font-semibold mb-1 block">Visual LED / Màn LED (VX)</label>
                  <select
                    value={mapping.vx || ''}
                    onChange={(e) => setMapping({ ...mapping, vx: e.target.value || undefined })}
                    className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-white"
                  >
                    <option value="">-- None --</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {previewResult && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-300">Extraction Summary:</div>
                    <div className="flex gap-4 text-xs font-mono">
                      <span className="text-cyan-400">Total Cues: {previewResult.totalCues}</span>
                      <span className="text-amber-400">Fixtures: {previewResult.totalLighting}</span>
                      <span className="text-purple-400">Screens: {previewResult.totalScreens}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 font-medium">Hành động:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-cyan-500 focus:ring-0"
                      />
                      <span>Thay thế toàn bộ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-cyan-500 focus:ring-0"
                      />
                      <span>Thêm vào cuối (Append)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
          {step === 'mapping' ? (
            <>
              <button
                onClick={() => setStep('input')}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow"
              >
                <Check className="h-4 w-4" />
                <span>Confirm & Import Cues</span>
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
