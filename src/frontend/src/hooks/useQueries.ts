import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Customer } from "../backend.d.ts";
import { useActor } from "./useActor";

export interface CustomerWithId extends Customer {
  id: number;
}

// ─── Customer Queries ────────────────────────────────────────────────────────

export function useGetAllCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<CustomerWithId[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      const customers = await actor.getAllCustomers();
      return customers.map((c) => ({ ...c, id: Number(c.id) }));
    },
    enabled: !!actor && !isFetching,
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

export function useAddCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Customer) => {
      if (!actor) throw new Error("Not connected");
      return actor.addCustomer(customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      customer,
    }: { id: number; customer: Customer }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateCustomer(BigInt(id), customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCustomer(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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
