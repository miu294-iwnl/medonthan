import { useState, useEffect, useRef } from "react"
import {
  saveAdminToken,
  getSavedRememberPreference,
  verifyAdminPasswordOnline,
  setupAdminPasswordOnline,
  checkAuthStatus,
} from "../lib/auth"

interface AdminAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  lang?: "vi" | "en"
}

export default function AdminAuthModal({
  isOpen,
  onClose,
  onSuccess,
  lang = "vi",
}: AdminAuthModalProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [remember, setRemember] = useState(() => getSavedRememberPreference())
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSetupMode, setIsSetupMode] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)

  // On open: focus input and check if backend requires password initialization
  useEffect(() => {
    if (isOpen) {
      setPassword("")
      setConfirmPassword("")
      setErrorMsg(null)
      setIsLoading(true)

      checkAuthStatus().then((status) => {
        setIsLoading(false)
        setIsSetupMode(!status.isSetup)
        setTimeout(() => inputRef.current?.focus(), 80)
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setErrorMsg(lang === "vi" ? "Vui lòng nhập mật khẩu" : "Please enter your password")
      return
    }

    if (isSetupMode) {
      if (password.length < 4) {
        setErrorMsg(lang === "vi" ? "Mật khẩu phải từ 4 ký tự trở lên" : "Password must be at least 4 characters")
        return
      }
      if (password !== confirmPassword) {
        setErrorMsg(lang === "vi" ? "Mật khẩu xác nhận không khớp" : "Passwords do not match")
        return
      }

      setIsLoading(true)
      setErrorMsg(null)
      const res = await setupAdminPasswordOnline(password.trim())
      setIsLoading(false)

      if (res.success && res.token) {
        saveAdminToken(res.token, remember)
        onSuccess()
      } else {
        setErrorMsg(res.error || (lang === "vi" ? "Không thể thiết lập mật khẩu" : "Failed to set password"))
      }
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    const res = await verifyAdminPasswordOnline(password.trim())
    setIsLoading(false)

    if (res.success && res.token) {
      // Save to cookie (and localStorage if remember checked)
      saveAdminToken(res.token, remember)
      onSuccess()
    } else {
      if (res.isSetupRequired) {
        setIsSetupMode(true)
        setErrorMsg(lang === "vi" ? "Chưa có mật khẩu nào được thiết lập. Hãy tạo mật khẩu mới." : "No password configured yet. Please set one.")
      } else {
        setErrorMsg(res.error || (lang === "vi" ? "Mật khẩu không chính xác" : "Incorrect password"))
        inputRef.current?.select()
      }
    }
  }

  const isVi = lang === "vi"

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-sm border border-line bg-panel p-6 shadow-2xl transition-all sm:p-8"
        style={{
          boxShadow: "0 0 40px rgba(198, 255, 63, 0.08), 0 20px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lime via-ice to-lime" />

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-muted hover:text-fg font-mono text-sm transition-colors disabled:opacity-50"
          title="Đóng"
        >
          ✕
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-sm bg-lime/15 border border-lime/30 text-lime font-mono text-xs font-bold">
            ✦
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold tracking-[0.2em] text-fg uppercase">
              {isSetupMode
                ? (isVi ? "KHỞI TẠO MẬT KHẨU QUẢN TRỊ" : "SETUP ADMIN PASSWORD")
                : (isVi ? "XÁC THỰC QUẢN TRỊ VIÊN" : "ADMIN AUTHENTICATION")}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-muted">
              {isSetupMode
                ? (isVi ? "Tạo mật khẩu chủ để bảo vệ kho game" : "Create a master password for your library")
                : (isVi ? "Yêu cầu mật khẩu để thực hiện thêm game mới" : "Password required to unlock add game feature")}
            </p>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-flame/40 bg-flame/10 px-3 py-2 text-flame font-mono text-xs">
            <span className="font-bold">✕</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              {isSetupMode
                ? (isVi ? "MẬT KHẨU MỚI" : "NEW PASSWORD")
                : (isVi ? "MẬT KHẨU" : "PASSWORD")}
            </label>
            <div className="relative mt-1.5">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isVi ? "Nhập mật khẩu quản trị..." : "Enter admin password..."}
                disabled={isLoading}
                className="w-full rounded-sm border border-line bg-ink px-3.5 py-2.5 pr-10 font-mono text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus:border-lime/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted hover:text-fg transition-colors"
                title={showPassword ? "Ẩn" : "Hiện"}
              >
                {showPassword ? "ẨN" : "HIỆN"}
              </button>
            </div>
          </div>

          {/* Confirm Password (Setup mode only) */}
          {isSetupMode && (
            <div>
              <label className="block font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                {isVi ? "XÁC NHẬN MẬT KHẨU" : "CONFIRM PASSWORD"}
              </label>
              <div className="mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isVi ? "Nhập lại mật khẩu..." : "Re-enter password..."}
                  disabled={isLoading}
                  className="w-full rounded-sm border border-line bg-ink px-3.5 py-2.5 font-mono text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus:border-lime/60"
                />
              </div>
            </div>
          )}

          {/* Remember Me Checkbox (Cookie) */}
          <label className="flex items-center gap-2.5 cursor-pointer pt-1 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded-sm border-line bg-ink text-lime accent-[#c6ff3f] cursor-pointer"
            />
            <span className="font-mono text-xs text-muted hover:text-fg transition-colors">
              {isVi
                ? "Lưu mật khẩu trên thiết bị này (lưu vào cookie)"
                : "Remember password on this device (save to cookie)"}
            </span>
          </label>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-sm border border-line px-4 py-2 font-mono text-xs font-semibold tracking-[0.1em] text-muted hover:border-muted/60 hover:text-fg transition-colors disabled:opacity-50"
            >
              {isVi ? "HỦY" : "CANCEL"}
            </button>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex items-center gap-2 rounded-sm bg-lime px-5 py-2 font-mono text-xs font-bold tracking-[0.12em] text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <div className="size-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                  <span>{isVi ? "ĐANG XỬ LÝ..." : "VERIFYING..."}</span>
                </>
              ) : isSetupMode ? (
                <span>{isVi ? "THIẾT LẬP MẬT KHẨU" : "SET PASSWORD"}</span>
              ) : (
                <span>{isVi ? "XÁC NHẬN" : "UNLOCK"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
