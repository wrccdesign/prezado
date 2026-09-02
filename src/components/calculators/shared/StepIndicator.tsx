interface Step {
  n: number;
  label: string;
}

interface StepIndicatorProps {
  steps: readonly Step[];
  current: number;
  ariaLabel?: string;
}

/** Indicador de etapas das calculadoras multi.etapa: número e rótulo, sem pílula. */
export function StepIndicator({ steps, current, ariaLabel = "Etapas" }: StepIndicatorProps) {
  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-note" aria-label={ariaLabel}>
      {steps.map((p, i) => (
        <li key={p.n} className="flex items-center gap-2">
          <span
            aria-current={current === p.n ? "step" : undefined}
            className={
              current === p.n
                ? "font-serif text-base font-medium text-navy"
                : current > p.n
                ? "font-serif text-base font-medium text-navy/60"
                : "font-serif text-base font-medium text-navy/40"
            }
          >
            {p.n}
          </span>
          <span className={current === p.n ? "font-medium text-navy" : "text-navy/60"}>{p.label}</span>
          {i < steps.length - 1 && <span className="h-px w-6 bg-cream-dark" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
