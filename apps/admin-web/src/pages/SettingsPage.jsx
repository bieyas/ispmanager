import { Compass, Save } from "lucide-react";
import { Card, Field, Input, PrimaryButton, SectionHeading } from "../components/ui.jsx";

export function SettingsPage({ form, onChange, onSubmit, isSaving }) {
  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading
          eyebrow="Pengaturan Umum"
          title="Titik awal map aplikasi"
          subtitle="Nilai ini dipakai sebagai pusat awal map picker prospect saat koordinat belum diisi."
        />
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Latitude Default">
              <Input type="number" step="0.000001" value={form.latitude} onChange={(event) => onChange((current) => ({ ...current, latitude: event.target.value }))} required />
            </Field>
            <Field label="Longitude Default">
              <Input type="number" step="0.000001" value={form.longitude} onChange={(event) => onChange((current) => ({ ...current, longitude: event.target.value }))} required />
            </Field>
            <Field label="Zoom Default">
              <Input type="number" min="1" max="19" value={form.zoom} onChange={(event) => onChange((current) => ({ ...current, zoom: event.target.value }))} required />
            </Field>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Simpan koordinat pusat area operasional utama agar marker prospect baru langsung mengarah ke area kerja tim.
            </div>
            <div className="md:col-span-2">
              <PrimaryButton type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
              </PrimaryButton>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Preview</p>
              <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-white">Default Map Center</h3>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Latitude</span>
              <strong className="mt-2 block text-2xl font-black tracking-[-0.04em] text-white">{form.latitude || "-"}</strong>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Longitude</span>
              <strong className="mt-2 block text-2xl font-black tracking-[-0.04em] text-white">{form.longitude || "-"}</strong>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Zoom</span>
              <strong className="mt-2 block text-2xl font-black tracking-[-0.04em] text-white">{form.zoom || "-"}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
