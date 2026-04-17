import clsx from "clsx";
import { X } from "lucide-react";
import { IconButton } from "./ui.jsx";

export function Toasts({ items, dismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-50 grid w-[calc(100vw-2rem)] max-w-sm gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={clsx(
            "pointer-events-auto rounded-2xl border bg-white/95 px-4 py-3 text-sm shadow-xl backdrop-blur-xl",
            item.type === "error" ? "border-rose-100 text-rose-600" : "border-emerald-100 text-slate-700",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{item.message}</span>
            <button className="text-slate-300 hover:text-slate-500" onClick={() => dismiss(item.id)} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Drawer({ open, label, title, onClose, children }) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="scrollbar-hidden fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white px-5 py-4 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <h3 className="mt-1 text-lg font-bold tracking-[-0.03em] text-slate-900">{title}</h3>
          </div>
          <IconButton onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-4 grid gap-4">{children}</div>
      </aside>
    </>
  );
}

export function Modal({ open, title, subtitle, onClose, children }) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-x-3 inset-y-3 z-50 flex items-center justify-center md:inset-x-6 md:inset-y-6">
        <div className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-900">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <IconButton onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="scrollbar-hidden mt-5 min-h-0 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}

export function FeatureBadge({ icon: Icon, label }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-sm">
      <Icon className="h-4 w-4 text-white" />
      <p className="mt-2 text-sm font-bold text-white">{label}</p>
    </div>
  );
}

export function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{label}</span>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function HeroMiniCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/20 bg-white/14 px-4 py-3 backdrop-blur-sm">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">{label}</span>
      <strong className="mt-2 block text-lg font-extrabold tracking-[-0.04em] text-white md:text-xl">{value}</strong>
    </div>
  );
}

export function MiniListItem({ title, subtitle, meta, status }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(28,71,124,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm font-bold text-slate-900">{title}</strong>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{meta}</p>
        </div>
        {status}
      </div>
    </article>
  );
}
