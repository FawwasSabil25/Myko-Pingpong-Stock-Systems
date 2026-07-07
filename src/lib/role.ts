const ROLE_KEY = "myko_role";
const WA_KEY = "myko_wa";

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
 * Mendapatkan nomor WhatsApp yang tersimpan di localStorage.
 */
export function getWhatsApp(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WA_KEY);
}

/**
 * Menyimpan nomor WhatsApp ke localStorage.
 */
export function setWhatsApp(nomor: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WA_KEY, nomor);
}

/**
 * Menghapus semua data setup dari localStorage (role + nomor WA).
 * Digunakan untuk fitur "Reset Role" saat testing.
 */
export function clearAll(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(WA_KEY);
}

/**
 * Menghapus role dari localStorage (untuk fitur "Reset Role").
 * @deprecated Gunakan clearAll() untuk menghapus semua data setup sekaligus.
 */
export function clearRole(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
}
