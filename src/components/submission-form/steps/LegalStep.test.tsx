import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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
    const v = validateBrazilianMobile(val, false);
    if (v.valid === false) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.reason });
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

describe("LegalStep - Cenários de Borda e Fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("exibe fallback quando responsável selecionado não tem WhatsApp", async () => {
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
                responsible_name: "João Sem Zap", 
                responsavel_duvidas_whatsapp: null,
                responsavel_tipo: "artista"
            }], 
            error: null 
        }))
      ),
    }));

    render(<TestWrapper />);

    const zapInput = screen.getByPlaceholderText(/WhatsApp que vai receber dúvidas/i);
    const nameInput = screen.getByPlaceholderText(/Como quer aparecer na divulgação/i);
    
    fireEvent.change(nameInput, { target: { value: "João" } });
    const suggestion = await screen.findByText("João Sem Zap", {}, { timeout: 2000 });
    fireEvent.mouseDown(suggestion);

    expect(zapInput).toHaveValue("");
    expect(zapInput).toHaveAttribute("readonly");
  });

  it("permite preenchimento manual no modo 'Outro' com sanitização e variados formatos", async () => {
    render(<TestWrapper />);

    const zapInput = screen.getByPlaceholderText(/WhatsApp que vai receber dúvidas/i);
    const radioOutro = screen.getByLabelText(/Outro/i);

    fireEvent.click(radioOutro);

    // 1. Número com espaços e caracteres não numéricos
    fireEvent.change(zapInput, { target: { value: "21 9 8888 7777" } });
    expect(zapInput).toHaveValue("(21) 98888-7777");

    // 2. Número com +55 (deve ser sanitizado internamente pelo validate)
    fireEvent.change(zapInput, { target: { value: "+55 21 97777 6666" } });
    expect(zapInput).toHaveValue("(21) 97777-6666");

    // 3. Formato parcial
    fireEvent.change(zapInput, { target: { value: "219" } });
    expect(zapInput).toHaveValue("(21) 9");

    // 4. Número extra-longo (acima de 11 dígitos, remove máscara rígida mas valida)
    fireEvent.change(zapInput, { target: { value: "21988887777000" } });
    expect(zapInput).toHaveValue("21988887777000"); 
  });

  it("valida corretamente diferentes comprimentos no modo 'Outro'", () => {
      // Teste direto da função de validação com o novo parâmetro strict=false
      
      // Válido (11 dígitos)
      expect(validateBrazilianMobile("21988887777", false).valid).toBe(true);
      
      // Válido (10 dígitos - fixo)
      expect(validateBrazilianMobile("2133334444", false).valid).toBe(true);
      
      // Inválido (muito curto)
      expect(validateBrazilianMobile("123", false).valid).toBe(false);
      
      // Sanitização de +55
      const res = validateBrazilianMobile("+55 21 98888 7777", false);
      expect(res.valid).toBe(true);
      if (res.valid) {
          expect(res.e164).toBe("5521988887777");
      }
  });
});