import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/PageShell";
import type { AdminUserData } from "../hooks/useQueries";
import {
  useCreateUser,
  useDeleteUser,
  useGetAllCustomersForAdmin,
  useGetRegisteredUsers,
} from "../hooks/useQueries";

interface AdminPageProps {
  userMobile: string;
  isAdmin?: boolean;
}

const ADMIN_MOBILE = "8128111699";

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 gap-6"
      data-ocid="admin.access-denied"
    >
      <div className="rounded-full bg-destructive/10 p-6">
        <ShieldOff className="h-12 w-12 text-destructive" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Access Denied
        </h2>
        <p className="text-muted-foreground">
          You do not have permission to access the Admin Panel. Only the
          administrator can view this page.
        </p>
      </div>
      <Badge
        variant="outline"
        className="px-4 py-1.5 text-sm font-medium border-destructive/40 text-destructive"
      >
        Admin access required
      </Badge>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  loading,
}: { label: string; value: number; loading: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 min-w-[140px]">
      <Users className="h-5 w-5 text-primary shrink-0" />
      <div>
        {loading ? (
          <Skeleton className="h-7 w-10 mb-1" />
        ) : (
          <p className="text-2xl font-bold text-primary">{value}</p>
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Create User Form ─────────────────────────────────────────────────────────

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const createUser = useCreateUser();
  const [newMobile, setNewMobile] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [formError, setFormError] = useState("");

  const handleCreate = async () => {
    setFormError("");
    if (!/^\d{10}$/.test(newMobile)) {
      setFormError("Mobile number must be exactly 10 digits.");
      return;
    }
    if (!newUserName.trim()) {
      setFormError("User name is required.");
      return;
    }
    try {
      const result = await createUser.mutateAsync({
        mobile: newMobile,
        userName: newUserName.trim(),
      });
      if (result) {
        toast.success(`User "${newUserName.trim()}" created successfully.`);
        setNewMobile("");
        setNewUserName("");
        onCreated();
      } else {
        toast.error("Failed to create user. User may already exist.");
      }
    } catch {
      toast.error("Failed to create user. Please try again.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm mb-6">
      <div
        className="px-5 py-3 flex items-center gap-2 border-b border-border rounded-t-xl"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.52 0.18 50 / 0.10), oklch(0.78 0.18 90 / 0.07))",
        }}
      >
        <UserPlus className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-foreground text-sm">
          Create New User
        </h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-user-mobile" className="font-semibold text-sm">
              Mobile Number
            </Label>
            <Input
              id="new-user-mobile"
              data-ocid="admin.create-user.mobile.input"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={newMobile}
              onChange={(e) => {
                setNewMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                setFormError("");
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-user-name" className="font-semibold text-sm">
              User Name
            </Label>
            <Input
              id="new-user-name"
              data-ocid="admin.create-user.name.input"
              type="text"
              placeholder="Full name"
              value={newUserName}
              onChange={(e) => {
                setNewUserName(e.target.value);
                setFormError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
        </div>
        {formError && (
          <p className="text-destructive text-sm font-medium" role="alert">
            {formError}
          </p>
        )}
        <Button
          data-ocid="admin.create-user.submit.button"
          onClick={handleCreate}
          disabled={createUser.isPending}
          className="gap-2"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.52 0.18 50), oklch(0.65 0.2 75))",
            color: "white",
          }}
        >
          {createUser.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Create User
        </Button>
      </div>
    </div>
  );
}

// ─── User Table Row (with expandable customers) ───────────────────────────────

function UserRow({
  user,
  idx,
  customerCount,
  customers,
  isExpanded,
  onToggle,
  onDelete,
  isDeleting,
}: {
  user: { mobile: string; userName: string };
  idx: number;
  customerCount: number;
  customers: AdminUserData["customers"];
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isAdminUser = user.mobile === ADMIN_MOBILE;

  return (
    <>
      <TableRow
        data-ocid={`admin.user.${idx + 1}`}
        className="hover:bg-accent/30 transition-colors cursor-pointer"
        onClick={customerCount > 0 ? onToggle : undefined}
        onKeyDown={
          customerCount > 0
            ? (e) => (e.key === "Enter" || e.key === " ") && onToggle()
            : undefined
        }
        tabIndex={customerCount > 0 ? 0 : undefined}
        role={customerCount > 0 ? "button" : undefined}
        aria-expanded={customerCount > 0 ? isExpanded : undefined}
      >
        <TableCell className="font-semibold text-foreground">
          {user.userName}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground font-mono">
          {user.mobile}
        </TableCell>
        <TableCell>
          <Badge
            variant="secondary"
            className="font-semibold"
            style={{
              background: "oklch(0.72 0.18 55 / 0.15)",
              color: "oklch(0.45 0.15 50)",
            }}
          >
            {customerCount}
          </Badge>
        </TableCell>
        <TableCell>
          {isAdminUser ? (
            <Badge
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.52 0.18 50), oklch(0.65 0.2 75))",
                color: "white",
              }}
            >
              Admin
            </Badge>
          ) : (
            <Badge variant="outline">User</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div
            className="flex items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {customerCount > 0 && (
              <Button
                data-ocid={`admin.user.${idx + 1}.expand_button`}
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={onToggle}
                aria-label={isExpanded ? "Hide customers" : "View customers"}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    View ({customerCount})
                  </>
                )}
              </Button>
            )}
            {!isAdminUser && (
              <Button
                data-ocid={`admin.user.${idx + 1}.delete_button`}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label={`Delete user ${user.userName}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {isExpanded &&
        customers.map((customer, cIdx) => (
          <TableRow
            key={`${user.mobile}-c-${customer.id}`}
            data-ocid={`admin.user.${idx + 1}.customer.${cIdx + 1}`}
            className="bg-muted/20 hover:bg-muted/30"
          >
            <TableCell
              colSpan={5}
              className="pl-10 py-2 text-sm text-muted-foreground"
            >
              <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                <span className="font-medium text-foreground">
                  {customer.name}
                </span>
                {customer.mobileNumber && (
                  <span className="font-mono text-xs">
                    {customer.mobileNumber}
                  </span>
                )}
                {customer.tag && (
                  <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                    {customer.tag}
                  </span>
                )}
                {customer.ghRga && (
                  <span className="text-xs font-medium text-primary">
                    {customer.ghRga}
                  </span>
                )}
                {customer.address && (
                  <span className="truncate max-w-[200px] text-xs">
                    {customer.address}
                  </span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

export function AdminPage({ userMobile, isAdmin }: AdminPageProps) {
  const {
    data: registeredUsers,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useGetRegisteredUsers();

  const {
    data: adminData,
    isLoading: dataLoading,
    refetch: refetchData,
  } = useGetAllCustomersForAdmin();

  const deleteUser = useDeleteUser();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Guard: non-admins see Access Denied (after all hooks)
  if (!isAdmin && userMobile !== ADMIN_MOBILE) {
    return <AccessDenied />;
  }

  const isLoading = usersLoading || dataLoading;

  const handleRefresh = () => {
    void refetchUsers();
    void refetchData();
  };

  const userCustomerMap = new Map<string, number>();
  for (const entry of (adminData ?? []) as AdminUserData[]) {
    userCustomerMap.set(entry.userMobile, entry.customers.length);
  }

  const getCustomersForUser = (mobile: string) =>
    ((adminData ?? []) as AdminUserData[]).find((e) => e.userMobile === mobile)
      ?.customers ?? [];

  const totalCustomers = ((adminData ?? []) as AdminUserData[]).reduce(
    (sum, e) => sum + e.customers.length,
    0,
  );

  const handleDeleteUser = async (mobile: string, name: string) => {
    if (!confirm(`Delete user "${name}" (${mobile})? This cannot be undone.`))
      return;
    try {
      const result = await deleteUser.mutateAsync(mobile);
      if (result) {
        toast.success(`User "${name}" deleted.`);
        if (expandedUser === mobile) setExpandedUser(null);
      } else {
        toast.error("Failed to delete user.");
      }
    } catch {
      toast.error("Failed to delete user. Please try again.");
    }
  };

  return (
    <PageShell
      breadcrumb="CustomerHub | Admin Panel"
      title="Admin Panel"
      userName="Administrator"
      actions={
        <Button
          data-ocid="admin.refresh.button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      }
    >
      {/* ─── Create New User ──────────────────────────── */}
      <CreateUserForm
        onCreated={() => {
          void refetchUsers();
        }}
      />

      {/* ─── Stats Bar ────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          label="Registered Users"
          value={registeredUsers?.length ?? 0}
          loading={isLoading}
        />
        <StatCard
          label="Total Customers"
          value={totalCustomers}
          loading={isLoading}
        />
      </div>

      {/* ─── Loading Skeleton ─────────────────────────── */}
      {isLoading && (
        <div data-ocid="admin.loading_state" className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* ─── Empty State ──────────────────────────────── */}
      {!isLoading && (registeredUsers ?? []).length === 0 && (
        <div
          data-ocid="admin.empty_state"
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-card py-20"
        >
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">No users yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a new user above to get started.
            </p>
          </div>
        </div>
      )}

      {/* ─── User Table ───────────────────────────────── */}
      {!isLoading && (registeredUsers ?? []).length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div
            className="px-5 py-2.5 border-b border-border text-sm font-semibold text-foreground"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.52 0.18 50 / 0.08), oklch(0.78 0.18 90 / 0.05))",
            }}
          >
            All Users — {registeredUsers?.length ?? 0} registered
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground min-w-[150px]">
                    User Name
                  </TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[140px]">
                    Mobile (ID)
                  </TableHead>
                  <TableHead className="font-semibold text-foreground w-[100px]">
                    Customers
                  </TableHead>
                  <TableHead className="font-semibold text-foreground w-[90px]">
                    Role
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right w-[140px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(registeredUsers ?? []).map((user, idx) => (
                  <UserRow
                    key={user.mobile}
                    user={user}
                    idx={idx}
                    customerCount={userCustomerMap.get(user.mobile) ?? 0}
                    customers={getCustomersForUser(user.mobile)}
                    isExpanded={expandedUser === user.mobile}
                    onToggle={() =>
                      setExpandedUser((prev) =>
                        prev === user.mobile ? null : user.mobile,
                      )
                    }
                    onDelete={() =>
                      void handleDeleteUser(user.mobile, user.userName)
                    }
                    isDeleting={deleteUser.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
