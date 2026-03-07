'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';

export default function PppProfilesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryKey = useMemo(
    () => ['ppp-profiles', search, page, pageSize],
    [page, pageSize, search],
  );

  const profilesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.listPppProfiles(token, { search, page, pageSize });
    },
  });

  const rows = profilesQuery.data?.data ?? [];
  const meta = profilesQuery.data?.meta;

  return (
    <DashboardLayout
      title="PPP Profiles"
      subtitle="Definisikan local address dan remote address pool untuk profile PPP."
    >
      <section className="page">
        <div className="controls">
          <input
            className="input"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by code, name, pool"
          />
          <button
            className="btn secondary"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            Search
          </button>
          <Link href="/ppp-profiles/new" className="btn">
            New PPP Profile
          </Link>
        </div>

        {profilesQuery.isLoading ? <p className="muted">Loading profiles...</p> : null}
        {profilesQuery.isError ? <p className="alert error">Failed to load PPP profiles.</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Profile ID</th>
                <th>Name</th>
                <th>Local Address</th>
                <th>Remote Pool</th>
                <th>Router</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.profileCode}</td>
                  <td>{item.profileName}</td>
                  <td>{item.localAddress}</td>
                  <td>{item.remotePoolName}</td>
                  <td>{item.routerName ?? '-'}</td>
                  <td>
                    <span className={`status-pill ${item.isActive ? 'success' : 'danger'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/ppp-profiles/${item.id}`}>Detail</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !profilesQuery.isLoading ? (
                <tr>
                  <td colSpan={7}>No PPP profile found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <button
            className="btn secondary"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="muted">
            Page {meta?.page ?? page} / {meta?.totalPages ?? 1} (Total: {meta?.total ?? 0})
          </span>
          <button
            className="btn secondary"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={Boolean(meta && page >= meta.totalPages)}
          >
            Next
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
