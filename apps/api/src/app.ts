import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { cashTransactionRouter } from "./modules/cash-transactions/cash-transaction.routes.js";
import { customerAuthRouter } from "./modules/customer-auth/customer-auth.routes.js";
import { customerAccountRouter } from "./modules/customer-accounts/customer-account.routes.js";
import { customerPortalRouter } from "./modules/customer-portal/customer-portal.routes.js";
import { customerRouter } from "./modules/customers/customer.routes.js";
import { geocodingRouter } from "./modules/geocoding/geocoding.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { installationVerificationRouter } from "./modules/installation-verifications/installation-verification.routes.js";
import { invoiceRouter } from "./modules/invoices/invoice.routes.js";
import { paymentRouter } from "./modules/payments/payment.routes.js";
import { prospectRouter } from "./modules/prospects/prospect.routes.js";
import { reportRouter } from "./modules/reports/report.routes.js";
import { renewalRouter } from "./modules/renewals/renewal.routes.js";
import { servicePlanRouter } from "./modules/service-plans/service-plan.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { subscriptionRouter } from "./modules/subscriptions/subscription.routes.js";
import { ticketRouter } from "./modules/tickets/ticket.routes.js";
import { workOrderRouter } from "./modules/work-orders/work-order.routes.js";
import { notFoundHandler, sendError } from "./lib/http.js";

export function createApp() {
  const app = express();
  const uploadsDir = new URL("../uploads", import.meta.url);

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir.pathname));

  app.get("/", (_req, res) => {
    return res.json({
      success: true,
      message: "ISP Manager API",
    });
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/customer-auth", customerAuthRouter);
  app.use("/customer-portal", customerPortalRouter);
  app.use("/geocoding", geocodingRouter);
  app.use("/prospects", prospectRouter);
  app.use("/customers", customerRouter);
  app.use("/customer-accounts", customerAccountRouter);
  app.use("/cash-transactions", cashTransactionRouter);
  app.use("/service-plans", servicePlanRouter);
  app.use("/subscriptions", subscriptionRouter);
  app.use("/invoices", invoiceRouter);
  app.use("/payments", paymentRouter);
  app.use("/renewals", renewalRouter);
  app.use("/tickets", ticketRouter);
  app.use("/work-orders", workOrderRouter);
  app.use("/installation-verifications", installationVerificationRouter);
  app.use("/reports", reportRouter);
  app.use("/settings", settingsRouter);

  app.use(notFoundHandler);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    return sendError(res, 500, "Internal server error");
  });

  return app;
}
