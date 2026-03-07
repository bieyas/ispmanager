'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import CustomerForm from '@/components/customers/customer-form';
import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';
import { UpdateCustomerRequest } from '@/shared/api/types';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [submitting, setSubmitting] = useState(false);
  const [assigningPackage, setAssigningPackage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [packageMessage, setPackageMessage] = useState<string | null>(null);

  const customerQuery = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.getCustomerById(token, customerId);
    },
  });

  const packagesQuery = useQuery({
    queryKey: ['customer-assignment-packages'],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      return apiClient.listInternetPackages(token, { page: 1, pageSize: 100 });
    },
  });

  async function handleUpdate(payload: UpdateCustomerRequest): Promise<void> {
    setSubmitting(true);
    setMessage(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      await apiClient.updateCustomer(token, customerId, payload);
      await customerQuery.refetch();
      setMessage('Customer updated.');
    } catch (error) {
      setMessage(error instanceof Error ? `Error: ${error.message}` : 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  }

  const customer = customerQuery.data;
  const packageRows = packagesQuery.data?.data ?? [];

  async function handlePackageAssignment(packageId: string | null): Promise<void> {
    setAssigningPackage(true);
    setPackageMessage(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      await apiClient.assignCustomerPackage(token, customerId, { packageId });
      await customerQuery.refetch();
      setPackageMessage('Package assignment updated.');
    } catch (error) {
      setPackageMessage(
        error instanceof Error ? `Error: ${error.message}` : 'Failed to update package assignment',
      );
    } finally {
      setAssigningPackage(false);
    }
  }

  return (
    <DashboardLayout title="Customer Detail" subtitle="Lihat detail dan update informasi customer.">
      <section className="page">
        <Link href="/customers">Back to customers</Link>
        {customerQuery.isLoading ? (
          <p className="muted" style={{ marginTop: '12px' }}>
            Loading customer...
          </p>
        ) : null}
        {customerQuery.isError ? (
          <p className="alert error">Failed to load customer detail.</p>
        ) : null}

        {customer ? (
          <div className="two-col" style={{ marginTop: '14px' }}>
            <div className="panel">
              <h1 style={{ marginBottom: '6px' }}>{customer.fullName}</h1>
              <p className="muted" style={{ margin: 0 }}>
                Customer ID: {customer.customerCode}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Email: {customer.email ?? '-'}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Phone: {customer.phone ?? '-'}
              </p>
              <p style={{ margin: '8px 0 0' }}>
                <span className={`status-pill ${customer.isActive ? 'success' : 'danger'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p className="muted" style={{ margin: '10px 0 0' }}>
                Package:{' '}
                {customer.currentPackage
                  ? `${customer.currentPackage.packageName} (${customer.currentPackage.downloadKbps}/${customer.currentPackage.uploadKbps} Kbps)`
                  : '-'}
              </p>
            </div>
            <div className="panel">
              <CustomerForm
                initialValue={customer}
                onSubmit={handleUpdate}
                submitting={submitting}
              />
              {message ? (
                <p className="muted" style={{ marginTop: '10px' }}>
                  {message}
                </p>
              ) : null}
              <div style={{ marginTop: '20px' }}>
                <h2 style={{ margin: '0 0 8px' }}>Package Assignment</h2>
                <label className="form-grid" style={{ maxWidth: '460px' }}>
                  <span>Current Package</span>
                  <select
                    className="input"
                    disabled={assigningPackage || packagesQuery.isLoading}
                    value={customer.currentPackage?.id ?? ''}
                    onChange={(event) => void handlePackageAssignment(event.target.value || null)}
                  >
                    <option value="">No Package</option>
                    {packageRows.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.packageCode} - {item.packageName} ({item.downloadKbps}/{item.uploadKbps}{' '}
                        Kbps)
                      </option>
                    ))}
                  </select>
                </label>
                {packagesQuery.isError ? (
                  <p className="alert error">Failed to load package options.</p>
                ) : null}
                {packageMessage ? (
                  <p className="muted" style={{ marginTop: '8px' }}>
                    {packageMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  );
}
