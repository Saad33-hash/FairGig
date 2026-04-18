import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { api, API_BASE_URL } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { notifyError, notifySuccess } from '../utils/notify';

const initialState = { email: '', password: '' };

const inputCls = 'w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken, token, user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toastNoticeShown = useRef(false);

  const notice = useMemo(() => {
    if (searchParams.get('verified') === 'success') return { type: 'success', text: 'Your email is verified. You can log in now.' };
    if (searchParams.get('verified') === 'invalid') return { type: 'error', text: 'Verification link is invalid or expired.' };
    if (searchParams.get('signup') === 'success') return { type: 'success', text: 'Check your inbox to verify your account before logging in.' };
    if (searchParams.get('oauth') === 'failed') return { type: 'error', text: 'OAuth sign-in failed. Try again from the provider buttons.' };
    return null;
  }, [searchParams]);

  useEffect(() => { if (token && user) navigate('/app', { replace: true }); }, [navigate, token, user]);

  useEffect(() => {
    if (notice && !toastNoticeShown.current) {
      toastNoticeShown.current = true;
      if (notice.type === 'success') { notifySuccess(notice.text); setMessage(notice.text); }
      else { notifyError(notice.text); setError(notice.text); }
    }
  }, [notice]);

  const handleChange = (e) => { const { name, value } = e.target; setForm((c) => ({ ...c, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      await loginWithToken(data.token);
      notifySuccess('Logged in successfully.');
      navigate('/app', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to log in.';
      setError(msg); notifyError(msg);
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      centered
      centeredBackTo="/"
      centeredBackLabel="Back"
      title="Welcome back"
      subtitle="Sign in with email or a trusted provider. Verified users go straight to the workspace."
      footer={
        <p className="text-sm text-slate-500">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-4 mt-6" onSubmit={handleSubmit}>
        {message && <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800">{message}</div>}
        {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="email">Email address</label>
          <input className={inputCls} id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="name@company.com" required />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="password">Password</label>
            <button type="button" className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">Forgot password?</button>
          </div>
          <input className={inputCls} id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} placeholder="Enter your password" required />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
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
