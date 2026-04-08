import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PlanWithId as BackendPlanWithId,
  CustomField,
  Customer,
  FieldDefinition,
  Plan,
  TagOption,
  User,
} from "../backend";
import { useActor } from "./useActor";

export type { Customer, CustomField, FieldDefinition, Plan, TagOption, User };

export interface PlanEntry {
  dateEntry: string;
  name: string;
  mobileNumber: string;
  installment: string;
  plan: string;
}

export interface PlanWithId {
  id: number;
  dateEntry: string;
  name: string;
  mobileNumber: string;
  installment: string;
  plan: string;
  daysCount: number;
  billRefundStatus: string;
}

function mapPlan(p: BackendPlanWithId): PlanWithId {
  return {
    id: Number(p.id),
    dateEntry: p.dateEntry,
    name: p.name,
    mobileNumber: p.mobileNumber,
    installment: p.installment,
    plan: p.plan,
    daysCount: Number(p.daysCount),
    billRefundStatus: p.billRefundStatus ?? "",
  };
}

export interface CustomerWithId {
  id: number;
  name: string;
  mobileNumber: string;
  tag: string;
  ghRga: string;
  address: string;
  isHighlighted: boolean;
  customFields: CustomField[];
}

export interface AdminUserData {
  userMobile: string;
  customers: CustomerWithId[];
}

// ─── Customer Queries ────────────────────────────────────────────────────────

export function useGetAllCustomers(userMobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CustomerWithId[]>({
    queryKey: ["customers", userMobile],
    queryFn: async () => {
      if (!actor || !userMobile) return [];
      const customers = await actor.getAllCustomers(userMobile);
      return customers.map((c) => ({
        ...c,
        id: Number(c.id),
        isHighlighted: c.isHighlighted ?? false,
        customFields: c.customFields ?? [],
      }));
    },
    enabled: !!actor && !isFetching && !!userMobile,
  });
}

export function useGetSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) return ["GH", "RGA", "CLOSE", "NOT INTERESTED"];
      const settings = await actor.getSettings();
      return settings.length > 0
        ? settings
        : ["GH", "RGA", "CLOSE", "NOT INTERESTED"];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTagOptions() {
  const { actor, isFetching } = useActor();
  return useQuery<TagOption[]>({
    queryKey: ["tagOptions"],
    queryFn: async () => {
      if (!actor)
        return [
          { tagLabel: "Purple", tagColor: "purple" },
          { tagLabel: "Regular", tagColor: "default" },
        ];
      const opts = await actor.getTagOptions();
      return opts.length > 0
        ? opts
        : [
            { tagLabel: "Purple", tagColor: "purple" },
            { tagLabel: "Regular", tagColor: "default" },
          ];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFieldDefinitions() {
  const { actor, isFetching } = useActor();
  return useQuery<FieldDefinition[]>({
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

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
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
      return result.map((r) => ({
        userMobile: r.userMobile,
        customers: r.customers.map((c) => ({
          id: Number(c.id),
          name: c.name,
          mobileNumber: c.mobileNumber,
          tag: c.tag,
          ghRga: c.ghRga,
          address: c.address,
          isHighlighted: c.isHighlighted ?? false,
          customFields: c.customFields ?? [],
        })),
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRegisteredUsers(adminMobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["registeredUsers", adminMobile],
    queryFn: async () => {
      if (!actor || !adminMobile) return [];
      return actor.getRegisteredUsers(adminMobile);
    },
    enabled: !!actor && !isFetching && !!adminMobile,
  });
}

export function useGetUserName(mobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["userName", mobile],
    queryFn: async () => {
      if (!actor || !mobile) return "";
      return actor.getUserName(mobile);
    },
    enabled: !!actor && !isFetching && !!mobile,
  });
}

// ─── Customer Mutations ───────────────────────────────────────────────────────

export function useAddCustomer(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Customer) => {
      if (!actor)
        throw new Error("Actor not ready — please wait and try again");
      if (!userMobile)
        throw new Error("User session missing — please log in again");
      return actor.addCustomer(userMobile, customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", userMobile] });
    },
    onError: (error: unknown) => {
      console.error("[useAddCustomer] Save failed:", error);
    },
  });
}

export function useUpdateCustomer(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      customer,
    }: { id: number; customer: Customer }) => {
      if (!actor)
        throw new Error("Actor not ready — please wait and try again");
      if (!userMobile)
        throw new Error("User session missing — please log in again");
      return actor.updateCustomer(userMobile, BigInt(id), customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", userMobile] });
    },
    onError: (error: unknown) => {
      console.error("[useUpdateCustomer] Update failed:", error);
    },
  });
}

export function useDeleteCustomer(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCustomer(userMobile, BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", userMobile] });
    },
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSettings: string[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateSettings(newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateTagOptions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newOptions: TagOption[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateTagOptions(newOptions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tagOptions"] });
    },
  });
}

export function useUpdateFieldDefinitions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: FieldDefinition[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateFieldDefinitions(fields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fieldDefinitions"] });
    },
  });
}

export function useUpdateColorTheme() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (theme: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateColorTheme(theme);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colorTheme"] });
    },
  });
}

// ─── OTP Mutations ────────────────────────────────────────────────────────────

export function useGenerateOtp() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (mobile: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.generateOtp(mobile);
    },
  });
}

export function useVerifyOtp() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ mobile, otp }: { mobile: string; otp: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.verifyOtp(mobile, otp);
    },
  });
}

// ─── User Management Mutations ────────────────────────────────────────────────

export function useCreateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminMobile,
      newMobile,
      userName,
    }: { adminMobile: string; newMobile: string; userName: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createUser(adminMobile, newMobile, userName);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["registeredUsers", vars.adminMobile],
      });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminMobile,
      mobile,
    }: { adminMobile: string; mobile: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteUser(adminMobile, mobile);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["registeredUsers", vars.adminMobile],
      });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

// ─── Plan Queries ─────────────────────────────────────────────────────────────

export function useGetAllPlans(userMobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PlanWithId[]>({
    queryKey: ["plans", userMobile],
    queryFn: async () => {
      if (!actor || !userMobile) return [];
      const plans = await actor.getAllPlans(userMobile);
      return plans.map(mapPlan);
    },
    enabled: !!actor && !isFetching && !!userMobile,
  });
}

export function useGetPlanOptions() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["planOptions"],
    queryFn: async () => {
      if (!actor) return ["GHS", "RGA"];
      const opts = await actor.getPlanOptions();
      return opts.length > 0 ? opts : ["GHS", "RGA"];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPlan(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planData: Plan) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.addPlan(userMobile, planData);
      return mapPlan(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
  });
}

export function useUpdatePlan(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, planData }: { id: number; planData: Plan }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updatePlan(userMobile, BigInt(id), planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
  });
}

export function useDeletePlan(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Not connected");
      return actor.deletePlan(userMobile, BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
  });
}

export function useDeleteAllPlans(userMobile: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planIds: number[]) => {
      if (!actor) throw new Error("Not connected");
      for (const id of planIds) {
        await actor.deletePlan(userMobile, BigInt(id));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
  });
}

export function useUpdatePlanOptions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (options: string[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.updatePlanOptions(options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planOptions"] });
    },
  });
}

export function useUpdatePlanStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (!actor) throw new Error("Not connected");
      const userMobile = localStorage.getItem("userMobile") ?? "";
      return actor.updatePlanStatus(userMobile, BigInt(id), status);
    },
    onSuccess: () => {
      const userMobile = localStorage.getItem("userMobile") ?? "";
      queryClient.invalidateQueries({ queryKey: ["plans", userMobile] });
    },
  });
}
