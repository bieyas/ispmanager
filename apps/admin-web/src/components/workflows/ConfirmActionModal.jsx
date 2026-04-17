import { PrimaryButton, SecondaryButton } from "../ui.jsx";
import { Modal } from "../overlay.jsx";

export function ConfirmActionModal({ modal, onClose, onConfirm }) {
  return (
    <Modal open={modal.open} title={modal.title} subtitle={modal.subtitle} onClose={onClose}>
      <div className="grid gap-4">
        <div className="rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {modal.message}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <SecondaryButton type="button" onClick={onClose}>
            Batal
          </SecondaryButton>
          <PrimaryButton type="button" className="from-rose-500 to-orange-400 shadow-rose-500/20" onClick={onConfirm}>
            {modal.confirmLabel || "Lanjutkan"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
