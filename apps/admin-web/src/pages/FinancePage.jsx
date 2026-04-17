import { ArrowDownLeft, ArrowUpRight, BadgeDollarSign, BarChart3 } from "lucide-react";
import { formatCurrency, formatDate } from "../lib/formatters.js";
import { Card, EmptyState, Field, Input, Pill, PrimaryButton, SecondaryButton, SectionHeading, Select, StatCard, Textarea } from "../components/ui.jsx";

export function FinancePage({
  data,
  categories,
  cashForm,
  pendingCashOut,
  editingCashId,
  onCashFormChange,
  onFiltersChange,
  onSubmit,
  onResetEdit,
  onApplyFilters,
  onResetFilters,
  onQuickRange,
  onExportCsv,
  onExportPdf,
  onView,
  onEdit,
  onConfirm,
  onDelete,
}) {
  const finance = data.summary?.finance || {};
  const categoriesForForm = categories.filter((category) => category.type === cashForm.type);

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading
          eyebrow="Finance"
          title="Cashflow yang lebih nyaman dibaca"
          subtitle="Summary ringkas, approval terpisah, dan transaksi manual tetap mudah dipakai di mobile."
          actions={
            <>
              <SecondaryButton onClick={onExportCsv}>Export CSV</SecondaryButton>
              <SecondaryButton onClick={onExportPdf}>Export PDF</SecondaryButton>
            </>
          }
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Kas Masuk Hari Ini" value={formatCurrency(finance.cashInToday)} tone="blue" icon={ArrowDownLeft} />
          <StatCard label="Kas Keluar Hari Ini" value={formatCurrency(finance.cashOutToday)} tone="rose" icon={ArrowUpRight} />
          <StatCard label="Net Cash Bulan Ini" value={formatCurrency(finance.netCashMonth)} tone="emerald" icon={BarChart3} />
          <StatCard label="Subscription Income" value={formatCurrency(finance.subscriptionIncomeMonth)} tone="amber" icon={BadgeDollarSign} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <SectionHeading eyebrow="Cash Transactions" title="Filter dan list transaksi" />
          <div className="mt-4 flex flex-wrap gap-2">
            <SecondaryButton onClick={() => onQuickRange("today")}>Hari Ini</SecondaryButton>
            <SecondaryButton onClick={() => onQuickRange("7days")}>7 Hari</SecondaryButton>
            <SecondaryButton onClick={() => onQuickRange("month")}>Bulan Ini</SecondaryButton>
          </div>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              onApplyFilters();
            }}
          >
            <Field label="Tanggal Mulai">
              <Input type="date" value={data.filters.dateFrom} onChange={(event) => onFiltersChange((current) => ({ ...current, filters: { ...current.filters, dateFrom: event.target.value } }))} />
            </Field>
            <Field label="Tanggal Akhir">
              <Input type="date" value={data.filters.dateTo} onChange={(event) => onFiltersChange((current) => ({ ...current, filters: { ...current.filters, dateTo: event.target.value } }))} />
            </Field>
            <Field label="Kategori">
              <Select value={data.filters.categoryCode} onChange={(event) => onFiltersChange((current) => ({ ...current, filters: { ...current.filters, categoryCode: event.target.value } }))}>
                <option value="">Semua kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.code}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={data.filters.status} onChange={(event) => onFiltersChange((current) => ({ ...current, filters: { ...current.filters, status: event.target.value } }))}>
                <option value="">Semua status</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>
            <Field label="Tipe">
              <Select value={data.filters.type} onChange={(event) => onFiltersChange((current) => ({ ...current, filters: { ...current.filters, type: event.target.value } }))}>
                <option value="">Semua tipe</option>
                <option value="cash_in">Cash In</option>
                <option value="cash_out">Cash Out</option>
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2 md:items-end">
              <PrimaryButton type="submit">Terapkan Filter</PrimaryButton>
              <SecondaryButton type="button" onClick={onResetFilters}>
                Reset
              </SecondaryButton>
            </div>
          </form>
          <div className="mt-4 grid gap-3">
            {data.cashTransactions.length ? (
              data.cashTransactions.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(28,71,124,0.08)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <strong className="text-sm font-bold text-slate-900">{item.transactionNo}</strong>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.keterangan || "-"} • {item.cashCategory.name}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {formatDate(item.transactionDate)} • {item.method}
                      </p>
                    </div>
                    <div className="grid justify-items-end gap-2">
                      {item.paymentId || item.payment ? <Pill status="source-auto" label="Auto-post" /> : <Pill status="source-manual" label="Manual" />}
                      <Pill status={item.status} label={item.status} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <strong className="text-lg font-black tracking-[-0.04em] text-slate-900">{formatCurrency(item.amount)}</strong>
                    <div className="flex flex-wrap gap-2">
                      <SecondaryButton onClick={() => onView(item.id)}>Detail</SecondaryButton>
                      {!item.paymentId && !item.payment && item.status === "draft" ? (
                        <>
                          <SecondaryButton onClick={() => onEdit(item.id)}>Edit</SecondaryButton>
                          <PrimaryButton onClick={() => onConfirm(item.id)}>Confirm</PrimaryButton>
                          <SecondaryButton className="!bg-rose-50 !text-rose-600" onClick={() => onDelete(item.id)}>
                            Cancel
                          </SecondaryButton>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="Belum ada transaksi kas." />
            )}
          </div>
        </Card>

        <div className="grid gap-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <SectionHeading eyebrow="Manual Entry" title={editingCashId ? "Edit Draft Kas" : "Input Kas Manual"} />
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
              <Field label="Tanggal">
                <Input type="date" value={cashForm.transactionDate} onChange={(event) => onCashFormChange((current) => ({ ...current, transactionDate: event.target.value }))} required />
              </Field>
              <Field label="Tipe">
                <Select value={cashForm.type} onChange={(event) => onCashFormChange((current) => ({ ...current, type: event.target.value, cashCategoryId: "" }))}>
                  <option value="cash_in">Cash In</option>
                  <option value="cash_out">Cash Out</option>
                </Select>
              </Field>
              <Field label="Kategori">
                <Select value={cashForm.cashCategoryId} onChange={(event) => onCashFormChange((current) => ({ ...current, cashCategoryId: event.target.value }))} required>
                  <option value="">Pilih kategori</option>
                  {categoriesForForm.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Metode">
                <Input value={cashForm.method} onChange={(event) => onCashFormChange((current) => ({ ...current, method: event.target.value }))} required />
              </Field>
              <Field label="Jumlah">
                <Input type="number" min="1" step="0.01" value={cashForm.amount} onChange={(event) => onCashFormChange((current) => ({ ...current, amount: event.target.value }))} required />
              </Field>
              <Field label="Reference No">
                <Input value={cashForm.referenceNo} onChange={(event) => onCashFormChange((current) => ({ ...current, referenceNo: event.target.value }))} />
              </Field>
              <Field label="Keterangan" className="md:col-span-2">
                <Input value={cashForm.keterangan} onChange={(event) => onCashFormChange((current) => ({ ...current, keterangan: event.target.value }))} required />
              </Field>
              <Field label="Deskripsi" className="md:col-span-2">
                <Textarea value={cashForm.description} onChange={(event) => onCashFormChange((current) => ({ ...current, description: event.target.value }))} />
              </Field>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <PrimaryButton type="submit">{editingCashId ? "Update Draft Kas" : "Simpan Draft Kas"}</PrimaryButton>
                {editingCashId ? (
                  <SecondaryButton type="button" onClick={onResetEdit}>
                    Batal Edit
                  </SecondaryButton>
                ) : null}
              </div>
            </form>
          </Card>

          <Card>
            <SectionHeading eyebrow="Approval Queue" title="Cash Out Draft" />
            <div className="mt-4 grid gap-3">
              {pendingCashOut.length ? (
                pendingCashOut.map((item) => (
                  <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(28,71,124,0.08)]">
                    <strong className="text-sm font-bold text-slate-900">
                      {item.transactionNo} • {formatCurrency(item.amount)}
                    </strong>
                    <p className="mt-1 text-xs text-slate-500">{item.keterangan}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <SecondaryButton onClick={() => onView(item.id)}>Detail</SecondaryButton>
                      <SecondaryButton onClick={() => onEdit(item.id)}>Edit</SecondaryButton>
                      <PrimaryButton onClick={() => onConfirm(item.id)}>Confirm</PrimaryButton>
                      <SecondaryButton className="!bg-rose-50 !text-rose-600" onClick={() => onDelete(item.id)}>
                        Cancel
                      </SecondaryButton>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState message="Tidak ada cash out draft yang menunggu approval." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
