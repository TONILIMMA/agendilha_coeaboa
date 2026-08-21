import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { AtrativoStep } from "./AtrativoStep";

// Mock permissions
vi.mock("@/hooks/useAppPermissions", () => ({
  useAppPermissions: () => ({ isAdmin: false, isMaster: false }),
}));

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "test-user-id" },
  })),
}));

// Mock supabase client used inside AtrativoStep
const atrativoMock = {
  id: "atr-1",
  name: "Banda Teste Ilha",
  tipo_atrativo: "Banda",
  type: "Cultura",
  style: "Rock",
  estilos: ["Rock", "Pop Rock"],
  description: "Banda de rock da ilha.",
  contact_info: "48999990001",
  is_approved: true,
};
const artistMock = {
  id: "art-1",
  name: "Testa DJ Aprovado",
  artist_type: "DJ",
  genre: "House",
  bio: "Artista aprovado.",
  whatsapp: "48999990009",
  is_approved: true,
};

vi.mock("@/integrations/supabase/client", () => {
  const build = (rows: any[]) => {
    const q: any = { data: rows, error: null };
    q.select = vi.fn().mockReturnValue(q);
    q.ilike = vi.fn().mockReturnValue(q);
    q.eq = vi.fn().mockReturnValue(q);
    q.order = vi.fn().mockReturnValue(q);
    q.limit = vi.fn().mockReturnValue(q);
    q.maybeSingle = vi.fn().mockImplementation(() => {
        const row = rows[0];
        if (row && (row.name === "Testa DJ Aprovado" || row.id === "art-1")) {
            return Promise.resolve({ data: artistMock, error: null });
        }
        return Promise.resolve({ data: row || null, error: null });
    });
    q.abortSignal = vi.fn().mockReturnValue(q);
    q.then = (resolve: any) => Promise.resolve({ data: rows, error: null }).then(resolve);
    return q;
  };
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "public_artist_profiles") return build([artistMock]);
        return build([atrativoMock]);
      }),
      rpc: vi.fn(() => {
        const merged = [
            { ...atrativoMock, __kind: 'atrativo' },
            { ...artistMock, artist_type: 'DJ', __kind: 'artist' }
        ];
        return build(merged);
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null }),
      },
    },
  };
});

function Harness() {
  const form = useForm({
    defaultValues: {
      atrativoName: "",
      atrativoType: "",
      atrativoStyle: "",
      atrativoDescription: "",
      atrativoContact: "",
    },
  });
  return (
    <FormProvider {...form}>
      <AtrativoStep form={form as any} />
      <output data-testid="dump">
        {JSON.stringify(form.watch())}
      </output>
    </FormProvider>
  );
}

describe("AtrativoStep autocomplete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra sugestões da tabela atrativos e de artist_profiles aprovados ao digitar 2+ caracteres", async () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText(/Busque ou selecione um atrativo/i);
    fireEvent.change(input, { target: { value: "te" } });

    await waitFor(() => {
      expect(screen.getByText("Banda Teste Ilha")).toBeInTheDocument();
      expect(screen.getByText("Testa DJ Aprovado")).toBeInTheDocument();
    });
  });

  it("não busca com menos de 2 caracteres", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    render(<Harness />);
    const input = screen.getByPlaceholderText(/Busque ou selecione um atrativo/i);
    fireEvent.change(input, { target: { value: "t" } });
    await new Promise((r) => setTimeout(r, 20));
    expect((supabase.from as any)).not.toHaveBeenCalled();
    expect((supabase.rpc as any)).not.toHaveBeenCalled();
  });

  it("preenche tipo, estilo, descrição e contato ao selecionar um atrativo", async () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText(/Busque ou selecione um atrativo/i);
    fireEvent.change(input, { target: { value: "banda" } });
    const opt = await screen.findByText("Banda Teste Ilha");
    fireEvent.click(opt);

    await waitFor(() => {
      const dump = JSON.parse(screen.getByTestId("dump").textContent || "{}");
      expect(dump.atrativoName).toBe("Banda Teste Ilha");
      expect(dump.atrativoType).toBe("Banda");
      expect(dump.atrativoStyle).toBe("Rock, Pop Rock");
      expect(dump.atrativoDescription).toBe("Banda de rock da ilha.");
      expect(dump.atrativoContact).toBe("48999990001");
    });
  });

  it("preenche corretamente ao selecionar um artist_profile aprovado", async () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText(/Busque ou selecione um atrativo/i);
    fireEvent.change(input, { target: { value: "testa" } });
    const opt = await screen.findByText("Testa DJ Aprovado");
    fireEvent.click(opt);

    await waitFor(() => {
      const dump = JSON.parse(screen.getByTestId("dump").textContent || "{}");
      expect(dump.atrativoName).toBe("Testa DJ Aprovado");
      expect(dump.atrativoType).toBe("DJ");
      expect(dump.atrativoStyle).toBe("House");
      expect(dump.atrativoDescription).toBe("Artista aprovado.");
      expect(dump.atrativoContact).toBe("48999990009");
    });
  });
});