import React, { useState, useEffect } from "react";

interface NoDevToolsProps {
  lang: "vi" | "en";
  setLang: (lang: "vi" | "en") => void;
  onRetry?: () => void;
}

export default function NoDevTools({ lang, setLang, onRetry }: NoDevToolsProps) {
  const [currentTime, setCurrentTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      setDotCount((prev) => (prev + 1) % 4);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReload = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.href = "/";
    }
  };

  const isVi = lang === "vi";

  return (
    <div className="relative min-h-screen w-full select-none overflow-hidden bg-ink text-fg">
      {/* Ambient background glow & grid lines */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,90,60,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(198,255,63,0.06),transparent_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Header bar */}
      <header className="relative z-10 border-b border-line/80 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-sm bg-flame text-ink">
              <span className="font-mono text-xs font-bold">✕</span>
            </div>
            <div className="leading-none">
              <div className="font-mono text-xs font-semibold tracking-[0.25em] text-fg">MEDONTHAN</div>
              <div className="mt-1 font-mono text-[9px] tracking-[0.25em] text-flame">SECURITY PROTOCOL</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-sm border border-line bg-panel p-0.5">
              <button
                onClick={() => setLang("vi")}
                className={`rounded-sm px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] transition-colors ${
                  lang === "vi" ? "bg-lime text-ink" : "text-muted hover:text-fg"
                }`}
              >
                VI
              </button>
              <button
                onClick={() => setLang("en")}
                className={`rounded-sm px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] transition-colors ${
                  lang === "en" ? "bg-lime text-ink" : "text-muted hover:text-fg"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main warning container */}
      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-16 sm:py-24 text-center">
        {/* Warning Icon with radar ring */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 animate-ping rounded-full bg-flame/15 duration-1000" />
          <div className="relative grid size-20 place-items-center rounded-full border border-flame/40 bg-flame/10 shadow-[0_0_30px_rgba(255,90,60,0.25)]">
            <svg className="size-10 text-flame" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Status tag */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-flame/40 bg-flame/10 px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.2em] text-flame">
          <span className="size-2 animate-pulse rounded-full bg-flame" />
          {isVi ? "PHÁT HIỆN CÔNG CỤ PHÁT TRIỂN" : "DEVTOOLS DETECTED"}
        </div>

        {/* Title */}
        <h1 className="font-mono text-3xl font-bold tracking-tight text-fg sm:text-5xl">
          {isVi ? "Truy Cập Bị Hạn Chế" : "Access Restricted"}
        </h1>

        {/* Description */}
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          {isVi
            ? "Hệ thống phát hiện Developer Tools (F12 hoặc Kiểm tra phần tử) đang được mở. Vui lòng đóng DevTools để tiếp tục sử dụng ứng dụng."
            : "Developer Tools (F12 or Inspect Element) has been detected. Please close Developer Tools to continue using the application."}
        </p>

        {/* Terminal / System Log Box */}
        <div className="mt-8 w-full max-w-xl text-left">
          <div className="rounded-sm border border-line bg-panel shadow-2xl">
            <div className="flex items-center justify-between border-b border-line bg-panel-2 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-flame/80" />
                <span className="size-2.5 rounded-full bg-gold/80" />
                <span className="size-2.5 rounded-full bg-lime/80" />
                <span className="ml-2 font-mono text-[11px] text-muted">terminal // security_monitor</span>
              </div>
              <span className="font-mono text-[10px] text-muted">{currentTime}</span>
            </div>

            <div className="space-y-1.5 p-4 font-mono text-xs leading-relaxed text-muted">
              <div className="flex items-center gap-2 text-flame">
                <span>[SECURITY_ALERT]</span>
                <span>CODE_403: INSPECTION_ENVIRONMENT_ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 text-fg/80">
                <span>[MONITOR]</span>
                <span>
                  {isVi ? "Trạng thái DevTools:" : "DevTools Status:"}{" "}
                  <span className="text-flame font-semibold">{isVi ? "ĐANG MỞ" : "OPENED"}</span>
                  {".".repeat(dotCount)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span>[POLICY]</span>
                <span>UNAUTHORIZED_DOM_INSPECTION_BLOCKED</span>
              </div>
              <div className="flex items-center gap-2 text-lime">
                <span>[ACTION_REQUIRED]</span>
                <span>{isVi ? "ĐÓNG DEVTOOLS VÀ NHẤN THỬ LẠI" : "CLOSE DEVTOOLS AND HIT RETRY"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleReload}
            className="flex items-center gap-2 rounded-sm border border-lime bg-lime px-6 py-2.5 font-mono text-xs font-bold tracking-[0.15em] text-ink transition-all hover:bg-lime-dim hover:shadow-[0_0_20px_rgba(198,255,63,0.35)]"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isVi ? "KIỂM TRA LẠI / TẢI LẠI TRANG" : "RE-CHECK / RELOAD"}</span>
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleReload();
            }}
            className="rounded-sm border border-line bg-panel px-5 py-2.5 font-mono text-xs font-semibold tracking-[0.15em] text-muted transition-colors hover:border-fg/40 hover:text-fg"
          >
            {isVi ? "VỀ TRANG CHỦ" : "RETURN HOME"}
          </a>
        </div>

        {/* Footer Note */}
        <p className="mt-10 font-mono text-[10px] tracking-widest text-muted/60">
          PROTECTED BY MEDONTHAN ANTI-INSPECT SYSTEM // 2026
        </p>
      </main>
    </div>
  );
}
