import { useState } from "react";
import { buildQuery } from "../lib/formatters.js";

export function useDashboardData({ apiFetch, hasPermission }) {
  const [dashboard, setDashboard] = useState({ summary: null, prospects: [], customers: [], cashTransactions: [] });
  const [prospectsState, setProspectsState] = useState({
    items: [],
    meta: { page: 1, pageSize: 6, totalItems: 0, totalPages: 1, hasPrevPage: false, hasNextPage: false },
    summary: {},
    filters: { q: "", status: "", page: 1, pageSize: 6, sortBy: "createdAt", sortOrder: "desc" },
  });
  const [customersState, setCustomersState] = useState({
    items: [],
    meta: { page: 1, pageSize: 6, totalItems: 0, totalPages: 1, hasPrevPage: false, hasNextPage: false },
    filters: { q: "", status: "", page: 1, pageSize: 6 },
  });
  const [financeState, setFinanceState] = useState({
    summary: null,
    cashTransactions: [],
    filters: { dateFrom: "", dateTo: "", categoryCode: "", status: "", type: "" },
  });
  const [servicePlans, setServicePlans] = useState([]);
  const [cashCategories, setCashCategories] = useState([]);

  async function loadDashboard() {
    const [summary, prospects, customers, cashTransactions] = await Promise.all([
      hasPermission("reports.revenue.read") ? apiFetch("/reports/summary") : Promise.resolve(null),
      hasPermission("prospects.list") ? apiFetch("/prospects?page=1&pageSize=4") : Promise.resolve({ items: [] }),
      hasPermission("customers.list") ? apiFetch("/customers?page=1&pageSize=4") : Promise.resolve({ items: [] }),
      hasPermission("cash_transactions.list") ? apiFetch("/cash-transactions") : Promise.resolve([]),
    ]);

    setDashboard({
      summary,
      prospects: prospects.items || [],
      customers: customers.items || [],
      cashTransactions: (cashTransactions || []).slice(0, 4),
    });
  }

  async function loadProspects(filters = prospectsState.filters) {
    const [prospectsResult, plans] = await Promise.all([
      apiFetch(`/prospects${buildQuery(filters)}`),
      hasPermission("service_plans.list") ? apiFetch("/service-plans") : Promise.resolve([]),
    ]);
    setProspectsState((current) => ({ ...current, items: prospectsResult.items, meta: prospectsResult.meta, summary: prospectsResult.summary || {}, filters }));
    setServicePlans(plans);
  }

  async function loadCustomers(filters = customersState.filters) {
    const result = await apiFetch(`/customers${buildQuery(filters)}`);
    setCustomersState((current) => ({ ...current, items: result.items, meta: result.meta, filters }));
  }

  async function loadFinance(filters = financeState.filters) {
    const [summary, categories, cashTransactions] = await Promise.all([
      hasPermission("reports.revenue.read")
        ? apiFetch(`/reports/summary${buildQuery({ dateFrom: filters.dateFrom, dateTo: filters.dateTo })}`)
        : Promise.resolve(null),
      apiFetch("/cash-transactions/categories/list"),
      apiFetch(`/cash-transactions${buildQuery(filters)}`),
    ]);
    setFinanceState((current) => ({ ...current, summary, cashTransactions, filters }));
    setCashCategories(categories);
  }

  async function loadPlans() {
    setServicePlans(await apiFetch("/service-plans"));
  }

  return {
    dashboard,
    prospectsState,
    customersState,
    financeState,
    servicePlans,
    cashCategories,
    setProspectsState,
    setCustomersState,
    setFinanceState,
    setServicePlans,
    loadDashboard,
    loadProspects,
    loadCustomers,
    loadFinance,
    loadPlans,
  };
}
