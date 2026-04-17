import clsx from "clsx";
import { LogOut, Menu, RefreshCw } from "lucide-react";
import { IconButton, SecondaryButton } from "./ui.jsx";

export function AppShell({
  user,
  navOpen,
  setNavOpen,
  allowedRoutes,
  currentRoute,
  currentRouteConfig,
  onRouteChange,
  onRefresh,
  onLogout,
  children,
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[290px_1fr]">
      {navOpen ? <div className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={() => setNavOpen(false)} /> : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-[86vw] max-w-[290px] flex-col border-r border-white/10 bg-slate-950/90 px-4 py-5 text-white backdrop-blur-xl transition lg:static lg:w-full lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-1 pb-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-400 text-lg font-black text-white shadow-lg shadow-blue-500/25">IM</div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Admin Console</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.03em]">ISP Manager</h2>
          </div>
        </div>

        <nav className="grid gap-1.5">
          {allowedRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <button
                key={route.key}
                type="button"
                onClick={() => onRouteChange(route.key)}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition",
                  currentRoute === route.key ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white",
                )}
              >
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/8">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{route.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3 pt-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            <p className="font-semibold">{user.fullName}</p>
            <p className="mt-1 text-xs text-slate-400">{user.role.name}</p>
          </div>
          <SecondaryButton className="bg-white/8 text-white ring-white/10 hover:bg-white/12" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </SecondaryButton>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/70 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconButton className="lg:hidden" onClick={() => setNavOpen((current) => !current)}>
                <Menu className="h-4 w-4" />
              </IconButton>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{currentRouteConfig.label}</p>
                <h1 className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-900 md:text-2xl">{currentRouteConfig.label}</h1>
              </div>
            </div>
            <SecondaryButton onClick={onRefresh} className="hidden sm:inline-flex">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </SecondaryButton>
          </div>
        </header>

        <main className="px-4 py-4 pb-24 md:px-6 md:py-5 lg:pb-6">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 gap-2 border-t border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-xl lg:hidden">
          {allowedRoutes
            .filter((route) => ["dashboard", "prospects", "customers", "finance"].includes(route.key))
            .map((route) => {
              const Icon = route.icon;
              return (
                <button
                  key={route.key}
                  type="button"
                  onClick={() => onRouteChange(route.key)}
                  className={clsx(
                    "grid justify-items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold",
                    currentRoute === route.key ? "bg-blue-50 text-blue-600" : "text-slate-400",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{route.label}</span>
                </button>
              );
            })}
        </nav>
      </div>
    </div>
  );
}
