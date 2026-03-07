'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { useAuth } from '@/shared/providers/auth-provider';

export default function DashboardShell() {
  const { user } = useAuth();

  const healthQuery = useQuery({
    queryKey: ['api-health'],
    queryFn: () => apiClient.getHealth(),
  });

  const customerKpi = useMemo(() => {
    return {
      active: user ? 1 : 0,
      role: user?.role.name ?? 'Unknown',
      api: healthQuery.isLoading
        ? 'Checking...'
        : healthQuery.isError
          ? 'Unreachable'
          : healthQuery.data?.status,
    };
  }, [healthQuery.data?.status, healthQuery.isError, healthQuery.isLoading, user]);

  return (
    <DashboardLayout
      title="Operational Dashboard"
      subtitle="Ringkasan kondisi platform dan akses modul utama."
    >
      <section className="page">
        <h1>Welcome Back</h1>
        <p className="muted">
          {user?.fullName} ({user?.email})
        </p>

        <div className="kpi">
          <article className="panel">
            <h3>{customerKpi.active}</h3>
            <p>Authenticated Session</p>
          </article>
          <article className="panel">
            <h3>{customerKpi.role}</h3>
            <p>Current Role</p>
          </article>
          <article className="panel">
            <h3>{customerKpi.api}</h3>
            <p>API Health</p>
          </article>
        </div>
      </section>
    </DashboardLayout>
  );
}
