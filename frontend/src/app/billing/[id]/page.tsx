'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export default function BillingDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;
  const [amount, setAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const invoiceQuery = useQuery({
    queryKey: ['billing-invoice-detail', invoiceId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.getInvoiceById(token, invoiceId);
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
      await apiClient.recordInvoicePayment(token, invoiceId, {
        amount: Number(amount),
        paymentMethod: paymentMethod.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setAmount('0');
      setPaymentMethod('');
      setReferenceNumber('');
      setNotes('');
      await invoiceQuery.refetch();
      setMessage('Payment recorded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  }

  const invoice = invoiceQuery.data;

  return (
    <DashboardLayout title="Invoice Detail" subtitle="Lihat invoice dan input pembayaran manual.">
      <section className="page">
        <Link href="/billing">Back to billing</Link>
        {invoiceQuery.isLoading ? (
          <p className="muted" style={{ marginTop: '12px' }}>
            Loading invoice...
          </p>
        ) : null}
        {invoiceQuery.isError ? <p className="alert error">Failed to load invoice.</p> : null}

        {invoice ? (
          <div className="two-col" style={{ marginTop: '14px' }}>
            <div className="panel">
              <h1 style={{ marginBottom: '6px' }}>{invoice.invoiceIdBusiness}</h1>
              <p className="muted" style={{ margin: 0 }}>
                Customer: {invoice.customer.customerIdBusiness} - {invoice.customer.fullName}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Amount Due: Rp {formatRupiah(invoice.amountDue)}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Amount Paid: Rp {formatRupiah(invoice.amountPaid)}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Due Date: {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
              </p>
              <p style={{ marginTop: '8px' }}>
                <span className={`status-pill ${invoice.status === 'PAID' ? 'success' : 'danger'}`}>
                  {invoice.status}
                </span>
              </p>
              <h3 style={{ marginTop: '18px' }}>Payment History</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Paid At</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.paidAt).toLocaleString('id-ID')}</td>
                        <td>Rp {formatRupiah(item.amount)}</td>
                        <td>{item.paymentMethod ?? '-'}</td>
                        <td>{item.referenceNumber ?? '-'}</td>
                      </tr>
                    ))}
                    {invoice.payments.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No payment yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="panel">
              <form onSubmit={handleSubmit} className="form-grid">
                <h2 style={{ margin: 0 }}>Record Payment</h2>
                <label>
                  Amount (IDR)
                  <input
                    className="input"
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </label>
                <label>
                  Payment Method
                  <input
                    className="input"
                    type="text"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                </label>
                <label>
                  Reference Number
                  <input
                    className="input"
                    type="text"
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
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
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Record Payment'}
                </button>
              </form>
              {message ? (
                <p className={message.startsWith('Failed') ? 'alert error' : 'muted'}>{message}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  );
}
