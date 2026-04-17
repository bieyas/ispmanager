import { PrimaryButton, SecondaryButton, Textarea } from "../ui.jsx";
import { Modal } from "../overlay.jsx";

export function ApprovalNoteModal({ modal, approvalNote, approvalError, setApprovalNote, onClose, onSubmit }) {
  return (
    <Modal open={modal.open} title={modal.title} subtitle={modal.subtitle} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Catatan Approval</span>
          <Textarea value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} placeholder="Contoh: Disetujui untuk pembelian material site A." />
        </label>
        {approvalError ? <p className="text-sm text-rose-500">{approvalError}</p> : null}
        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="submit">{modal.submitLabel}</PrimaryButton>
          <SecondaryButton type="button" onClick={onClose}>
            Batal
          </SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}
