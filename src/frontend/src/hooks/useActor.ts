import { createActorWithConfig } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";

const ACTOR_QUERY_KEY = "actor";

/**
 * Custom useActor hook that bypasses the core-infrastructure library's
 * useActor, which tries to call _initializeAccessControl() when an
 * Internet Identity is present. Our backend has no such method and no
 * access control — all calls are anonymous.
 */
export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY],
    queryFn: async () => {
      // Always create an anonymous actor — no identity, no access control.
      return await createActorWithConfig(createActor);
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor becomes available, invalidate and refetch all dependent queries.
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data ?? null,
    isFetching: actorQuery.isFetching,
  };
}
