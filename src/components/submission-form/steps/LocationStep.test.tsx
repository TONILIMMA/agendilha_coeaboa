import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocationStep } from "./LocationStep";

const LOCAL = {
  id: "local-1",
  nome: "Quiosque da Praia",
  endereco: "Praia da Bica",
  numero: "10",
  bairro: "Jardim Guanabara",
  cep: "21931-570",
  complemento: null,
  tipo: "quiosque",
  contato: "21999998888",
};

vi.mock("@/components/estabelecimentos/EstabelecimentoAutocomplete", () => ({
  EstabelecimentoAutocomplete: ({ value, onChange, onSelect }: any) => (
    <div>
      <input
        aria-label="Local autocomplete"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" onClick={() => { onChange(LOCAL.nome); onSelect(LOCAL); }}>
        Selecionar local
      </button>
    </div>
  ),
}));

vi.mock("@/components/estabelecimentos/NovoEstabelecimentoDialog", () => ({
  NovoEstabelecimentoDialog: () => null,
}));

function Harness() {
  const [visible, setVisible] = useState(true);
  const form = useForm({
    defaultValues: {
      locationName: "",
      localTipo: "",
      addressNeighborhood: "",
      eventAddress: "",
      locationCep: "",
      locationContact: "",
      locationType: "commercial",
      estabelecimentoId: "",
    },
  });
  return (
    <FormProvider {...form}>
      {visible && <LocationStep form={form as any} />}
      <button type="button" onClick={() => setVisible((current) => !current)}>
        Alternar etapa
      </button>
      <output data-testid="location-values">{JSON.stringify(form.watch())}</output>
    </FormProvider>
  );
}

describe("LocationStep autocomplete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preenche o local e preserva os valores ao avançar e voltar", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar local" }));

    let values = JSON.parse(screen.getByTestId("location-values").textContent || "{}");
    expect(values).toMatchObject({
      locationName: "Quiosque da Praia",
      estabelecimentoId: "local-1",
      eventAddress: "Praia da Bica, 10, Jardim Guanabara",
      addressNeighborhood: "Jardim Guanabara",
      localTipo: "quiosque",
      locationContact: "(21) 99999-8888",
      locationCep: "21931-570",
    });

    fireEvent.click(screen.getByRole("button", { name: "Alternar etapa" }));
    fireEvent.click(screen.getByRole("button", { name: "Alternar etapa" }));

    expect(screen.getByLabelText("Local autocomplete")).toHaveValue("Quiosque da Praia");
    values = JSON.parse(screen.getByTestId("location-values").textContent || "{}");
    expect(values.estabelecimentoId).toBe("local-1");
  });
});