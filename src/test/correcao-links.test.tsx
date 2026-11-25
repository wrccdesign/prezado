import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { exportToPDF, exportToDOCX, type ExportOptions } from "@/lib/exportDocument";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));
vi.mock("@/lib/exportDocument", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/exportDocument")>(),
  exportToPDF: vi.fn(),
  exportToDOCX: vi.fn(),
}));
vi.mock("@/components/calculators/shared/GuestExportGate", () => ({
  useGuestExportGate: () => ({ isAuthenticated: true, requireAccount: vi.fn() }),
}));
vi.mock("@/components/calculators/shared/UsarNaPeticaoButton", () => ({ UsarNaPeticaoButton: () => null }));
vi.mock("@/hooks/useUsage", () => ({ notifyUsageConsumed: vi.fn() }));
vi.mock("@/lib/track", () => ({ track: vi.fn(), ATTR_KEYS: [], withAttribution: (url: string) => url }));

const base = "/calculadoras/correcao-monetaria-juros-lei-14905?valor=10000&data_inicial=2024-01-15&data_final=2025-10-31&pro_rata=1";
function open(url = base) {
  render(<MemoryRouter initialEntries={[url]}><CorrecaoCalc /></MemoryRouter>);
}

describe("correction export interest-date round trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mocked calculation: these tests verify parameters, not financial totals.
    invoke.mockResolvedValue({ data: {
      valor_original: 10000, valor_corrigido: 11000, juros: 100, multa: 0,
      honorarios: 0, total: 11100, memoria: [], meses_faltantes: [],
      fonte: "BACEN", ultima_sincronizacao: null, base_legal: [],
    }, error: null });
  });
  afterEach(cleanup);

  it.each([
    ["2024-07-01", ""],
    ["", "2025-06-30"],
    ["2024-07-01", "2025-06-30"],
  ])("preserves interest start %s and end %s in PDF and Word links", async (start, end) => {
    open();
    await screen.findByRole("button", { name: "Exportar PDF" });
    fireEvent.click(screen.getByRole("button", { name: /Definir período próprio/ }));
    fireEvent.change(screen.getByLabelText("Início dos juros"), { target: { value: start } });
    fireEvent.change(screen.getByLabelText("Fim dos juros"), { target: { value: end } });
    fireEvent.click(screen.getByRole("button", { name: "Calcular Atualização" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Exportar PDF" });
    const originalBody = invoke.mock.calls[1][1].body;
    expect(originalBody.juros_data_inicial).toBe(start || null);
    expect(originalBody.juros_data_final).toBe(end || null);

    for (const [label, exporter] of [["Exportar PDF", exportToPDF], ["Exportar Word", exportToDOCX]] as const) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      const options = vi.mocked(exporter).mock.calls.at(-1)?.[3] as ExportOptions | undefined;
      const link = options?.verificacao?.url;
      if (!link) throw new Error("Missing verification link");
      const url = new URL(link);
      expect(url.searchParams.get("juros_data_inicial")).toBe(start || null);
      expect(url.searchParams.get("juros_data_final")).toBe(end || null);
      cleanup();
      const before = invoke.mock.calls.length;
      open(url.pathname + url.search);
      await waitFor(() => expect(invoke).toHaveBeenCalledTimes(before + 1));
      expect(invoke.mock.calls.at(-1)?.[1].body).toEqual(originalBody);
      await screen.findByRole("button", { name: "Exportar PDF" });
    }
  });

  it("omits stored custom dates when the interest-date option is disabled", async () => {
    open(base + "&juros_data_inicial=2024-07-01&juros_data_final=2025-06-30");
    await screen.findByRole("button", { name: "Exportar PDF" });
    fireEvent.click(screen.getByRole("button", { name: /Definir período próprio/ }));
    fireEvent.click(screen.getByRole("button", { name: "Calcular Atualização" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Exportar PDF" });
    expect(invoke.mock.calls[1][1].body.juros_data_inicial).toBeNull();
    expect(invoke.mock.calls[1][1].body.juros_data_final).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));
    const link = vi.mocked(exportToPDF).mock.calls[0][3]?.verificacao?.url;
    if (!link) throw new Error("Missing verification link");
    const params = new URL(link).searchParams;
    expect(params.has("juros_data_inicial")).toBe(false);
    expect(params.has("juros_data_final")).toBe(false);
  });

  it.each(["/calculadoras", "/calculadoras/custas-tjsp", "/"])(
    "exports from %s open the correction calculator directly",
    async (path) => {
      open(path + base.slice(base.indexOf("?")) + "&juros_data_inicial=2024-07-01");
      await screen.findByRole("button", { name: "Exportar PDF" });
      for (const [label, exporter] of [["Exportar PDF", exportToPDF], ["Exportar Word", exportToDOCX]] as const) {
        fireEvent.click(screen.getByRole("button", { name: label }));
        const link = vi.mocked(exporter).mock.calls.at(-1)?.[3]?.verificacao?.url;
        if (!link) throw new Error("Missing verification link");
        expect(new URL(link).pathname).toBe("/calculadoras/correcao-monetaria-juros-lei-14905");
        expect(new URL(link).searchParams.get("juros_data_inicial")).toBe("2024-07-01");
      }
    },
  );
});