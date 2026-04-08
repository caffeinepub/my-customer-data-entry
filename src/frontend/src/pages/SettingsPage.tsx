import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  Info,
  Layers,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/PageShell";
import {
  useGetColorTheme,
  useGetFieldDefinitions,
  useGetPlanOptions,
  useGetSettings,
  useUpdateColorTheme,
  useUpdateFieldDefinitions,
  useUpdatePlanOptions,
  useUpdateSettings,
} from "../hooks/useQueries";
import type { FieldDefinition } from "../hooks/useQueries";

// ─── Colour Theme ─────────────────────────────────────────────────────────────

const BRIGHT_COLOURS = [
  { name: "orange", hex: "#F97316", label: "Orange" },
  { name: "yellow", hex: "#EAB308", label: "Yellow" },
  { name: "green", hex: "#22C55E", label: "Green" },
  { name: "blue", hex: "#3B82F6", label: "Blue" },
  { name: "pink", hex: "#EC4899", label: "Pink" },
  { name: "purple", hex: "#A855F7", label: "Purple" },
];

const DARK_COLOURS = [
  { name: "dark-orange", hex: "#C2410C", label: "Dark Orange" },
  { name: "dark-yellow", hex: "#713F12", label: "Dark Yellow" },
  { name: "dark-green", hex: "#14532D", label: "Dark Green" },
  { name: "dark-blue", hex: "#1E3A8A", label: "Dark Blue" },
  { name: "dark-pink", hex: "#9D174D", label: "Dark Pink" },
  { name: "dark-purple", hex: "#581C87", label: "Dark Purple" },
];

// Map theme name to OKLCH primary values for CSS variable update
const THEME_OKLCH: Record<string, string> = {
  orange: "0.72 0.18 55",
  yellow: "0.80 0.18 90",
  green: "0.65 0.20 145",
  blue: "0.58 0.20 240",
  pink: "0.62 0.22 340",
  purple: "0.58 0.22 295",
  "dark-orange": "0.52 0.20 38",
  "dark-yellow": "0.40 0.15 80",
  "dark-green": "0.35 0.15 150",
  "dark-blue": "0.32 0.15 245",
  "dark-pink": "0.40 0.20 340",
  "dark-purple": "0.32 0.18 295",
};

// Sidebar gradient stops per theme
const THEME_SIDEBAR_GRADIENT: Record<string, [string, string]> = {
  orange: ["0.52 0.18 50", "0.62 0.20 70"],
  yellow: ["0.60 0.18 80", "0.75 0.20 95"],
  green: ["0.45 0.18 140", "0.60 0.20 155"],
  blue: ["0.40 0.18 235", "0.55 0.20 250"],
  pink: ["0.45 0.22 335", "0.58 0.22 345"],
  purple: ["0.42 0.20 290", "0.55 0.22 300"],
  "dark-orange": ["0.38 0.18 38", "0.50 0.20 50"],
  "dark-yellow": ["0.30 0.14 75", "0.42 0.16 88"],
  "dark-green": ["0.28 0.14 148", "0.38 0.16 155"],
  "dark-blue": ["0.25 0.14 242", "0.35 0.16 250"],
  "dark-pink": ["0.32 0.18 338", "0.42 0.20 345"],
  "dark-purple": ["0.26 0.16 292", "0.36 0.18 300"],
};

export function applyThemeToDocument(themeName: string) {
  const primary = THEME_OKLCH[themeName] ?? THEME_OKLCH.orange;
  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty(
    "--sidebar",
    `oklch(${(THEME_SIDEBAR_GRADIENT[themeName] ?? THEME_SIDEBAR_GRADIENT.orange)[0]})`,
  );

  // Store for Sidebar component to read gradient
  root.style.setProperty(
    "--theme-sidebar-from",
    `oklch(${(THEME_SIDEBAR_GRADIENT[themeName] ?? THEME_SIDEBAR_GRADIENT.orange)[0]})`,
  );
  root.style.setProperty(
    "--theme-sidebar-to",
    `oklch(${(THEME_SIDEBAR_GRADIENT[themeName] ?? THEME_SIDEBAR_GRADIENT.orange)[1]})`,
  );
}

// ─── Field Management ─────────────────────────────────────────────────────────

const DEFAULT_FIELD_DEFS: FieldDefinition[] = [
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

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  // ── Colour theme ──
  const { data: savedTheme } = useGetColorTheme();
  const updateColorTheme = useUpdateColorTheme();
  const [activeTheme, setActiveTheme] = useState<string>("");
  const currentTheme = activeTheme || savedTheme || "orange";

  const handleSelectTheme = async (themeName: string) => {
    setActiveTheme(themeName);
    applyThemeToDocument(themeName);
    try {
      await updateColorTheme.mutateAsync(themeName);
      toast.success("Colour theme updated!");
    } catch {
      toast.error("Failed to save colour theme");
    }
  };

  // ── Field definitions ──
  const { data: rawFieldDefs, isLoading: isLoadingFields } =
    useGetFieldDefinitions();
  const updateFieldDefinitions = useUpdateFieldDefinitions();

  const fieldDefs: FieldDefinition[] =
    rawFieldDefs && rawFieldDefs.length > 0
      ? [...rawFieldDefs].sort((a, b) => Number(a.order) - Number(b.order))
      : DEFAULT_FIELD_DEFS;

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldLabel, setEditingFieldLabel] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [isSavingFields, setIsSavingFields] = useState(false);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);

  const saveFieldDefs = async (newList: FieldDefinition[]) => {
    setIsSavingFields(true);
    try {
      await updateFieldDefinitions.mutateAsync(newList);
      toast.success("Fields saved!");
    } catch {
      toast.error("Failed to save fields");
    } finally {
      setIsSavingFields(false);
    }
  };

  const handleStartFieldEdit = (field: FieldDefinition) => {
    setEditingFieldId(field.id);
    setEditingFieldLabel(field.fieldLabel);
  };

  const handleSaveFieldEdit = async () => {
    if (!editingFieldId) return;
    if (!editingFieldLabel.trim()) {
      toast.error("Field name cannot be empty");
      return;
    }
    const updated = fieldDefs.map((f) =>
      f.id === editingFieldId
        ? { ...f, fieldLabel: editingFieldLabel.trim() }
        : f,
    );
    setEditingFieldId(null);
    await saveFieldDefs(updated);
  };

  const handleDeleteField = async (fieldId: string) => {
    setDeletingFieldId(fieldId);
    const updated = fieldDefs.filter((f) => f.id !== fieldId);
    await saveFieldDefs(updated);
    setDeletingFieldId(null);
  };

  const handleAddField = async () => {
    if (!newFieldLabel.trim()) {
      toast.error("Please enter a field name");
      return;
    }
    const newId = `field_${Date.now()}`;
    const maxOrder = fieldDefs.reduce(
      (m, f) => Math.max(m, Number(f.order)),
      0,
    );
    const newField: FieldDefinition = {
      id: newId,
      fieldLabel: newFieldLabel.trim(),
      fieldType: "text",
      order: BigInt(maxOrder + 1),
    };
    setNewFieldLabel("");
    await saveFieldDefs([...fieldDefs, newField]);
  };

  // ── GH/RGA options ──
  const {
    data: options,
    isLoading: isLoadingSettings,
    isError: isErrorSettings,
  } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [localOptions, setLocalOptions] = useState<string[] | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newOption, setNewOption] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const displayOptions = localOptions ?? options ?? [];

  const saveOptions = async (newList: string[]) => {
    setIsSaving(true);
    try {
      await updateSettings.mutateAsync(newList);
      setLocalOptions(null);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(displayOptions[index]);
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;
    if (!editingValue.trim()) {
      toast.error("Option cannot be empty");
      return;
    }
    const updated = displayOptions.map((opt, i) =>
      i === editingIndex ? editingValue.trim() : opt,
    );
    setEditingIndex(null);
    await saveOptions(updated);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };
  const handleDelete = async (index: number) =>
    saveOptions(displayOptions.filter((_, i) => i !== index));
  const handleAddOption = async () => {
    if (!newOption.trim()) {
      toast.error("Please enter an option value");
      return;
    }
    if (displayOptions.includes(newOption.trim())) {
      toast.error("This option already exists");
      return;
    }
    const updated = [...displayOptions, newOption.trim()];
    setNewOption("");
    await saveOptions(updated);
  };

  // ── Plan options ──
  const {
    data: planOpts,
    isLoading: isLoadingPlanOpts,
    isError: isErrorPlanOpts,
  } = useGetPlanOptions();
  const updatePlanOptions = useUpdatePlanOptions();

  const [localPlanOptions, setLocalPlanOptions] = useState<string[] | null>(
    null,
  );
  const [editingPlanIndex, setEditingPlanIndex] = useState<number | null>(null);
  const [editingPlanValue, setEditingPlanValue] = useState("");
  const [newPlanOption, setNewPlanOption] = useState("");
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const displayPlanOptions = localPlanOptions ?? planOpts ?? [];

  const savePlanOptions = async (newList: string[]) => {
    setIsSavingPlan(true);
    try {
      await updatePlanOptions.mutateAsync(newList);
      setLocalPlanOptions(null);
      toast.success("Plan options saved!");
    } catch {
      toast.error("Failed to save plan options");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleStartPlanEdit = (index: number) => {
    setEditingPlanIndex(index);
    setEditingPlanValue(displayPlanOptions[index]);
  };

  const handleSavePlanEdit = async () => {
    if (editingPlanIndex === null) return;
    if (!editingPlanValue.trim()) {
      toast.error("Option cannot be empty");
      return;
    }
    const updated = displayPlanOptions.map((opt, i) =>
      i === editingPlanIndex ? editingPlanValue.trim() : opt,
    );
    setEditingPlanIndex(null);
    await savePlanOptions(updated);
  };

  const handleCancelPlanEdit = () => {
    setEditingPlanIndex(null);
    setEditingPlanValue("");
  };
  const handleDeletePlanOption = async (index: number) =>
    savePlanOptions(displayPlanOptions.filter((_, i) => i !== index));
  const handleAddPlanOption = async () => {
    if (!newPlanOption.trim()) {
      toast.error("Please enter an option value");
      return;
    }
    if (displayPlanOptions.includes(newPlanOption.trim())) {
      toast.error("This option already exists");
      return;
    }
    const updated = [...displayPlanOptions, newPlanOption.trim()];
    setNewPlanOption("");
    await savePlanOptions(updated);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <PageShell breadcrumb="CustomerHub | Settings" title="Settings">
      <div className="max-w-xl w-full space-y-6">
        {/* Info note */}
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Manage colour theme, entry form fields, and dropdown options for
            GH/RGA and Plan fields.
          </span>
        </div>

        {/* ── COLOUR THEME CARD ── */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Colour Theme
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Choose a theme colour for buttons, sidebar, and accents throughout
              the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Bright Colours
              </p>
              <div className="flex flex-wrap gap-3">
                {BRIGHT_COLOURS.map((colour) => {
                  const isSelected = currentTheme === colour.name;
                  return (
                    <button
                      key={colour.name}
                      type="button"
                      data-ocid={`settings.theme.${colour.name}`}
                      title={colour.label}
                      onClick={() => handleSelectTheme(colour.name)}
                      className="relative w-9 h-9 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        backgroundColor: colour.hex,
                        boxShadow: isSelected
                          ? `0 0 0 3px white, 0 0 0 5px ${colour.hex}`
                          : undefined,
                        transform: isSelected ? "scale(1.15)" : undefined,
                      }}
                      aria-label={`Select ${colour.label} theme${isSelected ? " (current)" : ""}`}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <Check
                          className="absolute inset-0 m-auto h-4 w-4"
                          style={{
                            color: "white",
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Dark Colours
              </p>
              <div className="flex flex-wrap gap-3">
                {DARK_COLOURS.map((colour) => {
                  const isSelected = currentTheme === colour.name;
                  return (
                    <button
                      key={colour.name}
                      type="button"
                      data-ocid={`settings.theme.${colour.name}`}
                      title={colour.label}
                      onClick={() => handleSelectTheme(colour.name)}
                      className="relative w-9 h-9 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        backgroundColor: colour.hex,
                        boxShadow: isSelected
                          ? `0 0 0 3px white, 0 0 0 5px ${colour.hex}`
                          : undefined,
                        transform: isSelected ? "scale(1.15)" : undefined,
                      }}
                      aria-label={`Select ${colour.label} theme${isSelected ? " (current)" : ""}`}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <Check
                          className="absolute inset-0 m-auto h-4 w-4"
                          style={{
                            color: "white",
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Currently selected:{" "}
              <span className="font-medium capitalize text-foreground">
                {[...BRIGHT_COLOURS, ...DARK_COLOURS].find(
                  (c) => c.name === currentTheme,
                )?.label ?? currentTheme}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* ── ENTRY FORM FIELDS CARD ── */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Entry Form Fields
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Add, rename, or remove fields shown on the Customer Entry Form.
              All fields can be customised.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingFields && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isLoadingFields && fieldDefs.length > 0 && (
              <ul className="space-y-2">
                {fieldDefs.map((field) => (
                  <li
                    key={field.id}
                    data-ocid={`settings.field.${field.id}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                  >
                    {editingFieldId === field.id ? (
                      <>
                        <Input
                          value={editingFieldLabel}
                          onChange={(e) => setEditingFieldLabel(e.target.value)}
                          className="h-8 flex-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveFieldEdit();
                            if (e.key === "Escape") setEditingFieldId(null);
                          }}
                          autoFocus
                          placeholder="Field label"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={handleSaveFieldEdit}
                          disabled={isSavingFields}
                        >
                          {isSavingFields ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingFieldId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {field.fieldLabel}
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            ({field.fieldType})
                          </span>
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleStartFieldEdit(field)}
                          title={`Rename "${field.fieldLabel}"`}
                          data-ocid={`settings.field.edit.${field.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteField(field.id)}
                          disabled={
                            isSavingFields || deletingFieldId === field.id
                          }
                          title={`Delete "${field.fieldLabel}"`}
                          data-ocid={`settings.field.delete.${field.id}`}
                        >
                          {deletingFieldId === field.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Add new field */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Input
                placeholder="New field name (e.g. Birthday)"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="h-10 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddField();
                }}
                data-ocid="settings.field.new_input"
              />
              <Button
                onClick={handleAddField}
                disabled={isSavingFields}
                className="h-10 gap-1.5 whitespace-nowrap"
                data-ocid="settings.field.add_button"
              >
                {isSavingFields ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add Field
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── GH/RGA OPTIONS CARD ── */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              GH/RGA Options
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Manage the dropdown choices for the GH/RGA field.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSettings && (
              <div data-ocid="settings.loading_state" className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            )}

            {isErrorSettings && (
              <div
                data-ocid="settings.error_state"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                Failed to load settings.
              </div>
            )}

            {!isLoadingSettings && displayOptions.length === 0 && (
              <div
                data-ocid="settings.empty_state"
                className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
              >
                No options yet. Add your first GH/RGA option below.
              </div>
            )}

            {!isLoadingSettings && displayOptions.length > 0 && (
              <ul className="space-y-2">
                {displayOptions.map((opt, idx) => (
                  <li
                    key={opt}
                    data-ocid={`settings.item.${idx + 1}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                  >
                    {editingIndex === idx ? (
                      <>
                        <Input
                          data-ocid="settings.edit.input"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="h-8 flex-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          autoFocus
                        />
                        <Button
                          data-ocid="settings.edit.save_button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          data-ocid="settings.edit.cancel_button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {opt}
                        </span>
                        <Button
                          data-ocid={`settings.edit_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleStartEdit(idx)}
                          title={`Edit "${opt}"`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          data-ocid={`settings.delete_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(idx)}
                          disabled={isSaving}
                          title={`Delete "${opt}"`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Add new option */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Input
                data-ocid="settings.new_option.input"
                placeholder="New option value (e.g. FOLLOW UP)"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                className="h-10 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddOption();
                }}
              />
              <Button
                data-ocid="settings.add_option.button"
                onClick={handleAddOption}
                disabled={isSaving}
                className="h-10 gap-1.5 whitespace-nowrap"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add Option
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* ── PLAN OPTIONS CARD ── */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Plan Options
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Manage the dropdown choices for the Plan field in the PLANS form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPlanOpts && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            )}

            {isErrorPlanOpts && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Failed to load plan options.
              </div>
            )}

            {!isLoadingPlanOpts && displayPlanOptions.length === 0 && (
              <div
                data-ocid="settings.plan_options.empty_state"
                className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
              >
                No plan options yet. Add your first option below.
              </div>
            )}

            {!isLoadingPlanOpts && displayPlanOptions.length > 0 && (
              <ul className="space-y-2">
                {displayPlanOptions.map((opt, idx) => (
                  <li
                    key={opt}
                    data-ocid={`settings.plan_option.${idx + 1}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                  >
                    {editingPlanIndex === idx ? (
                      <>
                        <Input
                          data-ocid="settings.plan_option.edit_input"
                          value={editingPlanValue}
                          onChange={(e) => setEditingPlanValue(e.target.value)}
                          className="h-8 flex-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSavePlanEdit();
                            if (e.key === "Escape") handleCancelPlanEdit();
                          }}
                          autoFocus
                        />
                        <Button
                          data-ocid="settings.plan_option.save_edit_button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={handleSavePlanEdit}
                          disabled={isSavingPlan}
                        >
                          {isSavingPlan ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          data-ocid="settings.plan_option.cancel_edit_button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={handleCancelPlanEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {opt}
                        </span>
                        <Button
                          data-ocid={`settings.plan_option.edit_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleStartPlanEdit(idx)}
                          title={`Edit "${opt}"`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          data-ocid={`settings.plan_option.delete_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePlanOption(idx)}
                          disabled={isSavingPlan}
                          title={`Delete "${opt}"`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Add new plan option */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Input
                data-ocid="settings.plan_option.new_input"
                placeholder="New plan option (e.g. Gold Plan)"
                value={newPlanOption}
                onChange={(e) => setNewPlanOption(e.target.value)}
                className="h-10 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPlanOption();
                }}
              />
              <Button
                data-ocid="settings.plan_option.add_button"
                onClick={handleAddPlanOption}
                disabled={isSavingPlan}
                className="h-10 gap-1.5 whitespace-nowrap"
              >
                {isSavingPlan ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add Option
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
