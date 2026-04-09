import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ExternalBlob, createActor } from "../backend";
import type { backendInterface } from "../backend";

const ACTOR_QUERY_KEY = "actor";

const CANISTER_ID: string =
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_CANISTER_ID_BACKEND ?? "";

// No-op file handlers — this backend has no object storage.
const noopUpload = async (
  _file: ExternalBlob,
): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array() as Uint8Array<ArrayBuffer>;

const noopDownload = async (
  _bytes: Uint8Array<ArrayBufferLike>,
): Promise<ExternalBlob> => ExternalBlob.fromURL("");

/**
 * Creates a fully anonymous actor directly.
 * No identity provider, no access control, no setup calls.
 */
async function createAnonymousActor(): Promise<backendInterface> {
  if (!CANISTER_ID) {
    throw new Error(
      "VITE_CANISTER_ID_BACKEND is not set. Check your environment configuration.",
    );
  }
  const actor = createActor(CANISTER_ID, noopUpload, noopDownload, {});
  if (!actor) throw new Error("createActor returned null");
  return actor;
}

// Module-level ref so waitForActor can access it without React context
let _actorRef: backendInterface | null = null;

export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY],
    queryFn: async () => {
      const actor = await createAnonymousActor();
      _actorRef = actor;
      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: 5,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 10000),
    enabled: true,
  });

  // If actor failed all retries, keep trying every 3s
  useEffect(() => {
    if (actorQuery.isError && !actorQuery.isFetching) {
      console.warn(
        "[useActor] All retries failed, scheduling re-attempt in 3s",
      );
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [ACTOR_QUERY_KEY] });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actorQuery.isError, actorQuery.isFetching, queryClient]);

  // Update module-level ref when actor changes
  useEffect(() => {
    if (actorQuery.data) {
      _actorRef = actorQuery.data;
      // Kick dependent queries so they re-fetch
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data ?? null,
    isFetching: actorQuery.isPending || actorQuery.isFetching,
  };
}

/**
 * Waits up to `maxWaitMs` for the actor to be ready.
 * Polls the module-level ref every 100ms.
 * Use inside mutation functions to handle the race between user action
 * and actor initialization completing on hard refresh.
 */
export async function waitForActor(
  getActor?: () => backendInterface | null,
  maxWaitMs = 12000,
): Promise<backendInterface> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    // Try the provided getter first, then fall back to module-level ref
    const a = getActor ? getActor() : _actorRef;
    if (a) return a;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    "Connection timed out. Please reload the page and try again.",
  );
}
