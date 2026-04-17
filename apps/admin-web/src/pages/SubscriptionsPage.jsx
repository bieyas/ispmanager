import { CreditCard, FilePlus2, RefreshCw, RotateCw } from "lucide-react";
import { formatCurrency, formatDate, getCustomerStatusLabel, getInvoiceStatusLabel } from "../lib/formatters.js";
import { Card, EmptyState, Field, Input, Pill, PrimaryButton, SecondaryButton, SectionHeading, StatCard, Textarea } from "../components/ui.jsx";

export function SubscriptionsPage({
  subscriptions,
  manualInvoiceForm,
  periodicInvoiceForm,
  onManualInvoiceFormChange,
  onPeriodicInvoiceFormChange,
  onCreateManualInvoice,
  onGeneratePeriodicInvoices,
  onSelectSubscription,
  onViewSubscription,
  onRefresh,
}) {
  const activeCount = subscriptions.filter((item) => item.status === "active").length;

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading
          eyebrow="Revenue Core"
          title="Subscriptions dan penerbitan invoice"
          subtitle="Permukaan kerja minimum untuk review alur subscription, invoice manual, dan generate periodik."
          actions={<SecondaryButton onClick={onRefresh}><RefreshCw className="mr-2 h-4 w-4" />Refresh</SecondaryButton>}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Subscription" value={String(subscriptions.length)} tone="blue" icon={CreditCard} />
          <StatCard label="Active" value={String(activeCount)} tone="emerald" icon={RotateCw} />
          <StatCard label="Need Invoice" value={String(subscriptions.length)} tone="amber" icon={FilePlus2} />
          <StatCard label="Draft Manual Tools" value="Ready" tone="rose" icon={CreditCard} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeading eyebrow="Subscription List" title="Subscription aktif dan histori ringkas" />
          <div className="mt-4 grid gap-3">
            {subscriptions.length ? (
              subscriptions.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(28,71,124,0.08)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <strong className="text-sm font-bold text-slate-900">{item.subscriptionNo}</strong>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{item.customer?.customerCode} • {item.customer?.fullName}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Aktivasi {formatDate(item.activationDate)} • Anchor {item.billingAnchorDay}
                      </p>
                    </div>
                    <div className="grid gap-2 justify-items-end">
                      <Pill status={item.status} label={item.status} />
                      <Pill status={item.customer?.status || "active"} label={getCustomerStatusLabel(item.customer?.status || "active")} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => onViewSubscription(item.id)}>Detail</SecondaryButton>
                    <SecondaryButton onClick={() => onSelectSubscription(item.id)}>Isi Form Invoice</SecondaryButton>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="Belum ada subscription." />
            )}
          </div>
        </Card>

        <div className="grid gap-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <SectionHeading eyebrow="Manual Invoice" title="Buat invoice manual" />
            <form className="mt-4 grid gap-3" onSubmit={onCreateManualInvoice}>
              <Field label="Subscription ID">
                <Input value={manualInvoiceForm.subscriptionId} onChange={(event) => onManualInvoiceFormChange((current) => ({ ...current, subscriptionId: event.target.value }))} required />
              </Field>
              <Field label="Issue Date">
                <Input type="date" value={manualInvoiceForm.issueDate} onChange={(event) => onManualInvoiceFormChange((current) => ({ ...current, issueDate: event.target.value }))} />
              </Field>
              <Field label="Due Date">
                <Input type="date" value={manualInvoiceForm.dueDate} onChange={(event) => onManualInvoiceFormChange((current) => ({ ...current, dueDate: event.target.value }))} />
              </Field>
              <Field label="Amount Override">
                <Input type="number" min="1" step="0.01" value={manualInvoiceForm.amount} onChange={(event) => onManualInvoiceFormChange((current) => ({ ...current, amount: event.target.value }))} />
              </Field>
              <Field label="Notes">
                <Textarea value={manualInvoiceForm.notes} onChange={(event) => onManualInvoiceFormChange((current) => ({ ...current, notes: event.target.value }))} />
              </Field>
              <PrimaryButton type="submit">Create Manual Invoice</PrimaryButton>
            </form>
          </Card>

          <Card>
            <SectionHeading eyebrow="Periodic Generate" title="Generate invoice periodik" />
            <form className="mt-4 grid gap-3" onSubmit={onGeneratePeriodicInvoices}>
              <Field label="Issue Date">
                <Input type="date" value={periodicInvoiceForm.issueDate} onChange={(event) => onPeriodicInvoiceFormChange((current) => ({ ...current, issueDate: event.target.value }))} />
              </Field>
              <Field label="Due Date">
                <Input type="date" value={periodicInvoiceForm.dueDate} onChange={(event) => onPeriodicInvoiceFormChange((current) => ({ ...current, dueDate: event.target.value }))} />
              </Field>
              <Field label="Limit">
                <Input type="number" min="1" max="100" value={periodicInvoiceForm.limit} onChange={(event) => onPeriodicInvoiceFormChange((current) => ({ ...current, limit: event.target.value }))} />
              </Field>
              <Field label="Subscription IDs (pisah koma, opsional)">
                <Textarea value={periodicInvoiceForm.subscriptionIds} onChange={(event) => onPeriodicInvoiceFormChange((current) => ({ ...current, subscriptionIds: event.target.value }))} />
              </Field>
              <Field label="Notes">
                <Textarea value={periodicInvoiceForm.notes} onChange={(event) => onPeriodicInvoiceFormChange((current) => ({ ...current, notes: event.target.value }))} />
              </Field>
              <PrimaryButton type="submit">Generate Periodic Invoices</PrimaryButton>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
