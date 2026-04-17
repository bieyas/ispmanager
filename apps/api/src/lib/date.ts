function toDateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getLastDayOfMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function parseDateInput(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return toDateOnly(date);
}

export function resolveAnchorDate(baseDate: Date, anchorDay: number) {
  const year = baseDate.getUTCFullYear();
  const monthIndex = baseDate.getUTCMonth();
  const day = Math.min(anchorDay, getLastDayOfMonth(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, day));
}

export function addMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const targetYear = year + Math.floor(monthIndex / 12);
  const normalizedMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = getLastDayOfMonth(targetYear, normalizedMonth);

  return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay)));
}

export function endOfPreviousDay(date: Date) {
  const next = toDateOnly(date);
  next.setUTCDate(next.getUTCDate() - 1);
  return next;
}

export function calculateFirstPeriod(
  activationDate: Date,
  anchorDay: number,
  prorateEnabled: boolean,
  firstDueDateOverride?: Date | null,
) {
  const startDate = toDateOnly(activationDate);

  if (firstDueDateOverride) {
    const dueDate = toDateOnly(firstDueDateOverride);
    return {
      currentPeriodStart: startDate,
      currentPeriodEnd: dueDate,
      dueDate,
      billingAnchorDate: dueDate,
      isProrated: prorateEnabled,
    };
  }

  const currentAnchor = resolveAnchorDate(startDate, anchorDay);

  if (prorateEnabled && startDate.getTime() !== currentAnchor.getTime()) {
    const nextAnchor = startDate > currentAnchor ? resolveAnchorDate(addMonths(startDate, 1), anchorDay) : currentAnchor;

    return {
      currentPeriodStart: startDate,
      currentPeriodEnd: nextAnchor,
      dueDate: nextAnchor,
      billingAnchorDate: nextAnchor,
      isProrated: true,
    };
  }

  const nextMonthSameDay = addMonths(startDate, 1);
  const periodEnd = endOfPreviousDay(nextMonthSameDay);

  return {
    currentPeriodStart: startDate,
    currentPeriodEnd: periodEnd,
    dueDate: periodEnd,
    billingAnchorDate: resolveAnchorDate(startDate, anchorDay),
    isProrated: false,
  };
}

export function formatDateYYMMDD(date: Date) {
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
