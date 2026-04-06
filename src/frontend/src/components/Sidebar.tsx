import { cn } from "@/lib/utils";
import type { Page } from "../App";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  navItems: NavItem[];
  customerCount?: number;
}

export function Sidebar({
  currentPage,
  onPageChange,
  navItems,
  customerCount = 0,
}: SidebarProps) {
  return (
    <aside
      className="hidden md:flex w-[264px] flex-shrink-0 flex-col h-screen"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.52 0.18 50) 0%, oklch(0.62 0.20 70) 100%)",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: "1px solid oklch(0.70 0.16 65 / 0.4)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.95 0.18 90), oklch(0.85 0.22 60))",
          }}
        >
          <span
            className="text-lg font-bold leading-none"
            style={{ color: "oklch(0.35 0.12 40)" }}
          >
            C
          </span>
        </div>
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: "oklch(0.98 0.02 85)" }}
        >
          CustomerHub
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const iconColor = isActive
            ? "oklch(0.95 0.18 88)"
            : "oklch(0.92 0.12 80 / 0.85)";
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              )}
              style={{
                background: isActive
                  ? "oklch(0.90 0.18 85 / 0.30)"
                  : "transparent",
                color: isActive
                  ? "oklch(0.99 0.02 90)"
                  : "oklch(0.96 0.03 80 / 0.80)",
                outline: isActive
                  ? "1.5px solid oklch(0.90 0.18 85 / 0.50)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(0.90 0.14 80 / 0.18)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.99 0.02 90)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.96 0.03 80 / 0.80)";
                }
              }}
            >
              <span style={{ color: iconColor, display: "contents" }}>
                <Icon className="h-4 w-4 flex-shrink-0" />
              </span>
              {item.label}
              {item.id === "customers" && customerCount > 0 && (
                <span
                  className="ml-auto text-xs font-bold rounded-full px-1.5 py-0.5 leading-none min-w-[1.25rem] text-center"
                  style={{
                    background: "oklch(0.95 0.18 90)",
                    color: "oklch(0.35 0.12 45)",
                  }}
                >
                  {customerCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
