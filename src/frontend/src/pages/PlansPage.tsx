import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Edit2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PageShell } from "../components/PageShell";
import {
  useAddPlan,
  useDeleteAllPlans,
  useDeletePlan,
  useGetAllPlans,
  useGetPlanOptions,
  useUpdatePlan,
  useUpdatePlanStatus,
} from "../hooks/useQueries";
import type { PlanWithId } from "../hooks/useQueries";

interface PlansPageProps {
  userMobile: string;
}

export function calcDays(dateEntry: string): number {
  if (!dateEntry) return 0;
  return Math.floor(
    (Date.now() - new Date(dateEntry).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function getRowBg(status: string): string {
  if (status === "bill_done") return "bg-blue-100";
  if (status === "refund") return "bg-red-100";
  return "";
}

// ── Plan Form (shared for Add and Edit within modal) ─────────────────────────

interface PlanFormData {
  dateEntry: string;
  name: string;
  mobileNumber: string;
  installment: string;
  plan: string;
  billRefundStatus: string;
}

function PlanInlineForm({
  initial,
  planOptions,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: PlanFormData;
  planOptions: string[];
  onSave: (data: PlanFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<PlanFormData>(initial);
  const days = form.dateEntry ? calcDays(form.dateEntry) : 0;
  const isOld = days >= 300;

  const set = (field: keyof PlanFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Date */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="pif-date"
            className="text-xs font-semibold text-foreground"
          >
            Date
          </label>
          <input
            id="pif-date"
            type="date"
            value={form.dateEntry}
            onChange={(e) => set("dateEntry", e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        {/* Days (read-only) */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-foreground">
            Days (auto)
          </span>
          <div
            className={`h-9 rounded-md border border-input bg-muted/40 px-3 text-sm flex items-center ${
              isOld ? "text-destructive font-bold" : "text-muted-foreground"
            }`}
          >
            {form.dateEntry ? `${days}d${isOld ? " ⚠" : ""}` : "—"}
          </div>
        </div>
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="pif-name"
            className="text-xs font-semibold text-foreground"
          >
            Name
          </label>
          <Input
            id="pif-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Name"
            className="h-9 text-sm"
          />
        </div>
        {/* Mobile */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="pif-mobile"
            className="text-xs font-semibold text-foreground"
          >
            Mobile (10 digits)
          </label>
          <Input
            id="pif-mobile"
            value={form.mobileNumber}
            onChange={(e) =>
              set(
                "mobileNumber",
                e.target.value.replace(/\D/g, "").slice(0, 10),
              )
            }
            placeholder="Mobile number"
            className="h-9 text-sm"
            maxLength={10}
          />
        </div>
        {/* Installment */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="pif-installment"
            className="text-xs font-semibold text-foreground"
          >
            Installment
          </label>
          <Input
            id="pif-installment"
            value={form.installment}
            onChange={(e) => set("installment", e.target.value)}
            placeholder="Installment"
            className="h-9 text-sm"
          />
        </div>
        {/* Plan dropdown */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="pif-plan"
            className="text-xs font-semibold text-foreground"
          >
            Plan
          </label>
          <Select value={form.plan} onValueChange={(v) => set("plan", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {planOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ── Mobile Detail Modal ──────────────────────────────────────────────────────

function MobileDetailModal({
  mobile,
  plans,
  userMobile,
  onClose,
}: {
  mobile: string;
  plans: PlanWithId[];
  userMobile: string;
  onClose: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: planOptions = [] } = useGetPlanOptions();
  const allPlanOpts = planOptions.length > 0 ? planOptions : ["GHS", "RGA"];

  const updatePlan = useUpdatePlan(userMobile);
  const deletePlan = useDeletePlan(userMobile);
  const addPlan = useAddPlan(userMobile);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingId !== null) {
          setEditingId(null);
          return;
        }
        if (showAddForm) {
          setShowAddForm(false);
          return;
        }
        if (confirmDeleteId !== null) {
          setConfirmDeleteId(null);
          return;
        }
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, editingId, showAddForm, confirmDeleteId]);

  const handleEdit = async (data: PlanFormData) => {
    if (editingId === null) return;
    try {
      await updatePlan.mutateAsync({
        id: editingId,
        planData: {
          dateEntry: data.dateEntry,
          name: data.name,
          mobileNumber: data.mobileNumber,
          installment: data.installment,
          plan: data.plan,
          billRefundStatus: data.billRefundStatus,
        },
      });
      toast.success("Plan updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePlan.mutateAsync(id);
      toast.success("Plan deleted");
      setConfirmDeleteId(null);
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const handleAdd = async (data: PlanFormData) => {
    if (data.mobileNumber.length !== 10) {
      toast.error("Mobile number must be 10 digits");
      return;
    }
    try {
      await addPlan.mutateAsync({
        dateEntry: data.dateEntry,
        name: data.name,
        mobileNumber: data.mobileNumber,
        installment: data.installment,
        plan: data.plan,
        billRefundStatus: data.billRefundStatus,
      });
      toast.success("Plan added");
      setShowAddForm(false);
    } catch {
      toast.error("Failed to add plan");
    }
  };

  const currentMatching = plans.filter((p) => p.mobileNumber === mobile);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[88vh] flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Plans for Mobile
            </h2>
            <p className="text-sm text-amber-600 font-semibold mt-0.5">
              {mobile}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-ocid="plans.modal.add.button"
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
              }}
              className="h-8 gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-muted/60 transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {/* Add Form */}
          {showAddForm && (
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                New Entry
              </p>
              <PlanInlineForm
                initial={{
                  dateEntry: "",
                  name: "",
                  mobileNumber: mobile,
                  installment: "",
                  plan: allPlanOpts[0] ?? "",
                  billRefundStatus: "",
                }}
                planOptions={allPlanOpts}
                onSave={handleAdd}
                onCancel={() => setShowAddForm(false)}
                isSaving={addPlan.isPending}
              />
            </div>
          )}

          {currentMatching.length === 0 && !showAddForm ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No plans found for this mobile number.
            </p>
          ) : (
            currentMatching.map((p) => {
              const days = calcDays(p.dateEntry);
              const isOld = days >= 300;
              const statusLabel =
                p.billRefundStatus === "bill_done"
                  ? "Bill Done"
                  : p.billRefundStatus === "refund"
                    ? "Refund"
                    : null;
              const isEditing = editingId === p.id;
              const isConfirmDelete = confirmDeleteId === p.id;

              return (
                <div
                  key={p.id}
                  className={`rounded-lg border border-border ${
                    p.billRefundStatus === "bill_done"
                      ? "bg-blue-50"
                      : p.billRefundStatus === "refund"
                        ? "bg-red-50"
                        : "bg-background"
                  }`}
                >
                  {isEditing ? (
                    <div className="p-4">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                        Edit Entry
                      </p>
                      <PlanInlineForm
                        initial={{
                          dateEntry: p.dateEntry,
                          name: p.name,
                          mobileNumber: p.mobileNumber,
                          installment: p.installment,
                          plan: p.plan,
                          billRefundStatus: p.billRefundStatus,
                        }}
                        planOptions={allPlanOpts}
                        onSave={handleEdit}
                        onCancel={() => setEditingId(null)}
                        isSaving={updatePlan.isPending}
                      />
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {/* Top row: name + badges + actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {p.name || "—"}
                          </span>
                          {p.plan && (
                            <Badge variant="secondary" className="text-xs">
                              {p.plan}
                            </Badge>
                          )}
                          {statusLabel && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                p.billRefundStatus === "bill_done"
                                  ? "bg-blue-200 text-blue-800"
                                  : "bg-red-200 text-red-800"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          )}
                        </div>
                        {/* Edit / Delete buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            data-ocid="plans.modal.edit.button"
                            aria-label="Edit plan"
                            onClick={() => {
                              setEditingId(p.id);
                              setConfirmDeleteId(null);
                            }}
                            className="p-1.5 rounded text-amber-600 hover:bg-amber-100 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            data-ocid="plans.modal.delete.button"
                            aria-label="Delete plan"
                            onClick={() => {
                              setConfirmDeleteId(p.id);
                              setEditingId(null);
                            }}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Detail grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium text-foreground">
                            Date:
                          </span>{" "}
                          {p.dateEntry || "—"}
                        </span>
                        <span>
                          <span className="font-medium text-foreground">
                            Mobile:
                          </span>{" "}
                          {p.mobileNumber || "—"}
                        </span>
                        <span>
                          <span className="font-medium text-foreground">
                            Installment:
                          </span>{" "}
                          {p.installment || "—"}
                        </span>
                        <span>
                          <span className="font-medium text-foreground">
                            Days:
                          </span>{" "}
                          <span
                            className={
                              isOld
                                ? "text-destructive font-bold"
                                : "text-foreground"
                            }
                          >
                            {days}d{isOld && " ⚠"}
                          </span>
                        </span>
                      </div>

                      {/* Inline delete confirmation */}
                      {isConfirmDelete && (
                        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 flex items-center justify-between gap-3">
                          <span className="text-xs text-destructive font-medium">
                            Delete this entry?
                          </span>
                          <div className="flex gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deletePlan.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              onClick={() => handleDelete(p.id)}
                              disabled={deletePlan.isPending}
                            >
                              {deletePlan.isPending ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Status Picker Popover ────────────────────────────────────────────────────

function StatusPicker({
  onSelect,
  onDismiss,
}: {
  onSelect: (status: string) => void;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      className="absolute z-30 top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-2 flex flex-col gap-1.5 min-w-[130px]"
      role="menu"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => onSelect("bill_done")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
        Bill Done
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => onSelect("refund")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
        Refund
      </button>
    </div>
  );
}

// ── Delete All Confirmation Modal ────────────────────────────────────────────

function DeleteAllModal({
  count,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  count: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel, isDeleting]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm border border-destructive/30 p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-destructive uppercase tracking-wide">
            ⚠ DELETE ALL PLAN DATA
          </h2>
          <p className="text-sm text-muted-foreground">
            This will permanently delete{" "}
            <span className="font-bold text-foreground">{count}</span> plan
            {count !== 1 ? "s" : ""}. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            data-ocid="plans.delete_all.confirm.button"
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete All"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function PlansPage({ userMobile }: PlansPageProps) {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [selectedMobile, setSelectedMobile] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const { data: plans = [], isLoading } = useGetAllPlans(userMobile);
  const { data: planOptions = [] } = useGetPlanOptions();
  const deletePlan = useDeletePlan(userMobile);
  const deleteAllPlans = useDeleteAllPlans(userMobile);
  const addPlan = useAddPlan(userMobile);
  const updatePlanStatus = useUpdatePlanStatus();

  const allPlanOptions = planOptions.length > 0 ? planOptions : ["GHS", "RGA"];

  // Filter + search
  const filtered = plans.filter((p) => {
    const term = search.toLowerCase();
    const statusLabel =
      p.billRefundStatus === "bill_done"
        ? "bill done"
        : p.billRefundStatus === "refund"
          ? "refund"
          : "";
    const matchSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.mobileNumber.includes(term) ||
      p.installment.toLowerCase().includes(term) ||
      p.plan.toLowerCase().includes(term) ||
      p.dateEntry.includes(term) ||
      statusLabel.includes(term);
    const matchPlan = filterPlan === "all" || p.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this plan entry?")) return;
    try {
      await deletePlan.mutateAsync(id);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const handleDeleteAll = async () => {
    const ids = plans.map((p) => p.id);
    try {
      await deleteAllPlans.mutateAsync(ids);
      toast.success(`Deleted all ${ids.length} plan(s)`);
      setShowDeleteAllModal(false);
    } catch {
      toast.error("Failed to delete all plans");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updatePlanStatus.mutateAsync({ id, status });
      if (status === "bill_done") toast.success("Marked as Bill Done");
      else if (status === "refund") toast.success("Marked as Refund");
      else toast.success("Status cleared");
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ── Export XLS ──
  const handleExport = () => {
    if (plans.length === 0) {
      toast.info("No plans to export");
      return;
    }
    const rows = plans.map((p) => ({
      Date: p.dateEntry,
      Name: p.name,
      "Mobile Number": p.mobileNumber,
      Installment: p.installment,
      Plan: p.plan,
      Days: calcDays(p.dateEntry),
      Status: p.billRefundStatus,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plans");
    XLSX.writeFile(wb, "plans.xlsx");
    toast.success("Plans exported as plans.xlsx");
  };

  // ── Import XLS ──
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        const getField = (
          row: Record<string, string>,
          ...keys: string[]
        ): string => {
          for (const key of keys) {
            const found = Object.keys(row).find(
              (k) => k.toLowerCase() === key.toLowerCase(),
            );
            if (found !== undefined) return row[found] ?? "";
          }
          return "";
        };

        let imported = 0;
        for (const row of rows) {
          const dateEntry = getField(row, "date");
          const name = getField(row, "name");
          const mobileNumber = getField(row, "mobile number", "mobile");
          const installment = getField(row, "installment");
          const plan = getField(row, "plan");
          if (!dateEntry && !name && !mobileNumber) continue;
          await addPlan.mutateAsync({
            dateEntry,
            name,
            mobileNumber,
            installment,
            plan,
            billRefundStatus: "",
          });
          imported++;
        }
        toast.success(`Imported ${imported} plan(s)`);
      } catch {
        toast.error("Failed to import — check file format");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <PageShell
      breadcrumb="CustomerHub | Plans"
      title="Plans"
      actions={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            data-ocid="plans.delete_all.button"
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteAllModal(true)}
            disabled={plans.length === 0}
            className="h-9 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete All
          </Button>
          <Button
            data-ocid="plans.export.button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export XLS
          </Button>
          <Button
            data-ocid="plans.import.button"
            variant="outline"
            size="sm"
            onClick={() => importRef.current?.click()}
            className="h-9 gap-1.5"
          >
            <Upload className="h-4 w-4" />
            Import XLS
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            data-ocid="plans.search.input"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger
            data-ocid="plans.filter_plan.select"
            className="h-10 w-full sm:w-44"
          >
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {allPlanOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground mb-3">
        Showing {filtered.length} of {plans.length} plan(s)
      </p>

      {/* Table */}
      {isLoading ? (
        <div
          data-ocid="plans.loading_state"
          className="flex items-center justify-center py-16 text-muted-foreground text-sm"
        >
          Loading plans...
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="plans.empty_state"
          className="flex flex-col items-center justify-center py-16 gap-3 text-center"
        >
          <span className="text-4xl">📋</span>
          <p className="text-base font-medium text-foreground">
            No plans found
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {plans.length === 0
              ? "Add plans from the Entry Form page."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  "Status",
                  "Date",
                  "Name",
                  "Mobile",
                  "Installment",
                  "Plan",
                  "Days",
                  "",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((plan) => (
                <PlanTableRow
                  key={plan.id}
                  plan={plan}
                  allPlans={plans}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onMobileClick={setSelectedMobile}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Detail Modal */}
      {selectedMobile && (
        <MobileDetailModal
          mobile={selectedMobile}
          plans={plans}
          userMobile={userMobile}
          onClose={() => setSelectedMobile(null)}
        />
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <DeleteAllModal
          count={plans.length}
          isDeleting={deleteAllPlans.isPending}
          onConfirm={handleDeleteAll}
          onCancel={() => setShowDeleteAllModal(false)}
        />
      )}
    </PageShell>
  );
}

// ── Table Row ────────────────────────────────────────────────────────────────

export function PlanTableRow({
  plan,
  onDelete,
  onStatusChange,
  onMobileClick,
}: {
  plan: PlanWithId;
  allPlans: PlanWithId[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onMobileClick: (mobile: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const cellRef = useRef<HTMLTableCellElement>(null);

  const days = calcDays(plan.dateEntry);
  const isOld = days >= 300;
  const status = plan.billRefundStatus;
  const isBillDone = status === "bill_done";
  const isRefund = status === "refund";
  const hasStatus = isBillDone || isRefund;
  const rowBg = getRowBg(status);

  const handleCheckboxChange = () => {
    // Unchecked → show picker
    setShowPicker(true);
  };

  const handleStatusBadgeClick = () => {
    // Already has status → re-open picker to change or the user can clear
    setShowPicker(true);
  };

  const handlePickerSelect = (newStatus: string) => {
    setShowPicker(false);
    onStatusChange(plan.id, newStatus);
  };

  return (
    <tr
      data-ocid="plans.row"
      className={`border-b border-border transition-colors ${rowBg || "hover:bg-muted/30"}`}
    >
      {/* Status cell — checkbox when no status; colored bold text when status set */}
      <td ref={cellRef} className="px-3 py-3 relative">
        <div className="relative inline-block">
          {hasStatus ? (
            // Show colored text label; clicking it re-opens the picker
            <button
              type="button"
              data-ocid="plans.status_label"
              aria-label={
                isBillDone
                  ? "Bill Done — click to change"
                  : "Refund — click to change"
              }
              onClick={handleStatusBadgeClick}
              className={`text-xs font-bold px-2 py-1 rounded cursor-pointer select-none leading-tight transition-opacity hover:opacity-80 ${
                isBillDone
                  ? "text-blue-700 bg-blue-100 border border-blue-300"
                  : "text-red-700 bg-red-100 border border-red-300"
              }`}
            >
              {isBillDone ? "BILL DONE" : "REFUND"}
            </button>
          ) : (
            // Show checkbox when no status
            <input
              type="checkbox"
              data-ocid="plans.status_checkbox"
              checked={false}
              onChange={handleCheckboxChange}
              className="w-4 h-4 cursor-pointer accent-amber-500"
              aria-label="Set bill status"
            />
          )}
          {showPicker && (
            <StatusPicker
              onSelect={handlePickerSelect}
              onDismiss={() => setShowPicker(false)}
            />
          )}
        </div>
      </td>

      {/* Date */}
      <td className="px-3 py-3 text-sm whitespace-nowrap text-foreground">
        {plan.dateEntry || "—"}
      </td>

      {/* Name */}
      <td className="px-3 py-3 text-sm font-medium text-foreground">
        {plan.name || "—"}
      </td>

      {/* Mobile — clickable */}
      <td className="px-3 py-3 text-sm whitespace-nowrap">
        {plan.mobileNumber ? (
          <button
            type="button"
            data-ocid="plans.mobile_link"
            onClick={() => onMobileClick(plan.mobileNumber)}
            className="text-amber-600 underline underline-offset-2 hover:text-amber-700 cursor-pointer font-medium transition-colors"
          >
            {plan.mobileNumber}
          </button>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      {/* Installment */}
      <td className="px-3 py-3 text-sm text-foreground">
        {plan.installment || "—"}
      </td>

      {/* Plan */}
      <td className="px-3 py-3 text-sm">
        {plan.plan ? (
          <Badge variant="secondary" className="font-medium">
            {plan.plan}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      {/* Days */}
      <td className="px-3 py-3 text-sm whitespace-nowrap">
        <span
          className={
            isOld ? "text-destructive font-bold" : "text-foreground font-medium"
          }
        >
          {days}d{isOld && " ⚠"}
        </span>
      </td>

      {/* Delete */}
      <td className="px-3 py-3">
        <button
          type="button"
          data-ocid="plans.delete_row.button"
          aria-label="Delete plan"
          onClick={() => onDelete(plan.id)}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
