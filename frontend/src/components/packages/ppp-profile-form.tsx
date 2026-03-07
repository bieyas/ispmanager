'use client';

import { FormEvent, useMemo, useState } from 'react';

import { PppProfile, UpdatePppProfileRequest } from '@/shared/api/types';

type PppProfileFormProps = {
  initialValue?: PppProfile;
  submitting?: boolean;
  onSubmit: (payload: UpdatePppProfileRequest) => Promise<void>;
};

export default function PppProfileForm({
  initialValue,
  submitting = false,
  onSubmit,
}: PppProfileFormProps) {
  const isEditMode = Boolean(initialValue);
  const [profileCode, setProfileCode] = useState(initialValue?.profileCode ?? '');
  const [profileName, setProfileName] = useState(initialValue?.profileName ?? '');
  const [localAddress, setLocalAddress] = useState(initialValue?.localAddress ?? '');
  const [remotePoolName, setRemotePoolName] = useState(initialValue?.remotePoolName ?? '');
  const [dnsServers, setDnsServers] = useState(initialValue?.dnsServers ?? '');
  const [routerName, setRouterName] = useState(initialValue?.routerName ?? '');
  const [onlyOne, setOnlyOne] = useState(initialValue?.onlyOne ?? true);
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);

  const title = useMemo(() => (isEditMode ? 'Update PPP Profile' : 'Create PPP Profile'), [isEditMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      profileCode: profileCode.trim(),
      profileName: profileName.trim(),
      localAddress: localAddress.trim(),
      remotePoolName: remotePoolName.trim(),
      dnsServers: dnsServers.trim() || undefined,
      routerName: routerName.trim() || undefined,
      onlyOne,
      isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid" style={{ maxWidth: '520px' }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <label>
        Profile ID (Business)
        <input
          className="input"
          type="text"
          required
          minLength={3}
          value={profileCode}
          onChange={(event) => setProfileCode(event.target.value)}
        />
      </label>
      <label>
        Profile Name
        <input
          className="input"
          type="text"
          required
          minLength={3}
          value={profileName}
          onChange={(event) => setProfileName(event.target.value)}
        />
      </label>
      <label>
        Local Address
        <input
          className="input"
          type="text"
          required
          placeholder="10.10.10.1"
          value={localAddress}
          onChange={(event) => setLocalAddress(event.target.value)}
        />
      </label>
      <label>
        Remote Address Pool
        <input
          className="input"
          type="text"
          required
          placeholder="POOL-BRONZE"
          value={remotePoolName}
          onChange={(event) => setRemotePoolName(event.target.value)}
        />
      </label>
      <label>
        DNS Servers (optional)
        <input
          className="input"
          type="text"
          placeholder="8.8.8.8,1.1.1.1"
          value={dnsServers}
          onChange={(event) => setDnsServers(event.target.value)}
        />
      </label>
      <label>
        Router Name (optional)
        <input
          className="input"
          type="text"
          value={routerName}
          onChange={(event) => setRouterName(event.target.value)}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          checked={onlyOne}
          onChange={(event) => setOnlyOne(event.target.checked)}
        />
        Only One Session
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
        {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Profile'}
      </button>
    </form>
  );
}
