'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryKey = useMemo(() => ['customers', search, page, pageSize], [page, pageSize, search]);

  const customersQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.listCustomers(token, { search, page, pageSize });
    },
  });

  const rows = customersQuery.data?.data ?? [];
  const meta = customersQuery.data?.meta;

  return (
    <DashboardLayout
      title="Customer Management"
      subtitle="List customer dengan filter, paging, dan akses detail."
    >
      <section className="page">
        <div className="controls">
          <input
            className="input"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by code, name, email, phone"
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
          <Link href="/customers/new" className="btn">
            New Customer
          </Link>
        </div>

        {customersQuery.isLoading ? <p className="muted">Loading customers...</p> : null}
        {customersQuery.isError ? <p className="alert error">Failed to load customers.</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.customerCode}</td>
                  <td>{customer.fullName}</td>
                  <td>{customer.email ?? '-'}</td>
                  <td>{customer.phone ?? '-'}</td>
                  <td>
                    <span className={`status-pill ${customer.isActive ? 'success' : 'danger'}`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/customers/${customer.id}`}>Detail</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !customersQuery.isLoading ? (
                <tr>
                  <td colSpan={6}>No customer found.</td>
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
