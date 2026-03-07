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

const MOCK_USER: AuthUser = {
  id: 'mock-user-1',
  fullName: 'Mock Super Admin',
  email: 'admin@ispmanager.local',
  isActive: true,
  role: {
    id: 'mock-role-super-admin',
    name: 'Super Admin',
  },
};

export class MockApiAdapter implements ApiAdapter {
  private pppProfiles: PppProfile[] = [
    {
      id: 'mock-ppp-1',
      profileCode: 'PPP-MOCK-DEFAULT',
      profileIdBusiness: 'PPP-MOCK-DEFAULT',
      profileName: 'PPP Mock Default',
      localAddress: '10.10.10.1',
      remotePoolName: 'POOL-MOCK-1',
      dnsServers: '8.8.8.8,1.1.1.1',
      onlyOne: true,
      routerName: 'Mikrotik-Mock',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private internetPackages: InternetPackage[] = [
    {
      id: 'mock-package-1',
      packageCode: 'PKG-MOCK-10M',
      packageIdBusiness: 'PKG-MOCK-10M',
      packageName: 'Mock Fiber 10/10 Mbps',
      downloadKbps: 10240,
      uploadKbps: 10240,
      monthlyPrice: 150000,
      pppProfileId: 'mock-ppp-1',
      pppProfile: {
        id: 'mock-ppp-1',
        profileCode: 'PPP-MOCK-DEFAULT',
        profileIdBusiness: 'PPP-MOCK-DEFAULT',
        profileName: 'PPP Mock Default',
        localAddress: '10.10.10.1',
        remotePoolName: 'POOL-MOCK-1',
        dnsServers: '8.8.8.8,1.1.1.1',
        onlyOne: true,
        routerName: 'Mikrotik-Mock',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private customers: Customer[] = [
    {
      id: 'mock-customer-1',
      customerCode: 'CUST-MOCK-001',
      customerIdBusiness: 'CUST-MOCK-001',
      fullName: 'Pelanggan Mock',
      email: 'mock.customer@example.com',
      phone: '081111111111',
      isActive: true,
      currentPackage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private invoices: Invoice[] = [];

  async getHealth(): Promise<ApiHealth> {
    return { status: 'ok-mock' };
  }

  async login(payload: LoginRequest): Promise<LoginResponse> {
    return {
      accessToken: `mock-access-token-${payload.email}`,
      refreshToken: `mock-refresh-token-${payload.email}`,
      user: {
        ...MOCK_USER,
        email: payload.email,
      },
    };
  }

  async me(_accessToken: string): Promise<AuthUser> {
    return MOCK_USER;
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    return {
      accessToken: `${refreshToken}-rotated-access`,
      refreshToken: `${refreshToken}-rotated-refresh`,
    };
  }

  async listCustomers(
    _accessToken: string,
    query: ListCustomersRequest = {},
  ): Promise<CustomerListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const keyword = (query.search ?? '').toLowerCase().trim();
    const filtered = keyword
      ? this.customers.filter(
          (customer) =>
            customer.customerCode.toLowerCase().includes(keyword) ||
            customer.fullName.toLowerCase().includes(keyword) ||
            (customer.email ?? '').toLowerCase().includes(keyword) ||
            (customer.phone ?? '').toLowerCase().includes(keyword),
        )
      : this.customers;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      meta: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    };
  }

  async getCustomerById(_accessToken: string, id: string): Promise<Customer> {
    const customer = this.customers.find((item) => item.id === id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async createCustomer(_accessToken: string, payload: CreateCustomerRequest): Promise<Customer> {
    const now = new Date().toISOString();
    const created: Customer = {
      id: `mock-customer-${this.customers.length + 1}`,
      customerCode: payload.customerCode,
      customerIdBusiness: payload.customerCode,
      fullName: payload.fullName,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      isActive: payload.isActive ?? true,
      currentPackage: null,
      createdAt: now,
      updatedAt: now,
    };
    this.customers = [created, ...this.customers];
    return created;
  }

  async updateCustomer(
    _accessToken: string,
    id: string,
    payload: UpdateCustomerRequest,
  ): Promise<Customer> {
    const index = this.customers.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }

    const existing = this.customers[index];
    const updated: Customer = {
      ...existing,
      ...payload,
      customerIdBusiness: payload.customerCode ?? existing.customerCode,
      email: payload.email === undefined ? existing.email : (payload.email ?? null),
      phone: payload.phone === undefined ? existing.phone : (payload.phone ?? null),
      updatedAt: new Date().toISOString(),
    };
    this.customers[index] = updated;
    return updated;
  }

  async listPppProfiles(
    _accessToken: string,
    query: ListPppProfilesRequest = {},
  ): Promise<PppProfileListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const keyword = (query.search ?? '').toLowerCase().trim();
    const filtered = keyword
      ? this.pppProfiles.filter(
          (item) =>
            item.profileCode.toLowerCase().includes(keyword) ||
            item.profileName.toLowerCase().includes(keyword) ||
            item.remotePoolName.toLowerCase().includes(keyword),
        )
      : this.pppProfiles;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      meta: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    };
  }

  async getPppProfileById(_accessToken: string, id: string): Promise<PppProfile> {
    const found = this.pppProfiles.find((item) => item.id === id);
    if (!found) {
      throw new Error('PPP profile not found');
    }
    return found;
  }

  async createPppProfile(_accessToken: string, payload: CreatePppProfileRequest): Promise<PppProfile> {
    const now = new Date().toISOString();
    const created: PppProfile = {
      id: `mock-ppp-${this.pppProfiles.length + 1}`,
      profileCode: payload.profileCode,
      profileIdBusiness: payload.profileCode,
      profileName: payload.profileName,
      localAddress: payload.localAddress,
      remotePoolName: payload.remotePoolName,
      dnsServers: payload.dnsServers ?? null,
      onlyOne: payload.onlyOne ?? true,
      routerName: payload.routerName ?? null,
      isActive: payload.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.pppProfiles = [created, ...this.pppProfiles];
    return created;
  }

  async updatePppProfile(
    _accessToken: string,
    id: string,
    payload: UpdatePppProfileRequest,
  ): Promise<PppProfile> {
    const index = this.pppProfiles.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('PPP profile not found');
    }

    const existing = this.pppProfiles[index];
    const updated: PppProfile = {
      ...existing,
      ...payload,
      profileIdBusiness: payload.profileCode ?? existing.profileCode,
      dnsServers:
        payload.dnsServers === undefined ? existing.dnsServers : (payload.dnsServers ?? null),
      routerName:
        payload.routerName === undefined ? existing.routerName : (payload.routerName ?? null),
      updatedAt: new Date().toISOString(),
    };
    this.pppProfiles[index] = updated;
    return updated;
  }

  async listInternetPackages(
    _accessToken: string,
    query: ListInternetPackagesRequest = {},
  ): Promise<InternetPackageListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const keyword = (query.search ?? '').toLowerCase().trim();
    const filtered = keyword
      ? this.internetPackages.filter(
          (item) =>
            item.packageCode.toLowerCase().includes(keyword) ||
            item.packageName.toLowerCase().includes(keyword),
        )
      : this.internetPackages;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      meta: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    };
  }

  async getInternetPackageById(_accessToken: string, id: string): Promise<InternetPackage> {
    const found = this.internetPackages.find((item) => item.id === id);
    if (!found) {
      throw new Error('Package not found');
    }
    return found;
  }

  async createInternetPackage(
    _accessToken: string,
    payload: CreateInternetPackageRequest,
  ): Promise<InternetPackage> {
    const pppProfile = this.pppProfiles.find((item) => item.id === payload.pppProfileId);
    if (!pppProfile) {
      throw new Error('PPP profile not found');
    }

    const now = new Date().toISOString();
    const created: InternetPackage = {
      id: `mock-package-${this.internetPackages.length + 1}`,
      packageCode: payload.packageCode,
      packageIdBusiness: payload.packageCode,
      packageName: payload.packageName,
      downloadKbps: payload.downloadKbps,
      uploadKbps: payload.uploadKbps,
      monthlyPrice: payload.monthlyPrice,
      pppProfileId: payload.pppProfileId,
      pppProfile,
      isActive: payload.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.internetPackages = [created, ...this.internetPackages];
    return created;
  }

  async updateInternetPackage(
    _accessToken: string,
    id: string,
    payload: UpdateInternetPackageRequest,
  ): Promise<InternetPackage> {
    const index = this.internetPackages.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Package not found');
    }

    const existing = this.internetPackages[index];
    const pppProfileId = payload.pppProfileId ?? existing.pppProfileId;
    const pppProfile = this.pppProfiles.find((item) => item.id === pppProfileId);
    if (!pppProfile) {
      throw new Error('PPP profile not found');
    }

    const updated: InternetPackage = {
      ...existing,
      ...payload,
      packageIdBusiness: payload.packageCode ?? existing.packageCode,
      pppProfileId,
      pppProfile,
      updatedAt: new Date().toISOString(),
    };
    this.internetPackages[index] = updated;
    return updated;
  }

  async assignCustomerPackage(
    _accessToken: string,
    customerId: string,
    payload: AssignCustomerPackageRequest,
  ): Promise<Customer> {
    const customerIndex = this.customers.findIndex((item) => item.id === customerId);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }

    const packageValue =
      payload.packageId === null
        ? null
        : this.internetPackages.find((item) => item.id === payload.packageId) ?? null;

    if (payload.packageId !== null && !packageValue) {
      throw new Error('Package not found');
    }

    const updated: Customer = {
      ...this.customers[customerIndex],
      currentPackage: packageValue,
      updatedAt: new Date().toISOString(),
    };
    this.customers[customerIndex] = updated;
    return updated;
  }

  async listInvoices(
    _accessToken: string,
    query: ListInvoicesRequest = {},
  ): Promise<InvoiceListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const keyword = (query.search ?? '').toLowerCase().trim();
    const filtered = this.invoices.filter((item) => {
      if (query.status && item.status !== query.status) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return (
        item.invoiceCode.toLowerCase().includes(keyword) ||
        item.customer.customerCode.toLowerCase().includes(keyword) ||
        item.customer.fullName.toLowerCase().includes(keyword)
      );
    });

    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      meta: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    };
  }

  async getInvoiceById(_accessToken: string, id: string): Promise<Invoice> {
    const found = this.invoices.find((item) => item.id === id);
    if (!found) {
      throw new Error('Invoice not found');
    }
    return found;
  }

  async createInvoice(_accessToken: string, payload: CreateInvoiceRequest): Promise<Invoice> {
    const customer = this.customers.find((item) => item.id === payload.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const now = new Date();
    const code = `INV-MOCK-${String(this.invoices.length + 1).padStart(4, '0')}`;
    const created: Invoice = {
      id: `mock-invoice-${this.invoices.length + 1}`,
      invoiceCode: code,
      invoiceIdBusiness: code,
      customerId: payload.customerId,
      amountDue: payload.amountDue,
      amountPaid: 0,
      status: payload.status ?? 'ISSUED',
      dueDate: payload.dueDate,
      issuedAt: now.toISOString(),
      paidAt: null,
      notes: payload.notes ?? null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerIdBusiness: customer.customerCode,
        fullName: customer.fullName,
      },
      payments: [],
    };

    this.invoices = [created, ...this.invoices];
    return created;
  }

  async recordInvoicePayment(
    _accessToken: string,
    invoiceId: string,
    payload: RecordInvoicePaymentRequest,
  ): Promise<Invoice> {
    const index = this.invoices.findIndex((item) => item.id === invoiceId);
    if (index === -1) {
      throw new Error('Invoice not found');
    }

    const invoice = this.invoices[index];
    const now = new Date().toISOString();
    const payment = {
      id: `mock-payment-${invoice.payments.length + 1}`,
      amount: payload.amount,
      paidAt: payload.paidAt ?? now,
      paymentMethod: payload.paymentMethod ?? null,
      referenceNumber: payload.referenceNumber ?? null,
      notes: payload.notes ?? null,
      createdAt: now,
    };
    const amountPaid = invoice.amountPaid + payload.amount;
    const status = amountPaid >= invoice.amountDue ? 'PAID' : 'ISSUED';
    const updated: Invoice = {
      ...invoice,
      amountPaid,
      status,
      paidAt: status === 'PAID' ? now : null,
      updatedAt: now,
      payments: [payment, ...invoice.payments],
    };
    this.invoices[index] = updated;
    return updated;
  }

  async runOverdueBillingJob(_accessToken: string): Promise<RunOverdueBillingJobResponse> {
    return {
      checkedAt: new Date().toISOString(),
      updated: 0,
    };
  }

  async runMonthlyBillingJob(
    _accessToken: string,
    payload: RunMonthlyBillingJobRequest = {},
  ): Promise<RunMonthlyBillingJobResponse> {
    const now = new Date();
    return {
      year: payload.year ?? now.getUTCFullYear(),
      month: payload.month ?? now.getUTCMonth() + 1,
      created: 0,
      skipped: 0,
    };
  }
}
