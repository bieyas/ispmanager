export type ApiHealth = {
  status: string;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
  };
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type Customer = {
  id: string;
  customerCode: string;
  customerIdBusiness: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  currentPackage: InternetPackage | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListResponse = {
  data: Customer[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ListCustomersRequest = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type CreateCustomerRequest = {
  customerCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
};

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export type PppProfile = {
  id: string;
  profileCode: string;
  profileIdBusiness: string;
  profileName: string;
  localAddress: string;
  remotePoolName: string;
  dnsServers: string | null;
  onlyOne: boolean;
  routerName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PppProfileListResponse = {
  data: PppProfile[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ListPppProfilesRequest = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type CreatePppProfileRequest = {
  profileCode: string;
  profileName: string;
  localAddress: string;
  remotePoolName: string;
  dnsServers?: string;
  onlyOne?: boolean;
  routerName?: string;
  isActive?: boolean;
};

export type UpdatePppProfileRequest = Partial<CreatePppProfileRequest>;

export type InternetPackage = {
  id: string;
  packageCode: string;
  packageIdBusiness: string;
  packageName: string;
  downloadKbps: number;
  uploadKbps: number;
  monthlyPrice: number;
  pppProfileId: string;
  pppProfile: PppProfile;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InternetPackageListResponse = {
  data: InternetPackage[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ListInternetPackagesRequest = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type CreateInternetPackageRequest = {
  packageCode: string;
  packageName: string;
  downloadKbps: number;
  uploadKbps: number;
  monthlyPrice: number;
  pppProfileId: string;
  isActive?: boolean;
};

export type UpdateInternetPackageRequest = Partial<CreateInternetPackageRequest>;

export type AssignCustomerPackageRequest = {
  packageId: string | null;
};

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';

export type InvoicePayment = {
  id: string;
  amount: number;
  paidAt: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
};

export type Invoice = {
  id: string;
  invoiceCode: string;
  invoiceIdBusiness: string;
  customerId: string;
  amountDue: number;
  amountPaid: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedAt: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerCode: string;
    customerIdBusiness: string;
    fullName: string;
  };
  payments: InvoicePayment[];
};

export type InvoiceListResponse = {
  data: Invoice[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ListInvoicesRequest = {
  search?: string;
  status?: InvoiceStatus;
  page?: number;
  pageSize?: number;
};

export type CreateInvoiceRequest = {
  customerId: string;
  amountDue: number;
  dueDate: string;
  status?: 'DRAFT' | 'ISSUED';
  notes?: string;
};

export type RecordInvoicePaymentRequest = {
  amount: number;
  paidAt?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
};

export type RunMonthlyBillingJobRequest = {
  year?: number;
  month?: number;
};

export type RunOverdueBillingJobResponse = {
  checkedAt: string;
  updated: number;
};

export type RunMonthlyBillingJobResponse = {
  year: number;
  month: number;
  created: number;
  skipped: number;
};

export interface ApiAdapter {
  getHealth(): Promise<ApiHealth>;
  login(payload: LoginRequest): Promise<LoginResponse>;
  me(accessToken: string): Promise<AuthUser>;
  refresh(refreshToken: string): Promise<RefreshTokenResponse>;
  listCustomers(accessToken: string, query?: ListCustomersRequest): Promise<CustomerListResponse>;
  getCustomerById(accessToken: string, id: string): Promise<Customer>;
  createCustomer(accessToken: string, payload: CreateCustomerRequest): Promise<Customer>;
  updateCustomer(
    accessToken: string,
    id: string,
    payload: UpdateCustomerRequest,
  ): Promise<Customer>;
  listPppProfiles(accessToken: string, query?: ListPppProfilesRequest): Promise<PppProfileListResponse>;
  getPppProfileById(accessToken: string, id: string): Promise<PppProfile>;
  createPppProfile(accessToken: string, payload: CreatePppProfileRequest): Promise<PppProfile>;
  updatePppProfile(
    accessToken: string,
    id: string,
    payload: UpdatePppProfileRequest,
  ): Promise<PppProfile>;
  listInternetPackages(
    accessToken: string,
    query?: ListInternetPackagesRequest,
  ): Promise<InternetPackageListResponse>;
  getInternetPackageById(accessToken: string, id: string): Promise<InternetPackage>;
  createInternetPackage(
    accessToken: string,
    payload: CreateInternetPackageRequest,
  ): Promise<InternetPackage>;
  updateInternetPackage(
    accessToken: string,
    id: string,
    payload: UpdateInternetPackageRequest,
  ): Promise<InternetPackage>;
  assignCustomerPackage(
    accessToken: string,
    customerId: string,
    payload: AssignCustomerPackageRequest,
  ): Promise<Customer>;
  listInvoices(accessToken: string, query?: ListInvoicesRequest): Promise<InvoiceListResponse>;
  getInvoiceById(accessToken: string, id: string): Promise<Invoice>;
  createInvoice(accessToken: string, payload: CreateInvoiceRequest): Promise<Invoice>;
  recordInvoicePayment(
    accessToken: string,
    invoiceId: string,
    payload: RecordInvoicePaymentRequest,
  ): Promise<Invoice>;
  runOverdueBillingJob(accessToken: string): Promise<RunOverdueBillingJobResponse>;
  runMonthlyBillingJob(
    accessToken: string,
    payload?: RunMonthlyBillingJobRequest,
  ): Promise<RunMonthlyBillingJobResponse>;
}
