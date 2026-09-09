import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FrameworkAutocomplete } from "./FrameworkAutocomplete";

const OPTIONS = [
  { value: "musica", label: "Música" },
  { value: "gastronomia", label: "Gastronomia" },
];

function Harness() {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(true);
  return (
    <>
      {visible && (
        <FrameworkAutocomplete
          value={value}
          onValueChange={setValue}
          options={OPTIONS}
          placeholder="Selecione a categoria"
        />
      )}
      <button type="button" onClick={() => setVisible((current) => !current)}>
        Alternar etapa
      </button>
      <output data-testid="category-value">{value}</output>
    </>
  );
}

describe("FrameworkAutocomplete", () => {
  it("preserva a categoria selecionada ao avançar e voltar", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("combobox", { name: /selecione a categoria/i }));
    fireEvent.click(screen.getByText("Música"));
    expect(screen.getByTestId("category-value")).toHaveTextContent("musica");

    fireEvent.click(screen.getByRole("button", { name: "Alternar etapa" }));
    fireEvent.click(screen.getByRole("button", { name: "Alternar etapa" }));
    expect(screen.getByRole("combobox", { name: /música/i })).toBeInTheDocument();
  });
});