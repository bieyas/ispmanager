export { currencyFormatter, formatCurrency, formatDate, getDefaultApiBaseUrl } from "@ispmanager/web-utils";

export function getProspectStatusLabel(status) {
  return (
    {
      prospect: "Prospect",
      surveyed: "Surveyed",
      scheduled_installation: "Scheduled",
      installed: "Installed",
      activated: "Activated",
      cancelled: "Cancelled",
      rejected: "Rejected",
    }[status] || status
  );
}

export function getCustomerStatusLabel(status) {
  return (
    {
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
      terminated: "Terminated",
    }[status] || status
  );
}

export function getInvoiceStatusLabel(status) {
  return (
    {
      draft: "Draft",
      issued: "Issued",
      paid: "Paid",
      overdue: "Overdue",
      cancelled: "Cancelled",
    }[status] || status
  );
}

export function getTicketStatusLabel(status) {
  return (
    {
      open: "Open",
      assigned: "Assigned",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
      cancelled: "Cancelled",
    }[status] || status
  );
}

export function getWorkOrderStatusLabel(status) {
  return (
    {
      open: "Open",
      scheduled: "Scheduled",
      on_progress: "On Progress",
      done: "Done",
      cancelled: "Cancelled",
    }[status] || status
  );
}

export function getVerificationStatusLabel(status) {
  return (
    {
      submitted: "Submitted",
      approved: "Approved",
      rejected: "Rejected",
    }[status] || status
  );
}

export function buildQuery(params) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function initialProspectForm() {
  return {
    fullName: "",
    identityNo: "",
    email: "",
    phone: "",
    servicePlanId: "",
    installationDate: "",
    status: "prospect",
    pppoeUsername: "",
    pppoePassword: "",
    addressLine: "",
    village: "",
    district: "",
    city: "",
    province: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    mapPickSource: "",
    inputSource: "manual",
    notes: "",
  };
}

export function initialCustomerForm() {
  return {
    customerCode: "",
    fullName: "",
    identityNo: "",
    email: "",
    phone: "",
    status: "active",
    notes: "",
  };
}

export function initialServicePlanForm() {
  return {
    code: "",
    name: "",
    downloadMbps: "",
    uploadMbps: "",
    priceMonthly: "",
    description: "",
    isActive: true,
  };
}

export function initialCashForm() {
  return {
    transactionDate: new Date().toISOString().slice(0, 10),
    type: "cash_in",
    cashCategoryId: "",
    method: "",
    amount: "",
    referenceNo: "",
    keterangan: "",
    description: "",
  };
}

export function initialManualInvoiceForm() {
  return {
    subscriptionId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    amount: "",
    notes: "",
  };
}

export function initialPeriodicInvoiceForm() {
  return {
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    limit: "20",
    subscriptionIds: "",
    notes: "",
  };
}

export function initialTicketForm() {
  return {
    customerId: "",
    subscriptionId: "",
    assignedToUserId: "",
    category: "trouble",
    priority: "medium",
    subject: "",
    description: "",
  };
}

export function initialWorkOrderForm() {
  return {
    sourceType: "installation",
    sourceId: "",
    prospectId: "",
    customerId: "",
    subscriptionId: "",
    assignedToUserId: "",
    scheduledDate: "",
    notes: "",
  };
}

export function initialVerificationForm() {
  return {
    prospectId: "",
    workOrderId: "",
    checklistSnapshot: "{\n  \n}",
    deviceSerialSnapshot: "{\n  \n}",
    signalSnapshot: "{\n  \n}",
    photoSummary: "",
    verificationNotes: "",
  };
}

export function initialWorkOrderAttachmentForm() {
  return {
    workOrderId: "",
    file: null,
  };
}
