import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
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
    // Mocking search for "João"
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

    // Wait for suggestions and click
    const suggestion = await screen.findByText("João do Pandeiro");
    fireEvent.mouseDown(suggestion);

    expect(nameInput).toHaveValue("João do Pandeiro");
    expect(zapInput).toHaveValue("(21) 98888-7777");
    expect(zapInput).toHaveAttribute("readonly");
  });

  it("libera o campo e limpa ao selecionar 'Outro'", async () => {
    render(<TestWrapper />);

    const zapInput = screen.getByPlaceholderText(/WhatsApp que vai receber dúvidas/i);
    const radioOutro = screen.getByLabelText(/Outro/i);

    // Initial state (pre-selected 'artista' in TestWrapper defaultValues, but zap is empty)
    expect(zapInput).toHaveAttribute("readonly");

    // Click Outro
    fireEvent.click(radioOutro);

    expect(zapInput).not.toHaveAttribute("readonly");
    expect(zapInput).toHaveValue("");
    
    // Type something
    fireEvent.change(zapInput, { target: { value: "21912345678" } });
    expect(zapInput).toHaveValue("(21) 91234-5678");
  });

  it("substitui valor manual ao voltar para um tipo cadastrado (Maria)", async () => {
    // Mock Maria
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

    // 1. Go to Outro and type
    fireEvent.click(radioOutro);
    fireEvent.change(zapInput, { target: { value: "21900000000" } });
    expect(zapInput).toHaveValue("(21) 90000-0000");

    // 2. Select Maria from autocomplete
    fireEvent.change(nameInput, { target: { value: "Maria" } });
    const suggestion = await screen.findByText("Maria da Vila");
    fireEvent.mouseDown(suggestion);
    fireEvent.click(suggestion); // Try click as well just in case


    // Maria is an 'artista', so it should auto-select Artista radio and set zap
    expect(zapInput).toHaveValue("(21) 97777-6666");
    expect(zapInput).toHaveAttribute("readonly");
    
    // 3. Switch back to Outro (should clear)
    fireEvent.click(radioOutro);
    expect(zapInput).toHaveValue("");
    expect(zapInput).not.toHaveAttribute("readonly");

    // 4. Switch back to Artista (should restore Maria's if possible, or stay empty/blocked if we don't track history)
    // Actually, in LegalStep.tsx, switching back to a role only auto-fills if responsavelNome === nickName (user's own profile)
    // or via the Autocomplete onSelect. 
    // Let's test the "user's own profile" case:
    fireEvent.change(nameInput, { target: { value: "Dono do App" } });
    fireEvent.click(radioArtista);
    expect(zapInput).toHaveValue("(21) 99999-9999");
    expect(zapInput).toHaveAttribute("readonly");
  });

  it("aplica máscara e validação corretamente no modo 'Outro'", async () => {
    render(<TestWrapper />);
    
    const radioOutro = screen.getByLabelText(/Outro/i);
    fireEvent.click(radioOutro);
    
    const zapInput = screen.getByPlaceholderText(/WhatsApp que vai receber dúvidas/i);
    
    // Test mask
    fireEvent.change(zapInput, { target: { value: "21988887777" } });
    expect(zapInput).toHaveValue("(21) 98888-7777");
    
    // Test max length (11 digits)
    fireEvent.change(zapInput, { target: { value: "21988887777123" } });
    expect(zapInput).toHaveValue("(21) 98888-7777"); 
  });
});
