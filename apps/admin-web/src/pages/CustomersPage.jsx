import { BadgeDollarSign, CheckCircle2, UsersRound, X } from "lucide-react";
import { formatDate, getCustomerStatusLabel } from "../lib/formatters.js";
import { Card, EmptyState, Field, Input, Pill, PrimaryButton, SecondaryButton, SectionHeading, Select, StatCard, Textarea } from "../components/ui.jsx";

export function CustomersPage({
  data,
  form,
  editingId,
  onFormChange,
  onFiltersChange,
  onSubmit,
  onResetEdit,
  onApplyFilters,
  onResetFilters,
  onPrevPage,
  onNextPage,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading eyebrow="Customers" title="Customer module yang lebih rapi dan operasional" subtitle="List dan form dipisah supaya tetap nyaman dibaca di layar kecil." />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Customer" value={String(data.meta.totalItems || 0)} tone="blue" icon={UsersRound} />
          <StatCard label="Active" value={String(data.items.filter((item) => item.status === "active").length)} tone="emerald" icon={CheckCircle2} />
          <StatCard label="Suspended" value={String(data.items.filter((item) => item.status === "suspended").length)} tone="amber" icon={BadgeDollarSign} />
          <StatCard label="Terminated" value={String(data.items.filter((item) => item.status === "terminated").length)} tone="rose" icon={X} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <SectionHeading eyebrow="Customer List" title="Customer list" />
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              onApplyFilters();
            }}
          >
            <Field label="Cari Customer">
              <Input value={data.filters.q} onChange={(event) => onFiltersChange((current) => ({ ...current, filters: { ...current.filters, q: event.target.value } }))} placeholder="Customer ID, nama, telepon" />
            </Field>
            <Field label="Status">
              <Select value={data.filters.status} onChange={(event) => onFiltersChange((current) => ({ ...current, filters: { ...current.filters, status: event.target.value } }))}>
                <option value="">Semua status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <PrimaryButton type="submit">Terapkan Filter</PrimaryButton>
              <SecondaryButton type="button" onClick={onResetFilters}>
                Reset
              </SecondaryButton>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Menampilkan {data.items.length} dari {data.meta.totalItems} customer • Halaman {data.meta.page}/{data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <SecondaryButton type="button" onClick={onPrevPage} disabled={!data.meta.hasPrevPage}>
                Sebelumnya
              </SecondaryButton>
              <SecondaryButton type="button" onClick={onNextPage} disabled={!data.meta.hasNextPage}>
                Berikutnya
              </SecondaryButton>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {data.items.length ? (
              data.items.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(28,71,124,0.08)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <strong className="text-sm font-bold text-slate-900">{item.customerCode}</strong>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{item.fullName}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.phone} • {formatDate(item.activatedAt)}
                      </p>
                    </div>
                    <Pill status={item.status} label={getCustomerStatusLabel(item.status)} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SecondaryButton type="button" onClick={() => onView(item.id)}>
                      Detail
                    </SecondaryButton>
                    <SecondaryButton type="button" onClick={() => onEdit(item.id)}>
                      Edit
                    </SecondaryButton>
                    {item.status !== "terminated" ? (
                      <SecondaryButton type="button" className="!bg-rose-50 !text-rose-600" onClick={() => onDelete(item.id)}>
                        Terminasi
                      </SecondaryButton>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="Belum ada data customer." />
            )}
          </div>
        </Card>

        <Card className="xl:sticky xl:top-24 xl:self-start">
          <SectionHeading eyebrow="Customer Form" title={editingId ? "Edit Customer" : "Pilih customer untuk update"} />
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Customer ID">
              <Input value={form.customerCode} disabled />
            </Field>
            <Field label="Nama Lengkap">
              <Input value={form.fullName} onChange={(event) => onFormChange((current) => ({ ...current, fullName: event.target.value }))} disabled={!editingId} required={Boolean(editingId)} />
            </Field>
            <Field label="No. Telepon">
              <Input value={form.phone} onChange={(event) => onFormChange((current) => ({ ...current, phone: event.target.value }))} disabled={!editingId} required={Boolean(editingId)} />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(event) => onFormChange((current) => ({ ...current, email: event.target.value }))} type="email" disabled={!editingId} />
            </Field>
            <Field label="No. Identitas">
              <Input value={form.identityNo} onChange={(event) => onFormChange((current) => ({ ...current, identityNo: event.target.value }))} disabled={!editingId} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(event) => onFormChange((current) => ({ ...current, status: event.target.value }))} disabled={!editingId}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </Select>
            </Field>
            <Field label="Catatan" className="md:col-span-2">
              <Textarea value={form.notes} onChange={(event) => onFormChange((current) => ({ ...current, notes: event.target.value }))} disabled={!editingId} />
            </Field>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <PrimaryButton type="submit" disabled={!editingId}>
                Simpan Perubahan
              </PrimaryButton>
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
