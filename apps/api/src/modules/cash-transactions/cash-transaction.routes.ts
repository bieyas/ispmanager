import { Router, Express } from "express";
import { Prisma } from "@ispmanager/db";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import {
  cashTransactionQuerySchema,
  cancelCashTransactionSchema,
  confirmCashTransactionSchema,
  createCashTransactionSchema,
  updateCashTransactionSchema,
} from "./cash-transaction.schemas.js";
import {
  cancelManualCashTransaction,
  confirmManualCashTransaction,
  createManualCashTransaction,
  listCashTransactions,
  updateManualCashTransaction,
} from "./cash-transaction.service.js";

export const cashTransactionRouter = Router();

// Helper function untuk build scope based on user role
function getCashTransactionScope(req: Express.Request): Prisma.CashTransactionWhereInput | null {
  const currentUser = req.currentUser;
  
  if (!currentUser || currentUser.role.code === "admin") {
    return null;  // Admin: akses semua
  }

  // Tech/Sales: hanya cash transaction dari customer mereka atau yang mereka create
  return {
    OR: [
      // Cash transactions from their created customers
      {
        subscription: {
          customer: {
            activatedFromProspect: {
              createdByUserId: currentUser.id,
            },
          },
        },
      },
      // Cash transactions they created directly
      {
        createdByUserId: currentUser.id,
      },
    ],
  };
}

cashTransactionRouter.use(authenticate);

cashTransactionRouter.get(
  "/",
  authorize("cash_transactions.list"),
  async (req, res, next) => {
    try {
      const parsedQuery = cashTransactionQuerySchema.safeParse(req.query);

      if (!parsedQuery.success) {
        return sendError(res, 400, "Invalid cash transaction query", parsedQuery.error.flatten());
      }

      const scope = getCashTransactionScope(req);
      const cashTransactions = await listCashTransactions(parsedQuery.data, scope ?? undefined);

      return sendOk(res, cashTransactions, "cash transactions loaded");
    } catch (error) {
      return next(error);
    }
  },
);

cashTransactionRouter.get(
  "/export/csv",
  authorize("cash_transactions.list"),
  async (req, res, next) => {
    try {
      const parsedQuery = cashTransactionQuerySchema.safeParse(req.query);

      if (!parsedQuery.success) {
        return sendError(res, 400, "Invalid cash transaction export query", parsedQuery.error.flatten());
      }

      const scope = getCashTransactionScope(req);
      const cashTransactions = await listCashTransactions(parsedQuery.data, scope ?? undefined);
      const rows = [
        [
          "transaction_no",
          "transaction_date",
          "source",
          "category_code",
          "category_name",
          "type",
          "keterangan",
          "method",
          "amount",
          "status",
          "customer_code",
          "customer_name",
          "invoice_no",
          "created_by",
          "approved_by",
        ],
        ...cashTransactions.map((item) => [
          item.transactionNo,
          item.transactionDate.toISOString().slice(0, 10),
          item.paymentId ? "auto_post" : "manual",
          item.cashCategory.code,
          item.cashCategory.name,
          item.type,
          item.keterangan,
          item.method,
          item.amount.toString(),
          item.status,
          item.payment?.invoice?.subscription?.customer?.customerCode ?? "",
          item.payment?.invoice?.subscription?.customer?.fullName ?? "",
          item.payment?.invoice?.invoiceNo ?? "",
          item.createdByUser?.fullName ?? "",
          item.approvedByUser?.fullName ?? "",
        ]),
      ];

      const csv = rows
        .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
        .join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="cashflow-report-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      return next(error);
    }
  },
);

cashTransactionRouter.get(
  "/export/print",
  authorize("cash_transactions.list"),
  async (req, res, next) => {
    try {
      const parsedQuery = cashTransactionQuerySchema.safeParse(req.query);

      if (!parsedQuery.success) {
        return sendError(res, 400, "Invalid cash transaction export query", parsedQuery.error.flatten());
      }

      const scope = getCashTransactionScope(req);
      const cashTransactions = await listCashTransactions(parsedQuery.data, scope ?? undefined);
      const totals = cashTransactions.reduce(
        (accumulator, item) => {
          const amount = Number(item.amount.toString());

          if (item.type === "cash_in") {
            accumulator.cashIn += amount;
          }

          if (item.type === "cash_out") {
            accumulator.cashOut += amount;
          }

          return accumulator;
        },
        { cashIn: 0, cashOut: 0 },
      );

      const filters = [
        parsedQuery.data.dateFrom ? `Dari ${parsedQuery.data.dateFrom}` : null,
        parsedQuery.data.dateTo ? `Sampai ${parsedQuery.data.dateTo}` : null,
        parsedQuery.data.categoryCode ? `Kategori ${parsedQuery.data.categoryCode}` : null,
        parsedQuery.data.status ? `Status ${parsedQuery.data.status}` : null,
        parsedQuery.data.type ? `Tipe ${parsedQuery.data.type}` : null,
      ]
        .filter(Boolean)
        .join(" • ");

      const rows = cashTransactions
        .map((item) => {
          const customerCode = item.payment?.invoice?.subscription?.customer?.customerCode ?? "-";
          const customerName = item.payment?.invoice?.subscription?.customer?.fullName ?? "-";

          return `
            <tr>
              <td>${item.transactionNo}</td>
              <td>${item.transactionDate.toISOString().slice(0, 10)}</td>
              <td>${item.paymentId ? "Auto-post" : "Manual"}</td>
              <td>${item.cashCategory.name}</td>
              <td>${item.keterangan}</td>
              <td>${item.method}</td>
              <td>${item.type}</td>
              <td>${item.amount.toString()}</td>
              <td>${item.status}</td>
              <td>${customerCode} ${customerName}</td>
            </tr>
          `;
        })
        .join("");

      const html = `
        <!doctype html>
        <html lang="id">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Laporan Cashflow ISP Manager</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #163126; }
              h1, h2, p { margin: 0; }
              .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
              .meta { color: #5f7067; margin-top: 8px; line-height: 1.5; }
              .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0 24px; }
              .stat { border: 1px solid #d8e1db; border-radius: 16px; padding: 14px; background: #f7fbf8; }
              .stat span { display: block; color: #5f7067; font-size: 12px; margin-bottom: 6px; }
              .stat strong { font-size: 18px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #d8e1db; padding: 10px; text-align: left; font-size: 12px; vertical-align: top; }
              th { background: #eff4f0; text-transform: uppercase; letter-spacing: 0.06em; }
              .footer { margin-top: 20px; color: #5f7067; font-size: 12px; }
              @media print { body { padding: 16px; } }
            </style>
          </head>
          <body>
            <section class="head">
              <div>
                <h1>Laporan Cashflow</h1>
                <div class="meta">
                  <p>ISP Manager Finance</p>
                  <p>${filters || "Semua transaksi"}</p>
                </div>
              </div>
              <div class="meta">
                <p>Dicetak: ${new Date().toISOString().slice(0, 10)}</p>
                <p>Total transaksi: ${cashTransactions.length}</p>
              </div>
            </section>

            <section class="stats">
              <article class="stat"><span>Cash In</span><strong>${totals.cashIn.toLocaleString("id-ID")}</strong></article>
              <article class="stat"><span>Cash Out</span><strong>${totals.cashOut.toLocaleString("id-ID")}</strong></article>
              <article class="stat"><span>Net Cash</span><strong>${(totals.cashIn - totals.cashOut).toLocaleString("id-ID")}</strong></article>
            </section>

            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Sumber</th>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th>Metode</th>
                  <th>Tipe</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Customer</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <p class="footer">Dokumen ini digenerate server-side untuk kebutuhan export dan PDF resmi.</p>
          </body>
        </html>
      `;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    } catch (error) {
      return next(error);
    }
  },
);

cashTransactionRouter.get(
  "/categories/list",
  authorize("cash_categories.list"),
  async (_req, res, next) => {
    try {
      const categories = await db.cashCategory.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      });

      return sendOk(res, categories, "cash categories loaded");
    } catch (error) {
      return next(error);
    }
  },
);

cashTransactionRouter.get(
  "/:id",
  authorize("cash_transactions.read"),
  async (req, res, next) => {
    try {
      const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const cashTransaction = await db.cashTransaction.findUnique({
        where: { id: transactionId },
        include: {
          cashCategory: true,
          createdByUser: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          payment: {
            include: {
              customer: {
                select: {
                  id: true,
                  customerCode: true,
                  fullName: true,
                },
              },
              invoice: {
                select: {
                  id: true,
                  invoiceNo: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!cashTransaction) {
        return sendError(res, 404, "Cash transaction not found");
      }

      return sendOk(res, cashTransaction, "cash transaction loaded");
    } catch (error) {
      return next(error);
    }
  },
);

cashTransactionRouter.post(
  "/",
  async (req, res, next) => {
    try {
      const parsed = createCashTransactionSchema.safeParse(req.body);

      if (!parsed.success) {
        return sendError(res, 400, "Invalid cash transaction payload", parsed.error.flatten());
      }

      const requiredPermission =
        parsed.data.type === "cash_in" ? "cash_transactions.create_in" : "cash_transactions.create_out";

      if (!req.currentUser?.permissions.includes(requiredPermission)) {
        return sendError(res, 403, "Forbidden", {
          missingPermissions: [requiredPermission],
        });
      }

      try {
        const cashTransaction = await createManualCashTransaction({
          ...parsed.data,
          createdByUserId: req.currentUser.id,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "cash_transactions",
          action: "create",
          entityType: "cash_transaction",
          entityId: cashTransaction.id,
          newValues: cashTransaction,
        });

        return sendCreated(res, cashTransaction, "cash transaction created");
      } catch (error) {
        if (error instanceof Error) {
          return sendError(res, 400, error.message);
        }

        throw error;
      }
    } catch (error) {
      return next(error);
    }
  },
);

cashTransactionRouter.patch(
  "/:id",
  authorize("cash_transactions.update"),
  async (req, res, next) => {
    try {
      const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const existingTransaction = await db.cashTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!existingTransaction) {
        return sendError(res, 404, "Cash transaction not found");
      }

      const parsed = updateCashTransactionSchema.safeParse(req.body);

      if (!parsed.success) {
        return sendError(res, 400, "Invalid cash transaction payload", parsed.error.flatten());
      }

      try {
        const cashTransaction = await updateManualCashTransaction({
          transactionId,
          ...parsed.data,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "cash_transactions",
          action: "update",
          entityType: "cash_transaction",
          entityId: cashTransaction.id,
          oldValues: existingTransaction,
          newValues: cashTransaction,
        });

        return sendOk(res, cashTransaction, "cash transaction updated");
      } catch (error) {
        if (error instanceof Error) {
          return sendError(res, 400, error.message);
        }

        throw error;
      }
    } catch (error) {
      return next(error);
    }
  },
);

cashTransactionRouter.post(
  "/:id/confirm",
  authorize("cash_transactions.confirm"),
  async (req, res, next) => {
    try {
      const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const existingTransaction = await db.cashTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!existingTransaction) {
        return sendError(res, 404, "Cash transaction not found");
      }

      const parsed = confirmCashTransactionSchema.safeParse(req.body);

      if (!parsed.success) {
        return sendError(res, 400, "Invalid cash transaction confirmation payload", parsed.error.flatten());
      }

      try {
        const cashTransaction = await confirmManualCashTransaction({
          transactionId,
          approvedByUserId: req.currentUser!.id,
          approvalNote: parsed.data.approvalNote,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "cash_transactions",
          action: "confirm",
          entityType: "cash_transaction",
          entityId: cashTransaction.id,
          oldValues: existingTransaction,
          newValues: cashTransaction,
        });

        return sendOk(res, cashTransaction, "cash transaction confirmed");
      } catch (error) {
        if (error instanceof Error) {
          return sendError(res, 400, error.message);
        }

        throw error;
      }
    } catch (error) {
      return next(error);
    }
  },
);

cashTransactionRouter.delete(
  "/:id",
  authorize("cash_transactions.delete"),
  async (req, res, next) => {
    try {
      const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const existingTransaction = await db.cashTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!existingTransaction) {
        return sendError(res, 404, "Cash transaction not found");
      }

      const parsed = cancelCashTransactionSchema.safeParse(req.body ?? {});

      if (!parsed.success) {
        return sendError(res, 400, "Invalid cash transaction cancel payload", parsed.error.flatten());
      }

      try {
        const cashTransaction = await cancelManualCashTransaction({
          transactionId,
          approvedByUserId: req.currentUser!.id,
          approvalNote: parsed.data.approvalNote,
        });

        await writeAuditLog({
          req,
          userId: req.currentUser?.id,
          module: "cash_transactions",
          action: "cancel",
          entityType: "cash_transaction",
          entityId: cashTransaction.id,
          oldValues: existingTransaction,
          newValues: cashTransaction,
        });

        return sendOk(res, cashTransaction, "cash transaction cancelled");
      } catch (error) {
        if (error instanceof Error) {
          return sendError(res, 400, error.message);
        }

        throw error;
      }
    } catch (error) {
      return next(error);
    }
  },
);
