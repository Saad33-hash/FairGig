import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import AdvocateLayout from '../../components/AdvocateLayout';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';

function fmt(n) { return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col gap-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div>
        <h2 className="text-sm font-bold tracking-wide text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 px-6 py-5 flex flex-col gap-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
      <div className="h-1.5 w-11 rounded-full bg-blue-200 mb-2 group-hover:bg-blue-500 transition-colors" />
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}{p.unit ?? ''}</p>
      ))}
    </div>
  );
};

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function AdvocateDashboardPage() {
  const { user } = useAuth();
  const [trends,       setTrends]       = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [complaints,   setComplaints]   = useState(null);
  const [flags,        setFlags]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/advocate/commission-trends'),
      api.get('/advocate/income-distribution'),
      api.get('/advocate/top-complaints'),
      api.get('/advocate/vulnerability-flags'),
    ])
      .then(([t, d, c, f]) => {
        setTrends(t.data.trends ?? []);
        setDistribution(d.data.distribution ?? []);
        setComplaints(c.data);
        setFlags(f.data.flags ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdvocateLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-400">Loading analytics…</div>
      </AdvocateLayout>
    );
  }

  // Pivot trends: [{ month, Careem: 24.1, Bykea: 19.3, ... }]
  const trendPivot = (() => {
    const map = {};
    const platforms = new Set();
    for (const t of trends) {
      if (!map[t.month]) map[t.month] = { month: t.month };
      map[t.month][t.platform] = t.avgCommission;
      platforms.add(t.platform);
    }
    return { data: Object.values(map).sort((a, b) => a.month.localeCompare(b.month)), platforms: [...platforms] };
  })();

  const totalComplaints = complaints?.total ?? 0;
  const topCategory     = complaints?.byCategory?.[0];
  const topPlatform     = complaints?.byPlatform?.[0];
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Advocate';

  return (
    <AdvocateLayout>
      <main className="relative overflow-hidden max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute top-20 -right-20 h-64 w-64 rounded-full bg-slate-200/50 blur-3xl" />

        <div className="relative rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 via-white to-slate-50 px-6 py-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-blue-200 bg-white text-xs font-semibold tracking-wide text-blue-700 uppercase">
                Advocate Dashboard
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mt-3">
                Welcome back, <span className="text-blue-700">{userName}</span>
              </h1>
              <p className="text-base sm:text-lg font-semibold text-slate-700 mt-2">Platform trends, income distribution, and worker vulnerability</p>
            </div>

            {user?.role && (
              <div className="self-start px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">Role</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{user.role}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Complaints this week" value={totalComplaints} sub={topCategory ? `Top: ${topCategory.category}` : 'No data yet'} />
          <StatCard label="Vulnerability flags"  value={flags.length}   sub="Workers with >20% income drop" />
          <StatCard label="Top complained platform" value={topPlatform?.platform ?? '—'} sub={topPlatform ? `${topPlatform.count} reports` : 'No complaints yet'} />
        </div>

        {/* Commission trends */}
        <SectionCard title="Commission Rate Trends by Platform (%)" subtitle="Average deduction rate per platform over last 6 months">
          {trendPivot.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendPivot.data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {trendPivot.platforms.map((p, i) => (
                  <Line key={p} type="monotone" dataKey={p} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">No trend data yet. Run the seed script first.</p>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Income distribution by city */}
          <SectionCard title="Net Income by City (PKR)" subtitle="Last 3 months — all workers">
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distribution} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="city" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`PKR ${fmt(v)}`, 'Total Net']} />
                  <Bar dataKey="totalNet" name="Total Net" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">No distribution data yet.</p>
            )}
          </SectionCard>

          {/* Top complaints */}
          <SectionCard title="Top Complaint Categories" subtitle="Last 7 days">
            {complaints?.byCategory?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {complaints.byCategory.map((c, i) => (
                  <div key={c.category} className="group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md">
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-blue-300 group-hover:bg-blue-500 transition-colors" />
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700 capitalize">{c.category.replace('-', ' ')}</span>
                          <span className="text-xs text-slate-500">{c.count}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${Math.round((c.count / (complaints.byCategory[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">No complaints in the last 7 days.</p>
            )}
          </SectionCard>
        </div>

        {/* Vulnerability flags */}
        <SectionCard title="Vulnerability Flags" subtitle="Workers whose income dropped more than 20% month-on-month (anonymised)">
          {flags.length > 0 ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Worker ID</th>
                    <th>City</th>
                    <th>Category</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Drop</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((f, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs text-slate-500">…{f.workerId}</td>
                      <td>{f.city}</td>
                      <td className="capitalize">{f.category}</td>
                      <td>{f.fromMonth}</td>
                      <td>{f.toMonth}</td>
                      <td className="deduction-cell font-bold">−{f.dropPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">No vulnerability flags detected. Run the seed script to generate test data.</p>
          )}
        </SectionCard>

      </main>
    </AdvocateLayout>
  );
}
