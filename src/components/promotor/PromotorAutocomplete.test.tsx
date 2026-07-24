import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PromotorAutocomplete } from "./PromotorAutocomplete";

// Mock auth + supabase client
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

const mockLimit = vi.fn();
vi.mock("@/integrations/supabase/client", () => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    not: () => chain,
    ilike: () => chain,
    order: () => chain,
    limit: (...args: any[]) => mockLimit(...args),
  };
  return {
    supabase: { from: () => chain },
  };
});

function setupSuggestions(rows: any[]) {
  mockLimit.mockResolvedValueOnce({ data: rows, error: null });
}

describe("PromotorAutocomplete", () => {
  beforeEach(() => {
    mockLimit.mockReset();
  });

  it("ao selecionar um promotor existente, chama onSelect com nome e whatsapp", async () => {
    setupSuggestions([
      {
        responsible_name: "Zé do Rolê",
        responsavel_duvidas_whatsapp: "21999998888",
        responsavel_tipo: "artista",
      },
    ]);

    const onChange = vi.fn();
    const onSelect = vi.fn();

    render(
      <PromotorAutocomplete value="Zé" onChange={onChange} onSelect={onSelect} />,
    );

    const item = await screen.findByText("Zé do Rolê");
    fireEvent.mouseDown(item.closest("button")!);

    expect(onChange).toHaveBeenCalledWith("Zé do Rolê");
    expect(onSelect).toHaveBeenCalledWith({
      nome: "Zé do Rolê",
      whatsapp: "21999998888",
      tipo: "artista",
    });
  });

  it("quando não há correspondência exata, mostra dica de 'novo promotor'", async () => {
    setupSuggestions([
      {
        responsible_name: "Fulano",
        responsavel_duvidas_whatsapp: null,
        responsavel_tipo: null,
      },
    ]);

    render(
      <PromotorAutocomplete
        value="Ciclana Nova"
        onChange={() => {}}
        onSelect={() => {}}
      />,
    );

    // Espera a sugestão aparecer para abrir o painel
    await screen.findByText("Fulano");
    await waitFor(() =>
      expect(screen.getByText(/será salvo neste evento/i)).toBeInTheDocument(),
    );
  });

  it("mostra alerta de duplicidade quando o texto bate exatamente com uma sugestão sem seleção", async () => {
    setupSuggestions([
      {
        responsible_name: "Maria",
        responsavel_duvidas_whatsapp: "21999990000",
        responsavel_tipo: null,
      },
    ]);

    render(
      <PromotorAutocomplete
        value="Maria"
        onChange={() => {}}
        onSelect={() => {}}
        selected={false}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("promotor-duplicate-alert")).toBeInTheDocument(),
    );
  });
});