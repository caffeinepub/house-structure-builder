import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Room } from "../backend";
import { useActor } from "./useActor";

export function useGetAllPlans() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlans();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePlan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, rooms }: { name: string; rooms: Room[] }) => {
      if (!actor) throw new Error("No actor");
      return actor.savePlan(name, rooms);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useUpdatePlan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      rooms,
    }: { id: bigint; name: string; rooms: Room[] }) => {
      if (!actor) throw new Error("No actor");
      return actor.updatePlan(id, name, rooms);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useDeletePlan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deletePlan(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}
