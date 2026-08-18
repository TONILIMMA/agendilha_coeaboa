import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDivulgadorStatus } from "./useDivulgadorStatus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    })),
  },
}));

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "test-user-id" },
  })),
}));

// Mock error-handler
vi.mock("@/lib/error-handler", () => ({
  handleError: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

describe("useDivulgadorStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca e renderiza o status de divulgador corretamente para um admin", async () => {
    // Mocking the 4 calls in Promise.all
    (supabase.from as any).mockImplementation((table: string) => {
      const queryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === "profiles") {
            return Promise.resolve({ data: { user_type: "user" }, error: null });
          }
          if (table === "user_roles") {
            // Simulated return for many roles (maybeSingle is used in some places, but useDivulgadorStatus uses .eq)
            // Wait, useDivulgadorStatus uses .eq("user_id", userId!) for user_roles
            // And then it DOES NOT use maybeSingle() on user_roles.
            // Let's re-read useDivulgadorStatus.ts
            return Promise.resolve({ data: [{ role: "admin" }], error: null });
          }
          if (table === "collaborators") {
            return Promise.resolve({ data: null, error: null });
          }
          if (table === "divulgador_requests") {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };
      return queryChain;
    });

    const { result } = renderHook(() => useDivulgadorStatus(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isDivulgador).toBe(true);
    expect(result.current.isCollaborator).toBe(false);
  });

  it("busca e renderiza o status para um divulgador comum", async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      const queryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === "profiles") {
            return Promise.resolve({ data: { user_type: "divulgador" }, error: null });
          }
          if (table === "user_roles") {
            return Promise.resolve({ data: [], error: null });
          }
          if (table === "collaborators") {
            return Promise.resolve({ data: null, error: null });
          }
          if (table === "divulgador_requests") {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };
      return queryChain;
    });

    const { result } = renderHook(() => useDivulgadorStatus(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isDivulgador).toBe(true);
  });

  it("invalida os dados corretamente ao chamar refresh", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const testWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    const { result } = renderHook(() => useDivulgadorStatus(), { wrapper: testWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.refresh();

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["divulgador", "status", "test-user-id"]),
      })
    );
  });
});
