'use client';

import Link from 'next/link';
import { useState } from 'react';

import DashboardLayout from '@/components/dashboard-layout';
import { apiClient } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/session';

export default function BillingJobsPage() {
  const [runningOverdue, setRunningOverdue] = useState(false);
  const [runningMonthly, setRunningMonthly] = useState(false);
  const [year, setYear] = useState(String(new Date().getUTCFullYear()));
  const [month, setMonth] = useState(String(new Date().getUTCMonth() + 1));
  const [overdueResult, setOverdueResult] = useState<string | null>(null);
  const [monthlyResult, setMonthlyResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runOverdue(): Promise<void> {
    setRunningOverdue(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      const result = await apiClient.runOverdueBillingJob(token);
      setOverdueResult(`Checked at ${result.checkedAt}, updated ${result.updated} invoice(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run overdue job');
    } finally {
      setRunningOverdue(false);
    }
  }

  async function runMonthly(): Promise<void> {
    setRunningMonthly(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing access token');
      }
      const result = await apiClient.runMonthlyBillingJob(token, {
        year: Number(year),
        month: Number(month),
      });
      setMonthlyResult(
        `Period ${result.year}-${String(result.month).padStart(2, '0')}: created ${result.created}, skipped ${result.skipped}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run monthly job');
    } finally {
      setRunningMonthly(false);
    }
  }

  return (
    <DashboardLayout title="Billing Jobs" subtitle="Trigger manual job automation Billing v1.">
      <section className="page">
        <Link href="/billing">Back to billing</Link>

        <div className="two-col" style={{ marginTop: '14px' }}>
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Run Overdue Job</h2>
            <p className="muted">Mark invoice ISSUED yang lewat due date menjadi OVERDUE.</p>
            <button className="btn" onClick={() => void runOverdue()} disabled={runningOverdue}>
              {runningOverdue ? 'Running...' : 'Run Overdue Job'}
            </button>
            {overdueResult ? (
              <p className="muted" style={{ marginTop: '10px' }}>
                {overdueResult}
              </p>
            ) : null}
          </div>

          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Run Monthly Generation</h2>
            <p className="muted">
              Generate invoice bulanan otomatis dari customer aktif + package aktif.
            </p>
            <div className="controls" style={{ marginTop: '8px' }}>
              <input
                className="input"
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="Year"
              />
              <input
                className="input"
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                placeholder="Month"
              />
            </div>
            <button className="btn" onClick={() => void runMonthly()} disabled={runningMonthly}>
              {runningMonthly ? 'Running...' : 'Run Monthly Job'}
            </button>
            {monthlyResult ? (
              <p className="muted" style={{ marginTop: '10px' }}>
                {monthlyResult}
              </p>
            ) : null}
          </div>
        </div>

        {error ? <p className="alert error">{error}</p> : null}
      </section>
    </DashboardLayout>
  );
}
