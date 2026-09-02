import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";


function limpar(value: string) {
  return value.replace(/\D/g, "");
}

function formatarCpf(cpf: string) {
  const v = limpar(cpf);
  if (v.length !== 11) return v;
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarCnpj(cnpj: string) {
  const v = limpar(cnpj);
  if (v.length !== 14) return v;
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function calcularDigito(base: string, pesos: number[]) {
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += parseInt(base[i], 10) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function validarCpf(cpf: string) {
  const v = limpar(cpf);
  if (v.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(v)) return false;
  const base = v.slice(0, 9);
  const d1 = calcularDigito(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcularDigito(base + d1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return v === base + d1 + d2;
}

function validarCnpj(cnpj: string) {
  const v = limpar(cnpj);
  if (v.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(v)) return false;
  const base = v.slice(0, 12);
  const d1 = calcularDigito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcularDigito(base + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return v === base + d1 + d2;
}

export function CpfCnpjCalc() {
  const [tipo, setTipo] = useState<"cpf" | "cnpj">("cpf");
  const [valor, setValor] = useState("");
  const [valido, setValido] = useState<boolean | null>(null);

  const handleChange = (value: string) => {
    const apenasNumeros = limpar(value);
    const max = tipo === "cpf" ? 11 : 14;
    const cortado = apenasNumeros.slice(0, max);
    setValor(cortado);
    if (cortado.length === max) {
      setValido(tipo === "cpf" ? validarCpf(cortado) : validarCnpj(cortado));
    } else {
      setValido(null);
    }
  };

  const handleTipoChange = (novoTipo: "cpf" | "cnpj") => {
    setTipo(novoTipo);
    setValor("");
    setValido(null);
  };

  const copiar = () => {
    const formatado = tipo === "cpf" ? formatarCpf(valor) : formatarCnpj(valor);
    navigator.clipboard.writeText(formatado);
    toast({ title: "Copiado para a área de transferência" });
  };

  const exemplo = tipo === "cpf" ? "123.456.789-09" : "12.345.678/0001-95";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={v => handleTipoChange(v as "cpf" | "cnpj")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Número</Label>
          <Input className="h-11"
            inputMode="numeric"
            placeholder={exemplo}
            value={tipo === "cpf" ? formatarCpf(valor) : formatarCnpj(valor)}
            onChange={e => handleChange(e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={() => handleChange(valor)}
        disabled={valor.length !== (tipo === "cpf" ? 11 : 14)}
        className="h-11 w-full sm:w-auto"
      >
        Validar
      </Button>

      {valido !== null && (
        <div className={"rounded-lg border border-cream-dark bg-white " + valido ? "border-green-500/30 bg-green-50 " : "border-destructive/30 bg-destructive/5"}>
          <div className="p-5 flex items-start gap-4">
            {valido ? (
              <CheckCircle className="h-6 w-6 text-green-600  shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive shrink-0" />
            )}
            <div className="space-y-2 flex-1">
              <p className={cn("font-medium", valido ? "text-green-700 " : "text-destructive")}>
                {valido ? "Número válido" : "Número inválido"}
              </p>
              <p className="text-sm text-navy/70">
                {tipo.toUpperCase()}: {tipo === "cpf" ? formatarCpf(valor) : formatarCnpj(valor)}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={copiar}>
                  <Copy className="mr-1.5 h-4 w-4" /> Copiar formatado
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setValor(""); setValido(null); }}>
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-navy/60">
        A validação segue o algoritmo oficial dos dígitos verificadores. Não consulta a Receita Federal,
        portanto não confirma se o documento está ativo, cancelado ou se pertence a uma pessoa real.
      </p>
    </div>
  );
}

