import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { DuvidasWhatsappField } from "./DuvidasWhatsappField";
import { validateBrazilianMobile } from "@/lib/whatsapp";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mesmo schema usado no SubmissionForm para o campo.
const schema = z.object({
  duvidasWhatsapp: z
    .string()
    .trim()
    .min(1, "Informe o WhatsApp que vai receber as dúvidas")
    .superRefine((val, ctx) => {
      const v = validateBrazilianMobile(val);
      if (v.valid === false) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.reason });
      }
    })
    .default(""),
});

function Harness({ onNext }: { onNext?: (ok: boolean) => void }) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { duvidasWhatsapp: "" },
    mode: "onChange",
  });
  return (
    <Form {...form}>
      <DuvidasWhatsappField form={form} />
      <button
        type="button"
        onClick={async () => {
          const ok = await form.trigger(["duvidasWhatsapp"]);
          onNext?.(ok);
        }}
      >
        Continuar
      </button>
    </Form>
  );
}

describe("DuvidasWhatsappField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aplica máscara automática enquanto digita", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText(/Número com DDD/i) as HTMLInputElement;
    await user.type(input, "21998554322");
    expect(input.value).toBe("(21) 99855-4322");
  });

  it("sanitiza colagem com +55, espaços e traços", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText(/Número com DDD/i) as HTMLInputElement;
    await user.click(input);
    await user.paste("+55 (21) 99855-4322");
    expect(input.value).toBe("(21) 99855-4322");
  });

  it("mostra a pré-visualização do link wa.me quando o número é válido", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText(/Número com DDD/i), "21998554322");
    expect(await screen.findByText("https://wa.me/5521998554322")).toBeInTheDocument();
  });

  it("não mostra link nem botão de copiar com número incompleto", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText(/Número com DDD/i), "2199");
    expect(screen.queryByRole("button", { name: /Copiar link/i })).not.toBeInTheDocument();
  });

  it("copia o link gerado para a área de transferência", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText(/Número com DDD/i), "21998554322");
    await user.click(screen.getByRole("button", { name: /Copiar link/i }));
    expect(writeText).toHaveBeenCalledWith("https://wa.me/5521998554322");
    expect(await screen.findByText("Copiado")).toBeInTheDocument();
  });

  it("bloqueia o avanço para a Etapa 2 com o campo vazio", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(<Harness onNext={onNext} />);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onNext).toHaveBeenCalledWith(false));
    expect(await screen.findByText(/Informe o WhatsApp/i)).toBeInTheDocument();
  });

  it("bloqueia o avanço com DDD inválido", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(<Harness onNext={onNext} />);
    await user.type(screen.getByLabelText(/Número com DDD/i), "10998554322");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onNext).toHaveBeenCalledWith(false));
    expect(await screen.findByText(/DDD não é válido/i)).toBeInTheDocument();
  });

  it("bloqueia o avanço com celular que não começa com 9", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(<Harness onNext={onNext} />);
    await user.type(screen.getByLabelText(/Número com DDD/i), "21898554322");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onNext).toHaveBeenCalledWith(false));
  });

  it("libera o avanço com celular válido", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(<Harness onNext={onNext} />);
    await user.type(screen.getByLabelText(/Número com DDD/i), "21998554322");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onNext).toHaveBeenCalledWith(true));
  });

  it("libera o avanço com telefone fixo de 10 dígitos", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(<Harness onNext={onNext} />);
    await user.type(screen.getByLabelText(/Número com DDD/i), "2133334444");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onNext).toHaveBeenCalledWith(true));
  });
});
