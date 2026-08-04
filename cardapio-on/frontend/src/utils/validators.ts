export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 11
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2
}
