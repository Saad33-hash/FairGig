import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { api, API_BASE_URL } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { notifyError, notifySuccess } from '../utils/notify';

const initialState = {
  email: '',
  password: '',
};

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
    if (searchParams.get('verified') === 'success') {
      return { type: 'success', text: 'Your email is verified. You can log in now.' };
    }

    if (searchParams.get('verified') === 'invalid') {
      return { type: 'error', text: 'Verification link is invalid or expired.' };
    }

    if (searchParams.get('signup') === 'success') {
      return { type: 'success', text: 'Check your inbox to verify your account before logging in.' };
    }

    if (searchParams.get('oauth') === 'failed') {
      return { type: 'error', text: 'OAuth sign-in failed. Try again from the provider buttons.' };
    }

    return null;
  }, [searchParams]);

  useEffect(() => {
    if (token && user) {
      navigate('/app', { replace: true });
    }
  }, [navigate, token, user]);

  useEffect(() => {
    if (notice && !toastNoticeShown.current) {
      toastNoticeShown.current = true;
      if (notice.type === 'success') {
        notifySuccess(notice.text);
        setMessage(notice.text);
      } else {
        notifyError(notice.text);
        setError(notice.text);
      }
    }
  }, [notice]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);
      await loginWithToken(data.token);
      notifySuccess('Logged in successfully.');
      navigate('/app', { replace: true });
    } catch (loginError) {
      const errorMessage = loginError.response?.data?.message || 'Unable to log in.';
      setError(errorMessage);
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const redirectToOAuth = (provider) => {
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with email or a trusted provider. Verified users go straight to the workspace."
      sideTitle="A quiet, professional sign in surface"
      sideCopy="Minimal layout, precise spacing, and strong visual hierarchy keep the experience focused on access and account state."
      points={[
        { title: 'Verified accounts', copy: 'Email verification is required before password login.' },
        { title: 'OAuth ready', copy: 'Use Google for a faster sign in path.' },
        { title: 'Consistent theme', copy: 'One root palette drives the entire interface.' },
      ]}
      footer={
        <p className="auth-footnote">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-(--text)">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {message ? <div className="auth-success">{message}</div> : null}
        {error ? <div className="auth-error">{error}</div> : null}

        <div>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            className="field-input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@company.com"
            required
          />
        </div>

        <div>
          <div className="auth-row">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <button type="button" className="text-sm font-semibold text-(--muted)">
              Forgot password?
            </button>
          </div>
          <input
            className="field-input"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="auth-divider">or continue with</div>

        <div className="auth-actions">
          <button type="button" className="secondary-button" onClick={() => redirectToOAuth('google')}>
            <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1H12v2.92h5.35c-.23 1.4-.86 2.58-1.86 3.37v2.8h3.01c1.76-1.62 2.8-4.01 2.8-6.84 0-.66-.06-1.29-.15-1.9z"
              />
              <path
                fill="currentColor"
                d="M12 22c2.52 0 4.64-.84 6.18-2.28l-3.01-2.8c-.83.56-1.89.9-3.17.9-2.44 0-4.51-1.65-5.25-3.88H3.6v2.9A9.99 9.99 0 0 0 12 22z"
              />
              <path
                fill="currentColor"
                d="M6.75 14.94A5.98 5.98 0 0 1 6.44 13c0-.67.11-1.33.31-1.94V8.16H3.6A9.99 9.99 0 0 0 2 13c0 1.61.38 3.13 1.03 4.48l3.72-2.54z"
              />
              <path
                fill="currentColor"
                d="M12 5.96c1.37 0 2.6.47 3.57 1.39l2.67-2.67C16.62 3.16 14.5 2.2 12 2.2A9.99 9.99 0 0 0 3.6 8.16l3.76 2.9C7.49 7.61 9.56 5.96 12 5.96z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}