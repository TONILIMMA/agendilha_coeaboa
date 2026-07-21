/**
 * Centralized React Query keys for the data layer.
 * Keeps cache invalidation explicit and prevents typos in key arrays.
 */
export const qk = {
  newsletter: {
    all: ["newsletter"] as const,
    list: () => [...qk.newsletter.all, "list"] as const,
    count: () => [...qk.newsletter.all, "count"] as const,
  },
  adminUsers: {
    all: ["admin-users"] as const,
    list: () => [...qk.adminUsers.all, "list"] as const,
  },
  submissions: {
    all: ["submissions"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...qk.submissions.all, "list", filters ?? {}] as const,
    count: (filters?: Record<string, unknown>) =>
      [...qk.submissions.all, "count", filters ?? {}] as const,
    byId: (id: string) => [...qk.submissions.all, "byId", id] as const,
  },
  adminStats: {
    all: ["admin-stats"] as const,
    master: () => [...qk.adminStats.all, "master"] as const,
  },
  agenda: {
    all: ["agenda"] as const,
    events: () => [...qk.agenda.all, "events"] as const,
    ratings: () => [...qk.agenda.all, "ratings"] as const,
  },
  estabelecimentos: {
    all: ["estabelecimentos"] as const,
    mine: (userId: string | null | undefined) =>
      [...qk.estabelecimentos.all, "mine", userId ?? "anon"] as const,
    approved: (search?: string) =>
      [...qk.estabelecimentos.all, "approved", search ?? ""] as const,
  },
  atrativos: {
    all: ["atrativos"] as const,
    mine: (userId: string | null | undefined) =>
      [...qk.atrativos.all, "mine", userId ?? "anon"] as const,
    approved: (search?: string) =>
      [...qk.atrativos.all, "approved", search ?? ""] as const,
  },
} as const;