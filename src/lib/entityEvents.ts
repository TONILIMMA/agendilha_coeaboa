/**
 * Event bus minimalista para sinalizar que uma entidade
 * (promotor / estabelecimento / atrativo) mudou — criada, editada, aprovada
 * ou excluída — assim os autocompletes revalidam a lista na hora, sem
 * precisar recarregar a página.
 */
import { useEffect, useState } from "react";

export type EntityType = "promotor" | "estabelecimento" | "atrativo";

const EVENT_NAME = "lovable:entity-created";

export function emitEntityCreated(type: EntityType) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { type } }));
}

/** Mesma coisa que emitEntityCreated, para edição/aprovação/exclusão. */
export const emitEntityChanged = emitEntityCreated;

export function onEntityCreated(
  type: EntityType,
  handler: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.type === type) handler();
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

/**
 * Contador que incrementa sempre que alguma entidade muda. Serve como
 * `refreshKey` para invalidar caches de autocomplete.
 */
export function useEntityRevision(types?: EntityType[]) {
  const [revision, setRevision] = useState(0);
  const key = (types ?? []).join(",");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wanted = key ? key.split(",") : null;
    const listener = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (wanted && !wanted.includes(detail?.type)) return;
      setRevision((r) => r + 1);
    };
    window.addEventListener(EVENT_NAME, listener);
    return () => window.removeEventListener(EVENT_NAME, listener);
  }, [key]);
  return revision;
}