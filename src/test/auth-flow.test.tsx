import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Auth from "@/pages/Auth";

const signIn = vi.fn();
const signUp = vi.fn();
const resetPassword = vi.fn();
const toast = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, signIn, signUp, resetPassword }),
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));

describe("fluxo de autenticação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe a mensagem devolvida pelo login e libera o botão novamente", async () => {
    signIn.mockResolvedValue({ error: new Error("E-mail ou senha incorretos.") });
    render(<MemoryRouter initialEntries={["/auth"]}><Auth /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "usuario@exemplo.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Não foi possível entrar",
      description: "E-mail ou senha incorretos.",
    })));
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });
});