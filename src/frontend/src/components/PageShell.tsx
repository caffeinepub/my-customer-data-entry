import type { ReactNode } from "react";

interface PageShellProps {
  breadcrumb: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  userName?: string;
}

export function PageShell({
  breadcrumb,
  title,
  actions,
  children,
  userName,
}: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* User name banner — always visible at very top */}
      {userName && (
        <div
          className="w-full px-4 md:px-6 py-1.5 flex items-center justify-between"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.52 0.18 50) 0%, oklch(0.65 0.2 75) 50%, oklch(0.78 0.18 90) 100%)",
          }}
          data-ocid="page.username-banner"
        >
          <p
            className="text-sm font-semibold tracking-wide truncate"
            style={{ color: "white" }}
          >
            Welcome, {userName}
          </p>
          <span
            className="text-xs font-medium hidden sm:block"
            style={{ color: "oklch(1 0 0 / 0.75)" }}
          >
            My Customer Data Entry
          </span>
        </div>
      )}

      {/* Top utility bar */}
      <div className="bg-card border-b border-border px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <p className="text-sm text-muted-foreground font-medium">
          {breadcrumb}
        </p>
      </div>

      {/* Page content */}
      <div className="flex-1 px-4 py-4 md:px-6 md:py-6">
        {/* Page title row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-wide uppercase text-foreground">
            {title}
          </h1>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
        {children}
      </div>

      {/* Footer */}
      <footer className="px-4 md:px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
