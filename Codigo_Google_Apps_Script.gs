/**
 * AGENDA DO INSPETOR — API GOOGLE PLANILHAS
 *
 * Mantém a agenda na planilha onde este Apps Script está instalado
 * e lê os dados dos técnicos da planilha de acompanhamento.
 *
 * Para usar:
 * 1. Extensões > Apps Script.
 * 2. Substitua o código atual por este.
 * 3. Salve.
 * 4. Implante como Aplicativo da web.
 * 5. Executar como: Eu.
 * 6. Quem tem acesso: Qualquer pessoa.
 * 7. Mantenha a URL /exec usada no HTML.
 */

const NOME_ABA = "Atividades";

const CABECALHO = [
  "ID",
  "Data",
  "Atividade",
  "Técnico",
  "Local",
  "Prioridade",
  "Status",
  "Descrição do serviço"
];

/*
 * Planilha enviada com os dados dos técnicos.
 */
const TECNICOS_SPREADSHEET_ID =
  "1C82k0Vz8_79jfItuCkarm8KlkowlzvMcujx6P-Yg9sk";

/* =========================================================
   LOGIN ADMINISTRATIVO — ABA "Usuarios" DA PLANILHA DA AGENDA
   Colunas esperadas:
   A = Usuario
   B = Senha
   C = Ativo

   O login usa a mesma estrutura da Agenda. Não usa
   ADMIN_USUARIO/ADMIN_SENHA nas propriedades do script.
========================================================= */
const NOME_ABA_USUARIOS = "Usuarios";
const LOGIN_TOKEN_CACHE_SEGUNDOS = 21600; // 6 horas

function obterAbaUsuarios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(NOME_ABA_USUARIOS);
  if (!aba) {
    throw new Error('Aba "Usuarios" não encontrada na planilha da Agenda.');
  }
  return aba;
}

function gerarTokenAdmin(usuario) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(
    "sessao_" + token,
    JSON.stringify({ token: token, usuario: usuario }),
    LOGIN_TOKEN_CACHE_SEGUNDOS
  );
  return token;
}

function validarTokenAdmin(token) {
  if (!token) return false;
  const salvo = CacheService.getScriptCache().get("sessao_" + String(token));
  if (!salvo) return false;
  try {
    const dados = JSON.parse(salvo);
    return String(dados.token) === String(token);
  } catch (e) {
    return false;
  }
}

function fazerLogin(usuario, senha) {
  const aba = obterAbaUsuarios();
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return { sucesso: false, mensagem: "Nenhum usuário cadastrado na aba Usuarios." };
  }

  const valores = aba.getRange(2, 1, ultimaLinha - 1, 3).getDisplayValues();
  const usuarioInformado = String(usuario || "").trim();
  const senhaInformada = String(senha || "");

  for (const linha of valores) {
    const usuarioPlanilha = String(linha[0] || "").trim();
    const senhaPlanilha = String(linha[1] || "");
    const ativo = String(linha[2] || "").trim().toUpperCase();

    const ativoValido = ["SIM", "S", "TRUE", "1", "ATIVO"].indexOf(ativo) !== -1;

    if (
      usuarioPlanilha === usuarioInformado &&
      senhaPlanilha === senhaInformada
    ) {
      if (!ativoValido) {
        return { sucesso: false, mensagem: "Este usuário está inativo." };
      }

      const token = gerarTokenAdmin(usuarioPlanilha);
      return {
        sucesso: true,
        usuario: usuarioPlanilha,
        token: token,
        mensagem: "Login realizado com sucesso."
      };
    }
  }

  return { sucesso: false, mensagem: "Usuário ou senha inválidos." };
}

function respostaLogin(resultado) {
  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

function obterPlanilha() {
  return SpreadsheetApp.getActiveSpreadsheet();
}


function obterAba() {

  const ss = obterPlanilha();

  let aba =
    ss.getSheetByName(NOME_ABA);

  if (!aba) {

    aba =
      ss.insertSheet(NOME_ABA);

    aba
      .getRange(
        1,
        1,
        1,
        CABECALHO.length
      )
      .setValues([
        CABECALHO
      ]);

    aba.setFrozenRows(1);

    aba.autoResizeColumns(
      1,
      CABECALHO.length
    );
  }

  if (aba.getMaxColumns() < CABECALHO.length) {
    aba.insertColumnsAfter(
      aba.getMaxColumns(),
      CABECALHO.length - aba.getMaxColumns()
    );
  }

  const colunaDescricao = CABECALHO.length;
  const cabecalhoDescricao = String(
    aba.getRange(1, colunaDescricao).getValue() || ""
  ).trim();
  if (!cabecalhoDescricao) {
    aba.getRange(1, colunaDescricao).setValue(CABECALHO[colunaDescricao - 1]);
  } else if (cabecalhoDescricao !== CABECALHO[colunaDescricao - 1]) {
    throw new Error('A coluna H da aba "Atividades" já possui outro cabeçalho. Confira antes de salvar a descrição.');
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
    status: String(obj.status || "Planejado"),
    descricao: String(obj.descricao || "").trim()
  };
}

function atividadeConcluida(status) {
  const valor = String(status || "").trim().toLowerCase();
  return valor === "concluído" || valor === "concluido";
}


function listarAtividades() {

  const aba = obterAba();
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  const valores =
    aba
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        CABECALHO.length
      )
      .getValues();

  return valores
    .filter(linha => linha[0] !== "")
    .map(linha => ({

      id: String(linha[0]),

      data:
        formatarDataPlanilha(
          linha[1]
        ),

      atividade:
        String(linha[2] || ""),

      tecnico:
        String(linha[3] || ""),

      local:
        String(linha[4] || ""),

      prioridade:
        String(linha[5] || "Média"),

      status:
        String(linha[6] || "Planejado"),

      descricao:
        String(linha[7] || "")

    }));
}


function formatarDataPlanilha(valor) {

  if (
    Object.prototype.toString.call(valor) ===
      "[object Date]" &&
    !isNaN(valor)
  ) {

    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  const texto =
    String(valor || "").trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(texto)
  ) {
    return texto;
  }

  const m =
    texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (m) {
    return `${m[3]}-${m[2]}-${m[1]}`;
  }

  return texto;
}


/* =========================================================
   DADOS DOS TÉCNICOS
========================================================= */

function obterPlanilhaTecnicos() {

  return SpreadsheetApp.openById(
    TECNICOS_SPREADSHEET_ID
  );
}


function limparTextoRotulo(
  valor,
  rotulo
) {

  const texto =
    String(valor || "").trim();

  if (!texto) {
    return "";
  }

  const inicio =
    rotulo + ":";

  if (
    texto
      .toLowerCase()
      .indexOf(
        inicio.toLowerCase()
      ) === 0
  ) {

    return texto
      .slice(inicio.length)
      .trim();
  }

  return texto;
}


function valorCelula(
  valores,
  linha,
  coluna
) {

  if (
    !valores[linha] ||
    valores[linha][coluna] === undefined ||
    valores[linha][coluna] === null
  ) {

    return "";
  }

  return valores[linha][coluna];
}


function textoCelula(
  valores,
  linha,
  coluna
) {

  return String(
    valorCelula(
      valores,
      linha,
      coluna
    ) || ""
  ).trim();
}


function formatarValorTecnico(valor) {

  if (
    Object.prototype.toString.call(valor) ===
      "[object Date]" &&
    !isNaN(valor)
  ) {

    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
    );
  }

  if (typeof valor === "number") {

    return String(valor)
      .replace(/\.0$/, "");
  }

  return String(valor || "").trim();
}


function lerTecnicoDaAba(aba) {

  const valores =
    aba
      .getDataRange()
      .getValues();

  const nome =
    limparTextoRotulo(
      valorCelula(
        valores,
        0,
        1
      ),
      "Colaborador"
    );

  if (!nome) {
    return null;
  }

  const tecnico = {

    aba:
      aba.getName().trim(),

    nome:

      nome,

    email:
      limparTextoRotulo(
        valorCelula(
          valores,
          1,
          1
        ),
        "Email"
      ),

    matricula:
      limparTextoRotulo(
        valorCelula(
          valores,
          0,
          4
        ),
        "Matricula"
      ),

    cpf:
      limparTextoRotulo(
        valorCelula(
          valores,
          1,
          4
        ),
        "CPF"
      ),

    cnh:
      limparTextoRotulo(
        valorCelula(
          valores,
          2,
          1
        ),
        "CNH"
      ),

    numeroCnh:
      formatarValorTecnico(
        valorCelula(
          valores,
          2,
          3
        )
      ),

    telefone:
      limparTextoRotulo(
        valorCelula(
          valores,
          2,
          4
        ),
        "Fone"
      ),

    vencimentoCnh:
      formatarValorTecnico(
        valorCelula(
          valores,
          3,
          2
        )
      ),

    status:
      textoCelula(
        valores,
        3,
        5
      ),

    nascimento:
      formatarValorTecnico(
        valorCelula(
          valores,
          4,
          2
        )
      ),

    cidade:
      limparTextoRotulo(
        valorCelula(
          valores,
          4,
          4
        ),
        "Cidade"
      ),

    admissao:
      formatarValorTecnico(
        valorCelula(
          valores,
          5,
          2
        )
      ),

    ferias:
      formatarValorTecnico(
        valorCelula(
          valores,
          5,
          4
        )
      ),

    gestor:
      limparTextoRotulo(
        valorCelula(
          valores,
          6,
          1
        ),
        "Gestor"
      ),

    inspetor:
      limparTextoRotulo(
        valorCelula(
          valores,
          6,
          3
        ),
        "Inspetor"
      ),

    fardamento:
      formatarValorTecnico(
        valorCelula(
          valores,
          7,
          2
        )
      ),

    pai:
      limparTextoRotulo(
        valorCelula(
          valores,
          7,
          3
        ),
        "Pai"
      ),

    quantidadeCalca:
      formatarValorTecnico(
        valorCelula(
          valores,
          8,
          2
        )
      ),

    quantidadeBata:
      formatarValorTecnico(
        valorCelula(
          valores,
          9,
          2
        )
      ),

    numeroBota:
      formatarValorTecnico(
        valorCelula(
          valores,
          9,
          4
        )
      ),

    ferramentas: []

  };


  /*
   * Linha 13 da planilha = índice 12.
   * Cada inspeção ocupa duas colunas:
   * Validação + Data.
   */
  for (
    let linha = 12;
    linha < valores.length;
    linha++
  ) {

    const nomeFerramenta =
      textoCelula(
        valores,
        linha,
        0
      );

    if (!nomeFerramenta) {
      continue;
    }

    if (
      nomeFerramenta.toUpperCase() ===
      "FERRAMENTAS"
    ) {
      continue;
    }

    if (
      nomeFerramenta.toLowerCase() ===
      "validação"
    ) {
      continue;
    }

    const ferramenta = {
      nome: nomeFerramenta,
      inspecoes: []
    };

    for (
      let coluna = 1;
      coluna + 1 < valores[linha].length;
      coluna += 2
    ) {

      const validacao =
        formatarValorTecnico(
          valores[linha][coluna]
        );

      const data =
        formatarValorTecnico(
          valores[linha][coluna + 1]
        );

      if (validacao || data) {

        ferramenta.inspecoes.push({

          validacao:
            validacao,

          data:
            data

        });
      }
    }

    tecnico.ferramentas.push(
      ferramenta
    );
  }

  return tecnico;
}


function listarTecnicos() {

  const planilha =
    obterPlanilhaTecnicos();

  return planilha
    .getSheets()

    .filter(
      aba =>
        aba.getName()
          .trim()
          .toLowerCase() !==
        "modelo"
    )

    .map(
      lerTecnicoDaAba
    )

    .filter(
      Boolean
    )

    .map(
      tecnico => ({

        aba:
          tecnico.aba,

        nome:
          tecnico.nome,

        matricula:
          tecnico.matricula,

        cidade:
          tecnico.cidade,

        telefone:
          tecnico.telefone,

        status:
          tecnico.status

      })
    )

    .sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
    );
}


function buscarTecnico(identificador) {

  const planilha =
    obterPlanilhaTecnicos();

  const chave =
    String(identificador || "")
      .trim();

  if (!chave) {
    throw new Error(
      "Identificador do técnico não informado."
    );
  }

  /*
   * Primeiro procura pelo nome da aba.
   * A comparação é normalizada para evitar
   * problemas com espaços ou diferenças de maiúsculas.
   */
  const chaveNormalizada =
    chave
      .replace(/\\s+/g, " ")
      .trim()
      .toLowerCase();

  let aba =
    planilha
      .getSheets()
      .find(sheet =>
        sheet
          .getName()
          .replace(/\\s+/g, " ")
          .trim()
          .toLowerCase() ===
        chaveNormalizada
      );

  /*
   * Se não encontrar pela aba, procura também
   * pelo nome do colaborador ou matrícula.
   * Isso deixa o detalhe mais resistente a alterações
   * no nome das abas da planilha.
   */
  if (!aba) {

    for (const sheet of planilha.getSheets()) {

      if (
        sheet
          .getName()
          .trim()
          .toLowerCase() === "modelo"
      ) {
        continue;
      }

      const tecnico =
        lerTecnicoDaAba(sheet);

      if (!tecnico) {
        continue;
      }

      const nomeNormalizado =
        String(tecnico.nome || "")
          .replace(/\\s+/g, " ")
          .trim()
          .toLowerCase();

      const matriculaNormalizada =
        String(tecnico.matricula || "")
          .trim()
          .toLowerCase();

      if (
        chaveNormalizada === nomeNormalizado ||
        chaveNormalizada === matriculaNormalizada
      ) {
        aba = sheet;
        break;
      }
    }
  }

  if (!aba) {
    throw new Error(
      "Técnico não encontrado na planilha: " + chave
    );
  }

  const tecnico =
    lerTecnicoDaAba(aba);

  if (!tecnico) {
    throw new Error(
      "A aba encontrada não possui um cadastro válido de técnico."
    );
  }

  return tecnico;
}



/* =========================================================
   POWER METER — PLANILHA EXTERNA
   IMPORTANTE: informar aqui o ID da Google Planilha que contém
   a aba "Santa Luzia" do arquivo RG-OPE-22 - Power Meter Aferições.
   As outras abas não são acessadas nem alteradas por estas funções.
========================================================= */
const POWER_METER_SPREADSHEET_ID = "1AhW_xK4O70TfF-EA2BtEsVPTXrprJc3xGw8pobju-ok";
const POWER_METER_ABA = "Santa Luzia";
const POWER_METER_CABECALHO = [
  "'", "Marca/Modelo", "Nome Colaborador", "Patrimonio PXX",
  "Sinal Padrão", "Sinal Encontrado", "Diferença Admitida",
  "Data da aferição", "Inicio da Próxima Aferição",
  "Limite da Próxima Aferição", "Dias Restantes",
  "Responsavel pela Calibração"
];

function obterPlanilhaPowerMeter() {
  if (!POWER_METER_SPREADSHEET_ID || POWER_METER_SPREADSHEET_ID.indexOf("COLE_AQUI") === 0) {
    throw new Error("Configure POWER_METER_SPREADSHEET_ID com o ID da Google Planilha do Power Meter.");
  }
  return SpreadsheetApp.openById(POWER_METER_SPREADSHEET_ID);
}

function obterAbaPowerMeter() {
  const ss = obterPlanilhaPowerMeter();
  const aba = ss.getSheetByName(POWER_METER_ABA);
  if (!aba) throw new Error('Aba "Santa Luzia" não encontrada na planilha Power Meter.');
  return aba;
}

function formatarDataPowerMeter(valor) {
  if (valor instanceof Date && !isNaN(valor)) return Utilities.formatDate(valor, Session.getScriptTimeZone(), "dd/MM/yyyy");
  return String(valor || "");
}

function dataISOFromPowerMeter(valor) {
  if (valor instanceof Date && !isNaN(valor)) return Utilities.formatDate(valor, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const s=String(valor||"").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

function numeroPowerMeter(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n=Number(v); return isNaN(n) ? v : n;
}

function listarPowerMeters() {
  const aba=obterAbaPowerMeter();
  const ultima=aba.getLastRow();
  if (ultima<2) return [];
  const valores=aba.getRange(2,1,ultima-1,12).getValues();
  return valores.map((r,i)=>({
    id:String(i+2), numero:r[0], modelo:String(r[1]||""), colaborador:String(r[2]||""),
    patrimonio:r[3], sinalPadrao:r[4], sinalEncontrado:r[5], diferenca:r[6],
    dataAfericao:formatarDataPowerMeter(r[7]), dataAfericaoISO:dataISOFromPowerMeter(r[7]),
    inicioProxima:formatarDataPowerMeter(r[8]), limiteProxima:formatarDataPowerMeter(r[9]),
    diasRestantes:r[10], responsavel:String(r[11]||"")
  })).filter(x=>x.modelo || x.colaborador || x.patrimonio || x.numero);
}

function normalizarPowerMeter(d) {
  return {
    numero:numeroPowerMeter(d.numero), modelo:String(d.modelo||"").trim(), colaborador:String(d.colaborador||"").trim(),
    patrimonio:numeroPowerMeter(d.patrimonio), sinalPadrao:numeroPowerMeter(d.sinalPadrao), sinalEncontrado:numeroPowerMeter(d.sinalEncontrado),
    dataAfericao:String(d.dataAfericao||"").trim(), responsavel:String(d.responsavel||"").trim()
  };
}

function aplicarDadosPowerMeter(aba, linha, item) {
  if (!item.modelo || !item.colaborador || !item.dataAfericao) throw new Error("Marca/Modelo, Nome Colaborador e Data da aferição são obrigatórios.");
  aba.getRange(linha,1,1,6).setValues([[item.numero,item.modelo,item.colaborador,item.patrimonio,item.sinalPadrao,item.sinalEncontrado]]);
  const data=Utilities.parseDate(item.dataAfericao, Session.getScriptTimeZone(), "yyyy-MM-dd");
  aba.getRange(linha,8).setValue(data);
  aba.getRange(linha,12).setValue(item.responsavel);
  // Mantém a lógica existente da aba Santa Luzia: G=F-E, I=H+60, J=H+90, K=J-TODAY().
  aba.getRange(linha,7).setFormula(`=(F${linha}-E${linha})`);
  aba.getRange(linha,9).setFormula(`=H${linha}+60`);
  aba.getRange(linha,10).setFormula(`=H${linha}+90`);
  aba.getRange(linha,11).setFormula(`=J${linha}-today()`);
}

function adicionarPowerMeter(dados) {
  const aba=obterAbaPowerMeter(); const item=normalizarPowerMeter(dados);
  const linha=Math.max(2,aba.getLastRow()+1);
  aplicarDadosPowerMeter(aba,linha,item);
  return `Power Meter salvo na aba Santa Luzia (linha ${linha}).`;
}

function editarPowerMeter(id,dados) {
  const linha=Number(id); if (!Number.isInteger(linha) || linha<2) throw new Error("Registro de Power Meter inválido.");
  const aba=obterAbaPowerMeter(); if (linha>aba.getLastRow()) throw new Error("Registro de Power Meter não encontrado.");
  aplicarDadosPowerMeter(aba,linha,normalizarPowerMeter(dados));
  return "Power Meter atualizado na aba Santa Luzia.";
}

function excluirPowerMeter(id) {
  const linha=Number(id); if (!Number.isInteger(linha) || linha<2) throw new Error("Registro de Power Meter inválido.");
  const aba=obterAbaPowerMeter(); if (linha>aba.getLastRow()) throw new Error("Registro de Power Meter não encontrado.");
  aba.deleteRow(linha);
  return "Power Meter excluído da aba Santa Luzia.";
}

function respostaPowerMeters(lista,mensagem) {
  return ContentService.createTextOutput(JSON.stringify({sucesso:true,mensagem:mensagem||"",powerMeters:lista||[]})).setMimeType(ContentService.MimeType.JSON);
}

/* =========================================================
   RESPOSTAS
========================================================= */

function resposta(
  atividades,
  mensagem
) {

  return ContentService
    .createTextOutput(
      JSON.stringify({

        sucesso: true,

        mensagem:
          mensagem || "",

        atividades:
          atividades

      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


function respostaTecnicos(
  tecnicos,
  mensagem
) {

  return ContentService
    .createTextOutput(
      JSON.stringify({

        sucesso: true,

        mensagem:
          mensagem || "",

        tecnicos:
          tecnicos

      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


function respostaTecnico(
  tecnico,
  mensagem
) {

  return ContentService
    .createTextOutput(
      JSON.stringify({

        sucesso: true,

        mensagem:
          mensagem || "",

        tecnico:
          tecnico

      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


function erro(mensagem) {

  return ContentService
    .createTextOutput(
      JSON.stringify({
        sucesso: false,
        mensagem: String(mensagem || "Erro desconhecido."),
        atividades: [],
        powerMeters: []
      })
    )
    .setMimeType(ContentService.MimeType.JSON);
}


/* =========================================================
   GET / POST
========================================================= */

function doGet(e) {

  /*
   * JSONP para o site hospedado no GitHub Pages.
   * Quando houver payload/acao na URL, executamos a mesma lógica do POST.
   * Isso evita bloqueios de CORS/"Failed to fetch" no navegador.
   */
  if (e && e.parameter && (e.parameter.payload || e.parameter.acao)) {
    try {
      const resultado = doPost({
        parameter: e.parameter,
        postData: { contents: "" }
      });

      const json = resultado.getContent();
      const callback = String(e.parameter.callback || "")
        .replace(/[^a-zA-Z0-9_.$]/g, "");

      if (callback) {
        return ContentService
          .createTextOutput(callback + "(" + json + ");")
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }

      return ContentService
        .createTextOutput(json)
        .setMimeType(ContentService.MimeType.JSON);

    } catch (eJsonp) {
      const jsonErro = JSON.stringify({
        sucesso: false,
        mensagem: "Erro no servidor: " + eJsonp.message,
        atividades: [],
        powerMeters: []
      });

      const callbackErro = String(e.parameter.callback || "")
        .replace(/[^a-zA-Z0-9_.$]/g, "");

      if (callbackErro) {
        return ContentService
          .createTextOutput(callbackErro + "(" + jsonErro + ");")
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }

      return ContentService
        .createTextOutput(jsonErro)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  try {
    return resposta(
      listarAtividades(),
      "Dados carregados."
    );
  } catch (e) {
    return erro(
      "Erro ao carregar dados: " +
      e.message
    );
  }
}


function doPost(e) {

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(30000);

    // Aceita tanto o formato JSON antigo quanto o novo formato
    // application/x-www-form-urlencoded usado pelo HTML do GitHub Pages.
    let dados = {};
    const conteudo = String((e && e.postData && e.postData.contents) || "");
    if (e && e.parameter && e.parameter.payload) {
      dados = JSON.parse(String(e.parameter.payload));
    } else if (conteudo) {
      try {
        dados = JSON.parse(conteudo);
      } catch (jsonError) {
        // Alguns clientes podem enviar URL-encoded diretamente no corpo.
        const match = conteudo.match(/(?:^|&)payload=([^&]*)/);
        if (match) {
          dados = JSON.parse(decodeURIComponent(match[1]));
        } else {
          throw new Error("Corpo da requisição inválido.");
        }
      }
    }

    const acao =
      String(
        dados.acao || ""
      );

    /* Login administrativo — usa a aba Usuarios da Agenda */
    if (acao === "validarSessao") {
      return ContentService
        .createTextOutput(JSON.stringify({ sucesso: validarTokenAdmin(dados.token) }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (acao === "login") {
      return respostaLogin(
        fazerLogin(dados.usuario, dados.senha)
      );
    }

    /*
     * Consultas da área de técnicos.
     * Não alteram a agenda.
     */

    if (
      acao ===
      "listarTecnicos"
    ) {

      return respostaTecnicos(
        listarTecnicos(),
        "Técnicos carregados."
      );
    }


    if (
      acao ===
      "buscarTecnico"
    ) {

      return respostaTecnico(
        buscarTecnico(
          dados.aba
        ),
        "Técnico carregado."
      );
    }


    if (acao === "listarAtividades") {
      return resposta(
        listarAtividades(),
        "Dados carregados."
      );
    }

    if (acao === "listarPowerMeters") {
      return respostaPowerMeters(listarPowerMeters(), "Power Meters carregados.");
    }

    if (acao === "adicionarPowerMeter") {
      if (!validarTokenAdmin(dados.token)) return erro("Sessão administrativa inválida ou expirada. Faça login novamente.");
      return respostaPowerMeters([], adicionarPowerMeter(dados.powerMeter));
    }

    if (acao === "editarPowerMeter") {
      if (!validarTokenAdmin(dados.token)) return erro("Sessão administrativa inválida ou expirada. Faça login novamente.");
      return respostaPowerMeters([], editarPowerMeter(dados.id || (dados.powerMeter && dados.powerMeter.id), dados.powerMeter));
    }

    if (acao === "excluirPowerMeter") {
      if (!validarTokenAdmin(dados.token)) return erro("Sessão administrativa inválida ou expirada. Faça login novamente.");
      return respostaPowerMeters([], excluirPowerMeter(dados.id));
    }


    /*
     * Operações existentes da agenda.
     * Todas as alterações exigem sessão administrativa válida.
     */

    if (["adicionar", "editar", "excluir", "limpar"].indexOf(acao) !== -1) {
      if (!validarTokenAdmin(dados.token)) {
        return erro("Sessão administrativa inválida ou expirada. Faça login novamente.");
      }
    }

    const aba =
      obterAba();


    if (
      acao ===
      "adicionar"
    ) {

      const item =
        normalizarAtividade((dados.atividade && typeof dados.atividade === "object") ? Object.assign({}, dados.atividade, { id: dados.atividade.id || dados.id }) : dados);

      if (
        !item.data ||
        !item.atividade ||
        !item.tecnico
      ) {

        return erro(
          "Data, atividade e técnico são obrigatórios."
        );
      }

      aba.appendRow([

        item.id,
        item.data,
        item.atividade,
        item.tecnico,
        item.local,
        item.prioridade,
        item.status,
        item.descricao

      ]);

      return resposta(
        listarAtividades(),
        "Atividade adicionada."
      );
    }


    if (
      acao ===
      "editar"
    ) {

      const item =
        normalizarAtividade((dados.atividade && typeof dados.atividade === "object") ? Object.assign({}, dados.atividade, { id: dados.atividade.id || dados.id }) : dados);

      const valores =
        aba
          .getDataRange()
          .getValues();

      for (
        let i = 1;
        i < valores.length;
        i++
      ) {

        if (
          String(
            valores[i][0]
          ) ===
          String(
            item.id
          )
        ) {

          if (atividadeConcluida(valores[i][6])) {
            return erro("Serviços concluídos não podem ser editados.");
          }

          aba
            .getRange(
              i + 1,
              1,
              1,
              CABECALHO.length
            )
            .setValues([[
              item.id,
              item.data,
              item.atividade,
              item.tecnico,
              item.local,
              item.prioridade,
              item.status,
              item.descricao
            ]]);

          return resposta(
            listarAtividades(),
            "Atividade alterada."
          );
        }
      }

      return erro(
        "Atividade não encontrada."
      );
    }


    if (
      acao ===
      "excluir"
    ) {

      const id =
        String(
          dados.id || ""
        );

      const valores =
        aba
          .getDataRange()
          .getValues();

      for (
        let i =
          valores.length - 1;
        i >= 1;
        i--
      ) {

        if (
          String(
            valores[i][0]
          ) ===
          id
        ) {

          if (atividadeConcluida(valores[i][6])) {
            return erro("Serviços concluídos não podem ser excluídos.");
          }

          aba.deleteRow(
            i + 1
          );

          return resposta(
            listarAtividades(),
            "Atividade excluída."
          );
        }
      }

      return erro(
        "Atividade não encontrada."
      );
    }


    if (
      acao ===
      "limpar"
    ) {

      const ultimaLinha =
        aba.getLastRow();

      if (
        ultimaLinha >= 2
      ) {

        aba
          .getRange(
            2,
            1,
            ultimaLinha - 1,
            CABECALHO.length
          )
          .clearContent();
      }

      return resposta(
        [],
        "Agenda limpa."
      );
    }


    return erro(
      "Ação inválida."
    );

  } catch (e) {

    return erro(
      "Erro no servidor: " +
      e.message
    );

  } finally {

    try {
      lock.releaseLock();
    } catch (_) {}
  }
}
