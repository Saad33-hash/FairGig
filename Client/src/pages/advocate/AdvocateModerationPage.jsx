import { useEffect, useState } from 'react';
import AdvocateLayout from '../../components/AdvocateLayout';
import { api } from '../../utils/api';
import { notifyError, notifySuccess } from '../../utils/notify';

const PLATFORMS  = ['Careem', 'Bykea', 'Foodpanda', 'Upwork', 'Other'];
const CATEGORIES = [
  { value: 'commission-change', label: 'Commission Change' },
  { value: 'deactivation',      label: 'Deactivation'      },
  { value: 'payment-delay',     label: 'Payment Delay'     },
  { value: 'other',             label: 'Other'             },
];
const STATUSES = ['open', 'escalated', 'resolved'];
const STATUS_STYLES = {
  open:      'bg-amber-50 border-amber-200 text-amber-700',
  escalated: 'bg-blue-50 border-blue-200 text-blue-700',
  resolved:  'bg-green-50 border-green-200 text-green-700',
};

const inputCls   = 'w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition';
const btnPrimary = 'px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors';
const btnGhost   = 'px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors disabled:opacity-60';

function ModerationCard({ g, onUpdated }) {
  const [tagInput, setTagInput]       = useState(g.tags?.join(', ') ?? '');
  const [cluster, setCluster]         = useState(g.clusterGroup ?? '');
  const [status, setStatus]           = useState(g.status);
  const [note, setNote]               = useState(g.advocateNote ?? '');
  const [loading, setLoading]         = useState(false);
  const [expanded, setExpanded]       = useState(false);

  const cat  = CATEGORIES.find((c) => c.value === g.category)?.label ?? g.category;
  const date = new Date(g.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  const save = async (endpoint, payload, successMsg) => {
    setLoading(true);
    try {
      const { data } = await api.put(`/grievances/${g._id}/${endpoint}`, payload);
      notifySuccess(successMsg);
      onUpdated(data.grievance);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Action failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{g.platform}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">{cat}</span>
            {g.workerId?.city && <><span className="text-slate-300">·</span><span className="text-xs text-slate-500">{g.workerId.city}</span></>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{date}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${STATUS_STYLES[g.status]}`}>
          {g.status}
        </span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">{g.description}</p>

      {g.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {g.tags.map((t) => (
            <span key={t} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">{t}</span>
          ))}
        </div>
      )}

      {/* Toggle moderation panel */}
      <button
        className="text-xs font-semibold text-blue-600 hover:text-blue-800 text-left transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? '▲ Hide actions' : '▼ Moderate this complaint'}
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 pt-3 border-t border-slate-100">

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tags (comma-separated)</label>
            <div className="flex gap-2 mt-1">
              <input className={inputCls} value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Karachi, commission-hike, Jan 2025" />
              <button className={btnPrimary} disabled={loading} onClick={() => save('tag', { tags: tagInput.split(',').map((t) => t.trim()).filter(Boolean) }, 'Tags updated')}>
                Save
              </button>
            </div>
          </div>

          {/* Cluster group */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cluster Group</label>
            <div className="flex gap-2 mt-1">
              <input className={inputCls} value={cluster} onChange={(e) => setCluster(e.target.value)} placeholder="e.g. Careem Commission Hike Jan 2025" />
              <button className={btnPrimary} disabled={loading || !cluster.trim()} onClick={() => save('cluster', { clusterGroup: cluster.trim() }, 'Cluster updated')}>
                Save
              </button>
            </div>
          </div>

          {/* Status + note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Update Status</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              <button className={btnPrimary} disabled={loading} onClick={() => save('status', { status, advocateNote: note }, 'Status updated')}>
                Update
              </button>
            </div>
            <textarea
              className={`${inputCls} resize-y mt-2`}
              style={{ minHeight: 72 }}
              placeholder="Add a note for the worker (optional)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdvocateModerationPage() {
  const [grievances, setGrievances]   = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');

  const fetchGrievances = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (filterPlatform) params.platform = filterPlatform;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus)   params.status   = filterStatus;
      const { data } = await api.get('/grievances', { params });
      setGrievances(data.grievances); setTotal(data.total); setPage(p);
    } catch { notifyError('Failed to load grievances'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGrievances(1); }, [filterPlatform, filterCategory, filterStatus]);

  const handleUpdated = (updated) => {
    setGrievances((prev) => prev.map((g) => g._id === updated._id ? updated : g));
  };

  const pages = Math.ceil(total / 15);

  return (
    <AdvocateLayout>
      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grievance Moderation</h1>
          <p className="text-sm text-slate-500 mt-1">{total} complaint{total !== 1 ? 's' : ''} · tag, cluster, and escalate</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          {(filterPlatform || filterCategory || filterStatus) && (
            <button className={btnGhost} onClick={() => { setFilterPlatform(''); setFilterCategory(''); setFilterStatus(''); }}>Clear</button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading grievances…</div>
        ) : grievances.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-slate-900">No complaints found</p>
            <p className="text-sm text-slate-500 mt-1.5">Try clearing the filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grievances.map((g) => (
              <ModerationCard key={g._id} g={g} onUpdated={handleUpdated} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button className={btnGhost} disabled={page === 1} onClick={() => fetchGrievances(page - 1)}>← Prev</button>
            <span className="text-sm text-slate-500">Page {page} of {pages}</span>
            <button className={btnGhost} disabled={page === pages} onClick={() => fetchGrievances(page + 1)}>Next →</button>
          </div>
        )}
      </main>
    </AdvocateLayout>
  );
}
