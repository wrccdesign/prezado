import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildFaqJsonLd, type FaqItem } from "@/seo/faqData";

// Reexportados para não quebrar imports existentes; a fonte de verdade
// (tipo, helper de JSON-LD e conteúdo) vive em src/seo/faqData.ts.
export { buildFaqJsonLd };
export type { FaqItem };

interface FaqSectionProps {
  items: FaqItem[];
  title?: string;
  className?: string;
}

export function FaqSection({ items, title = "Perguntas frequentes", className }: FaqSectionProps) {
  if (!items.length) return null;

  return (
    <section className={className}>
      <h2 className="text-h2 text-navy mb-4">{title}</h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={item.question} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base text-navy">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-body-serif text-navy/80">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
