import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Crosshair, Eye, Pencil, Plus, Search, Settings2, Trash2, UserRoundPlus } from "lucide-react";
import { defaultMapView } from "../lib/constants.js";
import { formatCurrency, formatDate, getProspectStatusLabel } from "../lib/formatters.js";
import { Card, EmptyState, Field, IconButton, Input, Pill, PrimaryButton, SecondaryButton, SectionHeading, Select, StatCard, Textarea } from "../components/ui.jsx";
import { Modal } from "../components/overlay.jsx";
import { MapPicker } from "../components/MapPicker.jsx";

export function ProspectsPage({
  data,
  form,
  defaultMapCenter = defaultMapView,
  isLocating = false,
  editingId,
  isFormModalOpen,
  servicePlans,
  onFormChange,
  onFiltersChange,
  onUseMyLocation,
  onMapPick,
  onOpenCreate,
  onCloseForm,
  onSubmit,
  onResetEdit,
  onQuickSearch,
  onStatusFilterChange,
  onResetFilters,
  onSortChange,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
  onView,
  onEdit,
  onDelete,
  onOpenStatus,
  onActivate,
}) {
  const [searchTerm, setSearchTerm] = useState(data.filters.q || "");
  const [mapReady, setMapReady] = useState(false);
  const sortLabels = {
    createdAt: "Dibuat",
    fullName: "Pelanggan",
    city: "Lokasi",
    installationDate: "Pemasangan",
    status: "Status",
  };

  function renderSortIcon(columnKey) {
    if (data.filters.sortBy !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }

    return data.filters.sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  }

  useEffect(() => {
    setSearchTerm(data.filters.q || "");
  }, [data.filters.q]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchTerm !== data.filters.q) {
        onQuickSearch(searchTerm);
      }
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [data.filters.q, onQuickSearch, searchTerm]);

  useEffect(() => {
    if (!isFormModalOpen) {
      setMapReady(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMapReady(true);
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [isFormModalOpen]);

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading
          // eyebrow="Prospects"
          title="Daftar PSB"
          // subtitle="List, filter, form, dan map picker dipisah agar halaman tidak terasa penuh."
          actions={
            <PrimaryButton type="button" onClick={onOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Prospect
            </PrimaryButton>
          }
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Prospect" value={String(Object.values(data.summary || {}).reduce((a, b) => a + Number(b || 0), 0))} tone="blue" icon={UserRoundPlus} />
          <StatCard label="Need Survey" value={String(data.summary.prospect || 0)} tone="amber" icon={Search} />
          <StatCard label="Scheduled" value={String(data.summary.scheduled_installation || 0)} tone="blue" icon={Settings2} />
          <StatCard label="Ready Activate" value={String(data.summary.installed || 0)} tone="emerald" icon={CheckCircle2} />
        </div>
      </Card>

      <Card>
        <SectionHeading /* eyebrow="Prospect List" */ title="Quick search & server-side pagination" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_0.85fr_0.85fr_0.72fr_auto] xl:items-end">
          <Field label="Cari Prospect">
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nama, telepon, kota, alamat" />
          </Field>
          <Field label="Status">
            <Select value={data.filters.status} onChange={(event) => onStatusFilterChange(event.target.value)}>
              <option value="">Semua status</option>
              <option value="prospect">Prospect</option>
              <option value="surveyed">Surveyed</option>
              <option value="scheduled_installation">Scheduled</option>
              <option value="installed">Installed</option>
              <option value="activated">Activated</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Field>
          <Field label="Urutkan">
            <Select
              value={`${data.filters.sortBy}:${data.filters.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(":");
                onSortChange(sortBy, sortOrder);
              }}
            >
              <option value="createdAt:desc">Terbaru dulu</option>
              <option value="createdAt:asc">Terlama dulu</option>
              <option value="fullName:asc">Nama A-Z</option>
              <option value="fullName:desc">Nama Z-A</option>
              <option value="city:asc">Kota A-Z</option>
              <option value="city:desc">Kota Z-A</option>
              <option value="installationDate:asc">Pemasangan paling awal</option>
              <option value="installationDate:desc">Pemasangan paling akhir</option>
              <option value="status:asc">Status A-Z</option>
              <option value="status:desc">Status Z-A</option>
            </Select>
          </Field>
          <Field label="Baris / halaman">
            <Select value={String(data.filters.pageSize)} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
              <option value="6">6</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton type="button" onClick={onResetFilters}>
              Reset
            </SecondaryButton>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Menampilkan {data.items.length} dari {data.meta.totalItems} prospect • Halaman {data.meta.page}/{data.meta.totalPages}
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

        <div className="mt-4 hidden overflow-hidden rounded-[26px] border border-slate-200 lg:block">
          {data.items.length ? (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <button className="inline-flex items-center gap-1.5 text-left" type="button" onClick={() => onSortChange("fullName")}>
                      Pelanggan
                      {renderSortIcon("fullName")}
                    </button>
                  </th>
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">
                    <button className="inline-flex items-center gap-1.5 text-left" type="button" onClick={() => onSortChange("city")}>
                      Lokasi
                      {renderSortIcon("city")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button className="inline-flex items-center gap-1.5 text-left" type="button" onClick={() => onSortChange("installationDate")}>
                      Pemasangan
                      {renderSortIcon("installationDate")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button className="inline-flex items-center gap-1.5 text-left" type="button" onClick={() => onSortChange("status")}>
                      Status
                      {renderSortIcon("status")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <strong className="block truncate font-bold text-slate-900">{item.fullName}</strong>
                        <p className="mt-1 text-xs text-slate-500">{item.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.servicePlan?.name || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{item.city || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(item.installationDate)}</td>
                    <td className="px-4 py-4">
                      <Pill status={item.status} label={getProspectStatusLabel(item.status)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <IconButton type="button" className="text-blue-600 ring-blue-100 hover:bg-blue-50 hover:text-blue-700" onClick={() => onView(item.id)} aria-label={`Detail ${item.fullName}`}>
                          <Eye className="h-4 w-4" />
                        </IconButton>
                          <IconButton type="button" className="text-amber-600 ring-amber-100 hover:bg-amber-50 hover:text-amber-700" onClick={() => onEdit(item.id)} aria-label={`Edit ${item.fullName}`}>
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <SecondaryButton type="button" onClick={() => onOpenStatus(item.id)}>
                            Status
                          </SecondaryButton>
                          {item.status !== "activated" ? (
                            <IconButton type="button" className="text-rose-600 ring-rose-100 hover:bg-rose-50 hover:text-rose-700" onClick={() => onDelete(item.id)} aria-label={`Hapus ${item.fullName}`}>
                              <Trash2 className="h-4 w-4" />
                          </IconButton>
                        ) : null}
                        {item.status === "installed" ? (
                          <PrimaryButton type="button" onClick={() => onActivate(item.id)}>
                            Aktivasi
                          </PrimaryButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4">
              <EmptyState message="Belum ada data prospect." />
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 lg:hidden">
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Urutan aktif: {sortLabels[data.filters.sortBy] || "Dibuat"} {data.filters.sortOrder === "asc" ? "naik" : "turun"}
          </div>
          {data.items.length ? (
            data.items.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(28,71,124,0.08)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <strong className="text-sm font-bold text-slate-900">{item.fullName}</strong>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.phone} • {item.servicePlan?.name || "-"}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {item.city || "-"} • {formatDate(item.installationDate)}
                    </p>
                  </div>
                  <Pill status={item.status} label={getProspectStatusLabel(item.status)} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <IconButton type="button" className="text-blue-600 ring-blue-100 hover:bg-blue-50 hover:text-blue-700" onClick={() => onView(item.id)} aria-label={`Detail ${item.fullName}`}>
                    <Eye className="h-4 w-4" />
                  </IconButton>
                  <IconButton type="button" className="text-amber-600 ring-amber-100 hover:bg-amber-50 hover:text-amber-700" onClick={() => onEdit(item.id)} aria-label={`Edit ${item.fullName}`}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <SecondaryButton type="button" onClick={() => onOpenStatus(item.id)}>
                    Status
                  </SecondaryButton>
                  {item.status === "installed" ? (
                    <PrimaryButton type="button" onClick={() => onActivate(item.id)}>
                      Aktivasi
                    </PrimaryButton>
                  ) : null}
                  {item.status !== "activated" ? (
                    <IconButton type="button" className="text-rose-600 ring-rose-100 hover:bg-rose-50 hover:text-rose-700" onClick={() => onDelete(item.id)} aria-label={`Hapus ${item.fullName}`}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <EmptyState message="Belum ada data prospect." />
          )}
        </div>
      </Card>

      <Modal
        open={isFormModalOpen}
        title={editingId ? "Edit Prospect" : "Input Prospect Baru"}
        subtitle="Gunakan modal ini untuk menjaga halaman prospect tetap fokus pada list dan pencarian."
        onClose={() => {
          onResetEdit();
          onCloseForm();
        }}
      >
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nama Lengkap">
              <Input value={form.fullName} onChange={(event) => onFormChange((current) => ({ ...current, fullName: event.target.value }))} required />
            </Field>
            <Field label="No. Telepon">
              <Input value={form.phone} onChange={(event) => onFormChange((current) => ({ ...current, phone: event.target.value }))} required />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(event) => onFormChange((current) => ({ ...current, email: event.target.value }))} type="email" />
            </Field>
            <Field label="No. Identitas">
              <Input value={form.identityNo} onChange={(event) => onFormChange((current) => ({ ...current, identityNo: event.target.value }))} />
            </Field>
            <Field label="Paket Langganan">
              <Select value={form.servicePlanId} onChange={(event) => onFormChange((current) => ({ ...current, servicePlanId: event.target.value }))} required>
                <option value="">Pilih paket</option>
                {servicePlans
                  .filter((plan) => plan.isActive !== false)
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} • {formatCurrency(plan.priceMonthly)}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Tanggal Pemasangan">
              <Input type="date" value={form.installationDate} onChange={(event) => onFormChange((current) => ({ ...current, installationDate: event.target.value }))} />
            </Field>
            <Field label="Alamat" className="md:col-span-2">
              <Input value={form.addressLine} onChange={(event) => onFormChange((current) => ({ ...current, addressLine: event.target.value }))} required />
            </Field>
            <Field label="Kelurahan / Desa">
              <Input value={form.village} onChange={(event) => onFormChange((current) => ({ ...current, village: event.target.value }))} />
            </Field>
            <Field label="Kecamatan">
              <Input value={form.district} onChange={(event) => onFormChange((current) => ({ ...current, district: event.target.value }))} />
            </Field>
            <Field label="Kota / Kabupaten">
              <Input value={form.city} onChange={(event) => onFormChange((current) => ({ ...current, city: event.target.value }))} />
            </Field>
            <Field label="Provinsi">
              <Input value={form.province} onChange={(event) => onFormChange((current) => ({ ...current, province: event.target.value }))} />
            </Field>
            <Field label="Latitude">
              <Input value={form.latitude} onChange={(event) => onFormChange((current) => ({ ...current, latitude: event.target.value }))} />
            </Field>
            <Field label="Longitude">
              <Input value={form.longitude} onChange={(event) => onFormChange((current) => ({ ...current, longitude: event.target.value }))} />
            </Field>
            <Field label="Catatan" className="md:col-span-2">
              <Textarea value={form.notes} onChange={(event) => onFormChange((current) => ({ ...current, notes: event.target.value }))} />
            </Field>
          </div>

          <Card className="border-dashed bg-slate-50/70">
            <SectionHeading
              eyebrow="Map Picker"
              title="Koordinat & reverse geocoding"
              actions={
                <IconButton
                  type="button"
                  onClick={onUseMyLocation}
                  disabled={isLocating}
                  aria-label="Gunakan lokasi saya"
                  title={isLocating ? "Sedang mengambil lokasi..." : "Gunakan lokasi saya"}
                  className="text-blue-600 ring-blue-100 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Crosshair className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
                </IconButton>
              }
            />
            <div className="mt-4">
              {mapReady ? (
                <MapPicker latitude={form.latitude} longitude={form.longitude} onPick={onMapPick} defaultCenter={defaultMapCenter} />
              ) : (
                <div className="flex h-72 items-center justify-center rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(226,232,240,0.62),rgba(248,250,252,0.95))] text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Menyiapkan map…
                </div>
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Klik peta untuk isi koordinat. Sistem akan mencoba mengisi alamat otomatis dari titik map.</p>
          </Card>

          <div className="sticky bottom-0 -mx-1 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white/95 px-1 pt-3 backdrop-blur">
            <SecondaryButton
              type="button"
              onClick={() => {
                onResetEdit();
                onCloseForm();
              }}
            >
              Tutup
            </SecondaryButton>
            <PrimaryButton type="submit">{editingId ? "Update Prospect" : "Simpan Prospect"}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
