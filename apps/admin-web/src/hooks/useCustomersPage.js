import { useState } from "react";
import { initialCustomerForm } from "../lib/formatters.js";

export function useCustomersPage({ apiFetch, loadCustomers, refreshCurrentRoute, pushToast, openCustomerDrawer }) {
  const [customerForm, setCustomerForm] = useState(initialCustomerForm());
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  function resetCustomerForm() {
    setEditingCustomerId(null);
    setCustomerForm(initialCustomerForm());
  }

  async function submitCustomer() {
    if (!editingCustomerId) {
      pushToast("Pilih customer terlebih dahulu.", "error");
      return;
    }

    await apiFetch(`/customers/${editingCustomerId}`, {
      method: "PATCH",
      body: JSON.stringify({
        fullName: customerForm.fullName,
        identityNo: customerForm.identityNo || null,
        email: customerForm.email || null,
        phone: customerForm.phone,
        status: customerForm.status,
        notes: customerForm.notes || null,
      }),
    });

    resetCustomerForm();
    await refreshCurrentRoute("Data customer berhasil diperbarui.");
  }

  async function editCustomer(id) {
    const detail = await apiFetch(`/customers/${id}`);
    setEditingCustomerId(id);
    setCustomerForm({
      customerCode: detail.customerCode || "",
      fullName: detail.fullName || "",
      identityNo: detail.identityNo || "",
      email: detail.email || "",
      phone: detail.phone || "",
      status: detail.status || "active",
      notes: detail.notes || "",
    });
  }

  async function deleteCustomer(id) {
    await apiFetch(`/customers/${id}`, { method: "DELETE" });
    if (editingCustomerId === id) {
      resetCustomerForm();
    }
    await refreshCurrentRoute("Customer berhasil diterminasi.");
  }

  async function viewCustomer(id) {
    openCustomerDrawer(await apiFetch(`/customers/${id}`));
  }

  async function applyFilters(filters) {
    await loadCustomers({ ...filters, page: 1 });
  }

  async function prevPage(filters) {
    await loadCustomers({ ...filters, page: Math.max(1, filters.page - 1) });
  }

  async function nextPage(filters) {
    await loadCustomers({ ...filters, page: filters.page + 1 });
  }

  return {
    customerForm,
    editingCustomerId,
    setCustomerForm,
    resetCustomerForm,
    submitCustomer,
    editCustomer,
    deleteCustomer,
    viewCustomer,
    applyFilters,
    prevPage,
    nextPage,
  };
}
