'use client';

import { FormEvent, useMemo, useState } from 'react';

import { InternetPackage, PppProfile, UpdateInternetPackageRequest } from '@/shared/api/types';

type PackageFormProps = {
  initialValue?: InternetPackage;
  pppProfiles: PppProfile[];
  submitting?: boolean;
  onSubmit: (payload: UpdateInternetPackageRequest) => Promise<void>;
};

export default function PackageForm({
  initialValue,
  pppProfiles,
  submitting = false,
  onSubmit,
}: PackageFormProps) {
  const isEditMode = Boolean(initialValue);
  const [packageCode, setPackageCode] = useState(initialValue?.packageCode ?? '');
  const [packageName, setPackageName] = useState(initialValue?.packageName ?? '');
  const [downloadKbps, setDownloadKbps] = useState(String(initialValue?.downloadKbps ?? 10240));
  const [uploadKbps, setUploadKbps] = useState(String(initialValue?.uploadKbps ?? 10240));
  const [monthlyPrice, setMonthlyPrice] = useState(String(initialValue?.monthlyPrice ?? 0));
  const [pppProfileId, setPppProfileId] = useState(initialValue?.pppProfileId ?? '');
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);

  const title = useMemo(() => (isEditMode ? 'Update Package' : 'Create Package'), [isEditMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      packageCode: packageCode.trim(),
      packageName: packageName.trim(),
      downloadKbps: Number(downloadKbps),
      uploadKbps: Number(uploadKbps),
      monthlyPrice: Number(monthlyPrice),
      pppProfileId: pppProfileId.trim(),
      isActive,
    };

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid" style={{ maxWidth: '520px' }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <label>
        Package ID (Business)
        <input
          className="input"
          type="text"
          required
          minLength={3}
          value={packageCode}
          onChange={(event) => setPackageCode(event.target.value)}
        />
      </label>
      <label>
        Package Name
        <input
          className="input"
          type="text"
          required
          minLength={3}
          value={packageName}
          onChange={(event) => setPackageName(event.target.value)}
        />
      </label>
      <label>
        Download (Kbps)
        <input
          className="input"
          type="number"
          required
          min={1}
          value={downloadKbps}
          onChange={(event) => setDownloadKbps(event.target.value)}
        />
      </label>
      <label>
        Upload (Kbps)
        <input
          className="input"
          type="number"
          required
          min={1}
          value={uploadKbps}
          onChange={(event) => setUploadKbps(event.target.value)}
        />
      </label>
      <label>
        PPP Profile
        <select
          className="input"
          required
          value={pppProfileId}
          onChange={(event) => setPppProfileId(event.target.value)}
        >
          <option value="">Select PPP Profile</option>
          {pppProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.profileCode} - {profile.profileName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Monthly Price (IDR)
        <input
          className="input"
          type="number"
          required
          min={0}
          value={monthlyPrice}
          onChange={(event) => setMonthlyPrice(event.target.value)}
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
        {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Package'}
      </button>
    </form>
  );
}
