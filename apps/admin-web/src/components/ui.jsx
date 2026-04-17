import clsx from "clsx";

function statusClass(status) {
  if (["active", "activated", "installed", "confirmed", "paid"].includes(status)) {
    return "bg-emerald-50 text-emerald-600 ring-emerald-100";
  }
  if (["draft", "cancelled", "terminated", "rejected", "overdue"].includes(status)) {
    return "bg-rose-50 text-rose-600 ring-rose-100";
  }
  if (["inactive", "suspended", "pending_payment", "pending"].includes(status)) {
    return "bg-amber-50 text-amber-600 ring-amber-100";
  }
  return "bg-blue-50 text-blue-600 ring-blue-100";
}

export function Pill({ status, label }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", statusClass(status))}>
      {label}
    </span>
  );
}

export function IconButton({ children, className, ...props }) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-cyan-400 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, ...props }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }) {
  return <section className={clsx("rounded-[28px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_44px_rgba(28,71,124,0.10)] backdrop-blur-xl md:p-5", className)}>{children}</section>;
}

export function SectionHeading({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p> : null}
        <h2 className="text-base font-bold tracking-[-0.02em] text-slate-900 md:text-lg">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-slate-500 md:text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Field({ label, children, className }) {
  return (
    <label className={clsx("grid gap-1.5", className)}>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function Input(props) {
  return <input className="h-11 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-300 focus:border-blue-300" {...props} />;
}

export function Select(props) {
  return <select className="h-11 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none ring-0 focus:border-blue-300" {...props} />;
}

export function Textarea(props) {
  return <textarea className="min-h-[112px] rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-300 focus:border-blue-300" {...props} />;
}

export function StatCard({ label, value, tone = "blue", icon: Icon }) {
  const toneClass = {
    blue: "from-blue-50 to-cyan-50 text-blue-600",
    emerald: "from-emerald-50 to-teal-50 text-emerald-600",
    amber: "from-amber-50 to-orange-50 text-amber-600",
    rose: "from-rose-50 to-pink-50 text-rose-600",
  }[tone];

  return (
    <Card className="relative overflow-hidden p-4">
      <div className={clsx("absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-b opacity-80", toneClass)} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <strong className="mt-2 block text-xl font-extrabold tracking-[-0.04em] text-slate-900 md:text-2xl">{value}</strong>
          </div>
          {Icon ? (
            <span className={clsx("inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-b ring-1 ring-white/60", toneClass)}>
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function EmptyState({ message }) {
  return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">{message}</div>;
}

export function DataListCard({ title, subtitle, action, children }) {
  return (
    <Card>
      <SectionHeading eyebrow={title} title={subtitle} actions={action} />
      <div className="mt-4 grid gap-3">{children}</div>
    </Card>
  );
}
