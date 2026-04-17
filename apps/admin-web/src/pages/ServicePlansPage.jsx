import { formatCurrency } from "../lib/formatters.js";
import { Card, EmptyState, Field, Input, Pill, PrimaryButton, SecondaryButton, SectionHeading, Textarea } from "../components/ui.jsx";

export function ServicePlansPage({ plans, form, editingId, onFormChange, onSubmit, onResetEdit, onRefresh, onEdit, onDelete }) {
  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading
          eyebrow="Service Plans"
          title="Kelola paket layanan dengan UI yang lebih modular"
          subtitle="Form dan daftar paket dipisah agar mudah dipindai di mobile."
          actions={<SecondaryButton onClick={onRefresh}>Refresh</SecondaryButton>}
        />
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <SectionHeading eyebrow="Plan List" title="Daftar paket" />
          <div className="mt-4 grid gap-3">
            {plans.length ? (
              plans.map((plan) => (
                <article key={plan.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(28,71,124,0.08)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <strong className="text-sm font-bold text-slate-900">{plan.name}</strong>
                      <p className="mt-1 text-xs text-slate-500">
                        {plan.code} • {plan.downloadMbps}/{plan.uploadMbps} Mbps
                      </p>
                    </div>
                    <Pill status={plan.isActive ? "active" : "inactive"} label={plan.isActive ? "Aktif" : "Nonaktif"} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <strong className="text-lg font-black tracking-[-0.04em] text-slate-900">{formatCurrency(plan.priceMonthly)}</strong>
                    <div className="flex flex-wrap gap-2">
                      <SecondaryButton onClick={() => onEdit(plan.id)}>Edit</SecondaryButton>
                      <SecondaryButton className="!bg-rose-50 !text-rose-600" onClick={() => onDelete(plan.id)}>
                        Nonaktifkan
                      </SecondaryButton>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="Belum ada service plan." />
            )}
          </div>
        </Card>

        <Card className="xl:sticky xl:top-24 xl:self-start">
          <SectionHeading eyebrow="Plan Form" title={editingId ? "Edit Paket" : "Input Paket Baru"} />
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Kode Paket">
              <Input value={form.code} onChange={(event) => onFormChange((current) => ({ ...current, code: event.target.value }))} required />
            </Field>
            <Field label="Nama Paket">
              <Input value={form.name} onChange={(event) => onFormChange((current) => ({ ...current, name: event.target.value }))} required />
            </Field>
            <Field label="Download Mbps">
              <Input type="number" value={form.downloadMbps} onChange={(event) => onFormChange((current) => ({ ...current, downloadMbps: event.target.value }))} required />
            </Field>
            <Field label="Upload Mbps">
              <Input type="number" value={form.uploadMbps} onChange={(event) => onFormChange((current) => ({ ...current, uploadMbps: event.target.value }))} required />
            </Field>
            <Field label="Harga Bulanan">
              <Input type="number" min="1" step="0.01" value={form.priceMonthly} onChange={(event) => onFormChange((current) => ({ ...current, priceMonthly: event.target.value }))} required />
            </Field>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange((current) => ({ ...current, isActive: event.target.checked }))} />
              <span>Paket aktif</span>
            </label>
            <Field label="Deskripsi" className="md:col-span-2">
              <Textarea value={form.description} onChange={(event) => onFormChange((current) => ({ ...current, description: event.target.value }))} />
            </Field>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <PrimaryButton type="submit">{editingId ? "Update Paket" : "Simpan Paket"}</PrimaryButton>
              {editingId ? (
                <SecondaryButton type="button" onClick={onResetEdit}>
                  Batal Edit
                </SecondaryButton>
              ) : null}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
