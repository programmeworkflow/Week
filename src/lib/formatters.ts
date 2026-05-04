// CPF: 000.000.000-00 (only numbers)
export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

// CNPJ: 00.000.000/0000-00 (only numbers)
export const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

// Telefone: (00) 00000-0000 (only numbers, dash in middle)
export const formatTelefone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Data: dd/mm/yyyy (only numbers)
export const formatDate = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// CNPJ ou CPF automático: até 11 dígitos = CPF, mais = CNPJ
export const formatCNPJorCPF = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) return formatCPF(value);
  return formatCNPJ(value);
};

// Email validation: must contain @
export const isValidEmail = (value: string): boolean => {
  return value.includes("@");
};

// Parse ISO date (YYYY-MM-DD) to a Date at noon local time. Returns null if invalid.
// Use this for any due_date/start_date stored in ISO format before passing to format().
export const parseISODate = (iso: string | null | undefined): Date | null => {
  if (!iso || typeof iso !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), 12, 0, 0);
  if (isNaN(date.getTime())) return null;
  // Reject dates that JS silently rolled over (e.g. "2026-02-30")
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
  return date;
};

// Parse BR date (dd/mm/yyyy) to a Date at noon local time. Returns null if invalid.
export const parseBRDate = (br: string | null | undefined): Date | null => {
  if (!br || typeof br !== "string") return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), 12, 0, 0);
  if (isNaN(date.getTime())) return null;
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
  return date;
};
