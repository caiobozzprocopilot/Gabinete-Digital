# Sistema Vereador Ortigueira

Frontend do sistema de atendimento do gabinete com formulario publico, painel administrativo e geracao de PDF.

## Stack

- React + Vite
- Firebase (Auth + Firestore)
- jsPDF (PDF individual e em lote)

## Requisitos

- Node.js 20+
- Projeto Firebase configurado (Auth, Firestore, Storage e regras)

## Configuracao de ambiente

1. Copie o arquivo [.env.example](.env.example) para `.env.local`.
2. Preencha todas as variaveis `VITE_FIREBASE_*`.
3. Defina `VITE_RECAPTCHA_SITE_KEY` para ativar a protecao publica.
4. Opcional: defina `VITE_TEST_MODE=true` para liberar navegacao de teste com dados simulados.

## Scripts

- `npm run dev`: sobe o ambiente local
- `npm run lint`: valida regras de lint
- `npm run build`: gera build de producao

## Rotas implementadas

- `/`: formulario publico de demandas
- `/atendimento/:slug`: link personalizado para divulgacao
- `/painel/login`: autenticacao do vereador/assessoria
- `/painel`: painel protegido com filtros, status e PDF

## Escopo ja iniciado

- Formulario publico com campos obrigatorios e anexos (ate 5 fotos, 5 MB cada)
- Aviso de consentimento e suporte ao reCAPTCHA
- Persistencia no Firestore com status inicial e historico
- Painel com listagem, filtros, paginação, atualizacao de status e exportacao PDF

## Proximos incrementos recomendados

- Regras de seguranca do Firestore/Storage por perfil
- Fluxo de onboarding de usuarios admin/operator
- Otimizacao de bundle com code splitting para jsPDF
