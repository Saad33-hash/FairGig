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
  {
    value: 'worker',
    label: 'Gig Worker',
    description: 'Log earnings, upload screenshots, get income certificates',
  },
  {
    value: 'verifier',
    label: 'Verifier',
    description: 'Review worker screenshots and flag anomalies',
  },
  {
    value: 'advocate',
    label: 'Advocate / Analyst',
    description: 'Monitor platform trends and manage grievances',
  },
];

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'worker',
  city: '',
  category: '',
};

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => setError('');
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleRoleSelect = (role) => {
    setForm((current) => ({ ...current, role, city: '', category: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/signup', form);
      notifySuccess('Signup successful. Verification email has been sent.');
      navigate('/login?signup=success', { replace: true });
    } catch (signupError) {
      const errorMessage = signupError.response?.data?.message || 'Unable to create account.';
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
        <p className="auth-footnote">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-(--text)">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error ? <div className="auth-error">{error}</div> : null}

        {/* Role selector */}
        <div>
          <label className="field-label">I am a</label>
          <div className="role-cards">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`role-card${form.role === r.value ? ' role-card--active' : ''}`}
                onClick={() => handleRoleSelect(r.value)}
              >
                <span className="role-card-title">{r.label}</span>
                <span className="role-card-desc">{r.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid-two">
          <div>
            <label className="field-label" htmlFor="firstName">First name</label>
            <input
              className="field-input"
              id="firstName"
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Saad"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="lastName">Last name</label>
            <input
              className="field-input"
              id="lastName"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Tariq"
              required
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="email">Email address</label>
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

        {/* City + Category — only for workers */}
        {form.role === 'worker' ? (
          <div className="form-grid-two">
            <div>
              <label className="field-label" htmlFor="city">City</label>
              <select
                className="field-input"
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              >
                <option value="">Select city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="category">Work category</label>
              <select
                className="field-input"
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <div className="form-grid-two">
          <div>
            <label className="field-label" htmlFor="password">Password</label>
            <input
              className="field-input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
            <input
              className="field-input"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat the password"
              required
            />
          </div>
        </div>

        <p className="auth-help">
          You'll receive a verification email before you can log in.
        </p>

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <div className="auth-divider">or continue with</div>

        <div className="auth-actions">
          <button type="button" className="secondary-button" onClick={() => redirectToOAuth('google')}>
            <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M21.35 11.1H12v2.92h5.35c-.23 1.4-.86 2.58-1.86 3.37v2.8h3.01c1.76-1.62 2.8-4.01 2.8-6.84 0-.66-.06-1.29-.15-1.9z" />
              <path fill="currentColor" d="M12 22c2.52 0 4.64-.84 6.18-2.28l-3.01-2.8c-.83.56-1.89.9-3.17.9-2.44 0-4.51-1.65-5.25-3.88H3.6v2.9A9.99 9.99 0 0 0 12 22z" />
              <path fill="currentColor" d="M6.75 14.94A5.98 5.98 0 0 1 6.44 13c0-.67.11-1.33.31-1.94V8.16H3.6A9.99 9.99 0 0 0 2 13c0 1.61.38 3.13 1.03 4.48l3.72-2.54z" />
              <path fill="currentColor" d="M12 5.96c1.37 0 2.6.47 3.57 1.39l2.67-2.67C16.62 3.16 14.5 2.2 12 2.2A9.99 9.99 0 0 0 3.6 8.16l3.76 2.9C7.49 7.61 9.56 5.96 12 5.96z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
