const ROLE_KEY = "myko_role";

export type Role = "pemilik" | "pengelola";

/**
 * Mendapatkan role yang tersimpan di localStorage.
 * Return null jika belum pernah di-set (perlu Setup Awal).
 */
export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(ROLE_KEY);
  if (role === "pemilik" || role === "pengelola") return role;
  return null;
}

/**
 * Menyimpan role ke localStorage.
 */
export function setRole(role: Role): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, role);
}

/**
 * Menghapus role dari localStorage (untuk fitur "Reset Role").
 */
export function clearRole(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
}
