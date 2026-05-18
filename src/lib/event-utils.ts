import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export const getEventFallbackImage = (category: string | null) => {
  const fallbacks: Record<string, string> = {
    "musica": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800",
    "gastronomia": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    "teatro": "https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=800",
    "esporte": "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
    "outros": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
  };

  if (!category) return fallbacks.outros;
  
  const normalized = normalizeText(category);
  
  if (normalized.includes("musica") || normalized.includes("show")) return fallbacks.musica;
  if (normalized.includes("gastronomia") || normalized.includes("comida") || normalized.includes("restaurante")) return fallbacks.gastronomia;
  if (normalized.includes("teatro") || normalized.includes("arte") || normalized.includes("cultura") || normalized.includes("cinema")) return fallbacks.teatro;
  if (normalized.includes("esporte")) return fallbacks.esporte;
  
  return fallbacks.outros;
};

export function getFallbackImage(category: string) {
  return getEventFallbackImage(category);
}
