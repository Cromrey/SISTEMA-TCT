/**
 * Global Date Formatter for Corporacion TCT
 * Standard format across entire application: dd/mm/aa (e.g., 19/08/26)
 */

export function formatDateDDMMAA(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const dd = String(dateInput.getDate()).padStart(2, '0');
    const mm = String(dateInput.getMonth() + 1).padStart(2, '0');
    const yy = String(dateInput.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  const clean = String(dateInput).trim();
  if (!clean) return '';

  // Match YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const yyyy = isoMatch[1];
    const mm = isoMatch[2].padStart(2, '0');
    const dd = isoMatch[3].padStart(2, '0');
    const yy = yyyy.slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  // Match DD/MM/YYYY or DD/MM/YY
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    const dd = slashMatch[1].padStart(2, '0');
    const mm = slashMatch[2].padStart(2, '0');
    const yy = slashMatch[3].slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  // Match DD-MM-YYYY
  const dashMatch = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})/);
  if (dashMatch) {
    const dd = dashMatch[1].padStart(2, '0');
    const mm = dashMatch[2].padStart(2, '0');
    const yy = dashMatch[3].slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  return clean;
}

/**
 * Format full date with time in dd/mm/aa HH:mm format
 */
export function formatDateTimeDDMMAA(dateInput?: string | Date | null, timeStr?: string): string {
  const formattedDate = formatDateDDMMAA(dateInput);
  if (!formattedDate) return '';
  if (timeStr) {
    return `${formattedDate} (${timeStr})`;
  }
  return formattedDate;
}
