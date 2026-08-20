interface Step {
  n: number;
  label: string;
}

interface StepIndicatorProps {
  steps: readonly Step[];
  current: number;
  ariaLabel?: string;
}

/** Indicador de etapas discreto (1 · 2 · 3) usado nas calculadoras multi-etapa. */
export function StepIndicator({ steps, current, ariaLabel = "Etapas" }: StepIndicatorProps) {
  return (
    <ol className="flex items-center gap-2 text-xs" aria-label={ariaLabel}>
      {steps.map((p, i) => (
        <li key={p.n} className="flex items-center gap-2">
          <span
            aria-current={current === p.n ? "step" : undefined}
            className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium ${
              current === p.n
                ? "border-primary bg-primary text-primary-foreground"
                : current > p.n
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {p.n}
          </span>
          <span className={current === p.n ? "font-medium text-foreground" : "text-muted-foreground"}>
            {p.label}
          </span>
          {i < steps.length - 1 && <span className="h-px w-4 bg-border sm:w-8" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
