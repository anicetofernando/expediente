# Relatório de implementação e validação

Data: 14 de Agosto de 2026  
Sistema: Gestão de Expediente CFM  
Base de dados: PostgreSQL local (`expediente_cfm`)

## Resultado

O núcleo local do sistema está funcional com autenticação por palavra-passe, dados persistidos no PostgreSQL, documentos guardados localmente, controlo de acesso por perfil, tramitação completa, notificações internas, auditoria e relatórios derivados dos dados reais.

Foram removidos a página e os controlos de 2FA, bem como o painel de gestão de sessões activas. A aplicação continua a utilizar um cookie HTTP-only assinado, indispensável para manter o utilizador autenticado com segurança entre pedidos HTTP.

## Funcionamento ponta a ponta

1. O utilizador entra com e-mail e palavra-passe.
2. O Remetente cria um expediente e escolhe uma das formas de documento:
   - redigir a carta no editor do sistema, com títulos, tipos e tamanhos de letra, negrito, itálico, sublinhado, cores, alinhamento, listas, desfazer/refazer e impressão;
   - carregar uma carta já existente em PDF, DOCX ou imagem;
   - carregar um documento obtido por digitalização;
   - acrescentar anexos reais ao processo.
3. O expediente pode ser guardado como rascunho ou submetido. Ao submeter, o PostgreSQL reserva um protocolo transaccional, por exemplo `CFM/DOC/2026/0001`, e atribui o processo à Secretaria.
4. A Secretaria recebe, protocola, aplica carimbo quando necessário e encaminha o processo para a unidade responsável.
5. O Superior/Aprovador analisa, pede parecer ou esclarecimento, devolve, rejeita ou aprova. Pode aplicar a assinatura registada e disponibilizar o resultado ao remetente.
6. O Remetente recebe a notificação, consulta o documento/resposta e confirma a recepção.
7. A Secretaria arquiva o processo. O expediente continua disponível no arquivo digital, livro, biblioteca de documentos, actividade, relatórios e auditoria.
8. Cada operação grava utilizador, unidade, data, estado, observação, notificações e evento cronológico.

### Exemplo prático validado

Felismina Cossa redige uma carta no editor e submete-a. Cremilda Nhantumbo recebe, protocola e encaminha a carta para o Departamento de Obras e Construção. Fátima Momade aprova, assina e disponibiliza a resposta. Felismina confirma o recebimento e Cremilda arquiva. O teste confirmou no banco o estado final `arquivado`, um documento principal, dez eventos cronológicos e um comentário.

O mesmo ensaio criou ainda uma carta por anexo (PDF com anexo de imagem) e um rascunho posteriormente submetido.

## Utilizadores e responsabilidades

### Remetentes

- Felismina Cossa
- Felismina Tembe
- Ricardo Langa
- Isabel Cuamba

Criam cartas no editor ou por anexo, guardam rascunhos, submetem expedientes, acompanham os próprios processos, comentam, recebem notificações e confirmam o recebimento.

### Secretaria

- Cremilda Nhantumbo
- Paulo Nhaca

Recebem, protocolam, carimbam, encaminham, disponibilizam, notificam e arquivam. Gerem o livro digital, exportação CSV, impressão e fecho mensal.

### Superiores/Aprovadores

- Fátima Momade
- Amélia Nhaca
- Carlos Machava
- José Cumbe
- António Sitoe
- Eduardo Macuácua
- Lídia Chissano
- Armando Bila
- Graça Muianga
- Noémia Machel

Analisam expedientes da sua unidade, solicitam pareceres/esclarecimentos, encaminham, aprovam, rejeitam, devolvem, assinam, disponibilizam respostas e criam/encerram delegações.

### Administração

- Sandro Tivane

Gere utilizadores, reposição de palavra-passe, perfis, matriz de permissões, estrutura organizacional, catálogos, tipos e modelos documentais, carimbos, assinaturas, fluxos, numeração, regras de notificação e parâmetros gerais. Consulta auditoria e dados globais.

Todos os 17 utilizadores foram autenticados individualmente pelo teste HTTP e chegaram à página inicial correspondente ao seu perfil.

## Funcionalidades persistentes

- autenticação apenas por palavra-passe, bloqueio após tentativas inválidas e logout real;
- alteração real da própria palavra-passe;
- recuperação de acesso com notificação segura à Administração;
- utilizadores, perfis, permissões e unidades organizacionais;
- expedientes, documentos, anexos e conteúdo HTML das cartas;
- armazenamento de ficheiros em `storage/uploads`;
- estados, responsáveis, prazos, prioridades e confidencialidade;
- comentários, linha temporal, notificações e auditoria;
- delegações de aprovação;
- catálogos, modelos, carimbos, assinaturas, fluxos e configurações administrativas;
- livro digital, fecho mensal, exportação CSV e impressão;
- painel, tarefas, biblioteca documental, actividade, arquivo e relatórios com dados do PostgreSQL.

## Base de dados

As migrações estão em `db/migrations` e podem ser reaplicadas com segurança. O estado entregue depois dos testes é:

- 17 utilizadores;
- 4 perfis base;
- 17 atribuições de perfil;
- 12 unidades organizacionais;
- 0 expedientes de teste;
- 0 utilizadores, perfis, delegações ou auditorias E2E;
- 0 sequências consumidas artificialmente.

A palavra-passe do PostgreSQL permanece apenas no `.env.local`, que está excluído do Git.

## Validação executada

- `npm run typecheck`: aprovado, zero erros;
- `npm run lint`: aprovado, zero avisos e zero erros;
- `npm run db:test`: aprovado;
- `npm run build -- --no-lint`: aprovado, 65 páginas/rotas geradas;
- `npm run test:e2e`: aprovado, 55 verificações ponta a ponta;
- log de erro do servidor de produção: vazio;
- `git diff --check`: aprovado.

## Operação local

Primeira preparação ou actualização:

```powershell
npm install
npm run db:migrate
```

Desenvolvimento:

```powershell
npm run dev
```

Produção local:

```powershell
npm run build
npm run start
```

A palavra-passe inicial das 17 contas de demonstração institucional é `CFM@2026!`. Deve ser substituída individualmente no perfil ou pela Administração antes de uso real.

## Dependências externas

O funcionamento local não depende de serviços externos. Envio efectivo por e-mail/SMS e captura directa a partir de hardware de scanner exigem credenciais, fornecedor e equipamento que não foram fornecidos. As notificações internas e o carregamento de ficheiros digitalizados estão funcionais; a interface não simula uma captura física inexistente.
