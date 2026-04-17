import { Card, PrimaryButton, SecondaryButton } from "../ui.jsx";
import { Modal } from "../overlay.jsx";

export function ActivationResultModal({ result, onClose }) {
  return (
    <Modal
      open={Boolean(result)}
      title={result ? `Customer ${result.customer.customerCode} berhasil dibuat` : ""}
      subtitle="Aktivasi selesai dan akun portal pelanggan sudah dibuat."
      onClose={onClose}
    >
      {result ? (
        <div className="grid gap-3">
          <Card className="p-4">
            <div className="grid gap-3 text-sm">
              <div>
                <span className="text-slate-400">Customer ID</span>
                <strong className="block text-slate-900">{result.customer.customerCode}</strong>
              </div>
              <div>
                <span className="text-slate-400">Portal Username</span>
                <strong className="block text-slate-900">{result.customerUser.username}</strong>
              </div>
              <div>
                <span className="text-slate-400">Temporary Password</span>
                <strong className="block text-slate-900">{result.customerUser.temporaryPassword}</strong>
              </div>
              <div>
                <span className="text-slate-400">Invoice Awal</span>
                <strong className="block text-slate-900">{result.invoice.invoiceNo}</strong>
              </div>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={() => navigator.clipboard.writeText(result.customer.customerCode)}>Copy Customer ID</SecondaryButton>
            <PrimaryButton onClick={() => navigator.clipboard.writeText(result.customerUser.temporaryPassword)}>Copy Password Portal</PrimaryButton>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
