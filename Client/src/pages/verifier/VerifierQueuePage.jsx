import { useEffect, useState } from 'react';
import VerifierLayout from '../../components/VerifierLayout';
import { api } from '../../utils/api';
import { notifyError, notifySuccess } from '../../utils/notify';

const SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

function fmt(n) { return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

const btnGhost = 'px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors disabled:opacity-60';

function QueueCard({ item, onReviewed }) {
  const { screenshot, worker, shift } = item;
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDecision = async (status) => {
    setLoading(true);
    try {
      await api.post(`/verifier/screenshots/${screenshot._id}/review`, { status, note });
      notifySuccess(`Marked as ${status}`);
      onReviewed(screenshot._id);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Review failed');
    } finally { setLoading(false); }
  };

  const dateStr = shift?.date
    ? new Date(shift.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-200 min-h-64">
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-blue-400/30 blur-3xl opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110" />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900">
                {worker?.firstName} {worker?.lastName}
              </span>
              <span className="text-xs text-slate-500">{worker?.city} · {worker?.category}</span>
            </div>
            <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">Pending Review</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-200 bg-amber-50 text-amber-700">
            Queue
          </span>
        </div>

      {/* Shift summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Platform',     value: shift?.platform },
          { label: 'Date',         value: dateStr },
          { label: 'Hours',        value: `${shift?.hoursWorked}h` },
          { label: 'Gross (PKR)',  value: fmt(shift?.grossEarned),       cls: '' },
          { label: 'Deductions',   value: `−${fmt(shift?.platformDeductions)}`, cls: 'deduction-cell' },
          { label: 'Net (PKR)',    value: fmt(shift?.netReceived),       cls: 'net-cell' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
            <span className={`text-sm font-semibold text-slate-900 ${cls || ''}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Screenshot */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        <img
          src={`${SERVER_URL}/uploads/${screenshot.filePath}`}
          alt="Earnings screenshot"
          className={`queue-screenshot${expanded ? ' queue-screenshot--expanded' : ''} shadow-sm`}
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? 'Click to collapse' : 'Click to expand'}
        />
        <p className="text-xs text-slate-400 text-center mt-1.5">
          {expanded ? 'Click image to collapse' : 'Click image to expand'}
        </p>
      </div>

      {/* Note */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Note (optional)</label>
        <textarea
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
          style={{ minHeight: 84 }}
          placeholder="Describe the discrepancy or reason for your decision…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Decision buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-60 shadow-sm"
          disabled={loading} onClick={() => handleDecision('verified')}
        >Confirm</button>
        <button
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 shadow-sm"
          disabled={loading} onClick={() => handleDecision('flagged')}
        >Flag Discrepancy</button>
        <button
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-60 shadow-sm"
          disabled={loading} onClick={() => handleDecision('unverifiable')}
        >Unverifiable</button>
      </div>
      </div>
    </article>
  );
}

export default function VerifierQueuePage() {
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/verifier/queue', { params: { page: p, limit: 10 } });
      const mapped = data.screenshots.map((s) => ({
        screenshot: { ...s, workerId: s.workerId?._id, shiftId: s.shiftId?._id },
        worker: s.workerId,
        shift:  s.shiftId,
      }));
      setItems(mapped); setTotal(data.total); setPage(p);
    } catch { notifyError('Failed to load queue'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQueue(1); }, []);

  const handleReviewed = (screenshotId) => {
    setItems((prev) => prev.filter((i) => i.screenshot._id !== screenshotId));
    setTotal((t) => t - 1);
  };

  const pages = Math.ceil(total / 10);

  return (
    <VerifierLayout>
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 via-white to-slate-50 px-6 py-5 shadow-sm flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border border-blue-200 bg-white text-blue-700">
              Verifier Queue
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Review Queue</h1>
            <p className="text-sm text-slate-500 mt-1">{total} screenshot{total !== 1 ? 's' : ''} pending review</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading queue…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-slate-900">Queue is empty</p>
            <p className="text-sm text-slate-500 mt-1.5">No screenshots are pending review right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => (
              <QueueCard key={item.screenshot._id} item={item} onReviewed={handleReviewed} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button className={btnGhost} disabled={page === 1} onClick={() => fetchQueue(page - 1)}>← Prev</button>
            <span className="text-sm text-slate-500">Page {page} of {pages}</span>
            <button className={btnGhost} disabled={page === pages} onClick={() => fetchQueue(page + 1)}>Next →</button>
          </div>
        )}
      </main>
    </VerifierLayout>
  );
}
