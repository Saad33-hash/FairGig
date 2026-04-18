import { useAuth } from '../hooks/useAuth';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();

  const isPending  = user?.status === 'pending';
  const isRejected = user?.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center shadow-xl border border-gray-800">
        {isPending && (
          <>
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Account Under Review</h1>
            <p className="text-gray-400 leading-relaxed">
              Your account is pending approval. An admin will review your registration shortly. You'll be able to log in once approved.
            </p>
          </>
        )}

        {isRejected && (
          <>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Account Not Approved</h1>
            <p className="text-gray-400 leading-relaxed">
              Your account was not approved. Please contact support if you believe this is a mistake.
            </p>
          </>
        )}

        <button
          onClick={logout}
          className="mt-8 w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
