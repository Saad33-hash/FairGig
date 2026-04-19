import { useEffect, useState } from 'react';
import WorkerLayout from '../../components/WorkerLayout';
import { useAuth } from '../../hooks/useAuth';
import { notifyError } from '../../utils/notify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const inputCls   = 'w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const btnPrimary = 'px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors';
const btnGhost   = 'px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors disabled:opacity-60';

export default function CertificatePage() {
  const { token } = useAuth();
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const buildUrl = () => `${API_BASE}/certificate?from=${from}&to=${to}`;

  const handlePreview = async () => {
    if (!from || !to) { notifyError('Select both a start and end date'); return; }
    if (from > to)    { notifyError('Start date must be before end date'); return; }

    setLoading(true);
    try {
      const res = await fetch(buildUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        notifyError(json.message || 'Failed to generate certificate');
        return;
      }
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch {
      notifyError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!previewUrl) return;
    const win = window.open(previewUrl, '_blank');
    win?.addEventListener('load', () => win.print());
  };

  const handleOpenTab = () => {
    if (previewUrl) window.open(previewUrl, '_blank');
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `income-certificate-${from}-to-${to}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClosePreview = () => setPreviewOpen(false);

  return (
    <WorkerLayout>
      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Income Certificate</h1>
          <p className="text-sm text-slate-500 mt-1">Generate a printable verified income summary for any date range.</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5">
          <p className="text-sm font-semibold text-slate-700">Select date range</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
              <input className={inputCls} type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreviewOpen(false); }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
              <input className={inputCls} type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreviewOpen(false); }} />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button className={btnPrimary} onClick={handlePreview} disabled={loading || !from || !to}>
              {loading ? 'Generating…' : 'Generate Certificate'}
            </button>
          </div>

          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-blue-500 mt-0.5 shrink-0">ℹ</span>
            <p className="text-xs text-blue-700 leading-relaxed">
              Only <strong>verifier-confirmed shifts</strong> appear in the certificate. Unsubmitted, pending, or flagged shifts are excluded.
            </p>
          </div>
        </div>

        {previewOpen && previewUrl && (
          <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClosePreview}>
            <div className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Income Certificate Preview</p>
                  <p className="text-xs text-slate-500 mt-0.5">{from} to {to}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button className={btnGhost} onClick={handlePrint}>Print</button>
                  <button className={btnGhost} onClick={handleOpenTab}>Open in new tab</button>
                  <button className={btnGhost} onClick={handleDownload}>Download</button>
                  <button className={btnPrimary} onClick={handleClosePreview}>Close</button>
                </div>
              </div>

              <iframe
                src={previewUrl}
                title="Income Certificate Preview"
                className="w-full flex-1 border-0 bg-white"
              />
            </div>
          </div>
        )}

      </main>
    </WorkerLayout>
  );
}