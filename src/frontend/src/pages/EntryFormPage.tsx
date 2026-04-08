import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Loader2, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { EditCustomerData } from "../App";
import { PageShell } from "../components/PageShell";
import { useActor } from "../hooks/useActor";
import {
  useAddCustomer,
  useAddPlan,
  useGetAllPlans,
  useGetFieldDefinitions,
  useGetPlanOptions,
  useGetSettings,
  useUpdateCustomer,
} from "../hooks/useQueries";
import type { FieldDefinition, PlanWithId } from "../hooks/useQueries";

interface EntryFormPageProps {
  editData: EditCustomerData | null;
  onEditComplete: () => void;
  currentUser: string;
}

const CORE_FIELD_IDS = ["name", "mobileNo", "tag", "ghRga", "address"];

const DEFAULT_FIELDS: FieldDefinition[] = [
  { id: "name", fieldLabel: "Name", fieldType: "text", order: BigInt(1) },
  {
    id: "mobileNo",
    fieldLabel: "Mobile Number",
    fieldType: "text",
    order: BigInt(2),
  },
  { id: "tag", fieldLabel: "Tag", fieldType: "text", order: BigInt(3) },
  { id: "ghRga", fieldLabel: "GH/RGA", fieldType: "select", order: BigInt(4) },
  {
    id: "address",
    fieldLabel: "Address",
    fieldType: "textarea",
    order: BigInt(5),
  },
];

function calcDays(dateEntry: string): number {
  if (!dateEntry) return 0;
  return Math.floor(
    (Date.now() - new Date(dateEntry).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function DaysDisplay({ dateEntry }: { dateEntry: string }) {
  const days = calcDays(dateEntry);
  const isOld = days >= 300;
  if (!dateEntry)
    return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <span
      className={
        isOld ? "text-destructive font-bold" : "text-foreground font-medium"
      }
    >
      {days} days
    </span>
  );
}

function PlanRow({
  plan,
  onDelete,
}: { plan: PlanWithId; onDelete: (id: number) => void }) {
  const days = calcDays(plan.dateEntry);
  const isOld = days >= 300;
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2 text-sm whitespace-nowrap">{plan.dateEntry}</td>
      <td className="px-3 py-2 text-sm font-medium">{plan.name}</td>
      <td className="px-3 py-2 text-sm whitespace-nowrap">
        {plan.mobileNumber}
      </td>
      <td className="px-3 py-2 text-sm">{plan.installment}</td>
      <td className="px-3 py-2 text-sm">
        <Badge variant="secondary">{plan.plan}</Badge>
      </td>
      <td
        className={`px-3 py-2 text-sm font-semibold whitespace-nowrap ${isOld ? "text-destructive" : "text-foreground"}`}
      >
        {days}d
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          data-ocid="plans.delete.button"
          aria-label="Delete plan"
          onClick={() => onDelete(plan.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

export function EntryFormPage({
  editData,
  onEditComplete,
  currentUser,
}: EntryFormPageProps) {
  const actorState = useActor();
  const isActorReady = !!actorState.actor && !actorState.isFetching;

  const [coreValues, setCoreValues] = useState({
    name: "",
    mobileNo: "",
    tag: "",
    ghRga: "",
    address: "",
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<{ name?: string; mobileNo?: string }>(
    {},
  );
  const formRef = useRef<HTMLDivElement>(null);

  // Plans form state
  const [planForm, setPlanForm] = useState({
    dateEntry: "",
    name: "",
    mobileNumber: "",
    installment: "",
    plan: "",
  });
  const [planErrors, setPlanErrors] = useState<{
    mobileNumber?: string;
    dateEntry?: string;
  }>({});
  const planFormRef = useRef<HTMLDivElement>(null);

  const { data: settingsOptions } = useGetSettings();
  const { data: rawFieldDefs } = useGetFieldDefinitions();
  const { data: planOptions } = useGetPlanOptions();
  const { data: savedPlans = [] } = useGetAllPlans(currentUser);

  const ghRgaOptions =
    settingsOptions && settingsOptions.length > 0
      ? settingsOptions
      : ["GH", "RGA", "CLOSE", "NOT INTERESTED"];

  const fieldDefs: FieldDefinition[] =
    rawFieldDefs && rawFieldDefs.length > 0
      ? [...rawFieldDefs].sort((a, b) => Number(a.order) - Number(b.order))
      : DEFAULT_FIELDS;

  const planDropdownOptions =
    planOptions && planOptions.length > 0 ? planOptions : ["GHS", "RGA"];

  const addCustomer = useAddCustomer(currentUser);
  const updateCustomer = useUpdateCustomer(currentUser);
  const addPlan = useAddPlan(currentUser);

  const isEditing = editData !== null;
  const isPending = addCustomer.isPending || updateCustomer.isPending;
  const isSaveDisabled = isPending || !isActorReady;

  useEffect(() => {
    if (editData) {
      setCoreValues({
        name: editData.name,
        mobileNo: editData.mobileNumber,
        tag: editData.tag,
        ghRga: editData.ghRga,
        address: editData.address,
      });
      const customMap: Record<string, string> = {};
      if (editData.customFields) {
        for (const cf of editData.customFields)
          customMap[cf.fieldName] = cf.fieldValue;
      }
      setCustomValues(customMap);
      setErrors({});
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setCoreValues({
        name: "",
        mobileNo: "",
        tag: "",
        ghRga: "",
        address: "",
      });
      setCustomValues({});
      setErrors({});
    }
  }, [editData]);

  const validate = () => {
    const newErrors: { name?: string; mobileNo?: string } = {};
    if (!coreValues.name.trim()) newErrors.name = "Name is required";
    if (!coreValues.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile number is required";
    } else if (!/^\d{10}$/.test(coreValues.mobileNo.trim())) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const extraFields = fieldDefs.filter((f) => !CORE_FIELD_IDS.includes(f.id));
    const customFields = extraFields
      .map((f) => ({ fieldName: f.id, fieldValue: customValues[f.id] ?? "" }))
      .filter((cf) => cf.fieldValue !== "");

    const customerData = {
      name: coreValues.name.trim(),
      mobileNumber: coreValues.mobileNo.trim(),
      tag: coreValues.tag,
      ghRga: coreValues.ghRga,
      address: coreValues.address.trim(),
      isHighlighted: false,
      customFields,
    };

    try {
      if (isEditing && editData) {
        await updateCustomer.mutateAsync({
          id: editData.id,
          customer: customerData,
        });
        toast.success("Customer updated successfully!");
        onEditComplete();
      } else {
        await addCustomer.mutateAsync(customerData);
        toast.success("Customer saved successfully!");
      }
      setCoreValues({
        name: "",
        mobileNo: "",
        tag: "",
        ghRga: "",
        address: "",
      });
      setCustomValues({});
    } catch (err) {
      console.error("[EntryFormPage] Save error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(
        isEditing
          ? `Failed to update customer: ${msg}`
          : `Failed to save customer: ${msg}`,
      );
    }
  };

  const handleCancel = () => {
    setCoreValues({ name: "", mobileNo: "", tag: "", ghRga: "", address: "" });
    setCustomValues({});
    setErrors({});
    if (isEditing) onEditComplete();
  };

  const handleNewCustomer = () => {
    setCoreValues({ name: "", mobileNo: "", tag: "", ghRga: "", address: "" });
    setCustomValues({});
    setErrors({});
    if (isEditing) onEditComplete();
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const validatePlanForm = () => {
    const errs: { mobileNumber?: string; dateEntry?: string } = {};
    if (!planForm.dateEntry) errs.dateEntry = "Date is required";
    if (!planForm.mobileNumber.trim()) {
      errs.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(planForm.mobileNumber.trim())) {
      errs.mobileNumber = "Mobile number must be exactly 10 digits";
    }
    return errs;
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePlanForm();
    if (Object.keys(errs).length > 0) {
      setPlanErrors(errs);
      return;
    }
    setPlanErrors({});
    try {
      await addPlan.mutateAsync({
        dateEntry: planForm.dateEntry,
        name: planForm.name.trim(),
        mobileNumber: planForm.mobileNumber.trim(),
        installment: planForm.installment.trim(),
        plan: planForm.plan,
        billRefundStatus: "",
      });
      toast.success("Plan saved successfully!");
      setPlanForm({
        dateEntry: "",
        name: "",
        mobileNumber: "",
        installment: "",
        plan: "",
      });
    } catch {
      toast.error("Failed to save plan");
    }
  };

  const renderField = (field: FieldDefinition) => {
    const isName = field.id === "name";
    const isMobile = field.id === "mobileNo";
    const isAddress = field.id === "address";
    const isGhRga = field.id === "ghRga";
    const isCore = CORE_FIELD_IDS.includes(field.id);
    const colSpan = isAddress ? "md:col-span-2" : "";

    return (
      <div key={field.id} className={`space-y-1.5 ${colSpan}`}>
        <Label
          htmlFor={field.id}
          className="text-sm font-medium text-foreground"
        >
          {field.fieldLabel}
          {(isName || isMobile) && (
            <span className="text-destructive ml-1">*</span>
          )}
          {!isName && !isMobile && (
            <span className="text-muted-foreground text-xs font-normal ml-1">
              (optional)
            </span>
          )}
        </Label>
        {isAddress ? (
          <Textarea
            id={field.id}
            data-ocid={`entry.${field.id}.textarea`}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
            value={coreValues.address}
            onChange={(e) =>
              setCoreValues((p) => ({ ...p, address: e.target.value }))
            }
            className="min-h-[100px] resize-none"
            rows={3}
          />
        ) : isGhRga ? (
          <Select
            value={coreValues.ghRga}
            onValueChange={(val) =>
              setCoreValues((p) => ({ ...p, ghRga: val }))
            }
          >
            <SelectTrigger
              id={field.id}
              data-ocid="entry.ghrga.select"
              className="h-11"
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {ghRgaOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : isCore ? (
          <>
            <Input
              id={field.id}
              data-ocid={`entry.${field.id}.input`}
              placeholder={
                isMobile
                  ? "Enter 10-digit mobile number"
                  : `Enter ${field.fieldLabel.toLowerCase()}`
              }
              value={
                isName
                  ? coreValues.name
                  : isMobile
                    ? coreValues.mobileNo
                    : coreValues.tag
              }
              onChange={(e) => {
                const val = isMobile
                  ? e.target.value.replace(/\D/g, "").slice(0, 10)
                  : e.target.value;
                if (isName) setCoreValues((p) => ({ ...p, name: val }));
                else if (isMobile)
                  setCoreValues((p) => ({ ...p, mobileNo: val }));
                else setCoreValues((p) => ({ ...p, tag: val }));
              }}
              className="h-11"
              type={isMobile ? "tel" : "text"}
              inputMode={isMobile ? "numeric" : undefined}
              pattern={isMobile ? "[0-9]*" : undefined}
              maxLength={isMobile ? 10 : undefined}
              aria-invalid={
                isName
                  ? !!errors.name
                  : isMobile
                    ? !!errors.mobileNo
                    : undefined
              }
            />
            {isName && errors.name && (
              <p
                data-ocid="entry.name.error_state"
                className="text-xs text-destructive"
              >
                {errors.name}
              </p>
            )}
            {isMobile && errors.mobileNo && (
              <p
                data-ocid="entry.mobile.error_state"
                className="text-xs text-destructive"
              >
                {errors.mobileNo}
              </p>
            )}
            {isMobile &&
              !errors.mobileNo &&
              coreValues.mobileNo.length > 0 &&
              coreValues.mobileNo.length < 10 && (
                <p className="text-xs text-muted-foreground">
                  {coreValues.mobileNo.length}/10 digits
                </p>
              )}
          </>
        ) : (
          <Input
            id={field.id}
            data-ocid={`entry.custom.${field.id}.input`}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
            value={customValues[field.id] ?? ""}
            onChange={(e) =>
              setCustomValues((p) => ({ ...p, [field.id]: e.target.value }))
            }
            className="h-11"
          />
        )}
      </div>
    );
  };

  return (
    <PageShell
      breadcrumb="CustomerHub | My Customer Data Entry"
      title="My Customer Data Entry"
      actions={
        <Button
          data-ocid="entry.new_customer.primary_button"
          onClick={handleNewCustomer}
          size="sm"
          className="h-9 gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          New Customer
        </Button>
      }
    >
      {/* ── Customer Entry Form ── */}
      <div ref={formRef}>
        {isEditing && (
          <div
            data-ocid="entry.editing.card"
            className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm text-primary"
          >
            <span className="font-medium">Editing: {editData?.name}</span>
            <button
              type="button"
              onClick={handleCancel}
              className="ml-auto text-primary/60 hover:text-primary transition-colors"
              title="Cancel edit"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <Card className="shadow-card border-border">
          <CardContent className="p-6 md:p-7">
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fieldDefs.map(renderField)}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-border">
                <Button
                  type="submit"
                  data-ocid="entry.submit_button"
                  disabled={isSaveDisabled}
                  className="h-10 px-6"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Saving..."}
                    </>
                  ) : !isActorReady ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : isEditing ? (
                    "Update Customer"
                  ) : (
                    "Save Customer"
                  )}
                </Button>
                <Button
                  type="button"
                  data-ocid="entry.cancel_button"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-10 px-6"
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── PLANS Data Entry Form ── */}
      <div ref={planFormRef} className="mt-8">
        <Card className="shadow-card border-border">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CalendarDays className="h-5 w-5 text-primary" />
              PLANS Data Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-7">
            <form onSubmit={handlePlanSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Date */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="plan-date"
                    className="text-sm font-medium text-foreground"
                  >
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="plan-date"
                    data-ocid="plans.date.input"
                    type="date"
                    value={planForm.dateEntry}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, dateEntry: e.target.value }))
                    }
                    className="h-11"
                    aria-invalid={!!planErrors.dateEntry}
                  />
                  {planErrors.dateEntry && (
                    <p className="text-xs text-destructive">
                      {planErrors.dateEntry}
                    </p>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="plan-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Name
                  </Label>
                  <Input
                    id="plan-name"
                    data-ocid="plans.name.input"
                    placeholder="Enter name"
                    value={planForm.name}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="plan-mobile"
                    className="text-sm font-medium text-foreground"
                  >
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="plan-mobile"
                    data-ocid="plans.mobile.input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={planForm.mobileNumber}
                    onChange={(e) =>
                      setPlanForm((p) => ({
                        ...p,
                        mobileNumber: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      }))
                    }
                    className="h-11"
                    aria-invalid={!!planErrors.mobileNumber}
                  />
                  {planErrors.mobileNumber && (
                    <p className="text-xs text-destructive">
                      {planErrors.mobileNumber}
                    </p>
                  )}
                  {!planErrors.mobileNumber &&
                    planForm.mobileNumber.length > 0 &&
                    planForm.mobileNumber.length < 10 && (
                      <p className="text-xs text-muted-foreground">
                        {planForm.mobileNumber.length}/10 digits
                      </p>
                    )}
                </div>

                {/* Installment */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="plan-installment"
                    className="text-sm font-medium text-foreground"
                  >
                    Installment
                  </Label>
                  <Input
                    id="plan-installment"
                    data-ocid="plans.installment.input"
                    placeholder="Enter installment"
                    value={planForm.installment}
                    onChange={(e) =>
                      setPlanForm((p) => ({
                        ...p,
                        installment: e.target.value,
                      }))
                    }
                    className="h-11"
                  />
                </div>

                {/* Plan Dropdown */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="plan-type"
                    className="text-sm font-medium text-foreground"
                  >
                    Plan
                  </Label>
                  <Select
                    value={planForm.plan}
                    onValueChange={(val) =>
                      setPlanForm((p) => ({ ...p, plan: val }))
                    }
                  >
                    <SelectTrigger
                      id="plan-type"
                      data-ocid="plans.plan.select"
                      className="h-11"
                    >
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planDropdownOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Days (auto-calculated, read-only) */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">
                    Days
                  </Label>
                  <div
                    data-ocid="plans.days.display"
                    className="h-11 flex items-center px-3 rounded-md border border-input bg-muted/40 text-sm"
                  >
                    {planForm.dateEntry ? (
                      <DaysDisplay dateEntry={planForm.dateEntry} />
                    ) : (
                      <span className="text-muted-foreground">
                        Auto-calculated from date
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <Button
                  type="submit"
                  data-ocid="plans.submit_button"
                  disabled={addPlan.isPending}
                  className="h-10 px-6"
                >
                  {addPlan.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Plan"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Saved Plans Preview below the form */}
        {savedPlans.length > 0 && (
          <div className="mt-6" data-ocid="plans.saved_list">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Saved Plans ({savedPlans.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Mobile
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Installment
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Plan
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Days
                    </th>
                    <th className="px-3 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {savedPlans.map((plan) => (
                    <PlanRow key={plan.id} plan={plan} onDelete={() => {}} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
