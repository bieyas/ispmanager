'use client';

import { FormEvent, useMemo, useState } from 'react';

import { Customer, UpdateCustomerRequest } from '@/shared/api/types';

type CustomerFormProps = {
  initialValue?: Customer;
  submitting?: boolean;
  onSubmit: (payload: UpdateCustomerRequest) => Promise<void>;
};

export default function CustomerForm({
  initialValue,
  submitting = false,
  onSubmit,
}: CustomerFormProps) {
  const isEditMode = Boolean(initialValue);
  const [customerCode, setCustomerCode] = useState(initialValue?.customerCode ?? '');
  const [fullName, setFullName] = useState(initialValue?.fullName ?? '');
  const [email, setEmail] = useState(initialValue?.email ?? '');
  const [phone, setPhone] = useState(initialValue?.phone ?? '');
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);

  const title = useMemo(() => (isEditMode ? 'Update Customer' : 'Create Customer'), [isEditMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      customerCode: customerCode.trim(),
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      isActive,
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid" style={{ maxWidth: '460px' }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <label>
        Customer ID (Business)
        <input
          className="input"
          type="text"
          required
          minLength={3}
          value={customerCode}
          onChange={(event) => setCustomerCode(event.target.value)}
        />
      </label>
      <label>
        Full Name
        <input
          className="input"
          type="text"
          required
          minLength={3}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </label>
      <label>
        Email
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Phone
        <input
          className="input"
          type="text"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Active
      </label>
      <button type="submit" disabled={submitting} className="btn">
        {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Customer'}
      </button>
    </form>
  );
}
