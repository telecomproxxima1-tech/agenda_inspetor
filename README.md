# Página do Inspetor

Página estática para organizar atividades da equipe de inspeção e acessar formulários e controles da Proxxima Telecom. A interface é publicada pelo GitHub Pages e usa o Google Apps Script para consultar e gravar dados nas planilhas.

## Arquivos

| Arquivo | Uso |
| --- | --- |
| `index.html` | Estrutura da página e telas da Agenda, Técnicos, Power Meter e Forms. |
| `style.css` | Aparência e adaptação para celular e computador. |
| `script.js` | Agenda, filtros, autenticação da interface e integração com o Apps Script. |
| `capa-agenda-inspetor.png` | Imagem de capa. Deve ficar na mesma pasta do `index.html`. |
| `Codigo_Google_Apps_Script_atualizado.gs` | Código do servidor Google Apps Script, para manter ou atualizar no projeto Apps Script. Não é um arquivo da página do GitHub Pages. |

## Recursos da página

- Agenda com visualização semanal ou mensal.
- Busca por atividade, técnico, local ou descrição.
- Filtros por atividade, técnico, status e intervalo de datas.
- Cadastro de uma ou mais atividades na mesma tarefa, com descrição opcional.
- Indicadores de tarefas planejadas, em andamento, concluídas, pendentes e atrasadas.
- Exportação da agenda para CSV.
- Bloqueio de edição e exclusão das tarefas concluídas.
- Abas de Técnicos e Power Meter, além do catálogo de Forms para o usuário autenticado.
- Cache local para consultar os últimos dados carregados quando estiver sem conexão. Para sincronizar alterações com a planilha, é necessário estar online.

## Publicação no GitHub Pages

1. Mantenha `index.html`, `style.css`, `script.js` e `capa-agenda-inspetor.png` juntos na pasta publicada pelo GitHub Pages.
2. Envie os arquivos atualizados para o repositório e aguarde a publicação do Pages.
3. Abra o endereço do site e recarregue a página. Se o navegador ainda mostrar a versão anterior, use `Ctrl+F5`.

O HTML carrega os estilos e o script com um parâmetro de versão (`?v=...`) para evitar que o navegador reutilize arquivos antigos em cache. Ao publicar uma nova alteração nesses arquivos, atualize esse parâmetro no `index.html` se o navegador continuar mostrando uma versão antiga.

## Integração com o Google Apps Script

O endereço `/exec` usado pela página está configurado na constante `API_URL`, no início de `script.js`. Ele deve corresponder à implantação ativa do Google Apps Script. Se uma nova implantação gerar outro endereço, atualize `API_URL` e publique o `script.js` atualizado.

O arquivo `Codigo_Google_Apps_Script_atualizado.gs` contém o código do servidor. Para alterar o backend, copie o conteúdo para o projeto Apps Script ligado às planilhas e faça uma nova implantação como aplicativo da web. A conta e as permissões da implantação precisam permitir o acesso às planilhas usadas pela página.

O arquivo `.gs` pode ficar no repositório como cópia de manutenção, mas não precisa ser carregado pelo navegador nem publicado como parte dos arquivos do site.

## Atualizar os Forms

Os nomes, descrições e links do catálogo ficam no array `FORMULARIOS_DISPONIVEIS`, no início de `script.js`. Para incluir ou atualizar um formulário, altere os dados correspondentes e publique o script atualizado. Os links devem usar HTTPS.

