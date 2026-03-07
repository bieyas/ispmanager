import {
  ApiAdapter,
  ApiHealth,
  AssignCustomerPackageRequest,
  AuthUser,
  CreateInvoiceRequest,
  CreateInternetPackageRequest,
  CreatePppProfileRequest,
  CreateCustomerRequest,
  Customer,
  CustomerListResponse,
  Invoice,
  InvoiceListResponse,
  InternetPackage,
  InternetPackageListResponse,
  ListInvoicesRequest,
  ListInternetPackagesRequest,
  ListPppProfilesRequest,
  ListCustomersRequest,
  LoginRequest,
  LoginResponse,
  PppProfile,
  PppProfileListResponse,
  RecordInvoicePaymentRequest,
  RefreshTokenResponse,
  RunMonthlyBillingJobRequest,
  RunMonthlyBillingJobResponse,
  RunOverdueBillingJobResponse,
  UpdateInternetPackageRequest,
  UpdatePppProfileRequest,
  UpdateCustomerRequest,
} from '../types';

const DEFAULT_BASE_URL = 'http://localhost:3001/api';

export class RealApiAdapter implements ApiAdapter {
  constructor(
    private readonly baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL,
  ) {}

  async getHealth(): Promise<ApiHealth> {
    return this.request<ApiHealth>('/health', {
      method: 'GET',
    });
  }

  async login(payload: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async me(accessToken: string): Promise<AuthUser> {
    return this.request<AuthUser>('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    return this.request<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async listCustomers(
    accessToken: string,
    query: ListCustomersRequest = {},
  ): Promise<CustomerListResponse> {
    const params = new URLSearchParams();
    if (query.search) {
      params.set('search', query.search);
    }
    if (query.page) {
      params.set('page', String(query.page));
    }
    if (query.pageSize) {
      params.set('pageSize', String(query.pageSize));
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';

    return this.request<CustomerListResponse>(`/customers${suffix}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getCustomerById(accessToken: string, id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async createCustomer(accessToken: string, payload: CreateCustomerRequest): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async updateCustomer(
    accessToken: string,
    id: string,
    payload: UpdateCustomerRequest,
  ): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async listPppProfiles(
    accessToken: string,
    query: ListPppProfilesRequest = {},
  ): Promise<PppProfileListResponse> {
    const params = new URLSearchParams();
    if (query.search) {
      params.set('search', query.search);
    }
    if (query.page) {
      params.set('page', String(query.page));
    }
    if (query.pageSize) {
      params.set('pageSize', String(query.pageSize));
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';

    return this.request<PppProfileListResponse>(`/ppp-profiles${suffix}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getPppProfileById(accessToken: string, id: string): Promise<PppProfile> {
    return this.request<PppProfile>(`/ppp-profiles/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async createPppProfile(
    accessToken: string,
    payload: CreatePppProfileRequest,
  ): Promise<PppProfile> {
    return this.request<PppProfile>('/ppp-profiles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async updatePppProfile(
    accessToken: string,
    id: string,
    payload: UpdatePppProfileRequest,
  ): Promise<PppProfile> {
    return this.request<PppProfile>(`/ppp-profiles/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async listInternetPackages(
    accessToken: string,
    query: ListInternetPackagesRequest = {},
  ): Promise<InternetPackageListResponse> {
    const params = new URLSearchParams();
    if (query.search) {
      params.set('search', query.search);
    }
    if (query.page) {
      params.set('page', String(query.page));
    }
    if (query.pageSize) {
      params.set('pageSize', String(query.pageSize));
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';

    return this.request<InternetPackageListResponse>(`/packages${suffix}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getInternetPackageById(accessToken: string, id: string): Promise<InternetPackage> {
    return this.request<InternetPackage>(`/packages/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async createInternetPackage(
    accessToken: string,
    payload: CreateInternetPackageRequest,
  ): Promise<InternetPackage> {
    return this.request<InternetPackage>('/packages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async updateInternetPackage(
    accessToken: string,
    id: string,
    payload: UpdateInternetPackageRequest,
  ): Promise<InternetPackage> {
    return this.request<InternetPackage>(`/packages/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async assignCustomerPackage(
    accessToken: string,
    customerId: string,
    payload: AssignCustomerPackageRequest,
  ): Promise<Customer> {
    return this.request<Customer>(`/customers/${customerId}/package-assignment`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async listInvoices(
    accessToken: string,
    query: ListInvoicesRequest = {},
  ): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();
    if (query.search) {
      params.set('search', query.search);
    }
    if (query.status) {
      params.set('status', query.status);
    }
    if (query.page) {
      params.set('page', String(query.page));
    }
    if (query.pageSize) {
      params.set('pageSize', String(query.pageSize));
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';

    return this.request<InvoiceListResponse>(`/billing/invoices${suffix}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getInvoiceById(accessToken: string, id: string): Promise<Invoice> {
    return this.request<Invoice>(`/billing/invoices/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async createInvoice(accessToken: string, payload: CreateInvoiceRequest): Promise<Invoice> {
    return this.request<Invoice>('/billing/invoices', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async recordInvoicePayment(
    accessToken: string,
    invoiceId: string,
    payload: RecordInvoicePaymentRequest,
  ): Promise<Invoice> {
    return this.request<Invoice>(`/billing/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  async runOverdueBillingJob(accessToken: string): Promise<RunOverdueBillingJobResponse> {
    return this.request<RunOverdueBillingJobResponse>('/billing/jobs/run-overdue', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async runMonthlyBillingJob(
    accessToken: string,
    payload: RunMonthlyBillingJobRequest = {},
  ): Promise<RunMonthlyBillingJobResponse> {
    return this.request<RunMonthlyBillingJobResponse>('/billing/jobs/run-monthly', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
