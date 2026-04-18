import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboardPage() {
  const { logout } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/pending');
      setUsers(data.users);
    } catch {
      setError('Failed to load pending users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/admin/users/${id}/${action}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError(`Failed to ${action} user.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-colors border border-gray-700"
          >
            Sign out
          </button>
        </div>
        <p className="text-gray-400 mb-8">Review and approve pending Verifier / Advocate accounts.</p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : users.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-10 text-center border border-gray-800">
            <p className="text-gray-400">No pending accounts. You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
                <img src={u.avatar} alt="" className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-gray-400 text-sm truncate">{u.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium capitalize">{u.role}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(u.id, 'approve')}
                    className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(u.id, 'reject')}
                    className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400 text-sm font-medium transition-colors border border-gray-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
