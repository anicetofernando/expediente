# Relatório de desempenho e resposta ao toque

Data da validação: 14 de Agosto de 2026 (Africa/Maputo)

## Resultado

O sistema foi optimizado, compilado e está a funcionar em modo de produção local em:

`http://localhost:3017`

A porta 3000 já estava ocupada por outro serviço da máquina e, por segurança, esse processo não foi encerrado.

## Causas encontradas

1. O sistema estava aberto com `next dev`. Esse modo recompila código durante a utilização e não representa o desempenho de produção.
2. A estação chegou a 100% de CPU e apenas cerca de 348 MB de memória livre, com vários processos Node, Edge, VS Code e builds de outros projectos em execução.
3. O layout global carregava e consultava todos os catálogos administrativos, mesmo em páginas que não os utilizavam.
4. Cada linha de expediente continha três links com pré-carregamento automático para o mesmo detalhe. Em listas maiores isso podia disparar dezenas de renderizações e consultas em segundo plano.
5. Layout e página podiam repetir a mesma consulta de sessão no mesmo pedido.
6. O build dependia da fonte Inter alojada no Google. Falhas TLS causavam tentativas repetidas e esperas longas.
7. Não existia indicação visual instantânea entre o toque e a conclusão de uma navegação.
8. Faltavam índices compostos para as caixas, documentos, comentários, auditoria e delegações à medida que o volume de dados crescesse.

## Correcções aplicadas

- O servidor de uso normal passou para o build de produção; `npm run dev` usa Turbopack apenas para desenvolvimento.
- Catálogos foram retirados do layout global e limitados às páginas que realmente os usam, com cache no navegador durante a navegação.
- A sessão passou a ser deduplicada por pedido e o estado do menu lateral foi separado da sessão, evitando renderizar novamente a página inteira ao recolher o menu.
- O pré-carregamento dos detalhes passou a ocorrer somente quando há intenção real: aproximação do ponteiro, foco ou toque.
- Foi adicionado feedback de navegação imediato no topo e `touch-action: manipulation` nos controlos interactivos.
- Alvos de toque recebem uma área mínima de 40 px em dispositivos de toque.
- A fonte remota foi removida. O sistema usa `Segoe UI`, Arial ou a fonte nativa do dispositivo, sem depender da Internet.
- Foi adicionada a migração `003_performance.sql` com índices alinhados às consultas reais.
- Foram adicionados testes reutilizáveis de PostgreSQL e HTTP: `npm run test:perf:db` e `npm run test:perf:http`.

## Medições em produção

Medições feitas contra o servidor local em `127.0.0.1:3017`, depois do build:

| Operação | Tempo medido |
|---|---:|
| Arranque do servidor de produção | 7,7 s |
| Login com `scrypt` | 1.849 ms |
| Utilizadores, aquecido | 1.289 ms |
| Configurações, aquecido | 259 ms |
| Perfil, aquecido | 93 ms |
| Notificações, aquecido | 458 ms |
| Consulta de utilizadores no PostgreSQL | 10,3 ms |
| Consulta de unidades no PostgreSQL | 4,3 ms |
| Consulta de perfis no PostgreSQL | 163,1 ms |

O login é deliberadamente mais pesado porque a palavra-passe usa `scrypt`. Esse custo ocorre no início da sessão, não em cada clique.

O pacote final contém 65 rotas e 87,5 kB de JavaScript partilhado por todas as páginas. Funcionalidades pesadas, como gráficos e administração, continuam separadas nos seus próprios pacotes.

## Validação funcional

- TypeScript: sem erros.
- ESLint: sem avisos ou erros.
- Build de produção: concluído, 65 rotas.
- PostgreSQL: 17 utilizadores, 4 perfis, 12 unidades e o expediente real existente preservados.
- Teste E2E: aprovado, incluindo autenticação dos 17 utilizadores, carta escrita no sistema, carta anexada, rascunho, recepção, protocolo, encaminhamento, aprovação, assinatura, entrega, confirmação, arquivo, comentários, perfis, permissões, delegações, recuperação e notificações.
- Registos temporários E2E removidos no final.
- Log de erros do servidor de produção: vazio.

## Operação recomendada

Para uso normal, executar o pacote já construído:

```powershell
npm run start -- -p 3017
```

Para reconstruir e iniciar depois de novas alterações:

```powershell
npm run local
```

O modo `npm run dev` deve ser usado somente enquanto se altera código. Para compilações rápidas, recomenda-se libertar pelo menos 2 GB de memória e pausar builds de outros projectos; esses processos externos não foram encerrados durante esta intervenção.
