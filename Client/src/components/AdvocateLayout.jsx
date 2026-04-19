import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const NAV_ITEMS = [
  {
    to: '/app/advocate/dashboard',
    label: 'Analytics',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 19h16" />
        <path d="M7 15v-4" />
        <path d="M12 15V9" />
        <path d="M17 15V6" />
      </svg>
    ),
  },
  {
    to: '/app/advocate/moderation',
    label: 'Moderation',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: '/app/grievances',
    label: 'Grievances',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

function isItemActive(pathname, itemPath) {
  return pathname.startsWith(itemPath);
}

export default function AdvocateLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />

      <div className="flex-1 flex min-h-0">
        <aside
          className={`hidden md:flex md:flex-col md:shrink-0 border-r border-slate-200 bg-white/95 backdrop-blur-sm transition-all duration-200 ${collapsed ? 'md:w-20' : 'md:w-64'}`}
        >
          <div className="h-14 border-b border-slate-100 px-3 flex items-center justify-between">
            {!collapsed && <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Advocate Menu</p>}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M12.79 4.21a.75.75 0 0 1 0 1.06L8.06 10l4.73 4.73a.75.75 0 1 1-1.06 1.06l-5.26-5.26a.75.75 0 0 1 0-1.06l5.26-5.26a.75.75 0 0 1 1.06 0z" />
              </svg>
            </button>
          </div>

          <nav className="p-3 flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(location.pathname, item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center ${collapsed ? 'justify-center px-2.5' : 'px-3'} py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</span>
                  {!collapsed && <span className="ml-2.5">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="md:hidden px-4 pt-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              Advocate Menu
            </button>
          </div>

          <div className="flex-1 min-h-0">{children}</div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar overlay"
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Advocate Menu</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                aria-label="Close sidebar"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(location.pathname, item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={`${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</span>
                    <span className="ml-2.5">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
