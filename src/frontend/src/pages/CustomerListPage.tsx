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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Filter,
  Loader2,
  MapPin,
  Phone,
  Save,
  Search,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { EditCustomerData } from "../App";
import { PageShell } from "../components/PageShell";
import {
  useAddCustomer,
  useDeleteCustomer,
  useGetAllCustomers,
  useGetSettings,
  useGetTagOptions,
  useUpdateCustomer,
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
  currentUser?: string;
  userMobile?: string;
}

// Helper: highlight matching query segments with orange styling
function highlightText(text: string, query: string): ReactNode {
  if (!query.trim() || !text) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            // biome-ignore lint/suspicious/noArrayIndexKey: stable split fragments
            key={i}
            className="bg-orange-200 text-orange-900 rounded px-0.5 font-semibold not-italic"
          >
            {part}
          </mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable split fragments
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const COLOR_CLASS_MAP: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  default: "bg-muted text-muted-foreground border-border",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-green-100 text-green-700 border-green-200",
  red: "bg-red-100 text-red-600 border-red-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
};

function TagBadge({
  tagLabel,
  tagColor,
  highlight = "",
}: { tagLabel: string; tagColor: string; highlight?: string }) {
  const cls = COLOR_CLASS_MAP[tagColor] ?? COLOR_CLASS_MAP.default;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {highlightText(tagLabel, highlight)}
    </span>
  );
}

function GhRgaBadge({
  value,
  highlight = "",
}: { value: string; highlight?: string }) {
  const colorMap: Record<string, string> = {
    GH: "bg-blue-100 text-blue-700 border-blue-200",
    RGA: "bg-green-100 text-green-700 border-green-200",
    CLOSE: "bg-muted text-muted-foreground border-border",
    "NOT INTERESTED": "bg-red-100 text-red-600 border-red-200",
  };
  const cls = colorMap[value] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {highlightText(value, highlight)}
    </span>
  );
}

export function CustomerListPage({
  onEditCustomer,
  currentUser,
  userMobile,
}: CustomerListPageProps) {
  const resolvedUser = currentUser ?? userMobile ?? "";
  const {
    data: customers,
    isLoading,
    isError,
  } = useGetAllCustomers(resolvedUser);
  const { data: tagOpts } = useGetTagOptions();
  const { data: ghRgaOpts } = useGetSettings();
  const deleteCustomer = useDeleteCustomer(resolvedUser);
  const addCustomer = useAddCustomer(resolvedUser);
  const updateCustomer = useUpdateCustomer(resolvedUser);

  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [ghRgaFilter, setGhRgaFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithId | null>(null);
  const [popupHighlighted, setPopupHighlighted] = useState(false);
  const [isSavingHighlight, setIsSavingHighlight] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerWithId | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showClearAll, setShowClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteSelected, setShowDeleteSelected] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = (customers ?? []).filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.mobileNumber.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q) ||
        c.ghRga.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (tagFilter !== "all" && c.tag !== tagFilter) return false;
    if (ghRgaFilter !== "all" && c.ghRga !== ghRgaFilter) return false;
    return true;
  });

  const hasActiveFilters = tagFilter !== "all" || ghRgaFilter !== "all";

  const clearFilters = () => {
    setTagFilter("all");
    setGhRgaFilter("all");
  };

  // Checkbox helpers
  const allChecked =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((c) => selectedIds.has(c.id));
  const someChecked = filteredCustomers.some((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allChecked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of filteredCustomers) next.delete(c.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of filteredCustomers) next.add(c.id);
        return next;
      });
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTagColor = (tagLabel: string): string => {
    const found = (tagOpts ?? []).find((t) => t.tagLabel === tagLabel);
    return found?.tagColor ?? "default";
  };

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
          isHighlighted: false,
          customFields: [],
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

  const handleDeleteSelected = async () => {
    setIsDeletingSelected(true);
    try {
      for (const id of selectedIds) {
        await deleteCustomer.mutateAsync(id);
      }
      toast.success(`Deleted ${selectedIds.size} customer(s) successfully`);
      setSelectedIds(new Set());
      setShowDeleteSelected(false);
    } catch {
      toast.error("Failed to delete selected customers");
    } finally {
      setIsDeletingSelected(false);
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
      setSelectedIds(new Set());
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

  const openCustomerDetail = (customer: CustomerWithId) => {
    setSelectedCustomer(customer);
    setPopupHighlighted(customer.isHighlighted);
  };

  const handleSaveHighlight = async () => {
    if (!selectedCustomer) return;
    setIsSavingHighlight(true);
    try {
      await updateCustomer.mutateAsync({
        id: selectedCustomer.id,
        customer: {
          name: selectedCustomer.name,
          mobileNumber: selectedCustomer.mobileNumber,
          tag: selectedCustomer.tag,
          ghRga: selectedCustomer.ghRga,
          address: selectedCustomer.address,
          isHighlighted: popupHighlighted,
          customFields: selectedCustomer.customFields ?? [],
        },
      });
      toast.success("Customer updated successfully");
      setSelectedCustomer(null);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSavingHighlight(false);
    }
  };

  return (
    <PageShell breadcrumb="CustomerHub | Customer List" title="Customer List">
      {/* Import/Export + Delete Selected Toolbar */}
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
        {selectedIds.size > 0 && (
          <Button
            data-ocid="customers.delete_selected_button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowDeleteSelected(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.size})
          </Button>
        )}
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
      <div className="relative mb-3">
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

      {/* TAG and GH/RGA Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger
            data-ocid="customers.tag_filter"
            className="h-9 w-40 text-sm"
          >
            <Tag className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {(tagOpts ?? []).map((opt) => (
              <SelectItem key={opt.tagLabel} value={opt.tagLabel}>
                <div className="flex items-center gap-1.5">
                  <TagBadge tagLabel={opt.tagLabel} tagColor={opt.tagColor} />
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ghRgaFilter} onValueChange={setGhRgaFilter}>
          <SelectTrigger
            data-ocid="customers.ghrga_filter"
            className="h-9 w-44 text-sm"
          >
            <SelectValue placeholder="All GH/RGA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All GH/RGA</SelectItem>
            {(ghRgaOpts ?? ["GH", "RGA", "CLOSE", "NOT INTERESTED"]).map(
              (opt) => (
                <SelectItem key={opt} value={opt}>
                  <GhRgaBadge value={opt} />
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Customer count stat */}
      {!isLoading && !isError && customers && customers.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {customers.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {customers.length === 1 ? "customer" : "customers"} total
            </span>
            {(searchQuery || hasActiveFilters) &&
              filteredCustomers.length !== customers.length && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({filteredCustomers.length} shown)
                </span>
              )}
          </div>
        </div>
      )}

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
        (searchQuery || hasActiveFilters) &&
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
                Try adjusting your search or filters.
              </p>
            </div>
          </div>
        )}

      {!isLoading && filteredCustomers.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {/* Select All checkbox */}
                  <TableHead className="w-10 pl-3">
                    <Checkbox
                      data-ocid="customers.select_all_checkbox"
                      checked={allChecked}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all customers"
                      ref={(el) => {
                        if (el) {
                          const input = el as HTMLButtonElement & {
                            indeterminate?: boolean;
                          };
                          input.indeterminate = someChecked && !allChecked;
                        }
                      }}
                    />
                  </TableHead>
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
                    className={`transition-colors ${
                      customer.isHighlighted
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-accent/40"
                    }`}
                  >
                    {/* Per-row checkbox */}
                    <TableCell
                      className="pl-3 w-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        data-ocid={`customers.item.${idx + 1}.checkbox`}
                        checked={selectedIds.has(customer.id)}
                        onCheckedChange={() => toggleSelectOne(customer.id)}
                        aria-label={`Select ${customer.name}`}
                      />
                    </TableCell>
                    <TableCell
                      className="font-medium text-primary hover:underline cursor-pointer"
                      onClick={() => openCustomerDetail(customer)}
                    >
                      {highlightText(customer.name, searchQuery)}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground cursor-pointer"
                      onClick={() => openCustomerDetail(customer)}
                    >
                      {customer.mobileNumber
                        ? highlightText(customer.mobileNumber, searchQuery)
                        : "—"}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => openCustomerDetail(customer)}
                    >
                      {customer.tag ? (
                        <TagBadge
                          tagLabel={customer.tag}
                          tagColor={getTagColor(customer.tag)}
                          highlight={searchQuery}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => openCustomerDetail(customer)}
                    >
                      {customer.ghRga ? (
                        <GhRgaBadge
                          value={customer.ghRga}
                          highlight={searchQuery}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm cursor-pointer"
                      onClick={() => openCustomerDetail(customer)}
                    >
                      {customer.address
                        ? highlightText(customer.address, searchQuery)
                        : "—"}
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
                    {highlightText(selectedCustomer.name, searchQuery)}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                      Mobile Number
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedCustomer.mobileNumber
                        ? highlightText(
                            selectedCustomer.mobileNumber,
                            searchQuery,
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                      Tag
                    </p>
                    {selectedCustomer.tag ? (
                      <TagBadge
                        tagLabel={selectedCustomer.tag}
                        tagColor={getTagColor(selectedCustomer.tag)}
                        highlight={searchQuery}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                    GH/RGA
                  </p>
                  {selectedCustomer.ghRga ? (
                    <GhRgaBadge
                      value={selectedCustomer.ghRga}
                      highlight={searchQuery}
                    />
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
                        {highlightText(selectedCustomer.address, searchQuery)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Highlighted checkbox */}
              <div className="flex items-center gap-2 px-1 pt-1">
                <Checkbox
                  data-ocid="customers.dialog.highlighted_checkbox"
                  id="popup-highlighted"
                  checked={popupHighlighted}
                  onCheckedChange={(checked) =>
                    setPopupHighlighted(checked === true)
                  }
                />
                <label
                  htmlFor="popup-highlighted"
                  className="text-sm font-medium text-foreground cursor-pointer select-none"
                >
                  Highlight this customer{" "}
                  <span className="text-xs text-muted-foreground">
                    (marks row in light blue)
                  </span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
            <Button
              data-ocid="customers.save_highlight_button"
              variant="default"
              size="sm"
              className="flex-1 gap-1.5"
              disabled={isSavingHighlight}
              onClick={handleSaveHighlight}
            >
              {isSavingHighlight ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save
            </Button>
            <Button
              data-ocid="customers.edit_button"
              variant="outline"
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
              variant="ghost"
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

      {/* Delete Selected Confirmation */}
      <AlertDialog
        open={showDeleteSelected}
        onOpenChange={(open) => !open && setShowDeleteSelected(false)}
      >
        <AlertDialogContent data-ocid="customers.delete_selected.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Customers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedIds.size} selected customer(s)</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="customers.delete_selected.cancel_button"
              disabled={isDeletingSelected}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="customers.delete_selected.confirm_button"
              onClick={handleDeleteSelected}
              disabled={isDeletingSelected}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeletingSelected ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} Customer(s)`
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
