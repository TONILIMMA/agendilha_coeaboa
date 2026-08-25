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
  collaborators: {
    all: ["collaborators"] as const,
    list: () => [...qk.collaborators.all, "list"] as const,
  },
  reviews: {
    all: ["event-reviews"] as const,
    byEvent: (eventId: string | null | undefined) =>
      [...qk.reviews.all, "byEvent", eventId ?? "none"] as const,
  },
  userDetails: {
    all: ["user-details"] as const,
    byId: (userId: string | null | undefined) =>
      [...qk.userDetails.all, "byId", userId ?? "none"] as const,
  },
  profileOptions: {
    all: ["profile-options"] as const,
    list: () => [...qk.profileOptions.all, "list"] as const,
  },
  artistMedia: {
    all: ["artist-media"] as const,
    byArtist: (artistId: string | null | undefined) =>
      [...qk.artistMedia.all, "byArtist", artistId ?? "none"] as const,
  },
  divulgador: {
    all: ["divulgador"] as const,
    status: (userId: string | null | undefined) =>
      [...qk.divulgador.all, "status", userId ?? "anon"] as const,
    profile: (userId: string | null | undefined) =>
      [...qk.divulgador.all, "promotor-profile", userId ?? "anon"] as const,
  },
} as const;