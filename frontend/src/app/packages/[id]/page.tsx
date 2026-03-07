'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import PackageForm from '@/components/packages/package-form';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';
import { UpdateInternetPackageRequest } from '@/shared/api/types';

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>();
  const packageId = params.id;
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const packageQuery = useQuery({
    queryKey: ['package-detail', packageId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.getInternetPackageById(token, packageId);
    },
  });

  const pppProfilesQuery = useQuery({
    queryKey: ['ppp-profiles-for-package-update'],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.listPppProfiles(token, { page: 1, pageSize: 100 });
    },
  });

  async function handleUpdate(payload: UpdateInternetPackageRequest): Promise<void> {
    setSubmitting(true);
    setMessage(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      await apiClient.updateInternetPackage(token, packageId, payload);
      await packageQuery.refetch();
      setMessage('Package updated.');
    } catch (error) {
      setMessage(error instanceof Error ? `Error: ${error.message}` : 'Failed to update package');
    } finally {
      setSubmitting(false);
    }
  }

  const item = packageQuery.data;

  return (
    <DashboardLayout title="Package Detail" subtitle="Lihat dan update paket internet.">
      <section className="page">
        <Link href="/packages">Back to packages</Link>
        {packageQuery.isLoading ? (
          <p className="muted" style={{ marginTop: '12px' }}>
            Loading package...
          </p>
        ) : null}
        {packageQuery.isError ? <p className="alert error">Failed to load package detail.</p> : null}
        {pppProfilesQuery.isError ? <p className="alert error">Failed to load PPP profiles.</p> : null}

        {item ? (
          <div className="two-col" style={{ marginTop: '14px' }}>
            <div className="panel">
              <h1 style={{ marginBottom: '6px' }}>{item.packageName}</h1>
              <p className="muted" style={{ margin: 0 }}>
                Package ID: {item.packageCode}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Download/Upload: {item.downloadKbps}/{item.uploadKbps} Kbps
              </p>
              <p className="muted" style={{ margin: 0 }}>
                PPP Profile: {item.pppProfile.profileCode} ({item.pppProfile.localAddress} -{' '}
                {item.pppProfile.remotePoolName})
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Price: Rp {formatRupiah(item.monthlyPrice)}
              </p>
              <p style={{ margin: '8px 0 0' }}>
                <span className={`status-pill ${item.isActive ? 'success' : 'danger'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            <div className="panel">
              <PackageForm
                initialValue={item}
                pppProfiles={pppProfilesQuery.data?.data ?? []}
                onSubmit={handleUpdate}
                submitting={submitting}
              />
              {message ? (
                <p className="muted" style={{ marginTop: '10px' }}>
                  {message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  );
}
