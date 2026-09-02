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
  ...rest
}: CurrencyInputProps) {
  return (
    <Input
      id={id}
      inputMode="decimal"
      className={`h-11 ${className ?? ""}`}
      placeholder={placeholder}
      value={formatCents(value)}
      onChange={e => onChange(onlyDigits(e.target.value))}
      {...rest}
    />
  );
}
