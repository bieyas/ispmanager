import { useState } from "react";
import { initialServicePlanForm } from "../lib/formatters.js";

export function useServicePlansPage({ apiFetch, servicePlans, refreshCurrentRoute }) {
  const [servicePlanForm, setServicePlanForm] = useState(initialServicePlanForm());
  const [editingServicePlanId, setEditingServicePlanId] = useState(null);

  function resetServicePlanForm() {
    setEditingServicePlanId(null);
    setServicePlanForm(initialServicePlanForm());
  }

  async function submitServicePlan() {
    await apiFetch(editingServicePlanId ? `/service-plans/${editingServicePlanId}` : "/service-plans", {
      method: editingServicePlanId ? "PATCH" : "POST",
      body: JSON.stringify({
        code: servicePlanForm.code,
        name: servicePlanForm.name,
        downloadMbps: Number(servicePlanForm.downloadMbps),
        uploadMbps: Number(servicePlanForm.uploadMbps),
        priceMonthly: Number(servicePlanForm.priceMonthly),
        description: servicePlanForm.description || null,
        isActive: servicePlanForm.isActive,
      }),
    });
    const message = editingServicePlanId ? "Paket berhasil diperbarui." : "Paket baru berhasil dibuat.";
    resetServicePlanForm();
    await refreshCurrentRoute(message);
  }

  function editServicePlan(id) {
    const plan = servicePlans.find((entry) => entry.id === id);
    if (!plan) {
      return;
    }
    setEditingServicePlanId(id);
    setServicePlanForm({
      code: plan.code || "",
      name: plan.name || "",
      downloadMbps: plan.downloadMbps ?? "",
      uploadMbps: plan.uploadMbps ?? "",
      priceMonthly: plan.priceMonthly?.toString?.() || plan.priceMonthly || "",
      description: plan.description || "",
      isActive: plan.isActive !== false,
    });
  }

  async function deleteServicePlan(id) {
    await apiFetch(`/service-plans/${id}`, { method: "DELETE" });
    if (editingServicePlanId === id) {
      resetServicePlanForm();
    }
    await refreshCurrentRoute("Paket berhasil dinonaktifkan.");
  }

  return {
    servicePlanForm,
    editingServicePlanId,
    setServicePlanForm,
    resetServicePlanForm,
    submitServicePlan,
    editServicePlan,
    deleteServicePlan,
  };
}
