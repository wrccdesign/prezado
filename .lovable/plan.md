# Roadmap Prezado.ai — De ferramenta a referência

Escopo calibrado em **3/5**: 3 quick wins de conversão + 3 features de diferenciação + 3 alavancas de marca. Foco duplo: **Cidadão B2C** (topo de funil massivo via SEO) e **Advogado autônomo** (ticket recorrente Profissional).

## Parecer estratégico (resumo)

O produto hoje é sólido em *features* (diagnóstico, chat, petição, jurisprudência, calculadoras), mas fraco em três eixos que determinam se um SaaS jurídico vira referência:

1. **Aquisição barata e escalável** — sem SEO estruturado, cada usuário custa mídia paga. Concorrentes (Jusbrasil, Direito Direto, Astrea) ganham no orgânico.
2. **Momento "aha" antes do paywall** — o usuário free precisa sentir valor único em <2 minutos. Hoje o diagnóstico entrega isso; o resto do funil não amarra.
3. **Fricção advogado→pagante** — o advogado autônomo paga quando a ferramenta economiza horas *recorrentes* (petição + jurisprudência + prazos + cliente). Faltam ganchos de retenção diária.

## Fase 1 — Quick wins de conversão (2–4 semanas)

Alvo: dobrar taxa de free→pago sem features novas grandes.

### 1.1 Landing pública SEO-first por vertical
Hoje `LandingPage` é genérica. Criar rotas indexáveis:
- `/direitos/trabalhista/demissao-sem-justa-causa`
- `/direitos/consumidor/produto-com-defeito`
- `/direitos/inquilino/devolucao-caucao`
- ~30 páginas geradas a partir de template + conteúdo curado (não IA cega — LGPD/OAB).

Cada página: explicação em linguagem simples + calculadora embutida + CTA "Fazer diagnóstico grátis". Meta tags, JSON-LD `LegalService`, sitemap.xml.

**Por que agora**: pega intenção de busca ("fui demitido o que fazer") que hoje vai 100% para Jusbrasil. Sem custo de mídia.

### 1.2 Paywall inteligente no diagnóstico
Diagnóstico atual libera tudo. Novo comportamento:
- **Free**: mostra "O que está acontecendo" + "Qual é seu direito" (2 cards).
- **Blur + CTA "Ver plano completo"** nos cards de custos, passo-a-passo e petição.
- 1 diagnóstico completo grátis por dia (como teaser), depois blur.

Aumenta conversão porque o usuário já viu qualidade antes do paywall.

### 1.3 Onboarding do advogado com OAB validada + trial
- No signup do advogado: validar OAB via cache local (já existe scraping) e liberar **7 dias de Profissional grátis, sem cartão**.
- E-mail dia 1, 3, 6 com casos de uso ("gere sua 1ª petição", "monitore 1º processo", "salve 1º template").
- Dia 7: paywall com desconto de 20% primeira mensalidade.

## Fase 2 — Features de diferenciação (4–8 semanas)

Escolhidas por **impacto em retenção** × **defensabilidade** (difícil de copiar).

### 2.1 Monitor de processos (advogado)
Feature "matadora" de retenção. Integração com PJe/e-SAJ (scraping já existe parcialmente): advogado cola nº do processo → recebe push/e-mail em cada movimentação. Dashboard com prazos automáticos calculados.

Isso é o que faz Astrea/ADVBox valerem R$ 200+/mês. Prezado entra com preço agressivo.

### 2.2 "Meu Caso" (cidadão)
Cidadão salva um caso → recebe:
- Checklist de documentos a coletar (gerado por IA baseado no diagnóstico).
- Lembretes de prazo (ex.: "faltam 15 dias para prescrever seu direito").
- Modelo de carta de notificação extrajudicial pronto (unlock pago).

Transforma uso pontual em relacionamento contínuo → base para upsell.

### 2.3 Biblioteca de modelos comunitária (advogado)
Advogados Escritório publicam templates de petição (anonimizados). Outros advogados usam com 1 clique. Cria efeito de rede — quanto mais advogados, mais valor.

Moderação: LGPD + OAB (revisão manual antes de publicar).

## Fase 3 — Autoridade de marca (paralelo, contínuo)

### 3.1 "Índice Prezado" — dado próprio publicável
Extrair da base de jurisprudência: "% de sentenças favoráveis ao trabalhador por comarca", "tempo médio de execução por tribunal", etc. Publicar mensalmente. **É o tipo de conteúdo que vira notícia** (Valor, Migalhas, Conjur linkam).

### 3.2 Parcerias OAB seccionais
Oferecer Prezado Escritório grátis para diretoria de OAB regional em troca de menção em newsletter/eventos. Custo marginal zero, autoridade alta.

### 3.3 Newsletter semanal "Direito da Semana"
Um caso viral + uma jurisprudência + uma dica prática. Segmentada por perfil (cidadão vs advogado). Alimentada pelo próprio banco de decisões.

## O que NÃO fazer (agora)

- App mobile nativo — PWA resolve, custo/benefício ruim.
- IA para "prever resultado" — risco OAB/regulatório alto, credibilidade frágil.
- Expandir para outros países — mercado BR ainda pouco explorado.
- Adicionar mais calculadoras — as 4 atuais cobrem 80% da demanda.

## Métricas de sucesso (12 meses)

| Métrica | Baseline hoje | Meta 12m |
|---|---|---|
| Visitas orgânicas/mês | ~baixo | 50k |
| Free → Profissional | (a medir) | 4% |
| Retenção mês 3 (Profissional) | (a medir) | 70% |
| Advogados ativos semanais | (a medir) | 500 |
| Menções em mídia jurídica | 0 | 6 |

## Ordem sugerida de execução

1. **Semana 1–2**: Paywall inteligente (1.2) + validação OAB no trial (1.3)
2. **Semana 3–4**: Landing SEO vertical trabalhista (1.1) — 10 páginas
3. **Semana 5–8**: "Meu Caso" (2.2)
4. **Semana 9–12**: Monitor de processos v1 (2.1) — 1 tribunal só (TJSP)
5. **Paralelo desde semana 1**: Newsletter (3.3) + índice mensal (3.1)

## Próximo passo

Se aprovar a direção, sugiro começar pela **Fase 1.2 (Paywall inteligente)** — é a mudança de menor esforço e maior impacto imediato em receita. Também precisamos escolher a **vertical inicial de SEO** (trabalhista tem maior volume de busca; consumidor tem melhor conversão).

Quer que eu detalhe o plano técnico de uma dessas frentes específicas?
