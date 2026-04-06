import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ClipboardList, Settings, Users } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { useGetAllCustomers } from "./hooks/useQueries";
import { CustomerListPage } from "./pages/CustomerListPage";
import { EntryFormPage } from "./pages/EntryFormPage";
import { SettingsPage } from "./pages/SettingsPage";

export type Page = "entry" | "customers" | "settings";

export interface EditCustomerData {
  id: number;
  name: string;
  mobileNumber: string;
  tag: string;
  ghRga: string;
  address: string;
}

const navItems: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "entry", label: "Entry Form", icon: ClipboardList },
  { id: "customers", label: "Customers", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export { navItems };

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("entry");
  const [editData, setEditData] = useState<EditCustomerData | null>(null);
  const { data: customers } = useGetAllCustomers();
  const customerCount = customers?.length ?? 0;

  const handleEditCustomer = (data: EditCustomerData) => {
    setEditData(data);
    setCurrentPage("entry");
  };

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    if (page !== "entry") {
      setEditData(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Toaster position="top-right" richColors />
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        navItems={navItems}
        customerCount={customerCount}
      />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {currentPage === "entry" && (
          <EntryFormPage
            editData={editData}
            onEditComplete={() => setEditData(null)}
          />
        )}
        {currentPage === "customers" && (
          <CustomerListPage onEditCustomer={handleEditCustomer} />
        )}
        {currentPage === "settings" && <SettingsPage />}
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
                        background: "oklch(0.72 0.18 55)",
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
        </div>
      </nav>
    </div>
  );
}
