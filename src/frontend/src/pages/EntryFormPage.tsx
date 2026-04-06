import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Loader2, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { EditCustomerData } from "../App";
import { PageShell } from "../components/PageShell";
import {
  useAddCustomer,
  useGetSettings,
  useUpdateCustomer,
} from "../hooks/useQueries";

interface EntryFormPageProps {
  editData: EditCustomerData | null;
  onEditComplete: () => void;
}

const emptyForm = {
  name: "",
  mobileNumber: "",
  tag: "",
  ghRga: "",
  address: "",
};

export function EntryFormPage({
  editData,
  onEditComplete,
}: EntryFormPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});
  const formRef = useRef<HTMLDivElement>(null);

  const { data: settingsOptions } = useGetSettings();
  const ghRgaOptions =
    settingsOptions && settingsOptions.length > 0
      ? settingsOptions
      : ["GH", "RGA", "CLOSE", "NOT INTERESTED"];

  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();

  const isEditing = editData !== null;
  const isPending = addCustomer.isPending || updateCustomer.isPending;

  // Pre-fill form when editing
  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name,
        mobileNumber: editData.mobileNumber,
        tag: editData.tag,
        ghRga: editData.ghRga,
        address: editData.address,
      });
      setErrors({});
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setForm(emptyForm);
      setErrors({});
    }
  }, [editData]);

  const validate = () => {
    const newErrors: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.mobileNumber.trim())
      newErrors.mobileNumber = "Mobile number is required";
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

    const customerData = {
      name: form.name.trim(),
      mobileNumber: form.mobileNumber.trim(),
      tag: form.tag.trim(),
      ghRga: form.ghRga,
      address: form.address.trim(),
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
      setForm(emptyForm);
    } catch {
      toast.error(
        isEditing ? "Failed to update customer" : "Failed to save customer",
      );
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setErrors({});
    if (isEditing) onEditComplete();
  };

  const handleNewCustomer = () => {
    setForm(emptyForm);
    setErrors({});
    if (isEditing) onEditComplete();
    formRef.current?.scrollIntoView({ behavior: "smooth" });
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
                {/* Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-foreground"
                  >
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    data-ocid="entry.name.input"
                    placeholder="Enter customer name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="h-11"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p
                      data-ocid="entry.name.error_state"
                      className="text-xs text-destructive"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="mobile"
                    className="text-sm font-medium text-foreground"
                  >
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mobile"
                    data-ocid="entry.mobile.input"
                    placeholder="Enter mobile number"
                    value={form.mobileNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, mobileNumber: e.target.value }))
                    }
                    className="h-11"
                    type="tel"
                    aria-invalid={!!errors.mobileNumber}
                  />
                  {errors.mobileNumber && (
                    <p
                      data-ocid="entry.mobile.error_state"
                      className="text-xs text-destructive"
                    >
                      {errors.mobileNumber}
                    </p>
                  )}
                </div>

                {/* Tag */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="tag"
                    className="text-sm font-medium text-foreground"
                  >
                    Tag{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="tag"
                    data-ocid="entry.tag.input"
                    placeholder="Add a tag"
                    value={form.tag}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tag: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>

                {/* GH/RGA Dropdown */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="ghRga"
                    className="text-sm font-medium text-foreground"
                  >
                    GH/RGA
                  </Label>
                  <Select
                    value={form.ghRga}
                    onValueChange={(val) =>
                      setForm((p) => ({ ...p, ghRga: val }))
                    }
                  >
                    <SelectTrigger
                      id="ghRga"
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
                </div>

                {/* Address — full width */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-foreground"
                  >
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    data-ocid="entry.address.textarea"
                    placeholder="Enter customer address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="min-h-[100px] resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-border">
                <Button
                  type="submit"
                  data-ocid="entry.submit_button"
                  disabled={isPending}
                  className="h-10 px-6"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      {isEditing ? "Updating..." : "Saving..."}
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
    </PageShell>
  );
}
