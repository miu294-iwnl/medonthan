/**
 * Authentication and Cookie Management for Admin Actions (Add Game)
 */

export const ADMIN_TOKEN_COOKIE = "medonthan_admin_token"
export const ADMIN_REMEMBER_COOKIE = "medonthan_admin_remember"

/**
 * Set a cookie with specified name, value, and optional expiration days
 */
export function setCookie(name: string, value: string, days?: number) {
  try {
    let expires = ""
    if (typeof days === "number") {
      const d = new Date()
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
      expires = `; expires=${d.toUTCString()}`
    }
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`
  } catch {}
}

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
  try {
    if (typeof document !== "undefined" && document.cookie) {
      const cookies = document.cookie.split("; ")
      for (const c of cookies) {
        const [k, ...v] = c.split("=")
        if (k === name) {
          return decodeURIComponent(v.join("=")).trim()
        }
      }
    }
  } catch {}
  return null
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
  } catch {}
}

/**
 * Get stored admin token from cookie (or fallback to localStorage)
 */
export function getAdminToken(): string | null {
  const token = getCookie(ADMIN_TOKEN_COOKIE)
  if (token) return token
  try {
    return localStorage.getItem(ADMIN_TOKEN_COOKIE)
  } catch {
    return null
  }
}

/**
 * Store admin token into cookie (and localStorage if remember = true)
 */
export function saveAdminToken(token: string, remember = true) {
  if (remember) {
    // 365 days expiration
    setCookie(ADMIN_TOKEN_COOKIE, token, 365)
    setCookie(ADMIN_REMEMBER_COOKIE, "true", 365)
    try {
      localStorage.setItem(ADMIN_TOKEN_COOKIE, token)
      localStorage.setItem(ADMIN_REMEMBER_COOKIE, "true")
    } catch {}
  } else {
    // Session cookie (cleared when browser closes)
    setCookie(ADMIN_TOKEN_COOKIE, token)
    deleteCookie(ADMIN_REMEMBER_COOKIE)
    try {
      localStorage.removeItem(ADMIN_TOKEN_COOKIE)
      localStorage.removeItem(ADMIN_REMEMBER_COOKIE)
    } catch {}
  }
}

/**
 * Clear admin token (logout)
 */
export function clearAdminToken() {
  deleteCookie(ADMIN_TOKEN_COOKIE)
  deleteCookie(ADMIN_REMEMBER_COOKIE)
  try {
    localStorage.removeItem(ADMIN_TOKEN_COOKIE)
    localStorage.removeItem(ADMIN_REMEMBER_COOKIE)
  } catch {}
}

/**
 * Check if the user previously checked "remember password"
 */
export function getSavedRememberPreference(): boolean {
  const cookiePref = getCookie(ADMIN_REMEMBER_COOKIE)
  if (cookiePref !== null) return cookiePref === "true"
  try {
    return localStorage.getItem(ADMIN_REMEMBER_COOKIE) !== "false"
  } catch {
    return true
  }
}

export interface AuthStatusResponse {
  isSetup: boolean
  isAuthenticated: boolean
}

/**
 * Verify current authentication status with backend
 */
export async function checkAuthStatus(): Promise<AuthStatusResponse> {
  const token = getAdminToken()
  try {
    const res = await fetch("/api/auth/status", {
      headers: {
        ...(token ? { "x-admin-token": token } : {}),
      },
    })
    if (res.ok) {
      const data = await res.json()
      // If token is invalid on backend, clear local token
      if (token && !data.isAuthenticated) {
        clearAdminToken()
      }
      return data
    }
  } catch (err) {
    console.warn("Could not check auth status:", err)
  }
  return { isSetup: true, isAuthenticated: Boolean(token) }
}

/**
 * Verify password with backend
 */
export async function verifyAdminPasswordOnline(password: string): Promise<{ success: boolean; token?: string; error?: string; isSetupRequired?: boolean }> {
  try {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (res.ok && data.success && data.token) {
      return { success: true, token: data.token }
    }
    return {
      success: false,
      error: data.error || "Mật khẩu không chính xác",
      isSetupRequired: Boolean(data.isSetupRequired),
    }
  } catch (err: any) {
    return { success: false, error: "Không thể kết nối đến máy chủ xác thực" }
  }
}

/**
 * Setup master admin password with backend
 */
export async function setupAdminPasswordOnline(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (res.ok && data.success && data.token) {
      return { success: true, token: data.token }
    }
    return { success: false, error: data.error || "Không thể thiết lập mật khẩu" }
  } catch (err: any) {
    return { success: false, error: "Không thể kết nối đến máy chủ" }
  }
}
