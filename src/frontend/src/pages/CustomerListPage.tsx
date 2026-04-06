import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Edit,
  FileDown,
  Loader2,
  MapPin,
  Phone,
  Search,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { EditCustomerData } from "../App";
import { PageShell } from "../components/PageShell";
import {
  useAddCustomer,
  useDeleteCustomer,
  useGetAllCustomers,
} from "../hooks/useQueries";
import type { CustomerWithId } from "../hooks/useQueries";

// Extend jsPDF type for autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: object) => jsPDF;
  }
}

interface CustomerListPageProps {
  onEditCustomer: (data: EditCustomerData) => void;
}

function GhRgaBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    GH: "bg-blue-100 text-blue-700 border-blue-200",
    RGA: "bg-green-100 text-green-700 border-green-200",
    CLOSE: "bg-gray-100 text-gray-600 border-gray-200",
    "NOT INTERESTED": "bg-red-100 text-red-600 border-red-200",
  };
  const cls = colorMap[value] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {value}
    </span>
  );
}

export function CustomerListPage({ onEditCustomer }: CustomerListPageProps) {
  const { data: customers, isLoading, isError } = useGetAllCustomers();
  const deleteCustomer = useDeleteCustomer();
  const addCustomer = useAddCustomer();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithId | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerWithId | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showClearAll, setShowClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = (customers ?? []).filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobileNumber.toLowerCase().includes(q) ||
      c.tag.toLowerCase().includes(q) ||
      c.ghRga.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const exportPDF = () => {
    const list = customers ?? [];
    const doc = new jsPDF();
    doc.text("Customer List", 14, 16);
    doc.autoTable({
      head: [["Name", "Mobile", "Tag", "GH/RGA", "Address"]],
      body: list.map((c) => [
        c.name,
        c.mobileNumber,
        c.tag,
        c.ghRga,
        c.address,
      ]),
      startY: 22,
    });
    doc.save("customers.pdf");
  };

  const exportXLS = () => {
    const list = customers ?? [];
    const rows = list.map((c) => ({
      Name: c.name,
      "Mobile Number": c.mobileNumber,
      Tag: c.tag,
      "GH/RGA": c.ghRga,
      Address: c.address,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customers.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

      for (const row of rows) {
        const get = (key: string) => {
          const found = Object.keys(row).find(
            (k) => k.toLowerCase() === key.toLowerCase(),
          );
          return found ? String(row[found] ?? "") : "";
        };
        await addCustomer.mutateAsync({
          name: get("name"),
          mobileNumber: get("mobile number") || get("mobile"),
          tag: get("tag"),
          ghRga: get("gh/rga") || get("ghrga"),
          address: get("address"),
        });
      }
      toast.success(`Imported ${rows.length} customer(s) successfully`);
    } catch {
      toast.error("Failed to import. Please check your file format.");
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      setSelectedCustomer(null);
    } catch {
      toast.error("Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (!customers || customers.length === 0) return;
    setIsClearingAll(true);
    try {
      for (const customer of customers) {
        await deleteCustomer.mutateAsync(customer.id);
      }
      toast.success("All customer data cleared successfully");
      setShowClearAll(false);
    } catch {
      toast.error("Failed to clear all data");
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleEdit = (customer: CustomerWithId) => {
    setSelectedCustomer(null);
    onEditCustomer(customer);
  };

  return (
    <PageShell breadcrumb="CustomerHub | Customer List" title="Customer List">
      {/* Import/Export Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          data-ocid="customers.export_pdf_button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={exportPDF}
        >
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
        <Button
          data-ocid="customers.export_xls_button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={exportXLS}
        >
          <FileDown className="h-4 w-4" />
          Export XLS
        </Button>
        <Button
          data-ocid="customers.import_button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isImporting}
          onClick={() => fileInputRef.current?.click()}
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isImporting ? "Importing..." : "Import XLS"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImport}
        />
        <Button
          data-ocid="customers.clear_all_button"
          variant="destructive"
          size="sm"
          className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
          disabled={isLoading || !customers || customers.length === 0}
          onClick={() => setShowClearAll(true)}
        >
          <Trash2 className="h-4 w-4" />
          Clear All Data
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          data-ocid="customers.search_input"
          type="text"
          placeholder="Search by name, mobile, tag, GH/RGA, address..."
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

      {isLoading && (
        <div data-ocid="customers.loading_state" className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div
          data-ocid="customers.error_state"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Failed to load customers. Please try again.
        </div>
      )}

      {!isLoading && !isError && customers && customers.length === 0 && (
        <div
          data-ocid="customers.empty_state"
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-card py-20"
        >
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">No customers yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the Entry Form to add your first customer, or import from an
              XLS file.
            </p>
          </div>
        </div>
      )}

      {!isLoading &&
        !isError &&
        customers &&
        customers.length > 0 &&
        searchQuery &&
        filteredCustomers.length === 0 && (
          <div
            data-ocid="customers.no_results_state"
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card py-16"
          >
            <Search className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-semibold text-foreground">
                No results found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No customers match "{searchQuery}". Try a different search.
              </p>
            </div>
          </div>
        )}

      {!isLoading && filteredCustomers.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          {searchQuery && (
            <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground">
              Showing {filteredCustomers.length} of {customers?.length}{" "}
              customer(s)
            </div>
          )}
          {/* Horizontal scroll wrapper */}
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
                {filteredCustomers.map((customer, idx) => (
                  <TableRow
                    key={customer.id}
                    data-ocid={`customers.item.${idx + 1}`}
                    className="cursor-pointer hover:bg-accent/40 transition-colors"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <TableCell className="font-medium text-primary hover:underline">
                      {customer.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.mobileNumber || "—"}
                    </TableCell>
                    <TableCell>
                      {customer.tag ? (
                        <Badge variant="secondary" className="text-xs">
                          {customer.tag}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.ghRga ? (
                        <GhRgaBadge value={customer.ghRga} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
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

      {/* Customer Detail Dialog */}
      <Dialog
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent data-ocid="customers.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Customer Details
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                    Name
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {selectedCustomer.name}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                      Mobile Number
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedCustomer.mobileNumber || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                      Tag
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedCustomer.tag || "—"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                    GH/RGA
                  </p>
                  {selectedCustomer.ghRga ? (
                    <GhRgaBadge value={selectedCustomer.ghRga} />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
                {selectedCustomer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        Address
                      </p>
                      <p className="text-sm text-foreground">
                        {selectedCustomer.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              data-ocid="customers.edit_button"
              variant="default"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => selectedCustomer && handleEdit(selectedCustomer)}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              data-ocid="customers.delete_button"
              variant="destructive"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => {
                setDeleteTarget(selectedCustomer);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <Button
              data-ocid="customers.close_button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedCustomer(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Customer Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="customers.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="customers.delete.cancel_button"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="customers.delete.confirm_button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Data Confirmation */}
      <AlertDialog
        open={showClearAll}
        onOpenChange={(open) => !open && setShowClearAll(false)}
      >
        <AlertDialogContent data-ocid="customers.clear_all.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Clear All Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>all {customers?.length} customer(s)</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="customers.clear_all.cancel_button"
              disabled={isClearingAll}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="customers.clear_all.confirm_button"
              onClick={handleClearAll}
              disabled={isClearingAll}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Clearing...
                </>
              ) : (
                "Yes, Clear All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
