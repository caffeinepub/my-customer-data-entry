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
import { Check, Info, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/PageShell";
import { useGetSettings, useUpdateSettings } from "../hooks/useQueries";

export function SettingsPage() {
  const { data: options, isLoading, isError } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [localOptions, setLocalOptions] = useState<string[] | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newOption, setNewOption] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Use local copy if we have one, otherwise use loaded data
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

  const handleDelete = async (index: number) => {
    const updated = displayOptions.filter((_, i) => i !== index);
    await saveOptions(updated);
  };

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

  return (
    <PageShell breadcrumb="CustomerHub | Settings" title="Settings">
      <div className="max-w-xl w-full space-y-6">
        {/* Info note */}
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            These options appear in the GH/RGA dropdown on the entry form.
          </span>
        </div>

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
            {isLoading && (
              <div data-ocid="settings.loading_state" className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            )}

            {isError && (
              <div
                data-ocid="settings.error_state"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                Failed to load settings.
              </div>
            )}

            {!isLoading && displayOptions.length === 0 && (
              <div
                data-ocid="settings.empty_state"
                className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
              >
                No options yet. Add your first GH/RGA option below.
              </div>
            )}

            {/* Options list */}
            {!isLoading && displayOptions.length > 0 && (
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
      </div>
    </PageShell>
  );
}
