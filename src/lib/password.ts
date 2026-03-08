/** At least 8 chars, one letter (a-z, A-Z), one special character (non-alphanumeric) */
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9\s]).{8,}$/;

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function getPasswordError(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-zA-Z]/.test(password)) return "Password must include at least one letter";
  if (!/[^a-zA-Z0-9\s]/.test(password))
    return "Password must include at least one special character (e.g. !@#$%^&*)";
  return null;
}
