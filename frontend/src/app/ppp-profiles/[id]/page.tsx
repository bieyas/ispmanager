'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import PppProfileForm from '@/components/packages/ppp-profile-form';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';
import { UpdatePppProfileRequest } from '@/shared/api/types';

export default function PppProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const profileId = params.id;
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['ppp-profile-detail', profileId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.getPppProfileById(token, profileId);
    },
  });

  async function handleUpdate(payload: UpdatePppProfileRequest): Promise<void> {
    setSubmitting(true);
    setMessage(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      await apiClient.updatePppProfile(token, profileId, payload);
      await profileQuery.refetch();
      setMessage('PPP profile updated.');
    } catch (error) {
      setMessage(error instanceof Error ? `Error: ${error.message}` : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  const profile = profileQuery.data;

  return (
    <DashboardLayout title="PPP Profile Detail" subtitle="Lihat dan update profile PPP.">
      <section className="page">
        <Link href="/ppp-profiles">Back to PPP profiles</Link>
        {profileQuery.isLoading ? (
          <p className="muted" style={{ marginTop: '12px' }}>
            Loading profile...
          </p>
        ) : null}
        {profileQuery.isError ? <p className="alert error">Failed to load profile detail.</p> : null}

        {profile ? (
          <div className="two-col" style={{ marginTop: '14px' }}>
            <div className="panel">
              <h1 style={{ marginBottom: '6px' }}>{profile.profileName}</h1>
              <p className="muted" style={{ margin: 0 }}>
                Profile ID: {profile.profileCode}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Local Address: {profile.localAddress}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Remote Pool: {profile.remotePoolName}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Router: {profile.routerName ?? '-'}
              </p>
              <p style={{ margin: '8px 0 0' }}>
                <span className={`status-pill ${profile.isActive ? 'success' : 'danger'}`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            <div className="panel">
              <PppProfileForm initialValue={profile} onSubmit={handleUpdate} submitting={submitting} />
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
