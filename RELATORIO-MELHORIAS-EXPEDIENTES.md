# Relatório de rectificação do fluxo de expedientes

Data: 15 de Agosto de 2026  
Estado: concluído, compilado e testado em produção local

## Resultado entregue

- O rascunho pertence apenas a **Meus expedientes** e deixou de aparecer na **Caixa de entrada**.
- O rascunho pode ser reaberto pelo botão **Continuar edição**, alterado, guardado novamente ou submetido.
- Um novo rascunho recebe um identificador temporário `RASCUNHO-...` e só consome a numeração oficial `CFM/UNIDADE/ANO/NNNN` quando é submetido.
- A opção **Digitalizar documento** foi removida da criação e dos catálogos. Documentos antigos dessa origem foram convertidos para **Importado**.
- Permanecem três origens: criar a carta no sistema, carregar um documento existente ou criar apenas o processo.
- O editor da carta passou a usar uma folha A4 de 794 × 1123 px, uma área de escrita maior e uma pré-visualização alta.
- A página de detalhe dedica a área principal ao documento e reduziu o painel lateral de acções para 220 px.
- A pré-visualização usa o PDF contínuo, sem cortar a folha, e permite percorrer todas as páginas no visualizador do navegador.
- **Descarregar PDF** entrega o mesmo documento mostrado na pré-visualização; **Imprimir** imprime esse PDF.
- PDF, DOCX, JPG, PNG e cartas escritas no sistema são convertidos para uma saída PDF comum.
- O carimbo escolhido é guardado com nome, posição, utilizador e data, e é incorporado no PDF.
- A assinatura escolhida é guardada com proprietário, cargo, utilizador e data, e é incorporada no PDF final.
- Foi mantida a auditoria de todas as acções do fluxo.

Nota técnica: a assinatura implementada é uma validação institucional visual e auditável do sistema. Uma assinatura legal baseada em certificado ICP/PKI exigirá, no futuro, a integração com um certificado e uma autoridade certificadora.

## Exemplo prático validado

1. Felismina cria uma carta dentro do sistema e guarda como rascunho.
2. O sistema guarda `RASCUNHO-XXXXXXXX`; o item aparece em Meus expedientes e não na Caixa de entrada.
3. Felismina abre o olho do expediente, escolhe Continuar edição, altera a carta e volta a guardar.
4. Ao submeter, o sistema atribui o protocolo oficial e entrega a responsabilidade à Secretaria.
5. Cremilda recebe, protocola, aplica o carimbo configurado e encaminha.
6. Fátima aprova e aplica a assinatura seleccionada.
7. O documento é disponibilizado, o remetente confirma e a Secretaria arquiva.
8. O PDF descarregado contém o conteúdo completo, o carimbo e a assinatura.

## Base de dados

- PostgreSQL local validado.
- Migrações aplicadas: `001` a `006`.
- Estado após os testes: 17 utilizadores, 4 perfis, 12 unidades e os 3 expedientes actuais preservados.
- O rascunho real `CFM/DOF/2026/0001 — AQUISICAO DE MATERIAL` foi aberto pela nova API com sucesso e o seu documento antigo passou de Digitalizado para Importado.
- Os registos temporários dos testes E2E foram removidos automaticamente.

## Testes executados

- TypeScript: aprovado, sem erros.
- Build Next.js de produção: aprovado; 66 páginas/rotas geradas.
- Teste funcional E2E: 74 verificações aprovadas.
- Autenticação: os 17 utilizadores institucionais autenticaram.
- Rascunho: criar, excluir da Caixa de entrada, reabrir, editar, guardar e submeter aprovados.
- Numeração: protocolo temporário no rascunho e protocolo oficial na submissão aprovados.
- Tramitação: receber, protocolar, encaminhar, aprovar, assinar, disponibilizar, confirmar e arquivar aprovados.
- Documento final: carimbo e assinatura persistidos; PDF final válido descarregado com 50.023 bytes.
- Integridade após limpeza E2E: aprovada.

## Desempenho medido no servidor local

- Consultas PostgreSQL aquecidas: 2,8 a 17,0 ms.
- Login: 642,6 ms.
- `/admin/utilizadores`: 1.097,4 ms na primeira abertura e 599,4 ms aquecido.
- `/admin/configuracoes`: 85,3 ms na primeira abertura e 180,4 ms aquecido.
- `/perfil`: 431,6 ms na primeira abertura e 336,2 ms aquecido.
- `/notificacoes`: 111,3 ms na primeira abertura e 72,4 ms aquecido.
- JavaScript comum a todas as páginas: 87,5 kB.

## Execução

- Aplicação de produção local: `http://localhost:3017`
- Processo do Next.js activo e a escutar em `0.0.0.0:3017`.

## Rectificações de 15 de Agosto de 2026

- Corrigido o painel vazio do rascunho: **Continuar edição** e **Submeter** ficam agora visíveis ao remetente.
- Corrigida a conversão da data PostgreSQL que enviava valores como `Sat Aug 15` ao campo HTML; os rascunhos passam a receber `AAAA-MM-DD`.
- Adicionado **Guardar alterações** durante a edição do rascunho, sem obrigar o utilizador a chegar primeiro ao último passo.
- Datas de entrega anteriores ao dia actual são bloqueadas no calendário, no assistente, na API de criação, na API de edição e na submissão directa.
- Modelos podem definir cabeçalho, rodapé, logótipo no cabeçalho ou rodapé e texto inicial da carta.
- O layout do modelo é guardado como fotografia no documento e reproduzido no PDF final.
- Modelos inexistentes ou inactivos são rejeitados pelo servidor.
- Carimbos são filtrados pela unidade proprietária e pela lista de utilizadores autorizados.
- Assinaturas são individuais e vinculadas ao utilizador por ID/e-mail; não existe assinatura partilhada do departamento.
- A Administração passou a seleccionar o utilizador real ao registar uma assinatura.
- Teste E2E actualizado: **74 verificações aprovadas**, incluindo data passada, edição de rascunho, âmbito do carimbo, titular da assinatura, layout, PDF e circuito da Secretaria.
- Verificação nos rascunhos existentes: `CFM/DOF/2026/0001` abriu com prazo `2026-08-15`; `RASCUNHO-92C5EE92` abriu com prazo `2026-08-16`.

## Revisão do painel da Secretaria — 15 de Agosto de 2026

- Corrigida a regra de navegação que aceitava apenas identificadores antigos `exp-*` e bloqueava os UUID usados pelo PostgreSQL; o olho volta a abrir o detalhe.
- Todas as listas operacionais e o Livro permitem abrir o expediente clicando em qualquer zona livre da linha, além do protocolo, assunto e olho.
- As linhas usam fundo branco uniforme e realce cinzento neutro ao passar o rato; cores ficam reservadas ao estado e a prazos realmente atrasados.
- Rascunhos de outros utilizadores foram excluídos da Consulta, do Livro, dos documentos e das rotas directas da Secretaria.
- O menu residual **Digitalizações** foi removido da Secretaria. A entrada de documentos existentes é feita por **Carregar documento**.

### Responsabilidade de cada menu

- **Recepção:** fila exclusiva dos expedientes submetidos que ainda aguardam confirmação de entrada pela Secretaria.
- **Protocolos:** expedientes já recebidos que aguardam protocolo e os recém-protocolados ainda dentro da preparação inicial.
- **Encaminhamentos:** expedientes protocolados que ainda precisam ser enviados à unidade responsável.
- **Livro de expediente:** registo cronológico institucional de expedientes oficialmente submetidos, com exportação, impressão e fecho mensal.
- **Entregas pendentes:** respostas aprovadas que devem ser disponibilizadas, confirmadas ou arquivadas.
- **Consultar expedientes:** pesquisa transversal de todos os expedientes oficiais, em qualquer fase, sem incluir rascunhos privados.
- **Arquivo:** consulta permanente dos expedientes formalmente concluídos e arquivados.
