import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/PageShell";
import {
  useCreateUser,
  useDeleteUser,
  useGetAllCustomersForAdmin,
  useGetRegisteredUsers,
} from "../hooks/useQueries";
import type { AdminUserData } from "../hooks/useQueries";

interface AdminPageProps {
  userMobile: string;
}

const ADMIN_MOBILE = "8128111699";

export function AdminPage({ userMobile }: AdminPageProps) {
  const {
    data: registeredUsers,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useGetRegisteredUsers(ADMIN_MOBILE);

  const {
    data: adminData,
    isLoading: dataLoading,
    refetch: refetchData,
  } = useGetAllCustomersForAdmin();

  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [newMobile, setNewMobile] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [formError, setFormError] = useState("");

  const isLoading = usersLoading || dataLoading;

  const handleRefresh = () => {
    refetchUsers();
    refetchData();
  };

  const userCustomerMap = new Map<string, number>();
  for (const entry of (adminData ?? []) as AdminUserData[]) {
    userCustomerMap.set(entry.userMobile, entry.customers.length);
  }

  const toggleExpand = (mobile: string) => {
    setExpandedUser((prev) => (prev === mobile ? null : mobile));
  };

  const getCustomersForUser = (mobile: string) => {
    return (
      ((adminData ?? []) as AdminUserData[]).find(
        (e) => e.userMobile === mobile,
      )?.customers ?? []
    );
  };

  const handleCreateUser = async () => {
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
        adminMobile: ADMIN_MOBILE,
        newMobile,
        userName: newUserName.trim(),
      });
      if (result.ok) {
        toast.success(`User "${newUserName.trim()}" created successfully.`);
        setNewMobile("");
        setNewUserName("");
      } else {
        toast.error(result.message || "Failed to create user.");
      }
    } catch {
      toast.error("Failed to create user. Please try again.");
    }
  };

  const handleDeleteUser = async (mobile: string, name: string) => {
    if (!confirm(`Delete user "${name}" (${mobile})? This cannot be undone.`))
      return;
    try {
      const result = await deleteUser.mutateAsync({
        adminMobile: ADMIN_MOBILE,
        mobile,
      });
      if (result.ok) {
        toast.success(`User "${name}" deleted.`);
      } else {
        toast.error(result.message || "Failed to delete user.");
      }
    } catch {
      toast.error("Failed to delete user. Please try again.");
    }
  };

  return (
    <PageShell
      breadcrumb="CustomerHub | Admin Panel"
      title="Admin Panel"
      userName={userMobile === ADMIN_MOBILE ? "Administrator" : userMobile}
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
      {/* ─── Create New User ──────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm mb-6">
        <div
          className="px-5 py-3 flex items-center gap-2 border-b border-border"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.52 0.18 50 / 0.08), oklch(0.78 0.18 90 / 0.06))",
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
              <Label
                htmlFor="new-user-mobile"
                className="font-semibold text-sm"
              >
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
                onKeyDown={(e) => e.key === "Enter" && handleCreateUser()}
              />
            </div>
          </div>
          {formError && (
            <p className="text-destructive text-sm font-medium">{formError}</p>
          )}
          <Button
            data-ocid="admin.create-user.submit.button"
            onClick={handleCreateUser}
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

      {/* ─── Stats Bar ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="text-2xl font-bold text-primary">
              {isLoading ? "…" : (registeredUsers?.length ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">Registered Users</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="text-2xl font-bold text-primary">
              {isLoading
                ? "…"
                : ((adminData ?? []) as AdminUserData[]).reduce(
                    (sum, e) => sum + e.customers.length,
                    0,
                  )}
            </p>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div
          data-ocid="admin.loading_state"
          className="flex items-center justify-center py-16 text-muted-foreground gap-2"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading user data…
        </div>
      )}

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

      {!isLoading && (registeredUsers ?? []).length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-foreground w-[180px]">
                  User Name
                </TableHead>
                <TableHead className="font-semibold text-foreground w-[160px]">
                  Mobile (ID)
                </TableHead>
                <TableHead className="font-semibold text-foreground w-[110px]">
                  Customers
                </TableHead>
                <TableHead className="font-semibold text-foreground w-[90px]">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(registeredUsers ?? []).map((user, idx) => {
                const count = userCustomerMap.get(user.mobile) ?? 0;
                const isAdminUser = user.mobile === ADMIN_MOBILE;
                const isExpanded = expandedUser === user.mobile;
                const userCustomers = getCustomersForUser(user.mobile);

                return (
                  <>
                    <TableRow
                      key={user.mobile}
                      data-ocid={`admin.user.${idx + 1}`}
                      className="hover:bg-accent/30 transition-colors"
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
                            background: "oklch(var(--primary) / 0.12)",
                            color: "oklch(var(--primary))",
                          }}
                        >
                          {count}
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
                        <div className="flex items-center justify-end gap-2">
                          {count > 0 && (
                            <Button
                              data-ocid={`admin.user.${idx + 1}.expand_button`}
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => toggleExpand(user.mobile)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" />
                                  View ({count})
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
                              onClick={() =>
                                handleDeleteUser(user.mobile, user.userName)
                              }
                              disabled={deleteUser.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded customer rows */}
                    {isExpanded &&
                      userCustomers.map((customer, cIdx) => (
                        <TableRow
                          key={`${user.mobile}-c-${customer.id}`}
                          data-ocid={`admin.user.${idx + 1}.customer.${cIdx + 1}`}
                          className="bg-muted/20 hover:bg-muted/30"
                        >
                          <TableCell
                            colSpan={5}
                            className="pl-10 py-2 text-sm text-muted-foreground"
                          >
                            <div className="flex flex-wrap gap-4 items-center">
                              <span className="font-medium text-foreground">
                                {customer.name}
                              </span>
                              {customer.mobileNumber && (
                                <span>{customer.mobileNumber}</span>
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
                                <span className="truncate max-w-[200px]">
                                  {customer.address}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
