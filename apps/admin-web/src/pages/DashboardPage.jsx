import { ArrowDownLeft, ArrowUpRight, BarChart3, CheckCircle2, CreditCard, Search, UserRoundPlus, UsersRound } from "lucide-react";
import { formatCurrency, formatDate, getProspectStatusLabel } from "../lib/formatters.js";
import { Card, DataListCard, EmptyState, Pill, PrimaryButton, SecondaryButton, SectionHeading, StatCard } from "../components/ui.jsx";
import { FeatureBadge, HeroMiniCard, MiniListItem } from "../components/overlay.jsx";

export function DashboardPage({ dashboard, onNavigate }) {
  const summary = dashboard.summary || {};
  const finance = summary.finance || {};
  const netTodayPositive = Number(finance.netCashToday || 0) >= 0;

  const modules = [
    { key: "prospects", title: "PSB & Aktivasi", desc: "Kelola prospect baru, survey, instalasi, dan aktivasi.", icon: UserRoundPlus },
    { key: "customers", title: "Customer", desc: "Lihat customer aktif, update data, dan status layanan.", icon: UsersRound },
    { key: "finance", title: "Finance", desc: "Pantau cashflow, approval kas keluar, dan input manual.", icon: BarChart3 },
  ];

  const activityItems = [
    {
      icon: UserRoundPlus,
      title: `${summary.prospects ?? 0} prospect aktif di pipeline`,
      body: `${summary.invoicesOverdue ?? 0} invoice overdue dan ${(dashboard.prospects || []).filter((item) => item.status === "installed").length} prospect siap diaktivasi.`,
    },
    {
      icon: UsersRound,
      title: `${summary.customers ?? 0} customer aktif terdaftar`,
      body: `${summary.subscriptions ?? 0} subscription tercatat. Fokus berikutnya: billing, renewal, dan kualitas pembayaran.`,
    },
    {
      icon: BarChart3,
      title: `Net cash bulan ini ${formatCurrency(finance.netCashMonth)}`,
      body: `Kas masuk hari ini ${formatCurrency(finance.cashInToday)} dan kas keluar hari ini ${formatCurrency(finance.cashOutToday)}.`,
    },
  ];

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[32px] border border-white/50 bg-linear-to-br from-blue-600 via-sky-500 to-cyan-300 p-5 text-white shadow-[0_30px_60px_rgba(37,118,255,0.24)] md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr] lg:items-end">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/70">Operational Snapshot</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.06em] md:text-5xl">
              Command center operasional ISP yang lebih compact dan cepat dipindai.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
              Hero dashboard ini meniru pola aplikasi mobile finansial: satu KPI utama, beberapa angka pendukung, dan recent activity yang singkat tapi informatif.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[28px] border border-white/20 bg-white/15 p-4 backdrop-blur-md">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Net Cash Bulan Ini</span>
              <strong className="mt-2 block text-4xl font-black tracking-[-0.06em] md:text-5xl">{formatCurrency(finance.netCashMonth)}</strong>
              <span className="mt-3 inline-flex rounded-full bg-white/14 px-3 py-1 text-xs font-bold text-white">
                {netTodayPositive ? "Cash position hari ini positif" : "Cash position hari ini negatif"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <HeroMiniCard label="Kas Masuk Hari Ini" value={formatCurrency(finance.cashInToday)} />
              <HeroMiniCard label="Invoice Overdue" value={String(summary.invoicesOverdue ?? 0)} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kas Masuk Hari Ini" value={formatCurrency(finance.cashInToday)} tone="blue" icon={ArrowDownLeft} />
        <StatCard label="Kas Keluar Hari Ini" value={formatCurrency(finance.cashOutToday)} tone="rose" icon={ArrowUpRight} />
        <StatCard label="Prospect Aktif" value={String(summary.prospects ?? 0)} tone="amber" icon={Search} />
        <StatCard label="Subscription" value={String(summary.subscriptions ?? 0)} tone="emerald" icon={CreditCard} />
      </div>

      <Card>
        <SectionHeading eyebrow="Quick Modules" title="Pilih area kerja" subtitle="Navigasi modular ini membuat flow lebih jelas dibanding satu halaman panjang." />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.key}
                type="button"
                onClick={() => onNavigate(module.key)}
                className="group rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-left shadow-[0_10px_24px_rgba(28,71,124,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(28,71,124,0.10)]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-b from-blue-50 to-cyan-50 text-blue-600 ring-1 ring-blue-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold tracking-[-0.02em] text-slate-900">{module.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{module.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeading eyebrow="Recent Activity" title="Operational activity" subtitle="Informasi singkat yang paling relevan untuk tindakan selanjutnya." />
          <div className="mt-4 grid gap-3">
            {activityItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="grid grid-cols-[auto_1fr] gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(28,71,124,0.08)]">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-b from-blue-50 to-cyan-50 text-blue-600 ring-1 ring-blue-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <strong className="block text-sm font-bold text-slate-900">{item.title}</strong>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-4">
          <DataListCard title="Recent PSB" subtitle="Prospect terbaru" action={<SecondaryButton onClick={() => onNavigate("prospects")}>Lihat Semua</SecondaryButton>}>
            {dashboard.prospects.length ? (
              dashboard.prospects.map((item) => (
                <MiniListItem
                  key={item.id}
                  title={item.fullName}
                  subtitle={`${item.phone} • ${item.servicePlan?.name || "-"}`}
                  meta={formatDate(item.installationDate)}
                  status={<Pill status={item.status} label={getProspectStatusLabel(item.status)} />}
                />
              ))
            ) : (
              <EmptyState message="Belum ada prospect." />
            )}
          </DataListCard>

          <DataListCard title="Recent Cashflow" subtitle="Arus kas terakhir">
            {dashboard.cashTransactions.length ? (
              dashboard.cashTransactions.map((item) => (
                <MiniListItem
                  key={item.id}
                  title={item.transactionNo}
                  subtitle={item.keterangan || "-"}
                  meta={`${formatDate(item.transactionDate)} • ${item.cashCategory.name}`}
                  status={<span className="text-xs font-bold text-slate-900">{formatCurrency(item.amount)}</span>}
                />
              ))
            ) : (
              <EmptyState message="Belum ada transaksi kas." />
            )}
          </DataListCard>
        </div>
      </div>
    </div>
  );
}
