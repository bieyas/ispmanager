'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';

export default function NewInvoicePage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [amountDue, setAmountDue] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ['billing-new-customers'],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.listCustomers(token, { page: 1, pageSize: 100 });
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      const created = await apiClient.createInvoice(token, {
        customerId,
        amountDue: Number(amountDue),
        dueDate: new Date(dueDate).toISOString(),
        status: 'ISSUED',
        notes: notes.trim() || undefined,
      });
      router.replace(`/billing/${created.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  }

  const customers = customersQuery.data?.data ?? [];

  return (
    <DashboardLayout title="Create Invoice" subtitle="Buat invoice manual untuk customer.">
      <section className="page">
        <Link href="/billing">Back to billing</Link>
        <form
          onSubmit={handleSubmit}
          className="form-grid"
          style={{ maxWidth: '520px', marginTop: '14px' }}
        >
          <label>
            Customer
            <select
              className="input"
              required
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerIdBusiness} - {customer.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount Due (IDR)
            <input
              className="input"
              type="number"
              required
              min={0}
              value={amountDue}
              onChange={(event) => setAmountDue(event.target.value)}
            />
          </label>
          <label>
            Due Date
            <input
              className="input"
              type="date"
              required
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
          <label>
            Notes
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <button type="submit" className="btn" disabled={submitting || customersQuery.isLoading}>
            {submitting ? 'Saving...' : 'Create Invoice'}
          </button>
        </form>
        {customersQuery.isError ? <p className="alert error">Failed to load customers.</p> : null}
        {message ? <p className="alert error">{message}</p> : null}
      </section>
    </DashboardLayout>
  );
}
