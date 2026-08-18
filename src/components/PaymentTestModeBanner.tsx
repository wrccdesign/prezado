const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        O checkout de produção ainda não está configurado. Conclua a ativação dos pagamentos para receber pagamentos reais.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-accent/40 bg-accent/10 px-4 py-2 text-center text-sm text-accent-foreground">
        Ambiente de teste: os pagamentos feitos aqui usam cartões de teste e não geram cobrança real.
      </div>
    );
  }
  return null;
}
