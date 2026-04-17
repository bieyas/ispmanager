import { LayoutDashboard, UsersRound, WalletCards } from "lucide-react";
import { Card, Field, Input, PrimaryButton, SectionHeading } from "../components/ui.jsx";
import { FeatureBadge, Toasts } from "../components/overlay.jsx";

export function LoginPage({ toasts, dismissToast, apiBaseUrl, loginStatus, setApiBaseUrl, onLogin }) {
  return (
    <>
      <Toasts items={toasts} dismiss={dismissToast} />
      <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl gap-4 lg:grid-cols-[1.2fr_0.9fr]">
          <Card className="hidden flex-col justify-between bg-linear-to-br from-blue-600 via-sky-500 to-cyan-300 p-6 text-white shadow-[0_30px_60px_rgba(37,118,255,0.24)] md:flex md:p-8">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70">ISP Manager</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.06em] md:text-6xl">
                Dashboard operasional yang compact dan terasa seperti aplikasi mobile profesional.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
                React + Tailwind memberi fondasi komponen reusable, tipografi mobile yang lebih kecil, dan layout yang jauh lebih mudah dipoles seiring bertambahnya modul.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <FeatureBadge icon={LayoutDashboard} label="Dashboard Shell" />
              <FeatureBadge icon={UsersRound} label="Reusable Components" />
              <FeatureBadge icon={WalletCards} label="Mobile First" />
            </div>
          </Card>

          <Card className="self-center p-5 md:p-6">
            <SectionHeading eyebrow="Login" title="Masuk ke Admin Web" subtitle="Gunakan akun internal sesuai role yang telah diotorisasi." />
            <form className="mt-6 grid gap-4" onSubmit={onLogin}>
              <Field label="Username">
                <Input name="username" placeholder="admin" required />
              </Field>
              <Field label="Password">
                <Input name="password" type="password" placeholder="••••••••" required />
              </Field>
              <PrimaryButton type="submit">Masuk</PrimaryButton>
              <p className="text-xs leading-5 text-slate-500">{loginStatus}</p>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
