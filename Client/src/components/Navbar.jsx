import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_NAV = {
  worker: [
    { to: '/app/worker/dashboard', label: 'Dashboard' },
    { to: '/app/worker/earnings',  label: 'Earnings'  },
    { to: '/app/worker/certificate', label: 'Certificate' },
    { to: '/app/grievances',       label: 'Grievances' },
  ],
  verifier: [
    { to: '/app/verifier/queue', label: 'Review Queue' },
    { to: '/app/grievances',     label: 'Grievances'   },
  ],
  advocate: [
    { to: '/app/advocate/dashboard',  label: 'Analytics'   },
    { to: '/app/advocate/moderation', label: 'Moderation'  },
    { to: '/app/grievances',          label: 'Grievances'  },
  ],
};

const getDisplayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Account';

const getDiceBearAvatar = (user) => {
  const seed = encodeURIComponent(`${user?.firstName?.trim() || ''}${user?.lastName?.trim() || ''}` || 'User');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
};

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navLinks = ROLE_NAV[user?.role] ?? [];

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const esc   = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  const handleLogout = () => { setOpen(false); logout(); navigate('/login', { replace: true }); };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">

      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-600 shrink-0" />
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900 leading-none">FairGig</p>
          <p className="text-[11px] text-slate-400 leading-none mt-0.5">Income &amp; Rights Platform</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* User chip */}
      <div className="relative" ref={menuRef}>
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-semibold text-slate-900 leading-none">{getDisplayName(user)}</span>
            {user?.role && (
              <span className={`role-badge--${user.role} inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize`}>
                {user.role}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="focus-visible:outline-2 focus-visible:outline-blue-500 rounded-full"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <img
              src={getDiceBearAvatar(user)}
              alt={getDisplayName(user)}
              className="w-8 h-8 rounded-full border-2 border-slate-200"
            />
          </button>
        </div>

        {open && (
          <div className="absolute right-0 top-[calc(100%+8px)] min-w-40 border border-slate-200 rounded-xl bg-white shadow-lg p-1 z-20" role="menu">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              role="menuitem"
            >
              Log out
            </button>
          </div>
        )}
      </div>

    </header>
  );
}
