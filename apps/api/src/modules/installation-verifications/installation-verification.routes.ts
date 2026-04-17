import { Router } from "express";
import { InstallationVerificationStatus, Prisma } from "@ispmanager/db";
import { writeAuditLog } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { sendCreated, sendError, sendOk } from "../../lib/http.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { decideInstallationVerificationSchema, listInstallationVerificationsQuerySchema, submitInstallationVerificationSchema } from "./installation-verification.schemas.js";

export const installationVerificationRouter = Router();

function getInstallationVerificationScope(req: Express.Request): Prisma.InstallationVerificationWhereInput | null {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return null;
  }

  if (currentUser.role.code === "admin") {
    return {};
  }

  return {
    OR: [
      {
        submittedByUserId: currentUser.id,
      },
      {
        prospect: {
          createdByUserId: currentUser.id,
        },
      },
    ],
  };
}

installationVerificationRouter.use(authenticate);

installationVerificationRouter.get("/", authorize("installation_verifications.read"), async (req, res, next) => {
  try {
    const parsed = listInstallationVerificationsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid installation verification query", parsed.error.flatten());
    }

    const scope = getInstallationVerificationScope(req);
    const items = await db.installationVerification.findMany({
      where: {
        ...(scope ?? {}),
        ...(parsed.data.prospectId ? { prospectId: parsed.data.prospectId } : {}),
        ...(parsed.data.workOrderId ? { workOrderId: parsed.data.workOrderId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        prospect: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            workOrderNo: true,
            status: true,
          },
        },
        submittedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        verifiedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return sendOk(res, items, "installation verifications loaded");
  } catch (error) {
    return next(error);
  }
});

installationVerificationRouter.get("/:id", authorize("installation_verifications.read"), async (req, res, next) => {
  try {
    const verificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scope = getInstallationVerificationScope(req);
    const verification = await db.installationVerification.findFirst({
      where: {
        id: verificationId,
        ...(scope ?? {}),
      },
      include: {
        prospect: true,
        workOrder: true,
        submittedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        verifiedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!verification) {
      return sendError(res, 404, "Installation verification not found");
    }

    return sendOk(res, verification, "installation verification loaded");
  } catch (error) {
    return next(error);
  }
});

installationVerificationRouter.post("/", authorize("installation_verifications.submit"), async (req, res, next) => {
  try {
    const parsed = submitInstallationVerificationSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid installation verification payload", parsed.error.flatten());
    }

    const workOrder = await db.workOrder.findUnique({
      where: { id: parsed.data.workOrderId },
      select: {
        id: true,
        prospectId: true,
      },
    });

    if (!workOrder) {
      return sendError(res, 404, "Work order not found");
    }

    if (workOrder.prospectId !== parsed.data.prospectId) {
      return sendError(res, 400, "Work order tidak sesuai dengan prospect");
    }

    const existingVerification = await db.installationVerification.findUnique({
      where: { workOrderId: parsed.data.workOrderId },
      select: { id: true },
    });

    if (existingVerification) {
      return sendError(res, 400, "Installation verification already exists for this work order");
    }

    const verification = await db.installationVerification.create({
      data: {
        prospectId: parsed.data.prospectId,
        workOrderId: parsed.data.workOrderId,
        submittedByUserId: req.currentUser!.id,
        checklistSnapshot: parsed.data.checklistSnapshot,
        deviceSerialSnapshot: parsed.data.deviceSerialSnapshot ?? null,
        signalSnapshot: parsed.data.signalSnapshot ?? null,
        photoSummary: parsed.data.photoSummary ?? null,
        verificationNotes: parsed.data.verificationNotes ?? null,
        verificationStatus: InstallationVerificationStatus.submitted,
        submittedAt: new Date(),
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "installation_verifications",
      action: "submit",
      entityType: "installation_verification",
      entityId: verification.id,
      newValues: verification,
    });

    return sendCreated(res, verification, "installation verification submitted");
  } catch (error) {
    return next(error);
  }
});

installationVerificationRouter.post("/:id/verify", authorize("installation_verifications.verify"), async (req, res, next) => {
  try {
    const verificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = decideInstallationVerificationSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return sendError(res, 400, "Invalid installation verification approve payload", parsed.error.flatten());
    }

    const existingVerification = await db.installationVerification.findUnique({
      where: { id: verificationId },
    });

    if (!existingVerification) {
      return sendError(res, 404, "Installation verification not found");
    }

    const verification = await db.installationVerification.update({
      where: { id: verificationId },
      data: {
        verificationStatus: InstallationVerificationStatus.approved,
        verifiedByUserId: req.currentUser!.id,
        verifiedAt: new Date(),
        verificationNotes: parsed.data.verificationNotes ?? existingVerification.verificationNotes,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "installation_verifications",
      action: "verify",
      entityType: "installation_verification",
      entityId: verification.id,
      oldValues: existingVerification,
      newValues: verification,
    });

    return sendOk(res, verification, "installation verification approved");
  } catch (error) {
    return next(error);
  }
});

installationVerificationRouter.post("/:id/reject", authorize("installation_verifications.reject"), async (req, res, next) => {
  try {
    const verificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = decideInstallationVerificationSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return sendError(res, 400, "Invalid installation verification reject payload", parsed.error.flatten());
    }

    const existingVerification = await db.installationVerification.findUnique({
      where: { id: verificationId },
    });

    if (!existingVerification) {
      return sendError(res, 404, "Installation verification not found");
    }

    const verification = await db.installationVerification.update({
      where: { id: verificationId },
      data: {
        verificationStatus: InstallationVerificationStatus.rejected,
        verifiedByUserId: req.currentUser!.id,
        verifiedAt: new Date(),
        verificationNotes: parsed.data.verificationNotes ?? existingVerification.verificationNotes,
      },
    });

    await writeAuditLog({
      req,
      userId: req.currentUser?.id,
      module: "installation_verifications",
      action: "reject",
      entityType: "installation_verification",
      entityId: verification.id,
      oldValues: existingVerification,
      newValues: verification,
    });

    return sendOk(res, verification, "installation verification rejected");
  } catch (error) {
    return next(error);
  }
});
