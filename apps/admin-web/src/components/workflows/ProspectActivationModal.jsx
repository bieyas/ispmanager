import { PrimaryButton, SecondaryButton } from "../ui.jsx";
import { Modal } from "../overlay.jsx";

export function ProspectActivationModal({ modal, payload, status, setPayload, setStatus, onClose, onSubmit }) {
  return (
    <Modal
      open={modal.open}
      title="Aktivasi Prospect"
      subtitle="Prospect harus berstatus installed sebelum bisa diaktivasi."
      onClose={() => {
        onClose();
        setStatus("");
      }}
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Tanggal Aktivasi</span>
          <input
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-blue-300"
            type="date"
            value={payload.activationDate}
            onChange={(event) => setPayload((current) => ({ ...current, activationDate: event.target.value }))}
          />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <input type="checkbox" checked={payload.prorateEnabled} onChange={(event) => setPayload((current) => ({ ...current, prorateEnabled: event.target.checked }))} />
          <span>Gunakan prorata untuk periode pertama</span>
        </label>
        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Override Jatuh Tempo</span>
          <input
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-blue-300"
            type="date"
            value={payload.firstDueDateOverride}
            onChange={(event) => setPayload((current) => ({ ...current, firstDueDateOverride: event.target.value }))}
          />
        </label>
        {status ? <p className="text-sm text-rose-500">{status}</p> : null}
        <div className="flex gap-2">
          <PrimaryButton type="submit">Aktivasi Sekarang</PrimaryButton>
          <SecondaryButton type="button" onClick={onClose}>
            Batal
          </SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}
