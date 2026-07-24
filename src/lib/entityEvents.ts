/**
 * Event bus minimalista para sinalizar que uma nova entidade
 * (promotor / estabelecimento / atrativo) foi criada no formulário —
 * assim os autocompletes revalidam a lista sem precisar recarregar a página.
 */
export type EntityType = "promotor" | "estabelecimento" | "atrativo";

const EVENT_NAME = "lovable:entity-created";

export function emitEntityCreated(type: EntityType) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { type } }));
}

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