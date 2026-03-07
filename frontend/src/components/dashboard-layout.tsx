'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

import RequireAuth from '@/components/require-auth';
import { useAuth } from '@/shared/providers/auth-provider';

type MenuItem = {
  label: string;
  href: string;
};

const MENU_BY_ROLE: Record<string, MenuItem[]> = {
  'Super Admin': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Customers', href: '/customers' },
    { label: 'Packages', href: '/packages' },
    { label: 'PPP Profiles', href: '/ppp-profiles' },
    { label: 'Billing', href: '/billing' },
    { label: 'Billing Jobs', href: '/billing/jobs' },
    { label: 'Network', href: '/dashboard' },
    { label: 'Settings', href: '/dashboard' },
  ],
  NOC: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'PPP Profiles', href: '/ppp-profiles' },
    { label: 'Network', href: '/dashboard' },
    { label: 'Incidents', href: '/dashboard' },
  ],
  Finance: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Packages', href: '/packages' },
    { label: 'Billing', href: '/billing' },
    { label: 'Billing Jobs', href: '/billing/jobs' },
    { label: 'Payments', href: '/billing' },
  ],
  CS: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Customers', href: '/customers' },
    { label: 'Tickets', href: '/dashboard' },
  ],
  Teknisi: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Work Orders', href: '/dashboard' },
  ],
};

type DashboardLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const roleName = user?.role.name ?? 'Unknown';
  const menuItems = MENU_BY_ROLE[roleName] ?? [{ label: 'Dashboard', href: '/dashboard' }];

  return (
    <RequireAuth>
      <div className="app-shell">
        <div className="shell-grid">
          <aside className="sidebar">
            <p className="brand">ISP Manager</p>
            <p className="muted" style={{ marginTop: 0 }}>
              {user?.fullName}
            </p>
            <p className="muted" style={{ marginTop: '-8px', marginBottom: '6px' }}>
              {roleName}
            </p>
            <ul className="menu-list">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="menu-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <section className="content">
            <header className="topbar">
              <div>
                <strong>{title}</strong>
                {subtitle ? (
                  <p className="muted" style={{ margin: '4px 0 0' }}>
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <button onClick={logout} className="btn secondary">
                Logout
              </button>
            </header>
            {children}
          </section>
        </div>
      </div>
    </RequireAuth>
  );
}
