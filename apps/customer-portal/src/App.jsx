import { useEffect, useMemo, useState } from "react";
import { CreditCard, KeyRound, LifeBuoy, LogOut, Router, Send, ShieldCheck, UserCircle2 } from "lucide-react";
import { createScopedStorageKeys, formatCurrency, formatDate, getDefaultApiBaseUrl } from "@ispmanager/web-utils";

const storageKeys = createScopedStorageKeys("customer");

function Card({ children, className = "" }) {
  return <section className={`rounded-[28px] border border-emerald-100/80 bg-white/90 p-5 shadow-[0_20px_40px_rgba(16,92,79,0.08)] ${className}`}>{children}</section>;
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">{label}</p>
          <strong className="mt-3 block text-2xl font-black tracking-[-0.05em] text-slate-900">{value}</strong>
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

function TicketComposer({ subscriptions, onSubmit, submitting }) {
  const [form, setForm] = useState({
    subscriptionId: "",
    category: "trouble",
    priority: "medium",
    subject: "",
    description: "",
  });

  return (
    <form
      className="mt-5 grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({
          ...form,
          subscriptionId: form.subscriptionId || null,
        });
        setForm({
          subscriptionId: "",
          category: "trouble",
          priority: "medium",
          subject: "",
          description: "",
        });
      }}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Subscription</span>
          <select value={form.subscriptionId} onChange={(event) => setForm((current) => ({ ...current, subscriptionId: event.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-400">
            <option value="">Tanpa subscription</option>
            {subscriptions.map((item) => (
              <option key={item.id} value={item.id}>{item.subscriptionNo}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Kategori</span>
          <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-400">
            <option value="trouble">Trouble</option>
            <option value="billing">Billing</option>
            <option value="installation">Installation</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Prioritas</span>
          <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-400">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Subjek</span>
        <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-400" required />
      </label>
      <label className="grid gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Deskripsi</span>
        <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400" required />
      </label>
      <button disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
        {submitting ? "Mengirim..." : "Buat Tiket"}
      </button>
    </form>
  );
}

function TicketReplyForm({ onSubmit, submitting }) {
  const [comment, setComment] = useState("");

  return (
    <form
      className="mt-3 grid gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(comment);
        setComment("");
      }}
    >
      <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400" placeholder="Balas update atau tambahkan informasi tambahan..." required />
      <button disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        <Send className="mr-2 h-4 w-4" />
        {submitting ? "Mengirim..." : "Kirim Balasan"}
      </button>
    </form>
  );
}

export function App() {
  const [token, setToken] = useState(localStorage.getItem(storageKeys.token) || "");
  const [customerSession, setCustomerSession] = useState(() => {
    const raw = localStorage.getItem(storageKeys.session);
    return raw ? JSON.parse(raw) : null;
  });
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState("Gunakan akun customer portal yang diberikan admin.");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [replyingTicketId, setReplyingTicketId] = useState("");
  const apiBaseUrl = useMemo(() => getDefaultApiBaseUrl(), []);

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.message || "Request failed");
    }
    return body.data;
  }

  async function loadPortal() {
    const [me, portalOverview] = await Promise.all([
      apiFetch("/customer-auth/me"),
      apiFetch("/customer-portal/overview"),
    ]);
    setCustomerSession(me);
    setOverview(portalOverview);
    localStorage.setItem(storageKeys.session, JSON.stringify(me));
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    loadPortal().catch((error) => {
      setToken("");
      setCustomerSession(null);
      setOverview(null);
      localStorage.removeItem(storageKeys.token);
      localStorage.removeItem(storageKeys.session);
      setStatus(error.message || "Session customer tidak valid.");
    });
  }, [token]);

  // Version checking for auto-update
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/version`);
        if (!response.ok) return;

        const data = await response.json();
        const currentVersion = window.__APP_VERSION__ || "0.1.0";
        const latestVersion = data.version;

        if (latestVersion && latestVersion !== currentVersion) {
          console.log(`New version available: ${latestVersion} (current: ${currentVersion})`);
          const userConfirmed = window.confirm(
            `📦 Update tersedia: ${latestVersion}\n\nReload aplikasi sekarang untuk mendapatkan fitur dan perbaikan terbaru?`
          );
          if (userConfirmed) {
            window.location.reload();
          }
        }
      } catch (error) {
        console.warn("Version check failed:", error);
      }
    };

    // Check version immediately
    checkVersion();

    // Check every 5 minutes
    const intervalId = setInterval(checkVersion, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [apiBaseUrl]);

  function logout() {
    setToken("");
    setCustomerSession(null);
    setOverview(null);
    localStorage.removeItem(storageKeys.token);
    localStorage.removeItem(storageKeys.session);
    setStatus("Session customer dihapus.");
  }

  if (!token || !customerSession) {
    return (
      <div className="min-h-screen px-4 py-8 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="rounded-[36px] bg-linear-to-br from-emerald-700 via-teal-700 to-orange-400 p-6 text-white shadow-[0_30px_60px_rgba(13,148,136,0.24)] md:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/70">Customer Portal</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] md:text-5xl">Portal pelanggan yang ringkas, cepat, dan langsung ke informasi penting.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82 md:text-base">
              Versi ini sudah membuka akses layanan aktif, invoice, serta tiket lengkap dengan pembuatan tiket baru dan balasan customer langsung dari portal.
            </p>
          </section>

          <Card className="backdrop-blur-xl">
            <div className="mb-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-500">Login</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">Masuk ke portal pelanggan</h2>
              <p className="mt-2 text-sm text-slate-500">{status}</p>
            </div>
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  const result = await fetch(`${apiBaseUrl}/customer-auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      username: event.currentTarget.username.value.trim(),
                      password: event.currentTarget.password.value,
                    }),
                  }).then((response) => response.json().then((body) => ({ ok: response.ok, body })));

                  if (!result.ok || !result.body.success) {
                    throw new Error(result.body.message || "Login customer gagal");
                  }

                  setToken(result.body.data.token);
                  setCustomerSession(result.body.data.customer);
                  localStorage.setItem(storageKeys.token, result.body.data.token);
                  localStorage.setItem(storageKeys.session, JSON.stringify(result.body.data.customer));
                  setStatus(`Login berhasil sebagai ${result.body.data.customer.customer.fullName}`);
                } catch (error) {
                  setStatus(error.message || "Login customer gagal");
                }
              }}
            >
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Username</span>
                <input name="username" className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-400" required />
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Password</span>
                <input name="password" type="password" className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-400" required />
              </label>
              <button className="mt-2 inline-flex items-center justify-center rounded-full bg-linear-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20">
                Masuk Portal
              </button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-6">
        <Card className="overflow-hidden bg-linear-to-br from-emerald-700 via-teal-700 to-orange-400 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/70">Portal Pelanggan</p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.06em] md:text-4xl">{customerSession.customer.customerCode} • {customerSession.customer.fullName}</h1>
              <p className="mt-3 text-sm text-white/82">
                Status layanan {customerSession.customer.status} • Username portal {customerSession.username}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={loadPortal} className="inline-flex items-center rounded-full bg-white/14 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20">
                Refresh
              </button>
              <button onClick={logout} className="inline-flex items-center rounded-full bg-slate-950/18 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/18">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Router} label="Layanan Aktif" value={String(overview?.subscriptions?.length || 0)} />
          <StatCard icon={CreditCard} label="Invoice" value={String(overview?.invoices?.length || 0)} />
          <StatCard icon={LifeBuoy} label="Tiket" value={String(overview?.tickets?.length || 0)} />
          <StatCard icon={ShieldCheck} label="Must Change Password" value={customerSession.mustChangePassword ? "Ya" : "Tidak"} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <UserCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-500">Layanan</p>
                <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-900">Subscription dan invoice terbaru</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {overview?.subscriptions?.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-emerald-100 bg-emerald-50/40 p-4">
                  <strong className="text-sm font-bold text-slate-900">{item.subscriptionNo}</strong>
                  <p className="mt-1 text-xs text-slate-500">{item.servicePlan?.name} • {item.servicePlan?.downloadMbps}/{item.servicePlan?.uploadMbps} Mbps</p>
                  <p className="mt-2 text-xs text-slate-500">Periode aktif {formatDate(item.currentPeriodStart)} s/d {formatDate(item.currentPeriodEnd)}</p>
                </article>
              )) || <p className="text-sm text-slate-500">Belum ada subscription.</p>}
            </div>

            <div className="mt-6 grid gap-3">
              {overview?.invoices?.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong className="text-sm font-bold text-slate-900">{item.invoiceNo}</strong>
                      <p className="mt-1 text-xs text-slate-500">Subscription {item.subscription?.subscriptionNo} • Jatuh tempo {formatDate(item.dueDate)}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-100">{item.status}</span>
                  </div>
                  <strong className="mt-4 block text-lg font-black tracking-[-0.04em] text-slate-900">{formatCurrency(item.totalAmount)}</strong>
                </article>
              )) || <p className="text-sm text-slate-500">Belum ada invoice.</p>}
            </div>
          </Card>

          <div className="grid gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-orange-500">Tiket</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-900">Buat tiket dan balas update layanan</h2>
                </div>
              </div>

              <TicketComposer
                subscriptions={overview?.subscriptions || []}
                submitting={submittingTicket}
                onSubmit={async (payload) => {
                  try {
                    setSubmittingTicket(true);
                    await apiFetch("/customer-portal/tickets", {
                      method: "POST",
                      body: JSON.stringify(payload),
                    });
                    setStatus("Tiket customer berhasil dibuat.");
                    await loadPortal();
                  } catch (error) {
                    setStatus(error.message || "Gagal membuat tiket.");
                  } finally {
                    setSubmittingTicket(false);
                  }
                }}
              />

              <div className="mt-6 grid gap-3">
                {overview?.tickets?.length ? overview.tickets.map((item) => (
                  <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <strong className="text-sm font-bold text-slate-900">{item.ticketNo}</strong>
                        <p className="mt-1 text-xs text-slate-500">{item.subject}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {item.status} • {formatDate(item.openedAt)} • Dibuat oleh {item.actor?.label || "-"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">{item.priority}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{item.description}</p>

                    <div className="mt-4 grid gap-2">
                      {item.comments?.filter((comment) => !comment.isInternal).map((comment) => (
                        <div key={comment.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-bold text-slate-700">{comment.actor?.label || "-"}</p>
                          <p className="mt-1 text-sm text-slate-600">{comment.comment}</p>
                          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">{formatDate(comment.createdAt)}</p>
                        </div>
                      ))}
                    </div>

                    <TicketReplyForm
                      submitting={replyingTicketId === item.id}
                      onSubmit={async (comment) => {
                        try {
                          setReplyingTicketId(item.id);
                          await apiFetch(`/customer-portal/tickets/${item.id}/comments`, {
                            method: "POST",
                            body: JSON.stringify({ comment }),
                          });
                          setStatus(`Balasan untuk ${item.ticketNo} berhasil dikirim.`);
                          await loadPortal();
                        } catch (error) {
                          setStatus(error.message || "Gagal mengirim balasan tiket.");
                        } finally {
                          setReplyingTicketId("");
                        }
                      }}
                    />
                  </article>
                )) : <p className="text-sm text-slate-500">Belum ada tiket.</p>}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Akun</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-900">Ganti password portal</h2>
                </div>
              </div>
              <form
                className="mt-5 grid gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    await apiFetch("/customer-auth/change-password", {
                      method: "POST",
                      body: JSON.stringify(passwordForm),
                    });
                    setPasswordForm({ currentPassword: "", newPassword: "" });
                    setStatus("Password customer berhasil diubah.");
                    await loadPortal();
                  } catch (error) {
                    setStatus(error.message || "Gagal mengubah password.");
                  }
                }}
              >
                <label className="grid gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Password Sekarang</span>
                  <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-400" required />
                </label>
                <label className="grid gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Password Baru</span>
                  <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-400" required />
                </label>
                <button className="mt-1 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white">
                  Simpan Password Baru
                </button>
                <p className="text-sm text-slate-500">{status}</p>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
