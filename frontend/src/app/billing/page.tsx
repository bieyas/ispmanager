'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';
import { InvoiceStatus } from '@/shared/api/types';

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export default function BillingPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryKey = useMemo(
    () => ['billing-invoices', search, status, page, pageSize],
    [page, pageSize, search, status],
  );

  const invoicesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.listInvoices(token, {
        search,
        status: status || undefined,
        page,
        pageSize,
      });
    },
  });

  const rows = invoicesQuery.data?.data ?? [];
  const meta = invoicesQuery.data?.meta;

  return (
    <DashboardLayout title="Billing" subtitle="Kelola invoice dan pembayaran manual customer.">
      <section className="page">
        <div className="controls">
          <input
            className="input"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search invoice/customer"
          />
          <select
            className="input"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as InvoiceStatus | '');
            }}
          >
            <option value="">All Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ISSUED">ISSUED</option>
            <option value="PAID">PAID</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
          <button
            className="btn secondary"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            Search
          </button>
          <Link href="/billing/new" className="btn">
            New Invoice
          </Link>
          <Link href="/billing/jobs" className="btn secondary">
            Billing Jobs
          </Link>
        </div>

        {invoicesQuery.isLoading ? <p className="muted">Loading invoices...</p> : null}
        {invoicesQuery.isError ? <p className="alert error">Failed to load invoices.</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Amount Due</th>
                <th>Amount Paid</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.invoiceIdBusiness}</td>
                  <td>{item.customer.customerIdBusiness}</td>
                  <td>{item.customer.fullName}</td>
                  <td>Rp {formatRupiah(item.amountDue)}</td>
                  <td>Rp {formatRupiah(item.amountPaid)}</td>
                  <td>
                    <span className={`status-pill ${item.status === 'PAID' ? 'success' : 'danger'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{new Date(item.dueDate).toLocaleDateString('id-ID')}</td>
                  <td>
                    <Link href={`/billing/${item.id}`}>Detail</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !invoicesQuery.isLoading ? (
                <tr>
                  <td colSpan={8}>No invoice found.</td>
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
