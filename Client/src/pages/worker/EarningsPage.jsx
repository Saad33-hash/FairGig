import { useEffect, useMemo, useRef, useState } from 'react';
import WorkerLayout from '../../components/WorkerLayout';
import { api } from '../../utils/api';
import { notifyError, notifySuccess } from '../../utils/notify';

const SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const PLATFORMS  = ['Careem', 'Bykea', 'Foodpanda', 'Upwork', 'Other'];
const CATEGORIES = ['ride-hailing', 'food-delivery', 'freelance', 'domestic'];

const STATUS_STYLES = {
  unsubmitted:  { label: 'Unsubmitted',  cls: 'badge-neutral'  },
  pending:      { label: 'Pending',      cls: 'badge-pending'  },
  verified:     { label: 'Verified',     cls: 'badge-verified' },
  flagged:      { label: 'Flagged',      cls: 'badge-flagged'  },
  unverifiable: { label: 'Unverifiable', cls: 'badge-neutral'  },
};

const emptyForm = { platform: '', date: '', hoursWorked: '', grossEarned: '', platformDeductions: '', city: '', category: '' };

const inputCls  = 'w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const labelCls  = 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
const btnPrimary = 'px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors';
const btnGhost   = 'px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors disabled:opacity-60';

function fmt(n) { return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

const ANOMALY_GROUP_STYLES = {
  high: {
    title: 'High',
    glow: 'bg-red-500/45',
    countCls: 'text-red-700',
    chipCls: 'bg-red-50 text-red-700 border-red-200',
  },
  moderate: {
    title: 'Moderate',
    glow: 'bg-amber-500/35',
    countCls: 'text-amber-700',
    chipCls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  other: {
    title: 'Other',
    glow: 'bg-slate-700/45',
    countCls: 'text-slate-900',
    chipCls: 'bg-slate-200 text-slate-900 border-slate-400',
  },
};

/* ── Shift modal ─────────────────────────────────────────────────────────── */
function ShiftModal({ initial, onClose, onSaved }) {
  const [form, setForm]     = useState(initial || emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const isEdit = !!initial?._id;
  const net = (Number(form.grossEarned) || 0) - (Number(form.platformDeductions) || 0);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) { const { data } = await api.put(`/earnings/shifts/${initial._id}`, form); onSaved(data.shift, 'updated'); }
      else        { const { data } = await api.post('/earnings/shifts', form);                onSaved(data.shift, 'created'); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to save shift'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Shift' : 'Log New Shift'}</h2>
          <button className="text-slate-400 hover:text-slate-700 text-xl leading-none transition-colors" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Platform</label>
              <select className={inputCls} name="platform" value={form.platform} onChange={handleChange} required>
                <option value="">Select platform</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input className={inputCls} type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City</label>
              <input className={inputCls} type="text" name="city" value={form.city} onChange={handleChange} placeholder="Lahore" required />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Hours Worked</label>
              <input className={inputCls} type="number" name="hoursWorked" value={form.hoursWorked} onChange={handleChange} placeholder="0" min="0" step="0.5" required />
            </div>
            <div>
              <label className={labelCls}>Gross (PKR)</label>
              <input className={inputCls} type="number" name="grossEarned" value={form.grossEarned} onChange={handleChange} placeholder="0" min="0" required />
            </div>
            <div>
              <label className={labelCls}>Deductions</label>
              <input className={inputCls} type="number" name="platformDeductions" value={form.platformDeductions} onChange={handleChange} placeholder="0" min="0" required />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-sm font-semibold text-slate-600">Net Received</span>
            <span className={`text-lg font-bold ${net < 0 ? 'text-red-600' : 'text-blue-600'}`}>PKR {fmt(net)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 mt-1">
            <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={btnPrimary} disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Screenshot preview modal ────────────────────────────────────────────── */
function ScreenshotModal({ shiftId, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/earnings/shifts/${shiftId}/screenshot`)
      .then((res) => setData(res.data.screenshot))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [shiftId]);

  const st = STATUS_STYLES[data?.status] || STATUS_STYLES.unsubmitted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Screenshot Status</h2>
          <button className="text-slate-400 hover:text-slate-700 text-xl leading-none transition-colors" onClick={onClose}>✕</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : !data ? (
            <p className="text-sm text-slate-400">No screenshot found.</p>
          ) : (
            <>
              <img src={`${SERVER_URL}/uploads/${data.filePath}`} alt="Earnings screenshot" className="w-full rounded-xl border border-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}>{st.label}</span>
              </div>
              {data.verifierNote && (
                <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                  <strong className="text-slate-900">Verifier note:</strong> {data.verifierNote}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function EarningsPage() {
  const [shifts, setShifts]             = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [screenshotShiftId, setScreenshotShiftId] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');
  const [uploadingId, setUploadingId]   = useState(null);
  const [csvLoading, setCsvLoading]     = useState(false);
  const [anomalies, setAnomalies]           = useState([]);
  const [anomalySummary, setAnomalySummary] = useState(null);
  const [aiInsight, setAiInsight]           = useState(null);
  const csvRef          = useRef(null);
  const screenshotRefs  = useRef({});

  const fetchShifts = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (filterPlatform) params.platform = filterPlatform;
      if (filterFrom)     params.from     = filterFrom;
      if (filterTo)       params.to       = filterTo;
      const { data } = await api.get('/earnings/shifts', { params });
      setShifts(data.shifts); setTotal(data.total); setPage(p);
      setAnomalies(data.anomalies ?? []);
      setAnomalySummary(data.anomalySummary ?? null);
      setAiInsight(data.aiInsight ?? null);
    } catch { notifyError('Failed to load shifts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchShifts(1); }, [filterPlatform, filterFrom, filterTo]);

  const handleSaved = (_shift, action) => {
    notifySuccess(`Shift ${action} successfully`);
    setShowModal(false); setEditTarget(null); fetchShifts(page);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = async (id) => {
    try { await api.delete(`/earnings/shifts/${id}`); notifySuccess('Shift deleted'); fetchShifts(page); }
    catch (err) { notifyError(err.response?.data?.message || 'Failed to delete'); }
    finally { setConfirmDeleteId(null); }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setCsvLoading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/earnings/shifts/csv-import', fd);
      notifySuccess(data.message);
      data.failed?.forEach((f) => notifyError(`Row ${f.row}: ${f.reason}`));
      fetchShifts(1);
    } catch (err) { notifyError(err.response?.data?.message || 'CSV import failed'); }
    finally { setCsvLoading(false); e.target.value = ''; }
  };

  const handleScreenshotUpload = async (e, shiftId) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingId(shiftId);
    const fd = new FormData(); fd.append('screenshot', file);
    try {
      await api.post(`/earnings/shifts/${shiftId}/screenshot`, fd);
      notifySuccess('Screenshot uploaded — pending verification'); fetchShifts(page);
    } catch (err) { notifyError(err.response?.data?.message || 'Upload failed'); }
    finally { setUploadingId(null); e.target.value = ''; }
  };

  const pages = Math.ceil(total / 15);
  const pageNet = shifts.reduce((sum, s) => sum + Number(s.netReceived || 0), 0);

  const anomalyGroups = useMemo(() => {
    const groups = { high: [], moderate: [], other: [] };
    anomalies.forEach((a) => {
      if (a.severity === 'high') groups.high.push(a);
      else if (a.severity === 'medium' || a.severity === 'moderate') groups.moderate.push(a);
      else groups.other.push(a);
    });
    return groups;
  }, [anomalies]);

  const statusCount = shifts.reduce((acc, s) => {
    const key = s.verificationStatus || 'unsubmitted';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <WorkerLayout>
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-linear-to-r from-white via-slate-50 to-blue-50/50 px-6 py-5 shadow-sm flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border border-blue-200 bg-white text-blue-700">
              Worker Earnings
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Earnings</h1>
            <p className="text-sm text-slate-500 mt-1">{total} shift{total !== 1 ? 's' : ''} logged</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            <button className={btnGhost} onClick={() => csvRef.current?.click()} disabled={csvLoading}>
              {csvLoading ? 'Importing…' : 'Import CSV'}
            </button>
            <button className={btnPrimary} onClick={() => { setEditTarget(null); setShowModal(true); }}>
              + Add Shift
            </button>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Total shifts</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
            <p className="text-xs text-slate-500 mt-1">All recorded entries</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Current page net</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">PKR {fmt(pageNet)}</p>
            <p className="text-xs text-slate-500 mt-1">For visible shifts ({shifts.length})</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Pending review</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{statusCount.pending || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting verifier action</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Detected anomalies</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{anomalies.length}</p>
            <p className="text-xs text-slate-500 mt-1">Risk signals in recent data</p>
          </div>
        </div>

        {/* AI Insight */}
        {aiInsight && (
          <div className="rounded-2xl border border-blue-200 bg-linear-to-r from-blue-50 via-white to-slate-50 px-5 py-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl border border-blue-200 bg-white text-blue-600 flex items-center justify-center text-base font-bold shrink-0">
                ✦
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1.5">AI Earnings Insight</p>
                <p className="text-sm text-slate-700 leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Anomaly cards */}
        {anomalies.length > 0 && (
          <div className="flex flex-col gap-3">
            {anomalySummary && (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">{anomalySummary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {Object.entries(ANOMALY_GROUP_STYLES).map(([key, style]) => {
                const items = anomalyGroups[key];
                return (
                  <div key={key} className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className={`pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full blur-3xl opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110 ${style.glow}`} />
                    <div className="px-4 py-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">{style.title} anomalies</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${style.chipCls}`}>
                          {items.length}
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-xs text-slate-400">No {style.title.toLowerCase()} anomalies detected.</p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {items.slice(0, 3).map((a, i) => (
                            <div key={`${key}-${i}`} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                              <p className="text-xs font-semibold text-slate-700 capitalize">{a.type.replace(/_/g, ' ')} · {a.shift_date}</p>
                              <p className="text-xs text-slate-500 mt-1">{a.explanation}</p>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <p className={`text-xs font-semibold ${style.countCls}`}>+{items.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <select className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
              <option value="">All platforms</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            <input className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            {(filterPlatform || filterFrom || filterTo) && (
              <button className={btnGhost} onClick={() => { setFilterPlatform(''); setFilterFrom(''); setFilterTo(''); }}>Clear</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Shift entries</p>
            <p className="text-xs text-slate-500">{shifts.length} shown on this page</p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading shifts…</div>
          ) : shifts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-semibold text-slate-900">No shifts yet</p>
              <p className="text-sm text-slate-500 mt-1.5">Click <strong>+ Add Shift</strong> to log your first shift, or import a CSV.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-245 text-sm border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">Platform</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">City</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">Hours</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">Gross (PKR)</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">Deductions</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">Net (PKR)</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => {
                  const st = STATUS_STYLES[s.verificationStatus] || STATUS_STYLES.unsubmitted;
                  const dateStr = new Date(s.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
                  const canUpload    = ['unsubmitted', 'flagged', 'unverifiable'].includes(s.verificationStatus);
                  const hasScreenshot = ['pending', 'verified', 'flagged', 'unverifiable'].includes(s.verificationStatus);

                  return (
                    <tr key={s._id} className="odd:bg-white even:bg-slate-50/35 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700 font-medium">{dateStr}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{s.platform}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{s.city}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{s.hoursWorked}h</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-slate-700">{fmt(s.grossEarned)}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-red-600 font-medium">−{fmt(s.platformDeductions)}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-blue-700 font-bold">{fmt(s.netReceived)}</td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.verificationStatus === 'unsubmitted' && (
                            <button className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors" onClick={() => { setEditTarget(s); setShowModal(true); }}>Edit</button>
                          )}
                          {canUpload && (
                            <>
                              <input ref={(el) => { screenshotRefs.current[s._id] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => handleScreenshotUpload(e, s._id)} />
                              <button className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-60" disabled={uploadingId === s._id} onClick={() => screenshotRefs.current[s._id]?.click()}>
                                {uploadingId === s._id ? '…' : 'Upload'}
                              </button>
                            </>
                          )}
                          {hasScreenshot && (
                            <button className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors" onClick={() => setScreenshotShiftId(s._id)}>View</button>
                          )}
                          {s.verificationStatus !== 'verified' && (
                            <div className="relative">
                              <button
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                onClick={() => setConfirmDeleteId(confirmDeleteId === s._id ? null : s._id)}
                              >
                                Delete
                              </button>
                              {confirmDeleteId === s._id && (
                                <div className="absolute bottom-full right-0 mb-2 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col gap-2">
                                  <p className="text-xs text-slate-700 font-medium">Delete this shift?</p>
                                  <div className="flex gap-1.5">
                                    <button
                                      className="flex-1 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                                      onClick={() => handleDelete(s._id)}
                                    >
                                      Delete
                                    </button>
                                    <button
                                      className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                                      onClick={() => setConfirmDeleteId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button className={btnGhost} disabled={page === 1} onClick={() => fetchShifts(page - 1)}>← Prev</button>
            <span className="text-sm text-slate-500">Page {page} of {pages}</span>
            <button className={btnGhost} disabled={page === pages} onClick={() => fetchShifts(page + 1)}>Next →</button>
          </div>
        )}
      </main>

      {showModal && (
        <ShiftModal
          initial={editTarget ? { ...editTarget, date: new Date(editTarget.date).toISOString().split('T')[0] } : null}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {screenshotShiftId && (
        <ScreenshotModal shiftId={screenshotShiftId} onClose={() => setScreenshotShiftId(null)} />
      )}
    </WorkerLayout>
  );
}
