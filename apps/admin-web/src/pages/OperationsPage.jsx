import { CheckCircle2, ClipboardCheck, LifeBuoy, Wrench } from "lucide-react";
import { formatDate, getTicketStatusLabel, getVerificationStatusLabel, getWorkOrderStatusLabel } from "../lib/formatters.js";
import { Card, EmptyState, Field, Input, Pill, PrimaryButton, SecondaryButton, SectionHeading, Select, StatCard, Textarea } from "../components/ui.jsx";

export function OperationsPage({
  tickets,
  workOrders,
  verifications,
  lookups,
  ticketForm,
  workOrderForm,
  verificationForm,
  attachmentForm,
  onTicketFormChange,
  onWorkOrderFormChange,
  onVerificationFormChange,
  onAttachmentFormChange,
  onCreateTicket,
  onCreateWorkOrder,
  onSubmitVerification,
  onUploadAttachment,
  onViewTicket,
  onViewWorkOrder,
  onViewVerification,
  onCloseTicket,
  onCloseWorkOrder,
  onApproveVerification,
  onRejectVerification,
  onRefresh,
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading eyebrow="Field Ops" title="Operasional lapangan dan layanan" subtitle="UI minimum untuk memeriksa dan menjalankan workflow teknisi." actions={<SecondaryButton onClick={onRefresh}>Refresh</SecondaryButton>} />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <StatCard label="Tickets" value={String(tickets.length)} tone="blue" icon={LifeBuoy} />
          <StatCard label="Work Orders" value={String(workOrders.length)} tone="amber" icon={Wrench} />
          <StatCard label="Verifications" value={String(verifications.length)} tone="emerald" icon={ClipboardCheck} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <SectionHeading eyebrow="Tickets" title="Create ticket" />
          <form className="mt-4 grid gap-3" onSubmit={onCreateTicket}>
            <Field label="Customer">
              <Select value={ticketForm.customerId} onChange={(event) => onTicketFormChange((current) => ({ ...current, customerId: event.target.value }))} required>
                <option value="">Pilih customer</option>
                {lookups.customers.map((item) => <option key={item.id} value={item.id}>{item.customerCode} • {item.fullName}</option>)}
              </Select>
            </Field>
            <Field label="Subscription">
              <Select value={ticketForm.subscriptionId} onChange={(event) => onTicketFormChange((current) => ({ ...current, subscriptionId: event.target.value }))}>
                <option value="">Tanpa subscription</option>
                {lookups.subscriptions
                  .filter((item) => !ticketForm.customerId || item.customer?.id === ticketForm.customerId)
                  .map((item) => <option key={item.id} value={item.id}>{item.subscriptionNo} • {item.customer?.fullName}</option>)}
              </Select>
            </Field>
            <Field label="Category">
              <Select value={ticketForm.category} onChange={(event) => onTicketFormChange((current) => ({ ...current, category: event.target.value }))}>
                <option value="installation">Installation</option>
                <option value="trouble">Trouble</option>
                <option value="billing">Billing</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={ticketForm.priority} onChange={(event) => onTicketFormChange((current) => ({ ...current, priority: event.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field label="Subject"><Input value={ticketForm.subject} onChange={(event) => onTicketFormChange((current) => ({ ...current, subject: event.target.value }))} required /></Field>
            <Field label="Description"><Textarea value={ticketForm.description} onChange={(event) => onTicketFormChange((current) => ({ ...current, description: event.target.value }))} required /></Field>
            <PrimaryButton type="submit">Create Ticket</PrimaryButton>
          </form>
          <div className="mt-4 grid gap-3">
            {tickets.length ? tickets.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <strong className="text-sm font-bold text-slate-900">{item.ticketNo}</strong>
                <p className="mt-1 text-xs text-slate-500">{item.subject}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill status={item.status} label={getTicketStatusLabel(item.status)} />
                  <SecondaryButton onClick={() => onViewTicket(item.id)}>Detail</SecondaryButton>
                  {item.status !== "closed" ? <SecondaryButton onClick={() => onCloseTicket(item.id)} className="!bg-emerald-50 !text-emerald-600">Close</SecondaryButton> : null}
                </div>
              </article>
            )) : <EmptyState message="Belum ada ticket." />}
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Work Orders" title="Create work order" />
          <form className="mt-4 grid gap-3" onSubmit={onCreateWorkOrder}>
            <Field label="Source Type"><Input value={workOrderForm.sourceType} onChange={(event) => onWorkOrderFormChange((current) => ({ ...current, sourceType: event.target.value }))} required /></Field>
            <Field label="Prospect">
              <Select value={workOrderForm.prospectId} onChange={(event) => onWorkOrderFormChange((current) => ({ ...current, prospectId: event.target.value, sourceId: event.target.value || current.sourceId }))}>
                <option value="">Tanpa prospect</option>
                {lookups.prospects.map((item) => <option key={item.id} value={item.id}>{item.fullName} • {item.phone}</option>)}
              </Select>
            </Field>
            <Field label="Customer">
              <Select value={workOrderForm.customerId} onChange={(event) => onWorkOrderFormChange((current) => ({ ...current, customerId: event.target.value }))}>
                <option value="">Tanpa customer</option>
                {lookups.customers.map((item) => <option key={item.id} value={item.id}>{item.customerCode} • {item.fullName}</option>)}
              </Select>
            </Field>
            <Field label="Subscription">
              <Select value={workOrderForm.subscriptionId} onChange={(event) => onWorkOrderFormChange((current) => ({ ...current, subscriptionId: event.target.value, sourceId: event.target.value || current.sourceId }))}>
                <option value="">Tanpa subscription</option>
                {lookups.subscriptions
                  .filter((item) => !workOrderForm.customerId || item.customer?.id === workOrderForm.customerId)
                  .map((item) => <option key={item.id} value={item.id}>{item.subscriptionNo} • {item.customer?.fullName}</option>)}
              </Select>
            </Field>
            <Field label="Scheduled Date"><Input type="date" value={workOrderForm.scheduledDate} onChange={(event) => onWorkOrderFormChange((current) => ({ ...current, scheduledDate: event.target.value }))} /></Field>
            <Field label="Notes"><Textarea value={workOrderForm.notes} onChange={(event) => onWorkOrderFormChange((current) => ({ ...current, notes: event.target.value }))} /></Field>
            <PrimaryButton type="submit">Create Work Order</PrimaryButton>
          </form>
          <form className="mt-6 grid gap-3 border-t border-slate-100 pt-4" onSubmit={onUploadAttachment}>
            <Field label="Work Order">
              <Select value={attachmentForm.workOrderId} onChange={(event) => onAttachmentFormChange((current) => ({ ...current, workOrderId: event.target.value }))} required>
                <option value="">Pilih work order</option>
                {workOrders.map((item) => <option key={item.id} value={item.id}>{item.workOrderNo}</option>)}
              </Select>
            </Field>
            <Field label="Attachment">
              <Input
                type="file"
                onChange={(event) => onAttachmentFormChange((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                required
              />
            </Field>
            <PrimaryButton type="submit">Upload Attachment</PrimaryButton>
          </form>
          <div className="mt-4 grid gap-3">
            {workOrders.length ? workOrders.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <strong className="text-sm font-bold text-slate-900">{item.workOrderNo}</strong>
                <p className="mt-1 text-xs text-slate-500">{item.sourceType} • {formatDate(item.scheduledDate)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill status={item.status} label={getWorkOrderStatusLabel(item.status)} />
                  <SecondaryButton onClick={() => onViewWorkOrder(item.id)}>Detail</SecondaryButton>
                  {item.status !== "done" ? <SecondaryButton onClick={() => onCloseWorkOrder(item.id)} className="!bg-emerald-50 !text-emerald-600">Close</SecondaryButton> : null}
                </div>
              </article>
            )) : <EmptyState message="Belum ada work order." />}
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Verification" title="Submit installation verification" />
          <form className="mt-4 grid gap-3" onSubmit={onSubmitVerification}>
            <Field label="Prospect">
              <Select value={verificationForm.prospectId} onChange={(event) => onVerificationFormChange((current) => ({ ...current, prospectId: event.target.value }))} required>
                <option value="">Pilih prospect</option>
                {lookups.prospects.map((item) => <option key={item.id} value={item.id}>{item.fullName} • {item.phone}</option>)}
              </Select>
            </Field>
            <Field label="Work Order">
              <Select value={verificationForm.workOrderId} onChange={(event) => onVerificationFormChange((current) => ({ ...current, workOrderId: event.target.value }))} required>
                <option value="">Pilih work order</option>
                {workOrders
                  .filter((item) => !verificationForm.prospectId || item.prospect?.id === verificationForm.prospectId)
                  .map((item) => <option key={item.id} value={item.id}>{item.workOrderNo} • {item.prospect?.fullName || "-"}</option>)}
              </Select>
            </Field>
            <Field label="Checklist JSON"><Textarea value={verificationForm.checklistSnapshot} onChange={(event) => onVerificationFormChange((current) => ({ ...current, checklistSnapshot: event.target.value }))} required /></Field>
            <Field label="Device Serial JSON"><Textarea value={verificationForm.deviceSerialSnapshot} onChange={(event) => onVerificationFormChange((current) => ({ ...current, deviceSerialSnapshot: event.target.value }))} /></Field>
            <Field label="Signal JSON"><Textarea value={verificationForm.signalSnapshot} onChange={(event) => onVerificationFormChange((current) => ({ ...current, signalSnapshot: event.target.value }))} /></Field>
            <Field label="Photo Summary"><Input value={verificationForm.photoSummary} onChange={(event) => onVerificationFormChange((current) => ({ ...current, photoSummary: event.target.value }))} /></Field>
            <Field label="Notes"><Textarea value={verificationForm.verificationNotes} onChange={(event) => onVerificationFormChange((current) => ({ ...current, verificationNotes: event.target.value }))} /></Field>
            <PrimaryButton type="submit">Submit Verification</PrimaryButton>
          </form>
          <div className="mt-4 grid gap-3">
            {verifications.length ? verifications.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <strong className="text-sm font-bold text-slate-900">{item.workOrder?.workOrderNo || item.id}</strong>
                <p className="mt-1 text-xs text-slate-500">{item.prospect?.fullName || "-"} • {formatDate(item.submittedAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill status={item.verificationStatus} label={getVerificationStatusLabel(item.verificationStatus)} />
                  <SecondaryButton onClick={() => onViewVerification(item.id)}>Detail</SecondaryButton>
                  {item.verificationStatus === "submitted" ? (
                    <>
                      <SecondaryButton onClick={() => onApproveVerification(item.id)} className="!bg-emerald-50 !text-emerald-600">Approve</SecondaryButton>
                      <SecondaryButton onClick={() => onRejectVerification(item.id)} className="!bg-rose-50 !text-rose-600">Reject</SecondaryButton>
                    </>
                  ) : null}
                </div>
              </article>
            )) : <EmptyState message="Belum ada verification." />}
          </div>
        </Card>
      </div>
    </div>
  );
}
