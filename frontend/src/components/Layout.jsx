import { Boxes, Home, LogOut, QrCode, Shield } from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/scanner', label: 'Scanner', icon: QrCode },
  { to: '/admin', label: 'Admin', icon: Boxes }
];

export default function Layout({ children }) {
  const { authenticated, logout, user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <NavLink to="/" className="flex items-center gap-3 font-bold text-slate-50">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-400 text-slate-950">
              <Shield size={21} />
            </span>
            <span>Smart QR Scanner</span>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `btn px-3 py-2 text-sm ${
                      isActive ? 'bg-slate-800 text-teal-200' : 'text-slate-300 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon size={17} />
                  {link.label}
                </NavLink>
              );
            })}
            {authenticated ? (
              <button className="btn btn-secondary px-3 py-2 text-sm" onClick={logout}>
                <LogOut size={17} />
                {user?.name || 'Logout'}
              </button>
            ) : (
              <NavLink className="btn btn-primary px-3 py-2 text-sm" to="/login">
                Login
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
