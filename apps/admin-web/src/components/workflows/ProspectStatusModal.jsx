import { Field, PrimaryButton, SecondaryButton, Select, Input, Textarea } from "../ui.jsx";
import { Modal } from "../overlay.jsx";
import { getProspectStatusLabel } from "../../lib/formatters.js";

const statusOptions = ["prospect", "surveyed", "scheduled_installation", "installed", "cancelled", "rejected"];

export function ProspectStatusModal({ modal, form, error, onChange, onClose, onSubmit }) {
  const selectedStatus = form.status;

  return (
    <Modal open={modal.open} title="Update Status Prospect" subtitle={modal.prospectName ? `Ubah status untuk ${modal.prospectName}.` : "Ubah status prospect dan lengkapi field wajib sesuai status."} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Status saat ini: <strong className="text-slate-900">{getProspectStatusLabel(form.currentStatus)}</strong>
        </div>

        <Field label="Status Baru">
          <Select value={form.status} onChange={(event) => onChange((current) => ({ ...current, status: event.target.value }))}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {getProspectStatusLabel(status)}
              </option>
            ))}
          </Select>
        </Field>

        {selectedStatus === "surveyed" ? (
          <Field label="Tanggal Survey">
            <Input type="date" value={form.surveyDate} onChange={(event) => onChange((current) => ({ ...current, surveyDate: event.target.value }))} required />
          </Field>
        ) : null}

        {selectedStatus === "installed" ? (
          <>
            <Field label="Tanggal Instalasi">
              <Input type="date" value={form.installationDate} onChange={(event) => onChange((current) => ({ ...current, installationDate: event.target.value }))} required />
            </Field>
            <Field label="SN / Serial Number ONU">
              <Input value={form.onuSerialNumber} onChange={(event) => onChange((current) => ({ ...current, onuSerialNumber: event.target.value }))} placeholder="Contoh: ZTEGC1234567" required />
            </Field>
          </>
        ) : null}

        {selectedStatus === "cancelled" || selectedStatus === "rejected" ? (
          <Field label="Alasan">
            <Textarea value={form.statusReason} onChange={(event) => onChange((current) => ({ ...current, statusReason: event.target.value }))} placeholder="Tuliskan alasan perubahan status." required />
          </Field>
        ) : null}

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Batal
          </SecondaryButton>
          <PrimaryButton type="submit">Simpan Status</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
