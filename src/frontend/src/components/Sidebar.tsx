import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import type { Page } from "../App";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  navItems: NavItem[];
  customerCount?: number;
  userMobile?: string;
  userName?: string;
  onLogout?: () => void;
}

export function Sidebar({
  currentPage,
  onPageChange,
  navItems,
  customerCount = 0,
  userMobile,
  userName,
  onLogout,
}: SidebarProps) {
  const isAdmin = userMobile === "8128111699";
  const displayName = userName || userMobile || "";
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <aside className="hidden md:flex w-[264px] flex-shrink-0 flex-col h-screen sidebar-gradient">
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

      {/* User info + logout */}
      {userMobile && (
        <div
          className="px-4 py-4 flex items-center gap-3"
          style={{ borderTop: "1px solid oklch(0.70 0.16 65 / 0.4)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{
              background: "oklch(0.95 0.18 90)",
              color: "oklch(0.35 0.12 45)",
            }}
          >
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "oklch(0.98 0.02 85)" }}
            >
              {displayName}
            </p>
            <p
              className="text-[10px]"
              style={{ color: "oklch(0.92 0.08 80 / 0.7)" }}
            >
              {isAdmin ? "Administrator" : "User"} · {userMobile}
            </p>
          </div>
          {onLogout && (
            <button
              type="button"
              data-ocid="nav.logout.button"
              onClick={onLogout}
              aria-label="Logout"
              className="p-1.5 rounded-md transition-all"
              style={{ color: "oklch(0.96 0.03 80 / 0.70)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.99 0.02 90)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.90 0.14 80 / 0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(0.96 0.03 80 / 0.70)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
