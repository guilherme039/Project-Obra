export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (parseInt(cleaned[9]) !== d1) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return parseInt(cleaned[10]) === d2;
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * w1[i];
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleaned[12]) !== d1) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * w2[i];
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cleaned[13]) === d2;
}

export function validateCPFOrCNPJ(value: string): { valid: boolean; message: string } {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return validateCPF(value)
      ? { valid: true, message: '' }
      : { valid: false, message: 'CPF inválido. Deve conter 11 dígitos válidos.' };
  }
  return validateCNPJ(value)
    ? { valid: true, message: '' }
    : { valid: false, message: 'CNPJ inválido. Deve conter 14 dígitos válidos.' };
}

export function validatePositiveValue(value: number): boolean {
  return value > 0;
}

export function validateDateRange(start: string, end: string): { valid: boolean; message: string } {
  if (!start || !end) return { valid: false, message: 'Datas são obrigatórias.' };
  if (new Date(start) > new Date(end)) {
    return { valid: false, message: 'Data de início não pode ser posterior à data de término.' };
  }
  return { valid: true, message: '' };
}
