import { useEffect, useMemo, useState } from "react";
import { formatBrazilianDate } from "@/lib/date-utils";
import { formatDayLabel, parseDateToObj } from "@/components/agenda/agenda-utils";
import type { AgendaEvent } from "@/components/agenda/types";

export interface AgendaProfileHints {
  home_location?: string | null;
  address_neighborhood?: string | null;
  musical_preferences?: string[] | null;
}

export interface AgendaDayGroup {
  label: string;
  sortKey: string;
  items: AgendaEvent[];
}

const SORT_STORAGE_KEY = "agendilha_sort_order";

/**
 * Concentra o estado de filtros e todos os recortes derivados da agenda
 * (próximos, filtrados, perto de você, bombando, recomendados e agrupados por dia).
 */
export function useAgendaFilters(params: {
  events: AgendaEvent[];
  profile: AgendaProfileHints | null | undefined;
  isFavorite: (id: string) => boolean;
  favorites: unknown;
}) {
  const { events, profile, isFavorite, favorites } = params;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() =>
    localStorage.getItem(SORT_STORAGE_KEY) === "desc" ? "desc" : "asc",
  );

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortOrder);
  }, [sortOrder]);

  // Lê os parâmetros da URL uma vez (?view=favorites, ?category=musica)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("view") === "favorites") setShowFavoritesOnly(true);
    const category = urlParams.get("category");
    if (category) setCategoryFilter(category);
  }, []);


  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter((e) => {
      const d = parseDateToObj(e.date);
      return !d || d >= today;
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    const term = search.toLowerCase();
    return upcomingEvents.filter((ev) => {
      const matchSearch =
        ev.event_title.toLowerCase().includes(term) ||
        (ev.description || "").toLowerCase().includes(term);
      const matchCat = categoryFilter === "all" || ev.category === categoryFilter;
      const matchFav = !showFavoritesOnly || isFavorite(ev.id);
      return matchSearch && matchCat && matchFav;
    });
  }, [
    upcomingEvents,
    search,
    categoryFilter,
    showFavoritesOnly,
    favorites,
    isFavorite,
  ]);

  const nearYouEvents: AgendaEvent[] = [];

  const recommendedEvents = useMemo(() => {
    const prefs = profile?.musical_preferences || [];
    if (prefs.length === 0) return [];
    return upcomingEvents
      .filter((ev) =>
        prefs.some(
          (p) =>
            ev.category?.toLowerCase().includes(p.toLowerCase()) ||
            ev.description?.toLowerCase().includes(p.toLowerCase()),
        ),
      )
      .slice(0, 4);
  }, [upcomingEvents, profile]);

  const trendingEvents = useMemo(
    () =>
      [...upcomingEvents]
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 4),
    [upcomingEvents],
  );

  const grouped = useMemo(() => {
    const map: Record<string, AgendaDayGroup> = {};
    for (const ev of filteredEvents) {
      const d = parseDateToObj(ev.date);
      const key = d
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : "sem-data";
      if (!map[key]) {
        map[key] = {
          label: formatBrazilianDate(ev.date) || formatDayLabel(ev.date),
          sortKey: key === "sem-data" ? "9999-99-99" : key,
          items: [],
        };
      }
      map[key].items.push(ev);
    }
    return map;
  }, [filteredEvents]);

  const sortedDays = useMemo(
    () =>
      Object.entries(grouped)
        .sort(([, a], [, b]) =>
          sortOrder === "asc"
            ? a.sortKey.localeCompare(b.sortKey)
            : b.sortKey.localeCompare(a.sortKey),
        )
        .map(([key]) => key),
    [grouped, sortOrder],
  );

  const hasActiveFilters =
    !!search || categoryFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    
  };

  return {
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    showFavoritesOnly,
    setShowFavoritesOnly,
    sortOrder,
    setSortOrder,
    
    upcomingEvents,
    filteredEvents,
    nearYouEvents,
    recommendedEvents,
    trendingEvents,
    grouped,
    sortedDays,
    hasActiveFilters,
    clearFilters,
  };
}
