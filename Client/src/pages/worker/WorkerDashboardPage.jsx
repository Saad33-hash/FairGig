import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';

function fmt(n) { return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: PKR {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function WorkerDashboardPage() {
  const { user }              = useAuth();
  const [summary, setSummary]   = useState(null);
  const [median, setMedian]     = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/worker/summary'),
      api.get('/analytics/worker/city-median'),
    ])
      .then(([s, m]) => { setSummary(s.data); setMedian(m.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Loading dashboard…</div>
      </div>
    );
  }

  const monthly           = summary?.monthly ?? [];
  const platformBreakdown = summary?.platformBreakdown ?? [];
  const totalNet          = summary?.totalNet ?? 0;
  const avgHourlyRate     = summary?.avgHourlyRate ?? 0;
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

  const thisMonth = (() => {
    const key = new Date().toISOString().slice(0, 7);
    return monthly.find((m) => m.month === key)?.net ?? 0;
  })();

  // Format month labels: "2025-01" → "Jan 25"
  const monthlyChart = monthly.map((m) => {
    const [y, mo] = m.month.split('-');
    const label   = new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-PK', { month: 'short', year: '2-digit' });
    return { ...m, label };
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-white px-6 py-6 shadow-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Welcome back, <span className="text-blue-700">{userName}</span>
          </h1>
          <p className="text-base sm:text-lg font-semibold text-slate-700 mt-2">Your earnings overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="This month"
            value={`PKR ${fmt(thisMonth)}`}
            sub="Net received"
          />
          <StatCard
            label="Avg hourly rate"
            value={`PKR ${fmt(avgHourlyRate)}`}
            sub="Across all shifts"
          />
          <StatCard
            label="All-time net"
            value={`PKR ${fmt(totalNet)}`}
            sub={`Across ${summary?.monthly?.length ?? 0} month(s)`}
          />
        </div>

        {/* Monthly earnings chart */}
        {monthlyChart.length > 0 ? (
          <SectionCard title="Monthly Net Earnings (PKR)">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyChart} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="net" name="Net Received" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        ) : (
          <SectionCard title="Monthly Net Earnings">
            <p className="text-sm text-slate-400 py-6 text-center">No shift data yet. Log your first shift to see trends.</p>
          </SectionCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Platform commission chart */}
          <SectionCard title="Avg Commission Rate by Platform (%)">
            {platformBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={platformBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Avg Commission']} />
                  <Bar dataKey="avgCommission" name="Commission %" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No platform data yet.</p>
            )}
          </SectionCard>

          {/* City median comparison */}
          <SectionCard title="City-Wide Median Comparison">
            {median && median.cityMedian > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Your 3-month avg</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">PKR {fmt(median.workerMonthlyAvg)}</p>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{median.city} median</p>
                    <p className="text-xl font-bold text-slate-700 mt-1">PKR {fmt(median.cityMedian)}</p>
                  </div>
                </div>

                {median.percentile !== null && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Your percentile among {median.peerCount} {median.category} workers in {median.city}</span>
                      <span className="font-bold text-slate-800">{median.percentile}th</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${median.percentile}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  Based on last 3 months · {median.category} · {median.city}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">
                Not enough peer data yet. Run the seed script or log more shifts.
              </p>
            )}
          </SectionCard>
        </div>

      </main>
    </div>
  );
}
