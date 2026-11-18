export type GuiaLink = { label: string; to: string };
export type GuiaData = {
  path: string;
  title: string;
  description: string;
  h1: string;
  resposta: string;
  sections: { heading: string; markdown: string }[];
  faq: { question: string; answer: string }[];
  cta: { links: GuiaLink[]; plano: string; related: GuiaLink[]; aviso: string };
};
