import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { api, API_BASE_URL } from '../utils/api';
import { notifyError, notifySuccess } from '../utils/notify';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Other'];
const CATEGORIES = [
  { value: 'ride-hailing', label: 'Ride-hailing (Careem, Bykea)' },
  { value: 'food-delivery', label: 'Food delivery (Foodpanda)' },
  { value: 'freelance', label: 'Freelance (Upwork, Fiverr)' },
  { value: 'domestic', label: 'Domestic worker' },
];
const ROLES = [
  { value: 'worker',   label: 'Gig Worker',       description: 'Log earnings, upload screenshots, get income certificates' },
  { value: 'verifier', label: 'Verifier',          description: 'Review worker screenshots and flag anomalies' },
  { value: 'advocate', label: 'Advocate / Analyst', description: 'Monitor platform trends and manage grievances' },
];

const initialState = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'worker', city: '', category: '' };

const inputCls = 'w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => () => setError(''), []);

  const handleChange = (e) => { const { name, value } = e.target; setForm((c) => ({ ...c, [name]: value })); };
  const handleRoleSelect = (role) => setForm((c) => ({ ...c, role, city: '', category: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/signup', form);
      notifySuccess('Signup successful. Verification email has been sent.');
      navigate('/login?signup=success', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to create account.';
      setError(msg); notifyError(msg);
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      title="Join FairGig"
      subtitle="Choose your role, verify your email, and start building a fairer record of your work."
      sideTitle="Income transparency for gig workers"
      sideCopy="FairGig lets workers log and verify earnings across platforms, so they can prove income to landlords and banks — and spot when platforms aren't playing fair."
      points={[
        { title: 'Verified earnings', copy: 'Upload screenshots — a verifier confirms your records.' },
        { title: 'Income certificate', copy: 'Generate a printable income summary for any date range.' },
        { title: 'Community board', copy: 'Post grievances and see patterns other workers spotted.' },
      ]}
      footer={
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-5 mt-8" onSubmit={handleSubmit}>
        {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}

        {/* Role selector */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">I am a</p>
          <div className="flex flex-col gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleRoleSelect(r.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  form.role === r.value
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className={`block font-semibold ${form.role === r.value ? 'text-blue-700' : 'text-slate-900'}`}>{r.label}</span>
                <span className="block text-xs text-slate-500 mt-0.5">{r.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="firstName">First name</label>
            <input className={inputCls} id="firstName" name="firstName" type="text" value={form.firstName} onChange={handleChange} placeholder="Saad" required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="lastName">Last name</label>
            <input className={inputCls} id="lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} placeholder="Tariq" required />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="email">Email address</label>
          <input className={inputCls} id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="name@company.com" required />
        </div>

        {form.role === 'worker' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="city">City</label>
              <select className={inputCls} id="city" name="city" value={form.city} onChange={handleChange} required>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="category">Work category</label>
              <select className={inputCls} id="category" name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="password">Password</label>
            <input className={inputCls} id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="confirmPassword">Confirm password</label>
            <input className={inputCls} id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat the password" required />
          </div>
        </div>

        <p className="text-xs text-slate-400 -mt-1">You'll receive a verification email before you can log in.</p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          or continue with
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={() => { window.location.href = `${API_BASE_URL}/auth/google`; }}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M21.35 11.1H12v2.92h5.35c-.23 1.4-.86 2.58-1.86 3.37v2.8h3.01c1.76-1.62 2.8-4.01 2.8-6.84 0-.66-.06-1.29-.15-1.9z" />
            <path fill="currentColor" d="M12 22c2.52 0 4.64-.84 6.18-2.28l-3.01-2.8c-.83.56-1.89.9-3.17.9-2.44 0-4.51-1.65-5.25-3.88H3.6v2.9A9.99 9.99 0 0 0 12 22z" />
            <path fill="currentColor" d="M6.75 14.94A5.98 5.98 0 0 1 6.44 13c0-.67.11-1.33.31-1.94V8.16H3.6A9.99 9.99 0 0 0 2 13c0 1.61.38 3.13 1.03 4.48l3.72-2.54z" />
            <path fill="currentColor" d="M12 5.96c1.37 0 2.6.47 3.57 1.39l2.67-2.67C16.62 3.16 14.5 2.2 12 2.2A9.99 9.99 0 0 0 3.6 8.16l3.76 2.9C7.49 7.61 9.56 5.96 12 5.96z" />
          </svg>
          Continue with Google
        </button>
      </form>
    </AuthLayout>
  );
}
