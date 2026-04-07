const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const APP_TIME_ZONE = 'America/Sao_Paulo';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function parseDateOnly(value: string) {
  const match = value.match(DATE_ONLY_PATTERN);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
}

export function getLocalDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getDatePartsForTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((item) => item.type === 'year')?.value || '';
  const month = parts.find((item) => item.type === 'month')?.value || '';
  const day = parts.find((item) => item.type === 'day')?.value || '';

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

export function getTimeZoneDateInputValue(date = new Date(), timeZone = APP_TIME_ZONE) {
  const parts = getDatePartsForTimeZone(date, timeZone);
  if (!parts) {
    return getLocalDateInputValue(date);
  }

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getAppDateInputValue(date = new Date()) {
  return getTimeZoneDateInputValue(date, APP_TIME_ZONE);
}

export function extractDateOnly(value: string | Date | null | undefined) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return getLocalDateInputValue(value);
  }

  const trimmed = value.trim();
  const directMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch) {
    return directMatch[1];
  }

  const parsedDate = new Date(trimmed);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return getLocalDateInputValue(parsedDate);
}

export function compareDateOnly(a: string | Date | null | undefined, b: string | Date | null | undefined) {
  return extractDateOnly(a).localeCompare(extractDateOnly(b));
}

export function formatDatePtBr(value: string | Date | null | undefined) {
  if (!value) {
    return '-';
  }

  if (value instanceof Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: APP_TIME_ZONE,
    }).format(value);
  }

  const dateOnly = extractDateOnly(value);
  const parsedDateOnly = parseDateOnly(dateOnly);
  if (parsedDateOnly) {
    return `${pad(parsedDateOnly.day)}/${pad(parsedDateOnly.month)}/${parsedDateOnly.year}`;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIME_ZONE,
  }).format(parsedDate);
}

export function formatDateDayMonthPtBr(value: string | Date | null | undefined) {
  if (!value) {
    return '-';
  }

  const dateOnly = extractDateOnly(value);
  const parsedDateOnly = parseDateOnly(dateOnly);
  if (parsedDateOnly) {
    return `${pad(parsedDateOnly.day)}/${pad(parsedDateOnly.month)}`;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
  }).format(parsedDate);
}

export function formatDateTimePtBr(value: string | Date | null | undefined) {
  if (!value) {
    return '-';
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
}

export function isSameMonthDate(value: string | Date | null | undefined, referenceDate = new Date()) {
  const dateOnly = extractDateOnly(value);
  const parsedDateOnly = parseDateOnly(dateOnly);

  if (parsedDateOnly) {
    return (
      parsedDateOnly.year === referenceDate.getFullYear() &&
      parsedDateOnly.month === referenceDate.getMonth() + 1
    );
  }

  const parsedDate = value instanceof Date ? value : value ? new Date(value) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return (
    parsedDate.getFullYear() === referenceDate.getFullYear() &&
    parsedDate.getMonth() === referenceDate.getMonth()
  );
}

export function diffDateOnlyInDays(start: string | Date, end: string | Date) {
  const startDateOnly = extractDateOnly(start);
  const endDateOnly = extractDateOnly(end);
  const parsedStart = parseDateOnly(startDateOnly);
  const parsedEnd = parseDateOnly(endDateOnly);

  if (!parsedStart || !parsedEnd) {
    return null;
  }

  const startDate = new Date(parsedStart.year, parsedStart.month - 1, parsedStart.day);
  const endDate = new Date(parsedEnd.year, parsedEnd.month - 1, parsedEnd.day);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
}
