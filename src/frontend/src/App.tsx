import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  FileSpreadsheet,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { useAuth } from "./hooks/useAuth";
import { useGetAllCustomers, useGetColorTheme } from "./hooks/useQueries";
import { AdminPage } from "./pages/AdminPage";
import { CustomerListPage } from "./pages/CustomerListPage";
import { EntryFormPage } from "./pages/EntryFormPage";
import { LoginPage } from "./pages/LoginPage";
import { PlansPage } from "./pages/PlansPage";
import { SettingsPage, applyThemeToDocument } from "./pages/SettingsPage";

export type Page = "entry" | "customers" | "settings" | "admin" | "plans";

export interface EditCustomerData {
  id: number;
  name: string;
  mobileNumber: string;
  tag: string;
  ghRga: string;
  address: string;
  isHighlighted?: boolean;
  customFields?: Array<{ fieldName: string; fieldValue: string }>;
}

const BASE_NAV_ITEMS: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}[] = [
  { id: "entry", label: "Entry Form", icon: ClipboardList },
  { id: "customers", label: "Customers", icon: Users },
  { id: "plans", label: "Plans", icon: FileSpreadsheet },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "admin", label: "Admin Panel", icon: Shield, adminOnly: true },
];

export { BASE_NAV_ITEMS as navItems };

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return { date, time };
}

function UserNameBanner({ userName }: { userName: string }) {
  const { date, time } = useLiveClock();

  return (
    <div
      className="w-full px-4 md:px-6 py-1.5 flex items-center justify-between gap-3 flex-shrink-0"
      style={{
        background:
          "linear-gradient(90deg, oklch(0.52 0.18 50) 0%, oklch(0.65 0.2 75) 50%, oklch(0.78 0.18 90) 100%)",
      }}
      data-ocid="app.username-banner"
    >
      <p
        className="text-sm font-semibold tracking-wide truncate"
        style={{ color: "white" }}
      >
        Welcome, {userName}
      </p>
      <div
        className="flex items-center gap-2 text-xs font-mono font-semibold shrink-0"
        style={{ color: "oklch(1 0 0 / 0.92)" }}
        data-ocid="app.live-clock"
        aria-live="off"
        aria-atomic="true"
      >
        <span>{date}</span>
        <span style={{ color: "oklch(1 0 0 / 0.55)" }}>|</span>
        <span>{time}</span>
      </div>
    </div>
  );
}

function AppShell({
  userMobile,
  isAdmin,
  userName,
}: { userMobile: string; isAdmin: boolean; userName: string }) {
  const { logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("entry");
  const [editData, setEditData] = useState<EditCustomerData | null>(null);
  const { data: customers } = useGetAllCustomers(userMobile);
  const { data: savedTheme } = useGetColorTheme();
  const customerCount = customers?.length ?? 0;

  const navItems = BASE_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    if (savedTheme && savedTheme.length > 0) {
      applyThemeToDocument(savedTheme);
    }
  }, [savedTheme]);

  const handleEditCustomer = (data: EditCustomerData) => {
    setEditData(data);
    setCurrentPage("entry");
  };

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    if (page !== "entry") setEditData(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <UserNameBanner userName={userName} />

      <div className="flex flex-1 overflow-hidden">
        <Toaster position="top-right" richColors />
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          navItems={navItems}
          customerCount={customerCount}
          userMobile={userMobile}
          userName={userName}
          onLogout={logout}
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {currentPage === "entry" && (
            <EntryFormPage
              currentUser={userMobile}
              editData={editData}
              onEditComplete={() => setEditData(null)}
            />
          )}
          {currentPage === "customers" && (
            <CustomerListPage
              userMobile={userMobile}
              onEditCustomer={handleEditCustomer}
            />
          )}
          {currentPage === "plans" && <PlansPage userMobile={userMobile} />}
          {currentPage === "settings" && <SettingsPage />}
          {currentPage === "admin" && isAdmin && (
            <AdminPage userMobile={userMobile} />
          )}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-ocid={`nav.${item.id}.link`}
                  onClick={() => handlePageChange(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors relative",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {item.id === "customers" && customerCount > 0 && (
                      <span
                        className="absolute -top-1.5 -right-2 text-[10px] font-bold rounded-full px-1 leading-none min-w-[1rem] h-4 flex items-center justify-center"
                        style={{
                          background: "oklch(var(--primary))",
                          color: "oklch(0.15 0.03 50)",
                        }}
                      >
                        {customerCount}
                      </span>
                    )}
                  </div>
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              data-ocid="nav.logout.button"
              onClick={logout}
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  const { session, login } = useAuth();

  if (!session) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LoginPage onLogin={login} />
      </>
    );
  }

  return (
    <AppShell
      userMobile={session.mobile}
      isAdmin={session.isAdmin}
      userName={session.userName || session.mobile}
    />
  );
}
