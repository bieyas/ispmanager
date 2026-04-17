import { db } from "../../lib/db.js";

function formatDateYYYYMMDD(date: Date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function generateTicketNo(tx = db) {
  const today = new Date();
  const prefix = formatDateYYYYMMDD(today);
  const sameDayCount = await tx.ticket.count({
    where: {
      createdAt: {
        gte: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
        lt: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)),
      },
    },
  });

  return `TCK-${prefix}-${String(sameDayCount + 1).padStart(3, "0")}`;
}

export function getTicketActorSummary(ticket: {
  createdByUser?: { id: string; fullName?: string | null; username?: string | null } | null;
  createdByCustomerUser?: {
    id: string;
    username?: string | null;
    customer?: { customerCode?: string | null; fullName?: string | null } | null;
  } | null;
}) {
  if (ticket.createdByUser) {
    return {
      type: "internal_user",
      id: ticket.createdByUser.id,
      label: ticket.createdByUser.fullName || ticket.createdByUser.username || "Internal User",
      username: ticket.createdByUser.username || null,
    };
  }

  if (ticket.createdByCustomerUser) {
    return {
      type: "customer_user",
      id: ticket.createdByCustomerUser.id,
      label: ticket.createdByCustomerUser.customer?.fullName || ticket.createdByCustomerUser.username || "Customer",
      username: ticket.createdByCustomerUser.username || null,
      customerCode: ticket.createdByCustomerUser.customer?.customerCode || null,
    };
  }

  return {
    type: "unknown",
    id: null,
    label: "Unknown Actor",
    username: null,
  };
}

export function getTicketCommentActorSummary(comment: {
  user?: { id: string; fullName?: string | null; username?: string | null } | null;
  customerUser?: {
    id: string;
    username?: string | null;
    customer?: { customerCode?: string | null; fullName?: string | null } | null;
  } | null;
}) {
  if (comment.user) {
    return {
      type: "internal_user",
      id: comment.user.id,
      label: comment.user.fullName || comment.user.username || "Internal User",
      username: comment.user.username || null,
    };
  }

  if (comment.customerUser) {
    return {
      type: "customer_user",
      id: comment.customerUser.id,
      label: comment.customerUser.customer?.fullName || comment.customerUser.username || "Customer",
      username: comment.customerUser.username || null,
      customerCode: comment.customerUser.customer?.customerCode || null,
    };
  }

  return {
    type: "unknown",
    id: null,
    label: "Unknown Actor",
    username: null,
  };
}
