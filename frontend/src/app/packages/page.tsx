'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export default function PackagesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryKey = useMemo(() => ['packages', search, page, pageSize], [page, pageSize, search]);

  const packagesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.listInternetPackages(token, { search, page, pageSize });
    },
  });

  const rows = packagesQuery.data?.data ?? [];
  const meta = packagesQuery.data?.meta;

  return (
    <DashboardLayout
      title="Internet Packages"
      subtitle="Kelola paket internet dan gunakan untuk assignment customer."
    >
      <section className="page">
        <div className="controls">
          <input
            className="input"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by code or package name"
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
          <Link href="/packages/new" className="btn">
            New Package
          </Link>
          <Link href="/ppp-profiles" className="btn secondary">
            PPP Profiles
          </Link>
        </div>

        {packagesQuery.isLoading ? <p className="muted">Loading packages...</p> : null}
        {packagesQuery.isError ? <p className="alert error">Failed to load packages.</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Package ID</th>
                <th>Name</th>
                <th>Bandwidth</th>
                <th>PPP Profile</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.packageCode}</td>
                  <td>{item.packageName}</td>
                  <td>
                    {item.downloadKbps}/{item.uploadKbps} Kbps
                  </td>
                  <td>{item.pppProfile.profileCode}</td>
                  <td>Rp {formatRupiah(item.monthlyPrice)}</td>
                  <td>
                    <span className={`status-pill ${item.isActive ? 'success' : 'danger'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/packages/${item.id}`}>Detail</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !packagesQuery.isLoading ? (
                <tr>
                  <td colSpan={7}>No package found.</td>
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
