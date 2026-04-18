import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_NAV = {
  worker: [
    { to: '/app/worker/dashboard', label: 'Dashboard' },
    { to: '/app/worker/earnings', label: 'Earnings' },
    { to: '/app/worker/certificate', label: 'Certificate' },
    { to: '/app/grievances', label: 'Grievance Board' },
  ],
  verifier: [
    { to: '/app/verifier/queue', label: 'Review Queue' },
    { to: '/app/grievances', label: 'Grievance Board' },
  ],
  advocate: [
    { to: '/app/advocate/dashboard', label: 'Analytics' },
    { to: '/app/advocate/moderation', label: 'Moderation' },
    { to: '/app/grievances', label: 'Grievance Board' },
  ],
};

const getDisplayName = (user) => {
  if (!user) return 'Account';
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Account';
};

const getDiceBearAvatar = (user) => {
  const seed = encodeURIComponent(
    `${user?.firstName?.trim() || ''}${user?.lastName?.trim() || ''}` || 'AccountUser'
  );
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
};

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const navLinks = ROLE_NAV[user?.role] ?? [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setOpenMenu(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    setOpenMenu(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="navbar-mark" />
        <div>
          <p className="navbar-title">FairGig</p>
          <p className="navbar-subtitle">Income &amp; Rights Platform</p>
        </div>
      </div>

      <nav className="navbar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link--active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="profile-menu" ref={menuRef}>
        <div className="user-chip">
          <div className="user-meta">
            <span className="user-name">{getDisplayName(user)}</span>
            {user?.role ? (
              <span className={`role-badge role-badge--${user.role}`}>{user.role}</span>
            ) : null}
          </div>
          <button
            type="button"
            className="avatar-trigger"
            aria-haspopup="menu"
            aria-expanded={openMenu}
            aria-label="Open account menu"
            onClick={() => setOpenMenu((c) => !c)}
          >
            <img
              className="user-avatar"
              src={getDiceBearAvatar(user)}
              alt={getDisplayName(user)}
            />
          </button>
        </div>

        {openMenu ? (
          <div className="profile-dropdown" role="menu" aria-label="Account menu">
            <button
              type="button"
              className="profile-dropdown-item"
              role="menuitem"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
