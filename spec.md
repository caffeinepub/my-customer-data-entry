# CustomerHub - Tag Management in Settings

## Current State
- Settings page (Page 3) manages GH/RGA dropdown options (plain text list stored as `[Text]` in backend)
- Tag field on Entry Form (Page 1) is a plain text input
- Backend stores: customers, ghRga settings (`settings` list), no tag options

## Requested Changes (Diff)

### Add
- Backend: new `TagOption` type with `label: Text` and `color: Text` fields
- Backend: `tagOptions` stable list, `getTagOptions` query, `updateTagOptions` mutation
- Settings page: new "Tag Options" card section below GH/RGA section with full add/edit/delete UI, color selector (Purple, Regular, and any user-defined colors)
- Entry Form: Tag field changes from plain text input to a dropdown Select using tag options from backend
- useQueries.ts: `useGetTagOptions` and `useUpdateTagOptions` hooks

### Modify
- Settings page: add Tag Options management card
- EntryFormPage: Tag field becomes a Select dropdown instead of Input
- useQueries.ts: add tag option query/mutation hooks

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo` to add `TagOption` type, `tagOptions` list with defaults ("Purple", "Regular"), `getTagOptions`, `updateTagOptions`
2. Regenerate backend bindings (backend.did.d.ts) to include new types and methods
3. Add `useGetTagOptions` and `useUpdateTagOptions` to `useQueries.ts`
4. Update `SettingsPage.tsx`: add a second card for Tag Options with color-coded badges, edit/delete per item, add new option with color picker
5. Update `EntryFormPage.tsx`: change Tag field from `<Input>` to `<Select>` using tag options, display with color badge
