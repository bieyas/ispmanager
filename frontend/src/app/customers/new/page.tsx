'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import CustomerForm from '@/components/customers/customer-form';
import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';
import { UpdateCustomerRequest } from '@/shared/api/types';

export default function NewCustomerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate(payload: UpdateCustomerRequest): Promise<void> {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      if (!payload.customerCode || !payload.fullName) {
        throw new Error('Customer code and full name are required');
      }
      const created = await apiClient.createCustomer(token, {
        customerCode: payload.customerCode,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        isActive: payload.isActive,
      });
      router.replace(`/customers/${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Create Customer" subtitle="Tambahkan data pelanggan baru ke sistem.">
      <section className="page">
        <Link href="/customers">Back to customers</Link>
        <div style={{ marginTop: '14px' }}>
          <CustomerForm onSubmit={handleCreate} submitting={submitting} />
          {errorMessage ? <p className="alert error">Error: {errorMessage}</p> : null}
        </div>
      </section>
    </DashboardLayout>
  );
}
