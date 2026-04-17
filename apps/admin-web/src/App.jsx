import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { defaultMapView, routes } from "./lib/constants.js";
import { useVersionCheck } from "./hooks/useVersionCheck.js";
import {
  formatCurrency,
  formatDate,
  getCustomerStatusLabel,
  getInvoiceStatusLabel,
  getProspectStatusLabel,
  getTicketStatusLabel,
  getVerificationStatusLabel,
  getWorkOrderStatusLabel,
  initialCashForm,
  initialCustomerForm,
  initialManualInvoiceForm,
  initialPeriodicInvoiceForm,
  initialServicePlanForm,
  initialTicketForm,
  initialVerificationForm,
  initialWorkOrderAttachmentForm,
  initialWorkOrderForm,
} from "./lib/formatters.js";
import { Card } from "./components/ui.jsx";
import { DetailItem, Drawer, Toasts } from "./components/overlay.jsx";
import { AppShell } from "./components/AppShell.jsx";
import { ApprovalNoteModal } from "./components/workflows/ApprovalNoteModal.jsx";
import { ConfirmActionModal } from "./components/workflows/ConfirmActionModal.jsx";
import { ProspectStatusModal } from "./components/workflows/ProspectStatusModal.jsx";
import { ProspectActivationModal } from "./components/workflows/ProspectActivationModal.jsx";
import { ActivationResultModal } from "./components/workflows/ActivationResultModal.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useDashboardData } from "./hooks/useDashboardData.js";
import { useProspectsPage } from "./hooks/useProspectsPage.js";
import { useCustomersPage } from "./hooks/useCustomersPage.js";
import { useFinancePage } from "./hooks/useFinancePage.js";
import { useServicePlansPage } from "./hooks/useServicePlansPage.js";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { ProspectsPage } from "./pages/ProspectsPage.jsx";
import { CustomersPage } from "./pages/CustomersPage.jsx";
import { FinancePage } from "./pages/FinancePage.jsx";
import { OperationsPage } from "./pages/OperationsPage.jsx";
import { ServicePlansPage } from "./pages/ServicePlansPage.jsx";
import { SubscriptionsPage } from "./pages/SubscriptionsPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";

export function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [generalSettings, setGeneralSettings] = useState({ defaultMapCenter: defaultMapView });
  const [generalSettingsForm, setGeneralSettingsForm] = useState({
    latitude: String(defaultMapView.latitude),
    longitude: String(defaultMapView.longitude),
    zoom: String(defaultMapView.zoom),
  });
  const [savingGeneralSettings, setSavingGeneralSettings] = useState(false);
  const [locatingProspect, setLocatingProspect] = useState(false);
  const [subscriptionsState, setSubscriptionsState] = useState([]);
  const [manualInvoiceForm, setManualInvoiceForm] = useState(initialManualInvoiceForm());
  const [periodicInvoiceForm, setPeriodicInvoiceForm] = useState(initialPeriodicInvoiceForm());
  const [operationsState, setOperationsState] = useState({
    tickets: [],
    workOrders: [],
    verifications: [],
  });
  const [operationsLookups, setOperationsLookups] = useState({
    prospects: [],
    customers: [],
    subscriptions: [],
  });
  const [ticketForm, setTicketForm] = useState(initialTicketForm());
  const [workOrderForm, setWorkOrderForm] = useState(initialWorkOrderForm());
  const [verificationForm, setVerificationForm] = useState(initialVerificationForm());
  const [attachmentForm, setAttachmentForm] = useState(initialWorkOrderAttachmentForm());
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token,
    user,
    apiBaseUrl,
    loginStatus,
    allowedRoutes,
    setApiBaseUrl,
    setLoginStatus,
    setUser,
    hasPermission,
    routeAllowed,
    defaultRouteForUser,
    apiFetch,
    apiFetchRaw,
    handleLogin,
    logout: baseLogout,
  } = useAuth();
  const {
    dashboard,
    prospectsState,
    customersState,
    financeState,
    servicePlans,
    cashCategories,
    setProspectsState,
    setCustomersState,
    setFinanceState,
    loadDashboard,
    loadProspects,
    loadCustomers,
    loadFinance,
    loadPlans,
  } = useDashboardData({ apiFetch, hasPermission });
  const {
    prospectForm,
    editingProspectId,
    isFormModalOpen,
    deleteConfirmModal,
    statusModal,
    statusForm,
    statusFormError,
    activationModal,
    activationPayload,
    activationStatus,
    activationResult,
    setProspectForm,
    setEditingProspectId,
    setIsFormModalOpen,
    setDeleteConfirmModal,
    setStatusModal,
    setStatusForm,
    setStatusFormError,
    setActivationModal,
    setActivationPayload,
    setActivationStatus,
    setActivationResult,
    resetProspectForm,
    resetStatusForm,
    reverseGeocode,
  } = useProspectsPage({ apiFetch });

  const [drawer, setDrawer] = useState({ open: false, label: "", title: "", content: null });
  const [approvalModal, setApprovalModal] = useState({ open: false, required: false, title: "", subtitle: "", submitLabel: "", resolver: null });
  const [approvalNote, setApprovalNote] = useState("");
  const [approvalError, setApprovalError] = useState("");

  const routeMap = useMemo(() => Object.fromEntries(routes.map((route) => [route.key, route])), []);
  const routeByPath = useMemo(() => Object.fromEntries(routes.map((route) => [route.path, route])), []);

  function pushToast(message, type = "success") {
    const id = globalThis.crypto?.randomUUID?.() || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((item) => item.id !== id));
  }

  async function loadRoute(routeKey) {
    setLoadingRoute(true);
    try {
      if (routeKey === "dashboard") await loadDashboard();
      if (routeKey === "prospects") {
        await Promise.all([loadProspects(), loadGeneralSettings()]);
      }
      if (routeKey === "customers") await loadCustomers();
      if (routeKey === "subscriptions") await loadSubscriptions();
      if (routeKey === "finance") await loadFinance();
      if (routeKey === "operations") await loadOperations();
      if (routeKey === "service-plans") await loadPlans();
      if (routeKey === "settings") await loadGeneralSettings();
    } finally {
      setLoadingRoute(false);
    }
  }

  async function goToRoute(routeKey) {
    const target = routeAllowed(routeKey) ? routeKey : defaultRouteForUser();
    setNavOpen(false);
    navigate(routeMap[target]?.path || "/");
    await loadRoute(target);
  }
  const currentRoute = routeByPath[location.pathname]?.key || "dashboard";
  const currentRouteConfig = routeMap[currentRoute] || routeMap.dashboard;

  async function refreshCurrentRoute(message = "Data diperbarui.") {
    await loadRoute(currentRoute);
    pushToast(message);
  }

  async function loadGeneralSettings() {
    const settings = await apiFetch("/settings/general");
    setGeneralSettings(settings);
    setGeneralSettingsForm({
      latitude: String(settings.defaultMapCenter.latitude),
      longitude: String(settings.defaultMapCenter.longitude),
      zoom: String(settings.defaultMapCenter.zoom),
    });
    return settings;
  }

  async function loadSubscriptions() {
    const subscriptions = await apiFetch("/subscriptions");
    setSubscriptionsState(subscriptions || []);
    return subscriptions;
  }

  async function loadOperations() {
    const [ticketsResult, workOrdersResult, verifications, prospectsResult, customersResult, subscriptions] = await Promise.all([
      hasPermission("tickets.list") ? apiFetch("/tickets") : Promise.resolve({ items: [] }),
      hasPermission("work_orders.list") ? apiFetch("/work-orders") : Promise.resolve({ items: [] }),
      hasPermission("installation_verifications.read") ? apiFetch("/installation-verifications") : Promise.resolve([]),
      hasPermission("prospects.list")
        ? apiFetch("/prospects?page=1&pageSize=50&sortBy=createdAt&sortOrder=desc")
        : Promise.resolve({ items: [] }),
      hasPermission("customers.list")
        ? apiFetch("/customers?page=1&pageSize=50")
        : Promise.resolve({ items: [] }),
      hasPermission("subscriptions.list")
        ? apiFetch("/subscriptions?pageSize=50")
        : Promise.resolve([]),
    ]);

    setOperationsState({
      tickets: ticketsResult.items || [],
      workOrders: workOrdersResult.items || [],
      verifications: verifications || [],
    });
    setOperationsLookups({
      prospects: prospectsResult.items || [],
      customers: customersResult.items || [],
      subscriptions: subscriptions || [],
    });
  }

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsDataURL(file);
    });
  }

  function parseJsonField(value, fieldLabel) {
    if (!value.trim()) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${fieldLabel} harus berupa JSON valid.`);
    }
  }

  function logout() {
    baseLogout();
    resetProspectForm();
    setCustomerForm(initialCustomerForm());
    setServicePlanForm(initialServicePlanForm());
    setCashForm(initialCashForm());
    setManualInvoiceForm(initialManualInvoiceForm());
    setPeriodicInvoiceForm(initialPeriodicInvoiceForm());
    setTicketForm(initialTicketForm());
    setWorkOrderForm(initialWorkOrderForm());
    setVerificationForm(initialVerificationForm());
    setAttachmentForm(initialWorkOrderAttachmentForm());
    setEditingCustomerId(null);
    setEditingServicePlanId(null);
    setEditingCashId(null);
    pushToast("Session dihapus.");
  }

  function askApproval(config) {
    setApprovalError("");
    setApprovalNote("");
    return new Promise((resolve) => {
      setApprovalModal({ ...config, open: true, resolver: resolve });
    });
  }

  async function confirmCash(id) {
    const item = financeState.cashTransactions.find((entry) => entry.id === id);
    const note = await askApproval({
      title: "Konfirmasi Cash Transaction",
      subtitle: item?.type === "cash_out" ? "Cash out membutuhkan approval note." : "Tambahkan catatan approval bila diperlukan.",
      submitLabel: "Confirm Sekarang",
      required: item?.type === "cash_out",
    });
    if (note === null) return;
    await apiFetch(`/cash-transactions/${id}/confirm`, { method: "POST", body: JSON.stringify({ approvalNote: note }) });
    await refreshCurrentRoute("Draft transaksi kas berhasil dikonfirmasi.");
  }

  async function cancelCash(id) {
    const item = financeState.cashTransactions.find((entry) => entry.id === id);
    const note = await askApproval({
      title: "Batalkan Cash Transaction",
      subtitle: item?.type === "cash_out" ? "Jelaskan alasan pembatalan." : "Catatan pembatalan opsional.",
      submitLabel: "Batalkan Draft",
      required: item?.type === "cash_out",
    });
    if (note === null) return;
    await apiFetch(`/cash-transactions/${id}`, { method: "DELETE", body: JSON.stringify({ approvalNote: note }) });
    if (editingCashId === id) {
      resetCashForm();
    }
    await refreshCurrentRoute("Draft transaksi kas berhasil dibatalkan.");
  }

  const {
    customerForm,
    editingCustomerId,
    setCustomerForm,
    resetCustomerForm,
    submitCustomer,
    editCustomer,
    deleteCustomer,
    viewCustomer,
    applyFilters: applyCustomerFilters,
    prevPage: prevCustomerPage,
    nextPage: nextCustomerPage,
  } = useCustomersPage({ apiFetch, loadCustomers, refreshCurrentRoute, pushToast, openCustomerDrawer });
  const {
    cashForm,
    editingCashId,
    setCashForm,
    resetCashForm,
    submitCash,
    editCash,
    viewCash,
    exportCsv,
    exportPdf,
    resetFilters: resetFinanceFilters,
    quickRange,
  } = useFinancePage({ apiFetch, apiFetchRaw, financeState, loadFinance, refreshCurrentRoute, pushToast, openCashDrawer });
  const {
    servicePlanForm,
    editingServicePlanId,
    setServicePlanForm,
    resetServicePlanForm,
    submitServicePlan,
    editServicePlan,
    deleteServicePlan,
  } = useServicePlansPage({ apiFetch, servicePlans, refreshCurrentRoute });

  // Version checking for auto-update
  useVersionCheck(apiBaseUrl, (newVersion) => {
    const userConfirmed = window.confirm(
      `📦 Update tersedia: ${newVersion}\n\nReload aplikasi sekarang untuk mendapatkan fitur dan perbaikan terbaru?`
    );
    if (userConfirmed) {
      window.location.reload();
    }
  });

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    apiFetch("/auth/me")
      .then(async (currentUser) => {
        if (cancelled) return;
        setUser(currentUser);
        localStorage.setItem("ispmanager.admin.user", JSON.stringify(currentUser));
        const route = routeAllowed(routeByPath[location.pathname]?.key) ? routeByPath[location.pathname]?.key : defaultRouteForUser();
        if ((routeMap[route]?.path || "/") !== location.pathname) {
          navigate(routeMap[route]?.path || "/", { replace: true });
        }
        await loadRoute(route);
      })
      .catch(() => {
        if (cancelled) return;
        logout();
        setLoginStatus("Session lama tidak valid. Silakan login ulang.");
      });

    return () => {
      cancelled = true;
    };
  }, [token, location.pathname]);

  const pendingCashOut = financeState.cashTransactions.filter((item) => !item.paymentId && !item.payment && item.type === "cash_out" && item.status === "draft");

  const dashboardElement = !loadingRoute ? <DashboardPage dashboard={dashboard} onNavigate={goToRoute} /> : null;
  const prospectsElement = !loadingRoute ? (
    <ProspectsPage
      data={prospectsState}
      form={prospectForm}
      defaultMapCenter={generalSettings.defaultMapCenter}
      isLocating={locatingProspect}
      editingId={editingProspectId}
      isFormModalOpen={isFormModalOpen}
      servicePlans={servicePlans}
      onFormChange={setProspectForm}
      onFiltersChange={setProspectsState}
      onUseMyLocation={async () => {
        if (locatingProspect) {
          return;
        }
        if (!navigator.geolocation) {
          pushToast("Browser tidak mendukung geolocation.", "error");
          return;
        }
        if (!window.isSecureContext) {
          pushToast("Lokasi browser memerlukan HTTPS atau localhost.", "error");
          return;
        }

        setLocatingProspect(true);
        pushToast("Meminta akses lokasi browser...");

        let settled = false;
        const watchdogId = window.setTimeout(() => {
          if (!settled) {
            setLocatingProspect(false);
            pushToast("Permintaan lokasi belum dijawab. Periksa prompt izin lokasi di browser.", "error");
          }
        }, 7000);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            settled = true;
            window.clearTimeout(watchdogId);
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            setProspectForm((current) => ({ ...current, latitude: lat, longitude: lng, mapPickSource: "browser_geolocation" }));
            try {
              await reverseGeocode(lat, lng);
            } catch (error) {
              pushToast(error.message || "Koordinat diambil, tetapi alamat otomatis belum tersedia.", "error");
            }
            setLocatingProspect(false);
            pushToast("Koordinat diisi dari lokasi browser.");
          },
          (error) => {
            settled = true;
            window.clearTimeout(watchdogId);
            setLocatingProspect(false);
            const message =
              error.code === 1
                ? "Izin lokasi ditolak di browser."
                : error.code === 2
                  ? "Lokasi perangkat tidak tersedia."
                  : error.code === 3
                    ? "Pengambilan lokasi melebihi batas waktu."
                    : "Gagal mengambil lokasi browser.";
            pushToast(message, "error");
          },
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0,
          },
        );
      }}
      onMapPick={async (lat, lng, source) => {
        setProspectForm((current) => ({ ...current, latitude: lat, longitude: lng, mapPickSource: source }));
        try {
          await reverseGeocode(lat, lng);
        } catch (error) {
          pushToast(error.message || "Gagal mengambil alamat.", "error");
        }
      }}
      onOpenCreate={() => {
        resetProspectForm();
        setIsFormModalOpen(true);
      }}
      onCloseForm={() => setIsFormModalOpen(false)}
      onSubmit={async (event) => {
        event.preventDefault();
        const payload = {
          ...prospectForm,
          identityNo: prospectForm.identityNo || null,
          email: prospectForm.email || null,
          installationDate: prospectForm.installationDate || null,
          pppoeUsername: prospectForm.pppoeUsername || null,
          pppoePassword: prospectForm.pppoePassword || null,
          village: prospectForm.village || null,
          district: prospectForm.district || null,
          city: prospectForm.city || null,
          province: prospectForm.province || null,
          postalCode: prospectForm.postalCode || null,
          latitude: prospectForm.latitude ? Number(prospectForm.latitude) : null,
          longitude: prospectForm.longitude ? Number(prospectForm.longitude) : null,
          mapPickSource: prospectForm.mapPickSource || null,
          notes: prospectForm.notes || null,
        };
        await apiFetch(editingProspectId ? `/prospects/${editingProspectId}` : "/prospects", {
          method: editingProspectId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        });
        resetProspectForm();
        await refreshCurrentRoute(editingProspectId ? "Prospect berhasil diperbarui." : "Prospect berhasil dibuat.");
      }}
      onResetEdit={resetProspectForm}
      onQuickSearch={async (query) => {
        const nextFilters = { ...prospectsState.filters, q: query, page: 1 };
        await loadProspects(nextFilters);
      }}
      onStatusFilterChange={async (status) => {
        const nextFilters = { ...prospectsState.filters, status, page: 1 };
        await loadProspects(nextFilters);
      }}
      onResetFilters={async () => {
        const nextFilters = { ...prospectsState.filters, q: "", status: "", page: 1, pageSize: 6, sortBy: "createdAt", sortOrder: "desc" };
        await loadProspects(nextFilters);
      }}
      onSortChange={async (sortBy, nextSortOrder) => {
        const sortOrder = nextSortOrder || (prospectsState.filters.sortBy === sortBy && prospectsState.filters.sortOrder === "asc" ? "desc" : "asc");
        const nextFilters = { ...prospectsState.filters, sortBy, sortOrder, page: 1 };
        await loadProspects(nextFilters);
      }}
      onPageSizeChange={async (pageSize) => {
        const nextFilters = { ...prospectsState.filters, pageSize, page: 1 };
        await loadProspects(nextFilters);
      }}
      onPrevPage={async () => {
        const nextFilters = { ...prospectsState.filters, page: Math.max(1, prospectsState.filters.page - 1) };
        await loadProspects(nextFilters);
      }}
      onNextPage={async () => {
        const nextFilters = { ...prospectsState.filters, page: prospectsState.filters.page + 1 };
        await loadProspects(nextFilters);
      }}
      onView={async (id) => openProspectDrawer(await apiFetch(`/prospects/${id}`))}
      onEdit={async (id) => {
        const detail = await apiFetch(`/prospects/${id}`);
        setEditingProspectId(id);
        setIsFormModalOpen(true);
        setProspectForm({
          fullName: detail.fullName || "",
          identityNo: detail.identityNo || "",
          email: detail.email || "",
          phone: detail.phone || "",
          servicePlanId: detail.servicePlanId || "",
          installationDate: formatDate(detail.installationDate) === "-" ? "" : formatDate(detail.installationDate),
          status: detail.status || "prospect",
          pppoeUsername: detail.pppoeUsername || "",
          pppoePassword: detail.pppoePassword || "",
          addressLine: detail.addressLine || "",
          village: detail.village || "",
          district: detail.district || "",
          city: detail.city || "",
          province: detail.province || "",
          postalCode: detail.postalCode || "",
          latitude: detail.latitude ?? "",
          longitude: detail.longitude ?? "",
          mapPickSource: detail.mapPickSource || "",
          inputSource: detail.inputSource || "manual",
          notes: detail.notes || "",
        });
      }}
      onDelete={async (id) => {
        const detail = prospectsState.items.find((item) => item.id === id);
        setDeleteConfirmModal({
          open: true,
          prospectId: id,
          prospectName: detail?.fullName || "prospect ini",
        });
      }}
      onOpenStatus={async (id) => {
        const detail = await apiFetch(`/prospects/${id}`);
        setStatusForm({
          prospectId: detail.id,
          currentStatus: detail.status || "prospect",
          status: detail.status || "prospect",
          surveyDate: formatDate(detail.surveyDate) === "-" ? "" : formatDate(detail.surveyDate),
          installationDate: formatDate(detail.installationDate) === "-" ? "" : formatDate(detail.installationDate),
          onuSerialNumber: detail.onuSerialNumber || "",
          statusReason: detail.statusReason || "",
        });
        setStatusFormError("");
        setStatusModal({ open: true, prospectName: detail.fullName || "prospect ini" });
      }}
      onActivate={async (id) => {
        const detail = await apiFetch(`/prospects/${id}`);
        setActivationModal({ open: true, prospectId: detail.id });
        setActivationPayload((current) => ({ ...current, activationDate: new Date().toISOString().slice(0, 10) }));
        setActivationStatus("");
      }}
    />
  ) : null;
  const customersElement = !loadingRoute ? (
    <CustomersPage
      data={customersState}
      form={customerForm}
      editingId={editingCustomerId}
      onFormChange={setCustomerForm}
      onFiltersChange={setCustomersState}
      onSubmit={async (event) => {
        event.preventDefault();
        await submitCustomer();
      }}
      onResetEdit={resetCustomerForm}
      onApplyFilters={async () => applyCustomerFilters(customersState.filters)}
      onResetFilters={async () => applyCustomerFilters({ ...customersState.filters, q: "", status: "" })}
      onPrevPage={async () => prevCustomerPage(customersState.filters)}
      onNextPage={async () => nextCustomerPage(customersState.filters)}
      onView={viewCustomer}
      onEdit={editCustomer}
      onDelete={deleteCustomer}
    />
  ) : null;
  const financeElement = !loadingRoute ? (
    <FinancePage
      data={financeState}
      categories={cashCategories}
      cashForm={cashForm}
      pendingCashOut={pendingCashOut}
      editingCashId={editingCashId}
      onCashFormChange={setCashForm}
      onFiltersChange={setFinanceState}
      onSubmit={async (event) => {
        event.preventDefault();
        await submitCash();
      }}
      onResetEdit={resetCashForm}
      onApplyFilters={async () => loadFinance(financeState.filters)}
      onResetFilters={resetFinanceFilters}
      onQuickRange={quickRange}
      onExportCsv={exportCsv}
      onExportPdf={exportPdf}
      onView={viewCash}
      onEdit={editCash}
      onConfirm={confirmCash}
      onDelete={cancelCash}
    />
  ) : null;
  const subscriptionsElement = !loadingRoute ? (
    <SubscriptionsPage
      subscriptions={subscriptionsState}
      manualInvoiceForm={manualInvoiceForm}
      periodicInvoiceForm={periodicInvoiceForm}
      onManualInvoiceFormChange={setManualInvoiceForm}
      onPeriodicInvoiceFormChange={setPeriodicInvoiceForm}
      onCreateManualInvoice={async (event) => {
        event.preventDefault();
        await apiFetch("/invoices/manual", {
          method: "POST",
          body: JSON.stringify({
            subscriptionId: manualInvoiceForm.subscriptionId,
            issueDate: manualInvoiceForm.issueDate || null,
            dueDate: manualInvoiceForm.dueDate || null,
            amount: manualInvoiceForm.amount ? Number(manualInvoiceForm.amount) : undefined,
            notes: manualInvoiceForm.notes || null,
          }),
        });
        setManualInvoiceForm(initialManualInvoiceForm());
        await refreshCurrentRoute("Manual invoice berhasil dibuat.");
      }}
      onGeneratePeriodicInvoices={async (event) => {
        event.preventDefault();
        await apiFetch("/invoices/generate-periodic", {
          method: "POST",
          body: JSON.stringify({
            issueDate: periodicInvoiceForm.issueDate || null,
            dueDate: periodicInvoiceForm.dueDate || null,
            limit: Number(periodicInvoiceForm.limit || 20),
            subscriptionIds: periodicInvoiceForm.subscriptionIds
              ? periodicInvoiceForm.subscriptionIds.split(",").map((item) => item.trim()).filter(Boolean)
              : undefined,
            notes: periodicInvoiceForm.notes || null,
          }),
        });
        setPeriodicInvoiceForm(initialPeriodicInvoiceForm());
        await refreshCurrentRoute("Generate invoice periodik selesai diproses.");
      }}
      onSelectSubscription={(subscriptionId) => setManualInvoiceForm((current) => ({ ...current, subscriptionId }))}
      onViewSubscription={async (id) => openSubscriptionDrawer(await apiFetch(`/subscriptions/${id}`))}
      onRefresh={() => refreshCurrentRoute("Daftar subscription diperbarui.")}
    />
  ) : null;
  const operationsElement = !loadingRoute ? (
    <OperationsPage
      tickets={operationsState.tickets}
      workOrders={operationsState.workOrders}
      verifications={operationsState.verifications}
      lookups={operationsLookups}
      ticketForm={ticketForm}
      workOrderForm={workOrderForm}
      verificationForm={verificationForm}
      attachmentForm={attachmentForm}
      onTicketFormChange={setTicketForm}
      onWorkOrderFormChange={setWorkOrderForm}
      onVerificationFormChange={setVerificationForm}
      onAttachmentFormChange={setAttachmentForm}
      onCreateTicket={async (event) => {
        event.preventDefault();
        await apiFetch("/tickets", {
          method: "POST",
          body: JSON.stringify({
            customerId: ticketForm.customerId,
            subscriptionId: ticketForm.subscriptionId || null,
            assignedToUserId: ticketForm.assignedToUserId || null,
            category: ticketForm.category,
            priority: ticketForm.priority,
            subject: ticketForm.subject,
            description: ticketForm.description,
          }),
        });
        setTicketForm(initialTicketForm());
        await refreshCurrentRoute("Ticket berhasil dibuat.");
      }}
      onCreateWorkOrder={async (event) => {
        event.preventDefault();
        await apiFetch("/work-orders", {
          method: "POST",
          body: JSON.stringify({
            sourceType: workOrderForm.sourceType,
            sourceId: workOrderForm.sourceId || workOrderForm.subscriptionId || workOrderForm.prospectId || null,
            prospectId: workOrderForm.prospectId || null,
            customerId: workOrderForm.customerId || null,
            subscriptionId: workOrderForm.subscriptionId || null,
            assignedToUserId: workOrderForm.assignedToUserId || null,
            scheduledDate: workOrderForm.scheduledDate || null,
            notes: workOrderForm.notes || null,
          }),
        });
        setWorkOrderForm(initialWorkOrderForm());
        await refreshCurrentRoute("Work order berhasil dibuat.");
      }}
      onSubmitVerification={async (event) => {
        event.preventDefault();
        await apiFetch("/installation-verifications", {
          method: "POST",
          body: JSON.stringify({
            prospectId: verificationForm.prospectId,
            workOrderId: verificationForm.workOrderId,
            checklistSnapshot: parseJsonField(verificationForm.checklistSnapshot, "Checklist JSON"),
            deviceSerialSnapshot: parseJsonField(verificationForm.deviceSerialSnapshot, "Device Serial JSON"),
            signalSnapshot: parseJsonField(verificationForm.signalSnapshot, "Signal JSON"),
            photoSummary: verificationForm.photoSummary || null,
            verificationNotes: verificationForm.verificationNotes || null,
          }),
        });
        setVerificationForm(initialVerificationForm());
        await refreshCurrentRoute("Installation verification berhasil dikirim.");
      }}
      onUploadAttachment={async (event) => {
        event.preventDefault();
        if (!attachmentForm.file) {
          throw new Error("Pilih file attachment terlebih dahulu.");
        }
        const contentBase64 = await fileToBase64(attachmentForm.file);
        await apiFetch(`/work-orders/${attachmentForm.workOrderId}/attachments`, {
          method: "POST",
          body: JSON.stringify({
            filename: attachmentForm.file.name,
            mimeType: attachmentForm.file.type || "application/octet-stream",
            contentBase64,
          }),
        });
        setAttachmentForm(initialWorkOrderAttachmentForm());
        await refreshCurrentRoute("Attachment work order berhasil diupload.");
      }}
      onViewTicket={async (id) => openTicketDrawer(await apiFetch(`/tickets/${id}`))}
      onViewWorkOrder={async (id) => openWorkOrderDrawer(await apiFetch(`/work-orders/${id}`))}
      onViewVerification={async (id) => openVerificationDrawer(await apiFetch(`/installation-verifications/${id}`))}
      onCloseTicket={async (id) => {
        await apiFetch(`/tickets/${id}/close`, { method: "POST" });
        await refreshCurrentRoute("Ticket berhasil ditutup.");
      }}
      onCloseWorkOrder={async (id) => {
        await apiFetch(`/work-orders/${id}/close`, { method: "POST", body: JSON.stringify({}) });
        await refreshCurrentRoute("Work order berhasil ditutup.");
      }}
      onApproveVerification={async (id) => {
        await apiFetch(`/installation-verifications/${id}/verify`, { method: "POST", body: JSON.stringify({}) });
        await refreshCurrentRoute("Verification berhasil di-approve.");
      }}
      onRejectVerification={async (id) => {
        await apiFetch(`/installation-verifications/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
        await refreshCurrentRoute("Verification berhasil di-reject.");
      }}
      onRefresh={() => refreshCurrentRoute("Data operations diperbarui.")}
    />
  ) : null;
  const servicePlansElement = !loadingRoute ? (
    <ServicePlansPage
      plans={servicePlans}
      form={servicePlanForm}
      editingId={editingServicePlanId}
      onFormChange={setServicePlanForm}
      onSubmit={async (event) => {
        event.preventDefault();
        await submitServicePlan();
      }}
      onResetEdit={resetServicePlanForm}
      onRefresh={() => refreshCurrentRoute("Data paket diperbarui.")}
      onEdit={editServicePlan}
      onDelete={deleteServicePlan}
    />
  ) : null;
  const settingsElement = !loadingRoute ? (
    <SettingsPage
      form={generalSettingsForm}
      onChange={setGeneralSettingsForm}
      isSaving={savingGeneralSettings}
      onSubmit={async (event) => {
        event.preventDefault();
        setSavingGeneralSettings(true);
        try {
          const result = await apiFetch("/settings/general", {
            method: "PATCH",
            body: JSON.stringify({
              defaultMapCenter: {
                latitude: Number(generalSettingsForm.latitude),
                longitude: Number(generalSettingsForm.longitude),
                zoom: Number(generalSettingsForm.zoom),
              },
            }),
          });
          setGeneralSettings(result);
          setGeneralSettingsForm({
            latitude: String(result.defaultMapCenter.latitude),
            longitude: String(result.defaultMapCenter.longitude),
            zoom: String(result.defaultMapCenter.zoom),
          });
          pushToast("Pengaturan umum berhasil disimpan.");
        } finally {
          setSavingGeneralSettings(false);
        }
      }}
    />
  ) : null;

  function openProspectDrawer(detail) {
    setDrawer({
      open: true,
      label: "Detail Prospect",
      title: detail.fullName,
      content: (
        <>
          <DetailItem label="Status" value={getProspectStatusLabel(detail.status)} />
          <DetailItem label="Paket" value={detail.servicePlan?.name || "-"} />
          <DetailItem label="Telepon" value={detail.phone || "-"} />
          <DetailItem label="Email" value={detail.email || "-"} />
          <DetailItem label="No. Identitas" value={detail.identityNo || "-"} />
          <DetailItem label="Tanggal Pemasangan" value={formatDate(detail.installationDate)} />
          <DetailItem label="PPPoE" value={`${detail.pppoeUsername || "-"} / ${detail.pppoePassword || "-"}`} />
          <DetailItem label="Alamat" value={detail.addressLine || "-"} />
          <DetailItem label="Wilayah" value={[detail.village, detail.district, detail.city, detail.province].filter(Boolean).join(", ") || "-"} />
          <DetailItem label="Koordinat" value={`${detail.latitude ?? "-"}, ${detail.longitude ?? "-"}`} />
          <DetailItem label="Catatan" value={detail.notes || "-"} />
        </>
      ),
    });
  }

  function openCustomerDrawer(detail) {
    const primaryAddress = detail.customerAddresses?.[0];
    const subscription = detail.subscriptions?.[0];
    setDrawer({
      open: true,
      label: "Detail Customer",
      title: `${detail.customerCode} • ${detail.fullName}`,
      content: (
        <>
          <DetailItem label="Status" value={getCustomerStatusLabel(detail.status)} />
          <DetailItem label="Telepon" value={detail.phone || "-"} />
          <DetailItem label="Email" value={detail.email || "-"} />
          <DetailItem label="Portal Username" value={detail.customerUser?.username || "-"} />
          <DetailItem label="Portal Status" value={detail.customerUser?.isActive ? "Aktif" : "Nonaktif"} />
          <DetailItem label="Paket Aktif" value={subscription?.servicePlan?.name || "-"} />
          <DetailItem label="PPPoE" value={`${subscription?.pppoeUsername || "-"} / ${subscription?.pppoePassword || "-"}`} />
          <DetailItem label="Alamat" value={primaryAddress?.addressLine || "-"} />
          <DetailItem label="Wilayah" value={[primaryAddress?.village, primaryAddress?.district, primaryAddress?.city, primaryAddress?.province].filter(Boolean).join(", ") || "-"} />
          <DetailItem label="Catatan" value={detail.notes || "-"} />
        </>
      ),
    });
  }

  function openCashDrawer(detail) {
    setDrawer({
      open: true,
      label: "Detail Kas",
      title: detail.transactionNo,
      content: (
        <>
          <DetailItem label="Sumber" value={detail.payment ? "Auto-post dari payment" : "Manual entry"} />
          <DetailItem label="Status" value={detail.status} />
          <DetailItem label="Kategori" value={detail.cashCategory.name} />
          <DetailItem label="Tanggal" value={formatDate(detail.transactionDate)} />
          <DetailItem label="Jumlah" value={formatCurrency(detail.amount)} />
          <DetailItem label="Metode" value={detail.method || "-"} />
          <DetailItem label="Keterangan" value={detail.keterangan || "-"} />
          <DetailItem label="Reference No" value={detail.referenceNo || "-"} />
          <DetailItem label="Customer" value={`${detail.payment?.customer?.customerCode || "-"} ${detail.payment?.customer?.fullName || ""}`} />
          <DetailItem label="Invoice" value={detail.payment?.invoice?.invoiceNo || "-"} />
        </>
      ),
    });
  }

  function openSubscriptionDrawer(detail) {
    setDrawer({
      open: true,
      label: "Detail Subscription",
      title: `${detail.subscriptionNo} • ${detail.customer?.customerCode || "-"}`,
      content: (
        <>
          <DetailItem label="Status" value={detail.status} />
          <DetailItem label="Customer" value={`${detail.customer?.customerCode || "-"} • ${detail.customer?.fullName || "-"}`} />
          <DetailItem label="Plan" value={`${detail.servicePlan?.name || "-"} • ${formatCurrency(detail.servicePlan?.priceMonthly)}`} />
          <DetailItem label="Period Aktif" value={`${formatDate(detail.currentPeriodStart)} s/d ${formatDate(detail.currentPeriodEnd)}`} />
          <DetailItem label="Billing Anchor" value={String(detail.billingAnchorDay || "-")} />
          <DetailItem label="PPPoE" value={`${detail.pppoeUsername || "-"} / ${detail.pppoePassword || "-"}`} />
          <DetailItem label="Alamat Instalasi" value={detail.installationAddress?.addressLine || "-"} />
          <DetailItem
            label="Invoice Terakhir"
            value={detail.invoices?.length ? `${detail.invoices[0].invoiceNo} • ${getInvoiceStatusLabel(detail.invoices[0].status)}` : "-"}
          />
          <DetailItem
            label="Renewal Terakhir"
            value={detail.renewals?.length ? `${detail.renewals[0].renewalNo} • ${detail.renewals[0].status}` : "-"}
          />
          <DetailItem
            label="Payment Summary"
            value={`${detail.paymentSummary?.confirmedCount || 0} payment • ${formatCurrency(detail.paymentSummary?.confirmedAmount)}`}
          />
        </>
      ),
    });
  }

  function openTicketDrawer(detail) {
    setDrawer({
      open: true,
      label: "Detail Ticket",
      title: `${detail.ticketNo} • ${detail.subject}`,
      content: (
        <>
          <DetailItem label="Status" value={getTicketStatusLabel(detail.status)} />
          <DetailItem label="Customer" value={`${detail.customer?.customerCode || "-"} • ${detail.customer?.fullName || "-"}`} />
          <DetailItem label="Subscription" value={detail.subscription?.subscriptionNo || "-"} />
          <DetailItem label="Priority" value={detail.priority || "-"} />
          <DetailItem label="Category" value={detail.category || "-"} />
          <DetailItem label="Assigned To" value={detail.assignedToUser?.fullName || "-"} />
          <DetailItem label="Opened At" value={formatDate(detail.openedAt)} />
          <DetailItem label="Description" value={detail.description || "-"} />
          <DetailItem label="Comments" value={detail.comments?.length ? detail.comments.map((item) => `${item.actor?.label || "-"}: ${item.comment}`).join(" | ") : "-"} />
        </>
      ),
    });
  }

  function openWorkOrderDrawer(detail) {
    setDrawer({
      open: true,
      label: "Detail Work Order",
      title: detail.workOrderNo,
      content: (
        <>
          <DetailItem label="Status" value={getWorkOrderStatusLabel(detail.status)} />
          <DetailItem label="Source" value={`${detail.sourceType || "-"} • ${detail.sourceId || "-"}`} />
          <DetailItem label="Prospect" value={detail.prospect?.fullName || "-"} />
          <DetailItem label="Customer" value={`${detail.customer?.customerCode || "-"} • ${detail.customer?.fullName || "-"}`} />
          <DetailItem label="Subscription" value={detail.subscription?.subscriptionNo || "-"} />
          <DetailItem label="Assigned To" value={detail.assignedToUser?.fullName || "-"} />
          <DetailItem label="Scheduled Date" value={formatDate(detail.scheduledDate)} />
          <DetailItem label="Visit Result" value={detail.visitResult || "-"} />
          <DetailItem label="Notes" value={detail.notes || "-"} />
          <DetailItem label="Verification" value={detail.installationVerification?.verificationStatus || "-"} />
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Attachments</span>
            <div className="mt-3 grid gap-3">
              {detail.attachments?.length ? detail.attachments.map((item) => {
                const isImage = item.fileType?.startsWith("image/");
                return (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {isImage ? (
                      <a href={item.fileUrl} target="_blank" rel="noreferrer">
                        <img src={item.fileUrl} alt={item.fileType || "Attachment"} className="h-40 w-full object-cover" />
                      </a>
                    ) : null}
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.fileType || "Attachment"}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                      </div>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                        Buka File
                      </a>
                    </div>
                  </article>
                );
              }) : <p className="text-sm text-slate-500">Belum ada attachment.</p>}
            </div>
          </div>
        </>
      ),
    });
  }

  function openVerificationDrawer(detail) {
    setDrawer({
      open: true,
      label: "Detail Verification",
      title: detail.workOrder?.workOrderNo || detail.id,
      content: (
        <>
          <DetailItem label="Status" value={getVerificationStatusLabel(detail.verificationStatus)} />
          <DetailItem label="Prospect" value={detail.prospect?.fullName || "-"} />
          <DetailItem label="Work Order" value={detail.workOrder?.workOrderNo || "-"} />
          <DetailItem label="Submitted By" value={detail.submittedByUser?.fullName || "-"} />
          <DetailItem label="Verified By" value={detail.verifiedByUser?.fullName || "-"} />
          <DetailItem label="Submitted At" value={formatDate(detail.submittedAt)} />
          <DetailItem label="Checklist" value={detail.checklistSnapshot ? JSON.stringify(detail.checklistSnapshot) : "-"} />
          <DetailItem label="Device Serial" value={detail.deviceSerialSnapshot ? JSON.stringify(detail.deviceSerialSnapshot) : "-"} />
          <DetailItem label="Signal" value={detail.signalSnapshot ? JSON.stringify(detail.signalSnapshot) : "-"} />
          <DetailItem label="Photo Summary" value={detail.photoSummary || "-"} />
          <DetailItem label="Notes" value={detail.verificationNotes || "-"} />
        </>
      ),
    });
  }

  if (!token || !user) {
    return (
      <LoginPage
        toasts={toasts}
        dismissToast={dismissToast}
        apiBaseUrl={apiBaseUrl}
        loginStatus={loginStatus}
        setApiBaseUrl={setApiBaseUrl}
        onLogin={async (event) => {
          try {
            const currentUser = await handleLogin(event);
            const target = routes.find((route) => route.permissions.length === 0 || route.permissions.some((permission) => currentUser.permissions.includes(permission)))?.key || "dashboard";
            navigate(routeMap[target]?.path || "/");
            await loadRoute(target);
          } catch (error) {
            setLoginStatus(error.message || "Login gagal");
          }
        }}
      />
    );
  }

  return (
    <>
      <Toasts items={toasts} dismiss={dismissToast} />
      <Drawer open={drawer.open} label={drawer.label} title={drawer.title} onClose={() => setDrawer({ open: false, label: "", title: "", content: null })}>
        {drawer.content}
      </Drawer>

      <ApprovalNoteModal
        modal={approvalModal}
        approvalNote={approvalNote}
        approvalError={approvalError}
        setApprovalNote={setApprovalNote}
        onClose={() => {
          approvalModal.resolver?.(null);
          setApprovalModal((current) => ({ ...current, open: false, resolver: null }));
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (approvalModal.required && !approvalNote.trim()) {
            setApprovalError("Catatan approval wajib diisi.");
            return;
          }
          approvalModal.resolver?.(approvalNote.trim() || null);
          setApprovalModal((current) => ({ ...current, open: false, resolver: null }));
        }}
      />

      <ConfirmActionModal
        modal={{
          open: deleteConfirmModal.open,
          title: "Hapus Prospect",
          subtitle: "Aksi ini perlu konfirmasi sebelum data dihapus.",
          message: `Prospect ${deleteConfirmModal.prospectName} akan dihapus. Tindakan ini tidak bisa dibatalkan.`,
          confirmLabel: "Ya, hapus",
        }}
        onClose={() => setDeleteConfirmModal({ open: false, prospectId: "", prospectName: "" })}
        onConfirm={async () => {
          const prospectId = deleteConfirmModal.prospectId;
          setDeleteConfirmModal({ open: false, prospectId: "", prospectName: "" });
          await apiFetch(`/prospects/${prospectId}`, { method: "DELETE" });
          if (editingProspectId === prospectId) {
            resetProspectForm();
          }
          await refreshCurrentRoute("Prospect berhasil dihapus.");
        }}
      />

      <ProspectStatusModal
        modal={statusModal}
        form={statusForm}
        error={statusFormError}
        onChange={setStatusForm}
        onClose={resetStatusForm}
        onSubmit={async (event) => {
          event.preventDefault();

          if (statusForm.status === "surveyed" && !statusForm.surveyDate) {
            setStatusFormError("Tanggal survey wajib diisi.");
            return;
          }

          if (statusForm.status === "installed" && (!statusForm.installationDate || !statusForm.onuSerialNumber.trim())) {
            setStatusFormError("Tanggal instalasi dan SN / Serial Number ONU wajib diisi.");
            return;
          }

          if (["cancelled", "rejected"].includes(statusForm.status) && !statusForm.statusReason.trim()) {
            setStatusFormError("Alasan wajib diisi.");
            return;
          }

          await apiFetch(`/prospects/${statusForm.prospectId}/status`, {
            method: "PATCH",
            body: JSON.stringify({
              status: statusForm.status,
              surveyDate: statusForm.surveyDate || null,
              installationDate: statusForm.installationDate || null,
              onuSerialNumber: statusForm.onuSerialNumber.trim() || null,
              statusReason: statusForm.statusReason.trim() || null,
            }),
          });
          resetStatusForm();
          await refreshCurrentRoute("Status prospect berhasil diperbarui.");
        }}
      />

      <ProspectActivationModal
        modal={activationModal}
        payload={activationPayload}
        status={activationStatus}
        setPayload={setActivationPayload}
        setStatus={setActivationStatus}
        onClose={() => {
          setActivationModal({ open: false, prospectId: "" });
        }}
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const result = await apiFetch(`/prospects/${activationModal.prospectId}/activate`, {
              method: "POST",
              body: JSON.stringify({
                activationDate: activationPayload.activationDate,
                prorateEnabled: activationPayload.prorateEnabled,
                firstDueDateOverride: activationPayload.firstDueDateOverride || null,
              }),
            });
            setActivationModal({ open: false, prospectId: "" });
            setActivationResult(result);
            await loadProspects();
            pushToast(`Customer ${result.customer.customerCode} berhasil dibuat.`);
          } catch (error) {
            setActivationStatus(error.message || "Gagal mengaktivasi prospect.");
          }
        }}
      />

      <ActivationResultModal result={activationResult} onClose={() => setActivationResult(null)} />

      <AppShell
        user={user}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        allowedRoutes={allowedRoutes}
        currentRoute={currentRoute}
        currentRouteConfig={currentRouteConfig}
        onRouteChange={goToRoute}
        onRefresh={() => refreshCurrentRoute()}
        onLogout={logout}
      >
        {loadingRoute ? <Card><p className="text-sm text-slate-500">Memuat halaman...</p></Card> : null}

        <Routes>
          <Route path="/" element={dashboardElement} />
          <Route path="/prospects" element={prospectsElement} />
          <Route path="/customers" element={customersElement} />
          <Route path="/subscriptions" element={subscriptionsElement} />
          <Route path="/finance" element={financeElement} />
          <Route path="/operations" element={operationsElement} />
          <Route path="/service-plans" element={servicePlansElement} />
          <Route path="/settings" element={settingsElement} />
          <Route path="*" element={<Navigate to={routeMap[defaultRouteForUser()]?.path || "/"} replace />} />
        </Routes>
      </AppShell>
    </>
  );
}
