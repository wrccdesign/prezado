import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  path: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, description, path, updatedAt, children }: LegalPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <SEO title={`${title} — Prezados.AI`} description={description} path={path} />
      <main className="flex-1 container max-w-3xl py-10 px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground mt-2">Última atualização: {updatedAt}</p>
        </div>
        <article className="prose prose-sm sm:prose-base max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-a:text-primary">
          {children}
        </article>
      </main>
      <AppFooter />
    </div>
  );
}
