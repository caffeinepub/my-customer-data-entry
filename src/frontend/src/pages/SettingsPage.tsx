import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Check,
  Info,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/PageShell";
import {
  useGetSettings,
  useGetTagOptions,
  useUpdateSettings,
  useUpdateTagOptions,
} from "../hooks/useQueries";
import type { TagOption } from "../hooks/useQueries";

const COLOR_OPTIONS = [
  { value: "purple", label: "Purple", dot: "bg-purple-500" },
  { value: "default", label: "Regular", dot: "bg-gray-400" },
  { value: "blue", label: "Blue", dot: "bg-blue-500" },
  { value: "green", label: "Green", dot: "bg-green-500" },
  { value: "red", label: "Red", dot: "bg-red-500" },
  { value: "orange", label: "Orange", dot: "bg-orange-500" },
  { value: "yellow", label: "Yellow", dot: "bg-yellow-500" },
  { value: "pink", label: "Pink", dot: "bg-pink-500" },
];

const COLOR_CLASS_MAP: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
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
}: { tagLabel: string; tagColor: string }) {
  const cls = COLOR_CLASS_MAP[tagColor] ?? COLOR_CLASS_MAP.default;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {tagLabel}
    </span>
  );
}

export function SettingsPage() {
  // GH/RGA settings
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

  // Tag options
  const {
    data: tagOpts,
    isLoading: isLoadingTags,
    isError: isErrorTags,
  } = useGetTagOptions();
  const updateTagOptions = useUpdateTagOptions();

  const [localTagOpts, setLocalTagOpts] = useState<TagOption[] | null>(null);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagLabel, setEditingTagLabel] = useState("");
  const [editingTagColor, setEditingTagColor] = useState("default");
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState("default");
  const [isSavingTag, setIsSavingTag] = useState(false);

  const displayTagOpts = localTagOpts ?? tagOpts ?? [];

  const saveTagOptions = async (newList: TagOption[]) => {
    setIsSavingTag(true);
    try {
      await updateTagOptions.mutateAsync(newList);
      setLocalTagOpts(null);
      toast.success("Tag options saved!");
    } catch {
      toast.error("Failed to save tag options");
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleStartTagEdit = (index: number) => {
    setEditingTagIndex(index);
    setEditingTagLabel(displayTagOpts[index].tagLabel);
    setEditingTagColor(displayTagOpts[index].tagColor);
  };

  const handleSaveTagEdit = async () => {
    if (editingTagIndex === null) return;
    if (!editingTagLabel.trim()) {
      toast.error("Tag label cannot be empty");
      return;
    }
    const updated = displayTagOpts.map((opt, i) =>
      i === editingTagIndex
        ? { tagLabel: editingTagLabel.trim(), tagColor: editingTagColor }
        : opt,
    );
    setEditingTagIndex(null);
    await saveTagOptions(updated);
  };

  const handleCancelTagEdit = () => {
    setEditingTagIndex(null);
    setEditingTagLabel("");
    setEditingTagColor("default");
  };

  const handleDeleteTag = async (index: number) => {
    const updated = displayTagOpts.filter((_, i) => i !== index);
    await saveTagOptions(updated);
  };

  const handleAddTag = async () => {
    if (!newTagLabel.trim()) {
      toast.error("Please enter a tag label");
      return;
    }
    if (
      displayTagOpts.some(
        (t) => t.tagLabel.toLowerCase() === newTagLabel.trim().toLowerCase(),
      )
    ) {
      toast.error("This tag already exists");
      return;
    }
    const updated = [
      ...displayTagOpts,
      { tagLabel: newTagLabel.trim(), tagColor: newTagColor },
    ];
    setNewTagLabel("");
    setNewTagColor("default");
    await saveTagOptions(updated);
  };

  return (
    <PageShell breadcrumb="CustomerHub | Settings" title="Settings">
      <div className="max-w-xl w-full space-y-6">
        {/* Info note */}
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Manage dropdown options for GH/RGA and Tag fields used in the entry
            form.
          </span>
        </div>

        {/* TAG OPTIONS CARD */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Tag Options
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Manage the dropdown choices for the Tag field. Each tag has a
              label and a color.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingTags && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            )}

            {isErrorTags && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Failed to load tag options.
              </div>
            )}

            {!isLoadingTags && displayTagOpts.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No tag options yet. Add your first tag below.
              </div>
            )}

            {!isLoadingTags && displayTagOpts.length > 0 && (
              <ul className="space-y-2">
                {displayTagOpts.map((opt, idx) => (
                  <li
                    key={`${opt.tagLabel}-${idx}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                  >
                    {editingTagIndex === idx ? (
                      <>
                        <Input
                          value={editingTagLabel}
                          onChange={(e) => setEditingTagLabel(e.target.value)}
                          className="h-8 flex-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveTagEdit();
                            if (e.key === "Escape") handleCancelTagEdit();
                          }}
                          autoFocus
                          placeholder="Tag label"
                        />
                        <Select
                          value={editingTagColor}
                          onValueChange={setEditingTagColor}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLOR_OPTIONS.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-block h-2.5 w-2.5 rounded-full ${c.dot}`}
                                  />
                                  {c.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={handleSaveTagEdit}
                          disabled={isSavingTag}
                        >
                          {isSavingTag ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={handleCancelTagEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">
                          <TagBadge
                            tagLabel={opt.tagLabel}
                            tagColor={opt.tagColor}
                          />
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleStartTagEdit(idx)}
                          title={`Edit "${opt.tagLabel}"`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteTag(idx)}
                          disabled={isSavingTag}
                          title={`Delete "${opt.tagLabel}"`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Add new tag */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Input
                placeholder="Tag label (e.g. VIP)"
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                className="h-10 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTag();
                }}
              />
              <Select value={newTagColor} onValueChange={setNewTagColor}>
                <SelectTrigger className="h-10 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${c.dot}`}
                        />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddTag}
                disabled={isSavingTag}
                className="h-10 gap-1.5 whitespace-nowrap"
              >
                {isSavingTag ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add Tag
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GH/RGA OPTIONS CARD */}
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
      </div>
    </PageShell>
  );
}
