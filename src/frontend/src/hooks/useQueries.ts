import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CustomerWithId as BackendCustomerWithId,
  PlanWithId as BackendPlanWithId,
  CustomerData,
  DropdownOption,
  FieldDef,
  PlanData,
  PlanOption,
  Settings,
  TagOption,
  UserInfo,
} from "../backend";
import { useActor, waitForActor } from "./useActor";

// Re-export backend types for use in pages
export type {
  DropdownOption,
  FieldDef,
  PlanOption,
  Settings,
  TagOption,
  UserInfo,
};

// ─── Frontend types ───────────────────────────────────────────────────────────

// FieldDefinition mirrors FieldDef for backwards-compat usage in pages
export type FieldDefinition = FieldDef;

export interface CustomerRow {
  id: string;
  fields: [string, string][];
  // Convenience accessors populated by mapCustomer:
  name: string;
  mobileNumber: string;
  tag: string;
  ghRga: string;
  address: string;
  isHighlighted: boolean;
  customFields: { fieldName: string; fieldValue: string }[];
}

export interface PlanRow {
  id: string;
  dateStr: string;
  name: string;
  mobile: string;
  installment: string;
  plan: string;
  daysCount: number;
  status: string;
  // Aliases so existing pages that read .dateEntry / .mobileNumber / .billRefundStatus still work
  dateEntry: string;
  mobileNumber: string;
  billRefundStatus: string;
}

export interface AdminUserData {
  userMobile: string;
  customers: CustomerRow[];
}

// Legacy aliases so existing import sites compile
export type CustomerWithId = CustomerRow;
export type PlanWithId = PlanRow;

// ─── Mappers ──────────────────────────────────────────────────────────────────

/** Looks up a value from the fields array by field ID (first element of tuple). */
function getField(fields: [string, string][], id: string): string {
  const found = fields.find(([k]) => k === id);
  return found ? found[1] : "";
}

function mapCustomer(c: BackendCustomerWithId): CustomerRow {
  const fields = c.fields as [string, string][];
  const name = getField(fields, "name");
  const mobileNumber =
    getField(fields, "mobileNo") || getField(fields, "mobileNumber");
  const tag = getField(fields, "tag");
  const ghRga = getField(fields, "ghRga");
  const address = getField(fields, "address");
  const isHighlighted = getField(fields, "isHighlighted") === "true";

  // Custom fields = everything except known core fields
  const coreIds = new Set([
    "name",
    "mobileNo",
    "mobileNumber",
    "tag",
    "ghRga",
    "address",
    "isHighlighted",
  ]);
  const customFields = fields
    .filter(([k]) => !coreIds.has(k))
    .map(([fieldName, fieldValue]) => ({ fieldName, fieldValue }));

  return {
    id: c.id,
    fields,
    name,
    mobileNumber,
    tag,
    ghRga,
    address,
    isHighlighted,
    customFields,
  };
}

function mapPlan(p: BackendPlanWithId): PlanRow {
  return {
    id: p.id,
    dateStr: p.dateStr,
    name: p.name,
    mobile: p.mobile,
    installment: p.installment,
    plan: p.plan,
    daysCount: Number(p.daysCount),
    status: p.status,
    // Aliases
    dateEntry: p.dateStr,
    mobileNumber: p.mobile,
    billRefundStatus: p.status,
  };
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

// Helper: build CustomerData from CustomerRow fields
function buildCustomerData(fields: [string, string][]): CustomerData {
  return { fields };
}

// ─── Customer Queries ─────────────────────────────────────────────────────────

export function useGetAllCustomers(userMobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CustomerRow[]>({
    queryKey: ["customers", userMobile],
    queryFn: async () => {
      if (!actor || !userMobile) return [];
      const result = await actor.getAllCustomers(userMobile);
      return result.map(mapCustomer);
    },
    enabled: !!actor && !isFetching && !!userMobile,
    retry: 3,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 8000),
  });
}

export function useGetSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) return { ghRgaOptions: [] };
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTagOptions() {
  const { actor, isFetching } = useActor();
  return useQuery<TagOption[]>({
    queryKey: ["tagOptions"],
    queryFn: async () => {
      if (!actor) return [];
      const opts = await actor.getTagOptions();
      return opts;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFieldDefinitions() {
  const { actor, isFetching } = useActor();
  return useQuery<FieldDef[]>({
    queryKey: ["fieldDefinitions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFieldDefinitions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetColorTheme() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["colorTheme"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getColorTheme();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

export function useGetRegisteredUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserInfo[]>({
    queryKey: ["registeredUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRegisteredUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllCustomersForAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminUserData[]>({
    queryKey: ["allCustomersForAdmin"],
    queryFn: async (): Promise<AdminUserData[]> => {
      if (!actor) return [];
      const result = await actor.getAllCustomersForAdmin();
      return result.map(([userMobile, customers]) => ({
        userMobile,
        customers: customers.map(mapCustomer),
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserName(mobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["userName", mobile],
    queryFn: async () => {
      if (!actor || !mobile) return "";
      const result = await actor.getUserName(mobile);
      return result ?? "";
    },
    enabled: !!actor && !isFetching && !!mobile,
  });
}

// ─── Customer Mutations ───────────────────────────────────────────────────────

export function useAddCustomer(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: [string, string][]) => {
      if (!userMobile)
        throw new Error("User session missing — please log in again");
      const resolvedActor = await waitForActor(() => actor, 12000);
      console.log("[useAddCustomer] Saving customer for", userMobile);
      return resolvedActor.addCustomer(userMobile, buildCustomerData(fields));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", userMobile] });
    },
    onError: (error: unknown) => {
      console.error(
        "[useAddCustomer] Save failed:",
        extractErrorMessage(error),
        error,
      );
    },
  });
}

export function useUpdateCustomer(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: [string, string][];
    }) => {
      if (!userMobile)
        throw new Error("User session missing — please log in again");
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.updateCustomer(
        userMobile,
        id,
        buildCustomerData(fields),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", userMobile] });
    },
    onError: (error: unknown) => {
      console.error(
        "[useUpdateCustomer] Update failed:",
        extractErrorMessage(error),
        error,
      );
    },
  });
}

export function useDeleteCustomer(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.deleteCustomer(userMobile, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", userMobile] });
    },
    onError: (error: unknown) => {
      console.error(
        "[useDeleteCustomer] Delete failed:",
        extractErrorMessage(error),
        error,
      );
    },
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSettings: Settings) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.updateSettings(newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error: unknown) => {
      console.error("[useUpdateSettings] Failed:", extractErrorMessage(error));
    },
  });
}

export function useUpdateTagOptions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newOptions: TagOption[]) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.updateTagOptions(newOptions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tagOptions"] });
    },
    onError: (error: unknown) => {
      console.error(
        "[useUpdateTagOptions] Failed:",
        extractErrorMessage(error),
      );
    },
  });
}

export function useUpdateFieldDefinitions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: FieldDef[]) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.updateFieldDefinitions(fields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fieldDefinitions"] });
    },
    onError: (error: unknown) => {
      console.error(
        "[useUpdateFieldDefinitions] Failed:",
        extractErrorMessage(error),
      );
    },
  });
}

export function useUpdateColorTheme() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (theme: string) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.updateColorTheme(theme);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colorTheme"] });
    },
    onError: (error: unknown) => {
      console.error(
        "[useUpdateColorTheme] Failed:",
        extractErrorMessage(error),
      );
    },
  });
}

// ─── OTP Mutations ────────────────────────────────────────────────────────────

export function useGenerateOtp() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (mobile: string) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.generateOtp(mobile);
    },
    onError: (error: unknown) => {
      console.error("[useGenerateOtp] Failed:", extractErrorMessage(error));
    },
  });
}

export function useVerifyOtp() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ mobile, otp }: { mobile: string; otp: string }) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.verifyOtp(mobile, otp);
    },
    onError: (error: unknown) => {
      console.error("[useVerifyOtp] Failed:", extractErrorMessage(error));
    },
  });
}

// ─── User Management Mutations ────────────────────────────────────────────────

export function useCreateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mobile,
      userName,
    }: {
      mobile: string;
      userName: string;
    }) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.createUser(mobile, userName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registeredUsers"] });
      queryClient.invalidateQueries({ queryKey: ["allCustomersForAdmin"] });
    },
    onError: (error: unknown) => {
      console.error("[useCreateUser] Failed:", extractErrorMessage(error));
    },
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mobile: string) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.deleteUser(mobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registeredUsers"] });
      queryClient.invalidateQueries({ queryKey: ["allCustomersForAdmin"] });
    },
    onError: (error: unknown) => {
      console.error("[useDeleteUser] Failed:", extractErrorMessage(error));
    },
  });
}

// ─── Plan Queries ─────────────────────────────────────────────────────────────

export function useGetAllPlans(userMobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PlanRow[]>({
    queryKey: ["plans", userMobile],
    queryFn: async () => {
      if (!actor || !userMobile) return [];
      const plans = await actor.getAllPlans(userMobile);
      return plans.map(mapPlan);
    },
    enabled: !!actor && !isFetching && !!userMobile,
    retry: 3,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 8000),
  });
}

export function useGetPlanOptions() {
  const { actor, isFetching } = useActor();
  return useQuery<PlanOption[]>({
    queryKey: ["planOptions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPlanOptions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPlan(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planData: PlanData) => {
      if (!userMobile)
        throw new Error("User session missing — please log in again");
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.addPlan(userMobile, planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
    onError: (error: unknown) => {
      console.error("[useAddPlan] Failed:", extractErrorMessage(error), error);
    },
  });
}

export function useUpdatePlan(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      planData,
    }: { id: string; planData: PlanData }) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.updatePlan(userMobile, id, planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
    onError: (error: unknown) => {
      console.error("[useUpdatePlan] Failed:", extractErrorMessage(error));
    },
  });
}

export function useDeletePlan(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.deletePlan(userMobile, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
    onError: (error: unknown) => {
      console.error("[useDeletePlan] Failed:", extractErrorMessage(error));
    },
  });
}

export function useDeleteAllPlans(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.deleteAllPlans(userMobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
    onError: (error: unknown) => {
      console.error("[useDeleteAllPlans] Failed:", extractErrorMessage(error));
    },
  });
}

export function useUpdatePlanOptions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (options: PlanOption[]) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.updatePlanOptions(options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planOptions"] });
    },
    onError: (error: unknown) => {
      console.error(
        "[useUpdatePlanOptions] Failed:",
        extractErrorMessage(error),
      );
    },
  });
}

export function useUpdatePlanStatus(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const resolvedActor = await waitForActor(() => actor, 12000);
      return resolvedActor.updatePlanStatus(userMobile, id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
    onError: (error: unknown) => {
      console.error(
        "[useUpdatePlanStatus] Failed:",
        extractErrorMessage(error),
      );
    },
  });
}
