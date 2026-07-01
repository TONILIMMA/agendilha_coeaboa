import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { UpdateAnnouncement } from "./UpdateAnnouncement";
import { APP_VERSION, UPDATES } from "@/lib/changelog";

const STORAGE_KEY = "agendilha_last_seen_version";

describe("UpdateAnnouncement", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("usa exatamente o título e bullets de src/lib/changelog.ts", async () => {
    const current = UPDATES.find((u) => u.version === APP_VERSION) ?? UPDATES[0];

    render(<UpdateAnnouncement />);

    // O modal abre com um pequeno atraso (setTimeout 800ms). Espera o título.
    const title = await screen.findByText(current.title, {}, { timeout: 2000 });
    expect(title).toBeInTheDocument();

    // Data da atualização visível no cabeçalho
    expect(
      screen.getByText(new RegExp(`Atualização ${current.date}`, "i"))
    ).toBeInTheDocument();

    // Todos os bullets aparecem, na mesma ordem e com o texto exato do changelog
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(current.items.length);
    current.items.forEach((expected, idx) => {
      expect(items[idx]).toHaveTextContent(expected);
    });

    // Botão de fechar usa a microcopy do guia de voz
    expect(
      screen.getByRole("button", { name: /beleza, bora usar/i })
    ).toBeInTheDocument();
  });

  it("respeita o padrão editorial do título e bullets", () => {
    const current = UPDATES.find((u) => u.version === APP_VERSION) ?? UPDATES[0];

    // Título começa com o prefixo padronizado e é curto
    expect(current.title).toMatch(/^(Novidade no AgendIlha:|Novo jeito de)/);
    expect(current.title.length).toBeLessThanOrEqual(60);
    expect(current.title.endsWith(".")).toBe(false);

    // 2 a 4 bullets, sem jargão técnico
    expect(current.items.length).toBeGreaterThanOrEqual(2);
    expect(current.items.length).toBeLessThanOrEqual(4);
    const forbidden = /\b(RLS|endpoint|service worker|cache|deploy|PWA|API)\b/i;
    current.items.forEach((item) => {
      expect(item).not.toMatch(forbidden);
      // cada bullet termina em ponto (padrão "[o que mudou]. [como usar].")
      expect(item.trim().endsWith(".")).toBe(true);
    });
  });
});