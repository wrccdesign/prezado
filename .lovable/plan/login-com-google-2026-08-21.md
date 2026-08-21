# Login com Google

Adicionar "Entrar com Google" na tela de acesso, usando o login social gerenciado da plataforma (sem você precisar criar credenciais no Google Cloud).

## O que muda para o usuário

- Na página `/auth`, acima do formulário de e-mail/senha: botão "Continuar com Google" com o ícone oficial e um separador "ou".
- Quem entra com Google cai direto no destino que tentou acessar (ex.: exportar cálculo, `/peticao`), sem passar por confirmação de e-mail.
- Quem já tem conta com o mesmo e-mail continua na mesma conta (o backend faz a vinculação por e-mail).
- E-mail/senha continua funcionando normalmente, junto com "Esqueci minha senha".

## Perfil de advogado no cadastro por Google

O formulário atual coleta OAB, estado, especialidades e escritório no momento do cadastro. Isso não existe no fluxo Google. Tratamento:

- Após o primeiro login via Google, se o perfil não tiver `profile_type` definido, mostrar um passo curto pós-login perguntando "Você é advogado?" com os mesmos campos (OAB, UF, especialidades, escritório), salvando em `profiles`.
- O usuário pode pular e continuar como cidadão; os campos ficam editáveis depois em Minha Conta / Painel do Advogado.

## Implementação técnica

1. Habilitar o provedor Google gerenciado (ferramenta de social login da plataforma), que instala `@lovable.dev/cloud-auth-js` e gera `src/integrations/lovable/`. Esses arquivos não são editados à mão.
2. `src/contexts/AuthContext.tsx`: novo método `signInWithGoogle()` chamando `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`, tratando `error` e `redirected` conforme o padrão.
3. Guardar o destino pretendido (`redirectTo`) em `sessionStorage` antes de iniciar o OAuth, já que o retorno é para a origem e não para rota protegida. Após a sessão hidratar (`onAuthStateChange`), navegar para o caminho salvo — apenas caminhos internos (same-origin) são aceitos.
4. `src/pages/Auth.tsx`: botão Google + separador; estado de carregamento e toast de erro em português.
5. `src/components/calculators/shared/GuestExportGate.tsx` continua enviando `redirectTo`; nada muda ali.
6. Onboarding pós-Google: componente de completar perfil exibido na primeira sessão sem `profile_type`, reaproveitando os campos já existentes em `Auth.tsx`.

Nada de RLS, cotas, planos ou pagamentos é alterado.
