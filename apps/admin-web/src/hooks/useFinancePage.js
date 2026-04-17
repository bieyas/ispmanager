import { useState } from "react";
import { buildQuery, formatDate, initialCashForm } from "../lib/formatters.js";

export function useFinancePage({ apiFetch, apiFetchRaw, financeState, loadFinance, refreshCurrentRoute, pushToast, openCashDrawer }) {
  const [cashForm, setCashForm] = useState(initialCashForm());
  const [editingCashId, setEditingCashId] = useState(null);

  function resetCashForm() {
    setEditingCashId(null);
    setCashForm(initialCashForm());
  }

  async function submitCash() {
    await apiFetch(editingCashId ? `/cash-transactions/${editingCashId}` : "/cash-transactions", {
      method: editingCashId ? "PATCH" : "POST",
      body: JSON.stringify({
        transactionDate: cashForm.transactionDate,
        type: cashForm.type,
        cashCategoryId: cashForm.cashCategoryId,
        amount: Number(cashForm.amount),
        method: cashForm.method,
        referenceNo: cashForm.referenceNo || null,
        keterangan: cashForm.keterangan,
        description: cashForm.description || null,
      }),
    });
    const message = editingCashId ? "Draft kas diperbarui." : "Draft kas berhasil dibuat.";
    resetCashForm();
    await refreshCurrentRoute(message);
  }

  async function editCash(id) {
    const item = financeState.cashTransactions.find((entry) => entry.id === id);
    if (!item) {
      return;
    }
    setEditingCashId(id);
    setCashForm({
      transactionDate: formatDate(item.transactionDate),
      type: item.type,
      cashCategoryId: item.cashCategory.id,
      method: item.method || "",
      amount: item.amount?.toString?.() || item.amount || "",
      referenceNo: item.referenceNo || "",
      keterangan: item.keterangan || "",
      description: item.description || "",
    });
  }

  async function viewCash(id) {
    openCashDrawer(await apiFetch(`/cash-transactions/${id}`));
  }

  async function exportCsv() {
    const response = await apiFetchRaw(`/cash-transactions/export/csv${buildQuery(financeState.filters)}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = response.headers.get("Content-Disposition")?.match(/filename=\"([^\"]+)\"/)?.[1] || `cashflow-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushToast("CSV berhasil diexport.");
  }

  async function exportPdf() {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      throw new Error("Popup diblokir browser.");
    }
    const response = await apiFetchRaw(`/cash-transactions/export/print${buildQuery(financeState.filters)}`);
    const html = await response.text();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    pushToast("Jendela print report dibuka.");
  }

  async function resetFilters() {
    await loadFinance({ dateFrom: "", dateTo: "", categoryCode: "", status: "", type: "" });
  }

  async function quickRange(range) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const toValue = (date) => date.toISOString().slice(0, 10);
    const nextFilters = { ...financeState.filters };

    if (range === "today") {
      nextFilters.dateFrom = toValue(today);
      nextFilters.dateTo = toValue(today);
    }
    if (range === "7days") {
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - 6);
      nextFilters.dateFrom = toValue(start);
      nextFilters.dateTo = toValue(today);
    }
    if (range === "month") {
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      nextFilters.dateFrom = toValue(start);
      nextFilters.dateTo = toValue(today);
    }

    await loadFinance(nextFilters);
  }

  return {
    cashForm,
    editingCashId,
    setCashForm,
    resetCashForm,
    submitCash,
    editCash,
    viewCash,
    exportCsv,
    exportPdf,
    resetFilters,
    quickRange,
  };
}
