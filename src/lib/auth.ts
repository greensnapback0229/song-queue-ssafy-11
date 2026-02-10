const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export function verifyPassword(password: string | null): boolean {
  if (!password || !ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}
