import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCents, onlyDigits } from "@/lib/currency";

interface CurrencyInputProps {
  id?: string;
  /** Dígitos (centavos), estado controlado pelo componente pai. */
  value: string;
  onChange: (cents: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  /** Avisado quando o usuário digita sinal de menos; volta a false ao limpar o campo. */
  onNegativeChange?: (negativo: boolean) => void;
}

/**
 * Campo de moeda brasileira: exibe com separadores, guarda apenas dígitos.
 * Alvo de toque de 44px (h-11) e teclado numérico no mobile.
 */
export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0,00",
  className,
  onNegativeChange,
  ...rest
}: CurrencyInputProps) {
  const [negativo, setNegativo] = useState(false);
  return (
    <>
    <Input
      id={id}
      aria-invalid={negativo || undefined}
      inputMode="decimal"
      className={`h-11 ${className ?? ""}`}
      placeholder={placeholder}
      value={formatCents(value)}
      onChange={e => {
        const digits = onlyDigits(e.target.value);
        let neg = negativo;
        if (e.target.value.includes("-")) neg = true;
        if (!digits && !e.target.value.includes("-")) neg = false;
        if (neg !== negativo) { setNegativo(neg); onNegativeChange?.(neg); }
        onChange(digits);
      }}
      {...rest}
    />
    {negativo && <p role="alert" className="text-note text-destructive">Valor negativo não é aceito. Apague o campo e informe um valor positivo.</p>}
    </>
  );
}
