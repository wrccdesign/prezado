import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  items: FaqItem[];
  title?: string;
  className?: string;
}

/**
 * JSON-LD de FAQPage correspondente aos mesmos itens exibidos.
 * Passe o retorno dentro do array `jsonLd` do componente <SEO> da página —
 * o FaqSection renderiza apenas o HTML visível, sem Helmet próprio.
 */
export function buildFaqJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function FaqSection({ items, title = "Perguntas frequentes", className }: FaqSectionProps) {
  if (!items.length) return null;

  return (
    <section className={className}>
      <h2 className="text-xl font-semibold font-serif text-foreground mb-4">{title}</h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={item.question} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm font-medium">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
