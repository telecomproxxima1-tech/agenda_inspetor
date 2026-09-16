/**
 * AGENDA DO INSPETOR — API GOOGLE PLANILHAS
 *
 * COMO CONFIGURAR:
 * 1. Abra a Google Planilha que será o banco de dados.
 * 2. Extensões > Apps Script.
 * 3. Apague o conteúdo do editor e cole este código.
 * 4. Salve.
 * 5. No menu "Implantar", escolha "Nova implantação".
 * 6. Tipo: "Aplicativo da web".
 * 7. Executar como: "Eu".
 * 8. Quem tem acesso: "Qualquer pessoa".
 * 9. Clique em Implantar e copie a URL que termina em /exec.
 * 10. No site, clique em "Configurar conexão" e cole essa URL.
 *
 * A primeira execução cria automaticamente a aba "Atividades".
 */

const NOME_ABA = "Atividades";
const CABECALHO = ["ID", "Data", "Atividade", "Técnico", "Local", "Prioridade", "Status"];

function obterPlanilha() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function obterAba() {
  const ss = obterPlanilha();
  let aba = ss.getSheetByName(NOME_ABA);

  if (!aba) {
    aba = ss.insertSheet(NOME_ABA);
    aba.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO]);
    aba.setFrozenRows(1);
    aba.autoResizeColumns(1, CABECALHO.length);
  }

  return aba;
}

function normalizarAtividade(obj) {
  return {
    id: String(obj.id || Date.now()),
    data: String(obj.data || ""),
    atividade: String(obj.atividade || "").trim(),
    tecnico: String(obj.tecnico || "").trim(),
    local: String(obj.local || "").trim(),
    prioridade: String(obj.prioridade || "Média"),
    status: String(obj.status || "Planejado")
  };
}

function listarAtividades() {
  const aba = obterAba();
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) return [];

  const valores = aba.getRange(2, 1, ultimaLinha - 1, CABECALHO.length).getValues();

  return valores
    .filter(linha => linha[0] !== "")
    .map(linha => ({
      id: String(linha[0]),
      data: formatarDataPlanilha(linha[1]),
      atividade: String(linha[2] || ""),
      tecnico: String(linha[3] || ""),
      local: String(linha[4] || ""),
      prioridade: String(linha[5] || "Média"),
      status: String(linha[6] || "Planejado")
    }));
}

function formatarDataPlanilha(valor) {
  if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor)) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  const texto = String(valor || "").trim();

  // Aceita tanto yyyy-MM-dd quanto dd/MM/yyyy.
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  return texto;
}

function resposta(atividades, mensagem) {
  return ContentService
    .createTextOutput(JSON.stringify({
      sucesso: true,
      mensagem: mensagem || "",
      atividades: atividades
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function erro(mensagem) {
  return ContentService
    .createTextOutput(JSON.stringify({
      sucesso: false,
      mensagem: mensagem,
      atividades: []
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  try {
    return resposta(listarAtividades(), "Dados carregados.");
  } catch (e) {
    return erro("Erro ao carregar dados: " + e.message);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const dados = JSON.parse((e.postData && e.postData.contents) || "{}");
    const acao = String(dados.acao || "");
    const aba = obterAba();

    if (acao === "adicionar") {
      const item = normalizarAtividade(dados.atividade);

      if (!item.data || !item.atividade || !item.tecnico) {
        return erro("Data, atividade e técnico são obrigatórios.");
      }

      aba.appendRow([
        item.id,
        item.data,
        item.atividade,
        item.tecnico,
        item.local,
        item.prioridade,
        item.status
      ]);

      return resposta(listarAtividades(), "Atividade adicionada.");
    }

    if (acao === "editar") {
      const item = normalizarAtividade(dados.atividade);
      const valores = aba.getDataRange().getValues();

      for (let i = 1; i < valores.length; i++) {
        if (String(valores[i][0]) === String(item.id)) {
          aba.getRange(i + 1, 1, 1, CABECALHO.length).setValues([[
            item.id,
            item.data,
            item.atividade,
            item.tecnico,
            item.local,
            item.prioridade,
            item.status
          ]]);
          return resposta(listarAtividades(), "Atividade alterada.");
        }
      }

      return erro("Atividade não encontrada.");
    }

    if (acao === "excluir") {
      const id = String(dados.id || "");
      const valores = aba.getDataRange().getValues();

      for (let i = valores.length - 1; i >= 1; i--) {
        if (String(valores[i][0]) === id) {
          aba.deleteRow(i + 1);
          return resposta(listarAtividades(), "Atividade excluída.");
        }
      }

      return erro("Atividade não encontrada.");
    }

    if (acao === "limpar") {
      const ultimaLinha = aba.getLastRow();

      if (ultimaLinha >= 2) {
        aba.getRange(2, 1, ultimaLinha - 1, CABECALHO.length).clearContent();
      }

      return resposta([], "Agenda limpa.");
    }

    return erro("Ação inválida.");
  } catch (e) {
    return erro("Erro no servidor: " + e.message);
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}
