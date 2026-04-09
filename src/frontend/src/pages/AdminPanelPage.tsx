import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Search, Shield, Users, X } from "lucide-react";
import { useState } from "react";
import { PageShell } from "../components/PageShell";
import {
  useGetAllCustomersForAdmin,
  useGetRegisteredUsers,
} from "../hooks/useQueries";
import type { CustomerWithId } from "../hooks/useQueries";

const ADMIN_MOBILE = "8128111699";

interface AdminPanelPageProps {
  currentUser: string;
}

export function AdminPanelPage({ currentUser }: AdminPanelPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingUser, setViewingUser] = useState<string | null>(null);

  const {
    data: registeredUsers,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useGetRegisteredUsers();
  const { data: adminData, isLoading: isLoadingAdmin } =
    useGetAllCustomersForAdmin();

  // Guard: only admin can access
  if (currentUser !== ADMIN_MOBILE) {
    return (
      <PageShell breadcrumb="CustomerHub | Admin Panel" title="Admin Panel">
        <div
          data-ocid="admin.access_denied"
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-destructive/30 bg-destructive/5 py-20 text-center"
        >
          <Shield className="h-12 w-12 text-destructive/60" />
          <div>
            <h3 className="text-lg font-semibold text-destructive">
              Access Denied
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Only the administrator can access this panel.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  const users = registeredUsers ?? [];
  const filteredUsers = users.filter((u) =>
    searchQuery.trim()
      ? u.mobile.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.userName.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  const getCustomerCountForUser = (mobile: string): number => {
    const entry = (adminData ?? []).find((d) => d.userMobile === mobile);
    return entry?.customers?.length ?? 0;
  };

  const getCustomersForUser = (mobile: string): CustomerWithId[] => {
    const entry = (adminData ?? []).find((d) => d.userMobile === mobile);
    if (!entry) return [];
    return entry.customers;
  };

  if (viewingUser) {
    const userCustomers = getCustomersForUser(viewingUser);
    return (
      <PageShell
        breadcrumb={`CustomerHub | Admin Panel | ${viewingUser}`}
        title={`Customers — ${viewingUser}`}
        actions={
          <Button
            data-ocid="admin.back_button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setViewingUser(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        }
      >
        {isLoadingAdmin ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : userCustomers.length === 0 ? (
          <div
            data-ocid="admin.user_customers.empty_state"
            className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-card py-16 text-center"
          >
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-foreground">No customers</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This user has no saved customers yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-foreground w-[180px]">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-foreground w-[140px]">
                      Mobile
                    </TableHead>
                    <TableHead className="font-semibold text-foreground w-[120px]">
                      Tag
                    </TableHead>
                    <TableHead className="font-semibold text-foreground w-[120px]">
                      GH/RGA
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      Address
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCustomers.map((customer, idx) => (
                    <TableRow
                      key={customer.id}
                      data-ocid={`admin.customer.${idx + 1}`}
                      className={
                        customer.isHighlighted
                          ? "bg-blue-50"
                          : "hover:bg-accent/40"
                      }
                    >
                      <TableCell className="font-medium text-foreground">
                        {customer.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.mobileNumber || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.tag || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.ghRga || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {customer.address || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell breadcrumb="CustomerHub | Admin Panel" title="Admin Panel">
      {/* Admin header banner */}
      <div
        className="mb-6 rounded-xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--theme-sidebar-from, oklch(0.52 0.18 50)), var(--theme-sidebar-to, oklch(0.62 0.20 70)))",
        }}
      >
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="rounded-full bg-white/20 p-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">
              Administrator Panel
            </h2>
            <p className="text-white/80 text-sm mt-0.5">
              Manage all registered users and their customer data
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/70 text-xs">Logged in as</p>
            <p className="text-white font-semibold text-sm">{currentUser}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          data-ocid="admin.search_input"
          type="text"
          placeholder="Search users by mobile or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stats */}
      {!isLoadingUsers && users.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {users.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {users.length === 1 ? "user" : "users"} registered
            </span>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoadingUsers && (
        <div data-ocid="admin.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {isErrorUsers && (
        <div
          data-ocid="admin.error_state"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Failed to load users. Please try again.
        </div>
      )}

      {/* Empty */}
      {!isLoadingUsers && !isErrorUsers && users.length === 0 && (
        <div
          data-ocid="admin.empty_state"
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-card py-20 text-center"
        >
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">No users yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Users will appear here once they are created in the Admin Panel.
            </p>
          </div>
        </div>
      )}

      {/* No search results */}
      {!isLoadingUsers &&
        !isErrorUsers &&
        users.length > 0 &&
        filteredUsers.length === 0 && (
          <div
            data-ocid="admin.no_results_state"
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card py-16 text-center"
          >
            <Search className="h-8 w-8 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-foreground">No users found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search query.
              </p>
            </div>
          </div>
        )}

      {/* Users table */}
      {!isLoadingUsers && filteredUsers.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-foreground">
                  User Name
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Mobile Number
                </TableHead>
                <TableHead className="font-semibold text-foreground text-right w-[140px]">
                  Customer Count
                </TableHead>
                <TableHead className="font-semibold text-foreground text-right w-[140px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u, idx) => {
                const count = getCustomerCountForUser(u.mobile);
                const isAdminUser = u.mobile === ADMIN_MOBILE;
                return (
                  <TableRow
                    key={u.mobile}
                    data-ocid={`admin.user.${idx + 1}`}
                    className="hover:bg-accent/40"
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{u.userName}</span>
                        {isAdminUser && (
                          <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-xs font-semibold text-primary gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {u.mobile}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center rounded-full bg-muted px-3 py-1 text-sm font-semibold text-foreground min-w-[2rem]">
                        {isLoadingAdmin ? "…" : count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        data-ocid={`admin.user.${idx + 1}.view_button`}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setViewingUser(u.mobile)}
                      >
                        <Users className="h-3.5 w-3.5" />
                        View Customers
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
