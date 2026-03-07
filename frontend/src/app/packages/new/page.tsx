'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import PackageForm from '@/components/packages/package-form';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';
import { UpdateInternetPackageRequest } from '@/shared/api/types';

export default function NewPackagePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pppProfilesQuery = useQuery({
    queryKey: ['ppp-profiles-for-package-create'],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.listPppProfiles(token, { page: 1, pageSize: 100 });
    },
  });

  async function handleCreate(payload: UpdateInternetPackageRequest): Promise<void> {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (!payload.packageCode || !payload.packageName || !payload.pppProfileId) {
        throw new Error('Package code, package name, and PPP profile are required');
      }
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      const created = await apiClient.createInternetPackage(token, {
        packageCode: payload.packageCode,
        packageName: payload.packageName,
        downloadKbps: Number(payload.downloadKbps ?? 0),
        uploadKbps: Number(payload.uploadKbps ?? 0),
        monthlyPrice: Number(payload.monthlyPrice ?? 0),
        pppProfileId: payload.pppProfileId,
        isActive: payload.isActive ?? true,
      });
      router.replace(`/packages/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create package');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Create Package" subtitle="Tambah paket internet baru untuk assignment.">
      <section className="page">
        <Link href="/packages">Back to packages</Link>
        {pppProfilesQuery.isError ? <p className="alert error">Failed to load PPP profiles.</p> : null}
        <div style={{ marginTop: '14px' }}>
          <PackageForm
            onSubmit={handleCreate}
            submitting={submitting}
            pppProfiles={pppProfilesQuery.data?.data ?? []}
          />
          {errorMessage ? <p className="alert error">{errorMessage}</p> : null}
        </div>
      </section>
    </DashboardLayout>
  );
}
