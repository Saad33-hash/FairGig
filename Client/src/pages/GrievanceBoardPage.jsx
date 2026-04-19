import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import WorkerLayout from '../components/WorkerLayout';
import AdvocateLayout from '../components/AdvocateLayout';
import VerifierLayout from '../components/VerifierLayout';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { notifyError, notifySuccess } from '../utils/notify';

const PLATFORMS  = ['Careem', 'Bykea', 'Foodpanda', 'Upwork', 'Other'];
const CATEGORIES = [
  { value: 'commission-change', label: 'Commission Change' },
  { value: 'deactivation',      label: 'Deactivation'      },
  { value: 'payment-delay',     label: 'Payment Delay'     },
  { value: 'other',             label: 'Other'             },
];
const STATUSES = ['open', 'escalated', 'resolved'];

const STATUS_THEME = {
  open: {
    cardBorder: 'border-amber-200/80 bg-amber-50/35',
    chip: 'bg-amber-50 border-amber-200 text-amber-700',
    glow: 'from-amber-300/45 via-amber-100/20 to-transparent',
  },
  escalated: {
    cardBorder: 'border-blue-200/80 bg-blue-50/35',
    chip: 'bg-blue-50 border-blue-200 text-blue-700',
    glow: 'from-blue-300/45 via-blue-100/20 to-transparent',
  },
  closed: {
    cardBorder: 'border-slate-300/90 bg-slate-50/70',
    chip: 'bg-slate-200 border-slate-300 text-slate-800',
    glow: 'from-slate-400/45 via-slate-200/20 to-transparent',
  },
  other: {
    cardBorder: 'border-slate-200 bg-slate-50/30',
    chip: 'bg-slate-100 border-slate-200 text-slate-700',
    glow: 'from-slate-300/35 via-slate-100/15 to-transparent',
  },
};

const inputCls = 'w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const btnPrimary = 'px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors';
const btnGhost   = 'px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors disabled:opacity-60';

function PostModal({ onClose, onPosted }) {
  const [form, setForm]     = useState({ platform: '', category: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/grievances', form);
      notifySuccess('Complaint posted successfully');
      onPosted(data.grievance);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post complaint');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Post a Complaint</h2>
          <button className="text-slate-400 hover:text-slate-700 text-xl leading-none" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Platform</label>
              <select className={inputCls} value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} required>
                <option value="">Select platform</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <select className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
            <textarea
              className={`${inputCls} resize-y`}
              style={{ minHeight: 100 }}
              placeholder="Describe what happened in detail..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 mt-1">
            <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={btnPrimary} disabled={loading}>
              {loading ? 'Posting…' : 'Post Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GrievanceCard({ g }) {
  const cat    = CATEGORIES.find((c) => c.value === g.category)?.label ?? g.category;
  const worker = g.workerId;
  const date   = new Date(g.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const normalizedStatus = g.status === 'resolved' ? 'closed' : (g.status || 'other');
  const theme = STATUS_THEME[normalizedStatus] || STATUS_THEME.other;

  return (
    <article className={`group relative overflow-hidden rounded-2xl border p-6 min-h-70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${theme.cardBorder}`}>
      <div className={`pointer-events-none absolute inset-0 bg-linear-to-tr ${theme.glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-900">
                {g.platform}
              </span>
              <span className="text-xs text-slate-500">{cat}</span>
              {worker?.city && <span className="text-xs text-slate-500">{worker.city}</span>}
            </div>
            <p className="text-xs text-slate-400">Filed on {date}</p>
          </div>

          <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border uppercase tracking-wide ${theme.chip}`}>
            {normalizedStatus}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-3">
          <p className="text-sm text-slate-700 leading-relaxed">{g.description}</p>
        </div>

        {g.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {g.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">{tag}</span>
            ))}
          </div>
        )}

        {(g.clusterGroup || g.advocateNote) && (
          <div className="grid grid-cols-1 gap-2">
            {g.clusterGroup && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-xs font-semibold text-blue-700">Cluster: {g.clusterGroup}</p>
              </div>
            )}

            {g.advocateNote && (
              <div className="px-3 py-2 rounded-lg bg-slate-100/90 border border-slate-200 text-xs text-slate-600">
                <strong className="text-slate-800">Advocate note:</strong> {g.advocateNote}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function GrievanceBoardPage() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
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

  const handlePosted = (g) => {
    setShowModal(false);
    setGrievances((prev) => [g, ...prev]);
    setTotal((t) => t + 1);
  };

  const pages = Math.ceil(total / 15);

  const boardContent = (
    <>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grievance Board</h1>
            <p className="text-sm text-slate-500 mt-1">{total} complaint{total !== 1 ? 's' : ''} reported</p>
          </div>
          {user?.role === 'worker' && (
            <button className={btnPrimary} onClick={() => setShowModal(true)}>+ Post Complaint</button>
          )}
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

        {/* List */}
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading grievances…</div>
        ) : grievances.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-slate-900">No complaints yet</p>
            <p className="text-sm text-slate-500 mt-1.5">Be the first to report a platform issue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {grievances.map((g) => <GrievanceCard key={g._id} g={g} />)}
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

      {showModal && <PostModal onClose={() => setShowModal(false)} onPosted={handlePosted} />}
    </>
  );

  if (user?.role === 'worker') {
    return <WorkerLayout>{boardContent}</WorkerLayout>;
  }

  if (user?.role === 'advocate') {
    return <AdvocateLayout>{boardContent}</AdvocateLayout>;
  }

  if (user?.role === 'verifier') {
    return <VerifierLayout>{boardContent}</VerifierLayout>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      {boardContent}
    </div>
  );
}
