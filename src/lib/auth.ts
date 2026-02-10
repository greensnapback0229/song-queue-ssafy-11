const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ssafy11';

export function verifyPassword(password: string | null): boolean {
  if (!password) return false;
  return password === ADMIN_PASSWORD;
}
