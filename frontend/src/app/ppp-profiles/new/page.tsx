'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DashboardLayout from '@/components/dashboard-layout';
import PppProfileForm from '@/components/packages/ppp-profile-form';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';
import { UpdatePppProfileRequest } from '@/shared/api/types';

export default function NewPppProfilePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate(payload: UpdatePppProfileRequest): Promise<void> {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (!payload.profileCode || !payload.profileName || !payload.localAddress || !payload.remotePoolName) {
        throw new Error('Profile code, name, local address, and remote pool are required');
      }

      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }

      const created = await apiClient.createPppProfile(token, {
        profileCode: payload.profileCode,
        profileName: payload.profileName,
        localAddress: payload.localAddress,
        remotePoolName: payload.remotePoolName,
        dnsServers: payload.dnsServers,
        onlyOne: payload.onlyOne,
        routerName: payload.routerName,
        isActive: payload.isActive,
      });
      router.replace(`/ppp-profiles/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create PPP profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Create PPP Profile" subtitle="Tambah profile PPP untuk paket internet.">
      <section className="page">
        <Link href="/ppp-profiles">Back to PPP profiles</Link>
        <div style={{ marginTop: '14px' }}>
          <PppProfileForm onSubmit={handleCreate} submitting={submitting} />
          {errorMessage ? <p className="alert error">{errorMessage}</p> : null}
        </div>
      </section>
    </DashboardLayout>
  );
}
