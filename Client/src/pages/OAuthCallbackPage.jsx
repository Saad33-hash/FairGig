import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notifyError, notifySuccess } from '../utils/notify';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;

    const token = searchParams.get('token');

    if (!token) {
      const errorMessage = 'Authentication token was not returned by the provider.';
      setError(errorMessage);
      notifyError(errorMessage);
      return;
    }

    loginWithToken(token)
      .then(() => {
        notifySuccess('Logged in successfully with OAuth.');
        navigate('/app', { replace: true });
      })
      .catch(() => {
        const errorMessage = 'Unable to finish sign in.';
        setError(errorMessage);
        notifyError(errorMessage);
      });
  }, [loginWithToken, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center bg-slate-100">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm text-sm text-slate-500">
        {error
          ? <span className="text-red-600 font-medium">{error}</span>
          : 'Completing your sign in…'}
      </div>
    </div>
  );
}