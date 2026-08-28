import { describe, it, expect } from "vitest";
import {
  missingPublishFields,
  assertPublishable,
  shouldOfferGenericFlyer,
  canGenerateEventCard,
} from "./publishValidation";

const full = {
  event_title: "Show na Praça",
  date: "2026-08-01",
  start_time: "20:00",
  location: "Praça Central",
  image_url: "https://cdn/exemplo.jpg",
};

describe("publishValidation", () => {
  describe("missingPublishFields", () => {
    it("retorna vazio quando todos os campos mínimos estão OK", () => {
      expect(missingPublishFields(full)).toEqual([]);
    });

    it("lista data, horário e local quando faltam (título é opcional)", () => {
      expect(missingPublishFields({})).toEqual(["data", "horário", "local"]);
    });

    it("trata strings vazias/espaços como faltando", () => {
      expect(missingPublishFields({ ...full, event_title: "   ", date: "" })).toEqual([
        "data",
      ]);
    });

    it("retorna placeholder quando o objeto é nulo (não crasha em fluxos de aprovação)", () => {
      expect(missingPublishFields(null)).toEqual(["dados do evento"]);
    });
  });

  describe("assertPublishable (usado em publicar/agendar/aprovar)", () => {
    it("bloqueia publicação quando falta horário", () => {
      const r = assertPublishable({ ...full, start_time: null });
      expect(r.ok).toBe(false);
      expect(r.missing).toContain("horário");
      expect(r.message).toMatch(/horário/);
    });

    it("libera quando tudo está preenchido", () => {
      expect(assertPublishable(full).ok).toBe(true);
    });
  });

  describe("shouldOfferGenericFlyer (Fase 6 preservada)", () => {
    it("NÃO oferece flyer genérico quando o promotor enviou arte", () => {
      expect(shouldOfferGenericFlyer({ image_url: "https://cdn/arte.jpg" })).toBe(false);
    });

    it("oferece flyer genérico apenas quando image_url está vazio", () => {
      expect(shouldOfferGenericFlyer({ image_url: "" })).toBe(true);
      expect(shouldOfferGenericFlyer({ image_url: null })).toBe(true);
      expect(shouldOfferGenericFlyer({})).toBe(true);
    });

    it("trata espaços em branco como sem arte", () => {
      expect(shouldOfferGenericFlyer({ image_url: "   " })).toBe(true);
    });
  });

  describe("canGenerateEventCard (guarda geração de cards/copies)", () => {
    it("permite gerar cards só com os 4 campos completos", () => {
      expect(canGenerateEventCard(full)).toBe(true);
    });

    it("bloqueia geração de cards durante agendamento se faltar local", () => {
      expect(canGenerateEventCard({ ...full, location: null })).toBe(false);
    });

    it("bloqueia geração de cards durante agendamento se faltar data", () => {
      expect(canGenerateEventCard({ ...full, date: null })).toBe(false);
    });
  });
});