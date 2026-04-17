import { useState } from "react";
import { initialProspectForm } from "../lib/formatters.js";

function initialStatusUpdateForm() {
  return {
    prospectId: "",
    currentStatus: "prospect",
    status: "prospect",
    surveyDate: "",
    installationDate: "",
    onuSerialNumber: "",
    statusReason: "",
  };
}

export function useProspectsPage({ apiFetch }) {
  const [prospectForm, setProspectForm] = useState(initialProspectForm());
  const [editingProspectId, setEditingProspectId] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, prospectId: "", prospectName: "" });
  const [statusModal, setStatusModal] = useState({ open: false, prospectName: "" });
  const [statusForm, setStatusForm] = useState(initialStatusUpdateForm());
  const [statusFormError, setStatusFormError] = useState("");
  const [activationModal, setActivationModal] = useState({ open: false, prospectId: "" });
  const [activationPayload, setActivationPayload] = useState({
    activationDate: new Date().toISOString().slice(0, 10),
    prorateEnabled: false,
    firstDueDateOverride: "",
  });
  const [activationStatus, setActivationStatus] = useState("");
  const [activationResult, setActivationResult] = useState(null);

  function resetProspectForm() {
    setProspectForm(initialProspectForm());
    setEditingProspectId(null);
    setIsFormModalOpen(false);
  }

  function resetStatusForm() {
    setStatusModal({ open: false, prospectName: "" });
    setStatusForm(initialStatusUpdateForm());
    setStatusFormError("");
  }

  async function reverseGeocode(lat, lng) {
    const body = await apiFetch(`/geocoding/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
    const address = body.address || {};

    setProspectForm((current) => ({
      ...current,
      addressLine: current.addressLine || [address.road, address.house_number, address.neighbourhood, address.hamlet].filter(Boolean).join(" ") || body.displayName || "",
      village: address.village || address.suburb || address.hamlet || current.village,
      district: address.city_district || address.subdistrict || address.county || current.district,
      city: address.city || address.town || address.municipality || address.county || current.city,
      province: address.state || address.region || current.province,
      postalCode: address.postcode || current.postalCode,
      mapPickSource: "reverse_geocode",
    }));
  }

  return {
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
  };
}
