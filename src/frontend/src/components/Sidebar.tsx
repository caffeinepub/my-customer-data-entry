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
}

export function Sidebar({ currentPage, onPageChange, navItems }: SidebarProps) {
  return (
    <aside
      className="hidden md:flex w-[264px] flex-shrink-0 flex-col h-screen"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.13 0.04 230) 0%, oklch(0.17 0.05 225) 100%)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground text-lg font-bold leading-none">
            C
          </span>
        </div>
        <span className="text-sidebar-foreground text-lg font-semibold tracking-tight">
          CustomerHub
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
