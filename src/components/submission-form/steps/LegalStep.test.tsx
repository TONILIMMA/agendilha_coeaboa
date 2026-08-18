import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { LegalStep } from "./LegalStep";
import { useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { validateBrazilianMobile } from "@/lib/whatsapp";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((onFulfilled) => 
        Promise.resolve(onFulfilled({ data: [], error: null }))
      ),
    })),
  },
}));

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "test-user-id" },
  })),
}));

const formSchema = z.object({
  nickName: z.string().optional(),
  basicPhone: z.string().optional(),
  responsavelNome: z.string().min(1, "Obrigatório"),
  tipoResponsavel: z.enum(["artista", "estabelecimento", "produtor", "outro"]).optional(),
  duvidasWhatsapp: z.string().superRefine((val, ctx) => {
    if (!val) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Obrigatório" });
        return;
    }
    const v = validateBrazilianMobile(val);
    if (!v.valid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WhatsApp inválido. Use (DD) 9XXXX-XXXX" });
    }
  }),
  eventTitle: z.string().optional(),
});

function TestWrapper() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickName: "Dono do App",
      basicPhone: "21999999999",
      responsavelNome: "",
      tipoResponsavel: "artista",
      duvidasWhatsapp: "",
      eventTitle: "Festa do Teste",
    },
  });

  return (
    <MemoryRouter>
      <TooltipProvider>
        <Form {...form}>
          <LegalStep form={form} />
        </Form>
      </TooltipProvider>
    </MemoryRouter>
  );
}

describe("LegalStep - WhatsApp para dúvidas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("bloqueia o campo quando não for 'outro' e preenche ao selecionar sugestão", async () => {
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((onFulfilled) => 
        Promise.resolve(onFulfilled({ 
            data: [{ 
                responsible_name: "João do Pandeiro", 
                responsavel_duvidas_whatsapp: "21988887777",
                responsavel_tipo: "artista"
            }], 
            error: null 
        }))
      ),
    }));

    render(<TestWrapper />);

    const zapInput = screen.getByPlaceholderText(/WhatsApp que vai receber dúvidas/i);
    expect(zapInput).toHaveAttribute("readonly");

    const nameInput = screen.getByPlaceholderText(/Como quer aparecer na divulgação/i);
    fireEvent.change(nameInput, { target: { value: "João" } });

    const suggestion = await screen.findByText("João do Pandeiro", {}, { timeout: 2000 });
    fireEvent.mouseDown(suggestion);

    expect(nameInput).toHaveValue("João do Pandeiro");
    expect(zapInput).toHaveValue("(21) 98888-7777");
    expect(zapInput).toHaveAttribute("readonly");
  });

  it("libera o campo e limpa ao selecionar 'Outro'", async () => {
    render(<TestWrapper />);

    const zapInput = screen.getByPlaceholderText(/WhatsApp que vai receber dúvidas/i);
    const radioOutro = screen.getByLabelText(/Outro/i);

    fireEvent.click(radioOutro);

    expect(zapInput).not.toHaveAttribute("readonly");
    expect(zapInput).toHaveValue("");
    
    fireEvent.change(zapInput, { target: { value: "21912345678" } });
    expect(zapInput).toHaveValue("(21) 91234-5678");
  });

  it("substitui valor manual ao alternar seleções (Maria e Perfil Base)", async () => {
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((onFulfilled) => 
        Promise.resolve(onFulfilled({ 
            data: [{ 
                responsible_name: "Maria da Vila", 
                responsavel_duvidas_whatsapp: "21977776666",
                responsavel_tipo: "artista"
            }], 
            error: null 
        }))
      ),
    }));

    render(<TestWrapper />);

    const zapInput = screen.getByPlaceholderText(/WhatsApp que vai receber dúvidas/i);
    const radioOutro = screen.getByLabelText(/Outro/i);
    const radioArtista = screen.getByLabelText(/Artista/i);
    const nameInput = screen.getByPlaceholderText(/Como quer aparecer na divulgação/i);

    // Teste 1: Limpeza ao ir para Outro
    fireEvent.click(radioOutro);
    fireEvent.change(zapInput, { target: { value: "21900000000" } });
    expect(zapInput).toHaveValue("(21) 90000-0000");

    fireEvent.click(radioArtista);
    // Deve bloquear, mas como não é o perfil do usuário e não selecionou no autocomplete, fica o anterior ou limpa.
    // Pela regra de LegalStep.tsx, apenas bloqueia.
    expect(zapInput).toHaveAttribute("readonly");

    // Teste 2: Restauração do perfil base (Dono do App)
    fireEvent.change(nameInput, { target: { value: "Dono do App" } });
    fireEvent.click(radioOutro);
    fireEvent.change(zapInput, { target: { value: "21988888888" } });
    fireEvent.click(radioArtista);
    
    // responsavelNome ("Dono do App") matches nickName, so it restores basicPhone
    expect(zapInput).toHaveValue("(21) 99999-9999");
    expect(zapInput).toHaveAttribute("readonly");

    // Teste 3: Limpeza ao voltar para Outro
    fireEvent.click(radioOutro);
    expect(zapInput).toHaveValue("");
    expect(zapInput).not.toHaveAttribute("readonly");
  });

  it("aplica máscara e validação corretamente no modo 'Outro'", async () => {
    render(<TestWrapper />);
    
    const radioOutro = screen.getByLabelText(/Outro/i);
    fireEvent.click(radioOutro);
    
    const zapInput = screen.getByPlaceholderText(/WhatsApp que vai receber dúvidas/i);
    
    fireEvent.change(zapInput, { target: { value: "21988887777" } });
    expect(zapInput).toHaveValue("(21) 98888-7777");
    
    fireEvent.change(zapInput, { target: { value: "21988887777123" } });
    expect(zapInput).toHaveValue("(21) 98888-7777"); 
  });
});
