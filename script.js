

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycbycpXYyGRTDRQ1NjY3ey6-zvfai_28_vrci6VIDTQjM7aCar1IkkCwFtEim7B9PSXMG/exec";


let atividades = [];

let dataReferencia =
    new Date();

let idEditando = null;

let sincronizando = false;


let token =
    sessionStorage.getItem("agendaToken") || "";
let adminAutenticado = false;


let usuario =
    sessionStorage.getItem("agendaUsuario") || "";

/* =========================================================
   TÉCNICOS
========================================================= */

let tecnicosInspetor = [];
let tecnicosCarregados = false;

const FORMULARIOS_DISPONIVEIS = [
    {
        nome: 'Manutenção de clivador',
        descricao: 'Formulário e planilha de respostas.',
        links: [
            { texto: 'Abrir formulário', url: 'https://docs.google.com/forms/d/e/1FAIpQLSfL9QdW6GcA6ggsgs-sD2iT5F0k3DIVHQF1MdtuMx5OUUzXPQ/viewform' },
            { texto: 'Ver respostas', url: 'https://docs.google.com/spreadsheets/d/16g8QuafUqSnOXV6JAXnKoJEvfUoAcTQbGjJolPN9ggs/edit?usp=drivesdk' }
        ]
    },
    {
        nome: 'Inspeção patrimonial mensal',
        descricao: 'Formulário e planilha de respostas.',
        links: [
            { texto: 'Abrir formulário', url: 'https://docs.google.com/forms/d/e/1FAIpQLSfSw8COeA-XwbrL7UlnB3ZVMbNRPJGcoXi5T637pP7dEHzW1A/viewform' },
            { texto: 'Ver respostas', url: 'https://docs.google.com/spreadsheets/d/1k269VmenhPUhmbQFLN00Jb36CLtyzYyQq-1FWoSrDhI/edit?usp=sharing' }
        ]
    },
    {
        nome: 'Relatório de desempenho técnico',
        descricao: 'Formulário e planilha de respostas.',
        links: [
            { texto: 'Abrir formulário', url: 'https://docs.google.com/forms/d/e/1FAIpQLSc8TSrI5oZwBnn6LDezTz4YBjq9c3rvYnhkH0b1WnBXx5hi3A/viewform' },
            { texto: 'Ver respostas', url: 'https://docs.google.com/spreadsheets/d/1qOePpUq-98ybcmh5Z4tTt3B73bwK8AR3Pd9vjAdnBC4/edit?usp=drivesdk' }
        ]
    },
    {
        nome: 'Aferição Power Meter',
        descricao: 'Planilha de aferição dos Power Meters.',
        links: [
            { texto: 'Abrir planilha', url: 'https://docs.google.com/spreadsheets/d/1AhW_xK4O70TfF-EA2BtEsVPTXrprJc3xGw8pobju-ok/edit?usp=drivesdk' }
        ]
    }
];

function abrirAbaForms() {
    if (!estaLogado()) return;
    document.querySelectorAll('.view-inspetor').forEach(view => view.classList.add('oculto'));
    document.querySelectorAll('.aba-inspetor').forEach(botao => botao.classList.remove('ativa'));
    document.getElementById('formsView').classList.remove('oculto');
    document.getElementById('abaForms').classList.add('ativa');
    renderizarFormularios();
}

function renderizarFormularios() {
    const lista = document.getElementById('listaForms');
    if (!lista) return;

    const validos = FORMULARIOS_DISPONIVEIS.map(form => ({
        ...form,
        links: (form.links || []).filter(link => {
            try { return new URL(link.url).protocol === 'https:'; }
            catch (_) { return false; }
        })
    })).filter(form => form.links.length);

    if (!validos.length) {
        lista.innerHTML = '<div class="forms-vazio">Os formulários disponíveis aparecerão aqui.</div>';
        return;
    }

    lista.innerHTML = validos.map(form => `
        <article class="forms-card">
            <div class="forms-card-icone">📝</div>
            <div class="forms-card-conteudo">
                <h3>${esc(form.nome || 'Formulário')}</h3>
                ${form.descricao ? `<p>${esc(form.descricao)}</p>` : ''}
                <div class="forms-acoes">${form.links.map(link => `<a class="forms-abrir" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.texto)} ↗</a>`).join('')}</div>
            </div>
        </article>
    `).join('');
}

async function abrirAbaInspetor(aba) {
    const agendaView=document.getElementById('agendaView');
    const tecnicosView=document.getElementById('tecnicosView');
    const pmView=document.getElementById('powerMeterView');
    const abaAgenda=document.getElementById('abaAgenda');
    const abaTecnicos=document.getElementById('abaTecnicos');
    const abaPM=document.getElementById('abaPowerMeter');
    const abaForms=document.getElementById('abaForms');
    const formsView=document.getElementById('formsView');
    agendaView.classList.toggle('oculto',aba!=='agenda');
    tecnicosView.classList.toggle('oculto',aba!=='tecnicos');
    pmView.classList.toggle('oculto',aba!=='powerMeter');
    formsView.classList.add('oculto');
    abaAgenda.classList.toggle('ativa',aba==='agenda');
    abaTecnicos.classList.toggle('ativa',aba==='tecnicos');
    abaPM.classList.toggle('ativa',aba==='powerMeter');
    abaForms.classList.remove('ativa');
    if(aba==='tecnicos' && !tecnicosCarregados) await carregarTecnicosInspetor();
    if(aba==='powerMeter') await carregarPowerMeters();
}

async function carregarTecnicosInspetor(forcar = false) {

    if (tecnicosCarregados && !forcar) {
        filtrarTecnicosInspetor();
        return;
    }

    const status = document.getElementById("statusTecnicos");
    status.textContent = "Carregando técnicos da planilha...";
    status.className = "status-conexao aviso-sync";

    try {

        const dados = await apiPost({
            acao: "listarTecnicos"
        });

        if (!dados.sucesso) {
            throw new Error(
                dados.mensagem ||
                "Não foi possível carregar os técnicos."
            );
        }

        tecnicosInspetor =
            Array.isArray(dados.tecnicos)
                ? dados.tecnicos
                : [];

        tecnicosCarregados = true;

        preencherFiltrosTecnicosInspetor();
        atualizarKpisTecnicosInspetor();
        filtrarTecnicosInspetor();

        status.textContent =
            "✓ " + tecnicosInspetor.length +
            " técnico(s) carregado(s).";

        status.className =
            "status-conexao sucesso-sync";

    } catch (erro) {

        console.error(erro);

        status.textContent =
            "⚠ Erro ao carregar os técnicos: " +
            erro.message;

        status.className =
            "status-conexao erro-sync";
    }
}

function preencherFiltrosTecnicosInspetor() {

    const cidade =
        document.getElementById("filtroCidadeTecnicos");

    const status =
        document.getElementById("filtroStatusTecnicos");

    const cidadeAtual = cidade.value;
    const statusAtual = status.value;

    const cidades = [
        ...new Set(
            tecnicosInspetor
                .map(x => x.cidade)
                .filter(Boolean)
        )
    ].sort((a,b) => a.localeCompare(b, "pt-BR"));

    const statuses = [
        ...new Set(
            tecnicosInspetor
                .map(x => x.status)
                .filter(Boolean)
        )
    ].sort((a,b) => a.localeCompare(b, "pt-BR"));

    cidade.innerHTML =
        '<option value="">Todas as cidades</option>';

    status.innerHTML =
        '<option value="">Todos os status</option>';

    cidades.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        cidade.appendChild(option);
    });

    statuses.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        status.appendChild(option);
    });

    cidade.value = cidadeAtual;
    status.value = statusAtual;
}

function filtrarTecnicosInspetor() {

    const pesquisa =
        document.getElementById("pesquisaTecnicos")
            .value.trim().toLowerCase();

    const cidade =
        document.getElementById("filtroCidadeTecnicos")
            .value;

    const status =
        document.getElementById("filtroStatusTecnicos")
            .value;

    const lista = tecnicosInspetor.filter(t => {

        const texto = [
            t.nome,
            t.matricula,
            t.telefone,
            t.cidade
        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

        return (
            (!pesquisa || texto.includes(pesquisa)) &&
            (!cidade || t.cidade === cidade) &&
            (!status || t.status === status)
        );
    });

    renderizarTecnicosInspetor(lista);
}

function obterIniciaisTecnico(nome) {
    const partes = String(nome || "Técnico")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!partes.length) return "T";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function atualizarKpisTecnicosInspetor() {

    const total = tecnicosInspetor.length;

    const ativos = tecnicosInspetor.filter(t =>
        !String(t.status || "").toUpperCase().includes("DESLIG")
    ).length;

    const cidades = new Set(
        tecnicosInspetor
            .map(t => String(t.cidade || "").trim())
            .filter(Boolean)
    ).size;

    document.getElementById("kpiTotalTecnicos").textContent = total;
    document.getElementById("kpiAtivosTecnicos").textContent = ativos;
    document.getElementById("kpiCidadesTecnicos").textContent = cidades;
}

function filtrarTecnicosInspetor() {

    const pesquisa =
        document.getElementById("pesquisaTecnicos")
            .value.trim().toLowerCase();

    const cidade =
        document.getElementById("filtroCidadeTecnicos")
            .value;

    const status =
        document.getElementById("filtroStatusTecnicos")
            .value;

    const lista = tecnicosInspetor.filter(t => {

        const texto = [
            t.nome,
            t.matricula,
            t.telefone,
            t.cidade
        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

        return (
            (!pesquisa || texto.includes(pesquisa)) &&
            (!cidade || t.cidade === cidade) &&
            (!status || t.status === status)
        );
    });

    renderizarTecnicosInspetor(lista);
}

function renderizarTecnicosInspetor(lista) {

    const tbody = document.getElementById("listaTecnicosInspetor");
    const contagem = document.getElementById("contagemTecnicos");
    const kpiExibidos = document.getElementById("kpiExibidosTecnicos");

    contagem.textContent =
        lista.length === 1
            ? "1 técnico exibido"
            : `${lista.length} técnicos exibidos`;

    kpiExibidos.textContent = lista.length;

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="tecnico-vazio">
                    🔎 Nenhum técnico encontrado com os filtros atuais.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista.map(t => {

        const desligado =
            String(t.status || "")
                .toUpperCase()
                .includes("DESLIG");

        const iniciais = obterIniciaisTecnico(t.nome);

        return `
            <tr>
                <td>
                    <div class="tecnico-identidade">
                        <div class="tecnico-avatar">${esc(iniciais)}</div>
                        <div>
                            <div class="tecnico-nome">${esc(t.nome || "Sem nome")}</div>
                            <div class="tecnico-meta">${esc(t.aba || "Cadastro")}</div>
                        </div>
                    </div>
                </td>

                <td><strong>${esc(t.matricula || "-")}</strong></td>

                <td>
                    <span class="tecnico-cidade">
                        📍 ${esc(t.cidade || "-")}
                    </span>
                </td>

                <td>
                    <span class="tecnico-telefone">
                        ${esc(t.telefone || "-")}
                    </span>
                </td>

                <td>
                    <span class="status-tecnico ${desligado ? "desligado" : ""}">
                        ${esc(t.status || "Sem status")}
                    </span>
                </td>

                <td>
                    <button
                        class="btn-detalhes-tecnico"
                        onclick="abrirDetalhesTecnico('${escJS(t.aba)}')">
                        Ver detalhes →
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

async function abrirDetalhesTecnico(aba) {

    const modal =
        document.getElementById("modalTecnico");

    const area =
        document.getElementById("detalhesTecnico");

    modal.classList.remove("oculto");

    area.innerHTML = `
        <div class="tecnico-carregando">
            Carregando informações do técnico...
        </div>
    `;

    try {

        const dados = await apiPost({
            acao: "buscarTecnico",
            aba: aba
        });

        if (!dados.sucesso) {
            throw new Error(
                dados.mensagem ||
                "Técnico não encontrado."
            );
        }

        renderizarDetalhesTecnico(dados.tecnico);

    } catch (erro) {

        area.innerHTML = `
            <div class="tecnico-carregando">
                ⚠ ${esc(erro.message)}
            </div>
        `;
    }
}

function renderizarDetalhesTecnico(t) {

    const area =
        document.getElementById("detalhesTecnico");

    const campo = (label, valor) => `
        <div class="tecnico-campo">
            <label>${esc(label)}</label>
            <strong>${esc(valor || "-")}</strong>
        </div>
    `;

    const ferramentas =
        Array.isArray(t.ferramentas)
            ? t.ferramentas
            : [];

    let ferramentasHtml;

    if (!ferramentas.length) {

        ferramentasHtml = `
            <div class="tecnico-carregando">
                Nenhum item de ferramenta, EPI ou EPC cadastrado.
            </div>
        `;

    } else {

        /*
         * A primeira coluna fica fixa com o nome do item.
         * As inspeções ficam separadas em grupos:
         * Inspeção 1 | Validação | Data
         * Inspeção 2 | Validação | Data
         * etc.
         */
        const totalInspecoes = Math.max(
            1,
            ...ferramentas.map(f =>
                Array.isArray(f.inspecoes)
                    ? f.inspecoes.length
                    : 0
            )
        );

        const cabecalhoInspecoes = Array.from(
            { length: totalInspecoes },
            (_, indice) => `
                <th class="grupo-inspecao" colspan="2">
                    Inspeção ${indice + 1}
                </th>
            `
        ).join("");

        const subCabecalhoInspecoes = Array.from(
            { length: totalInspecoes },
            () => `
                <th class="sub-inspecao">Validação</th>
                <th class="sub-inspecao">Data</th>
            `
        ).join("");

        const linhas = ferramentas.map(f => {

            const inspecoes = Array.isArray(f.inspecoes)
                ? f.inspecoes
                : [];

            const celulasInspecoes = Array.from(
                { length: totalInspecoes },
                (_, indice) => {

                    const inspecao = inspecoes[indice];

                    if (!inspecao) {
                        return `
                            <td class="sem-dado">—</td>
                            <td class="sem-dado">—</td>
                        `;
                    }

                    return `
                        <td class="valor-inspecao">
                            ${esc(inspecao.validacao || "—")}
                        </td>
                        <td class="data-inspecao">
                            ${esc(inspecao.data || "—")}
                        </td>
                    `;
                }
            ).join("");

            return `
                <tr>
                    <td class="col-item">
                        <strong>${esc(f.nome || "Item")}</strong>
                    </td>
                    ${celulasInspecoes}
                </tr>
            `;
        }).join("");

        ferramentasHtml = `
            <div class="inspecoes-legenda">
                A coluna de item permanece fixa; cada inspeção é apresentada separadamente.
                Deslize horizontalmente para visualizar as inspeções mais antigas.
            </div>

            <div class="tabela-ferramentas-wrap">
                <table class="tabela-ferramentas">

                    <thead>
                        <tr>
                            <th class="col-item">Ferramentas / EPI / EPC</th>
                            ${cabecalhoInspecoes}
                        </tr>
                        <tr>
                            <th class="col-item">Item</th>
                            ${subCabecalhoInspecoes}
                        </tr>
                    </thead>

                    <tbody>
                        ${linhas}
                    </tbody>

                </table>
            </div>
        `;
    }

    area.innerHTML = `

        <div class="tecnico-cabecalho">

            <div>
                <h2>👷 ${esc(t.nome)}</h2>
                <div class="subtitulo">
                    ${esc(t.status || "Sem status")}
                </div>
            </div>

            <button
                class="btn-secundario"
                onclick="fecharDetalhesTecnico()">
                Fechar
            </button>

        </div>

        <div class="tecnico-grid">

            ${campo("Matrícula", t.matricula)}
            ${campo("CPF", t.cpf)}
            ${campo("E-mail", t.email)}

            ${campo("Telefone", t.telefone)}
            ${campo("Cidade", t.cidade)}
            ${campo("Data de nascimento", t.nascimento)}

            ${campo("CNH", t.cnh)}
            ${campo("Número da CNH", t.numeroCnh)}
            ${campo("Vencimento da CNH", t.vencimentoCnh)}

            ${campo("Admissão", t.admissao)}
            ${campo("Últimas férias", t.ferias)}
            ${campo("Gestor", t.gestor)}

            ${campo("Inspetor", t.inspetor)}
            ${campo("Fardamento", t.fardamento)}
            ${campo("Pai", t.pai)}

            ${campo("Quantidade de calças", t.quantidadeCalca)}
            ${campo("Quantidade de batas", t.quantidadeBata)}
            ${campo("Nº da bota", t.numeroBota)}

        </div>

        <div class="tecnico-secao">

            <h3>🔧 Ferramentas e inspeções</h3>

            ${ferramentasHtml}

        </div>
    `;
}

function fecharDetalhesTecnico() {
    document.getElementById("modalTecnico")
        .classList.add("oculto");
}

function escJS(v) {
    return String(v ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}



/* =========================================================
   POWER METER — SANTA LUZIA
========================================================= */
let powerMeters = [];
let powerMetersCarregados = false;

async function carregarPowerMeters(forcar=false){
  const status=document.getElementById('statusPowerMeter');
  if(!forcar && powerMetersCarregados){ filtrarPowerMeters(); return; }
  status.textContent='Carregando Power Meters da aba Santa Luzia...';
  try{
    const dados=await apiPost({acao:'listarPowerMeters'});
    if(!dados.sucesso) throw new Error(dados.mensagem||'Erro ao carregar Power Meter.');
    powerMeters=Array.isArray(dados.powerMeters)?dados.powerMeters:[];
    powerMetersCarregados=true;
    preencherFiltroResponsavel();
    atualizarKpisPowerMeter();
    atualizarPermissoesPowerMeter();
    filtrarPowerMeters();
    status.textContent=`${powerMeters.length} registro(s) carregado(s) — planilha: Santa Luzia.`;
  }catch(e){status.textContent='⚠ '+e.message; document.getElementById('listaPowerMeters').innerHTML=`<tr><td colspan="13" class="tecnico-vazio">${esc(e.message)}</td></tr>`;}
}

function preencherFiltroResponsavel(){
 const s=document.getElementById('pmFiltroResponsavel'),at=s.value;
 const nomes=[...new Set(powerMeters.map(x=>x.responsavel).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 s.innerHTML='<option value="">Todos</option>'+nomes.map(x=>`<option value="${escAttr(x)}">${esc(x)}</option>`).join(''); s.value=at;
}
function situacaoPM(x){
 const d=Number(x.diasRestantes);
 if(Number.isFinite(d)&&d<0)return 'Vencido';
 if(Number.isFinite(d)&&d<=15)return 'Próximo do limite';
 return 'Em dia';
}
function formatarDiferencaAdmitida(valor){
 const texto=String(valor ?? '').trim();
 if(!texto) return '';
 // Exibição: sempre exatamente 2 casas decimais, usando vírgula.
 // O valor original recebido da planilha permanece inalterado.
 const normalizado=texto
   .replace(/\s/g,'')
   .replace(/[−–—]/g,'-')
   .replace(/,/g,'.');
 const numero=Number(normalizado);
 if(!Number.isFinite(numero)) return esc(valor);
 const arredondado=Math.round((numero + Number.EPSILON) * 100) / 100;
 return arredondado.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:false});
}
function atualizarKpisPowerMeter(){
 document.getElementById('pmKpiTotal').textContent=powerMeters.length;
 document.getElementById('pmKpiColaboradores').textContent=new Set(powerMeters.map(x=>x.colaborador).filter(Boolean)).size;
 document.getElementById('pmKpiVencidos').textContent=powerMeters.filter(x=>situacaoPM(x)==='Vencido').length;
 document.getElementById('pmKpiProximos').textContent=powerMeters.filter(x=>situacaoPM(x)==='Próximo do limite').length;
}
function filtrarPowerMeters(){
 const q=(document.getElementById('pmPesquisa')?.value||'').toLowerCase().trim(), r=document.getElementById('pmFiltroResponsavel')?.value||'', sit=document.getElementById('pmFiltroSituacao')?.value||'';
 const lista=powerMeters.filter(x=>{const texto=[x.modelo,x.colaborador,x.patrimonio,x.numero].join(' ').toLowerCase(); return (!q||texto.includes(q))&&(!r||x.responsavel===r)&&(!sit||situacaoPM(x)===sit)});
 renderizarPowerMeters(lista);
}
function atualizarPermissoesPowerMeter(){
 const admin=estaLogado();
 const novo=document.getElementById('pmNovoBtn');
 const coluna=document.getElementById('pmColunaAcao');
 if(novo) novo.classList.toggle('oculto',!admin);
 if(coluna) coluna.classList.toggle('oculto',!admin);
}
function renderizarPowerMeters(lista){
 const tbody=document.getElementById('listaPowerMeters');
 if(!lista.length){tbody.innerHTML='<tr><td colspan="13" class="tecnico-vazio">Nenhum registro encontrado.</td></tr>';return;}
 tbody.innerHTML=lista.map(x=>{const sit=situacaoPM(x),cls=sit==='Vencido'?'pm-vencido':sit==='Próximo do limite'?'pm-proximo':'pm-ok'; return `<tr><td class="pm-num">${esc(x.numero)}</td><td>${esc(x.modelo)}</td><td>${esc(x.colaborador)}</td><td class="pm-num">${esc(x.patrimonio)}</td><td class="pm-num">${esc(x.sinalPadrao)}</td><td class="pm-num">${esc(x.sinalEncontrado)}</td><td class="pm-num">${formatarDiferencaAdmitida(x.diferenca)}</td><td>${esc(x.dataAfericao)}</td><td>${esc(x.inicioProxima)}</td><td>${esc(x.limiteProxima)}</td><td class="pm-num"><span class="pm-situacao ${cls}">${esc(x.diasRestantes)} — ${sit}</span></td><td>${esc(x.responsavel)}</td>${estaLogado() ? `<td><div class="pm-acao"><button class="pm-editar" onclick="editarPowerMeter('${escJS(x.id)}')">Editar</button><button class="pm-excluir" onclick="excluirPowerMeter('${escJS(x.id)}')">Excluir</button></div></td>` : ''}</tr>`;}).join('');
}
function abrirModalPowerMeter(item=null){
 if(!estaLogado()){ alert('Apenas o usuário administrador logado pode editar os Power Meters.'); return; }
 document.getElementById('modalPowerMeter').classList.remove('oculto');
 document.getElementById('pmModalTitulo').textContent=item?'📡 Editar Power Meter':'📡 Novo Power Meter';
 document.getElementById('pmId').value=item?item.id:''; document.getElementById('pmNumero').value=item?.numero||''; document.getElementById('pmModelo').value=item?.modelo||''; document.getElementById('pmColaborador').value=item?.colaborador||''; document.getElementById('pmPatrimonio').value=item?.patrimonio||''; document.getElementById('pmPadrao').value=item?.sinalPadrao??''; document.getElementById('pmEncontrado').value=item?.sinalEncontrado??''; document.getElementById('pmData').value=item?.dataAfericaoISO||''; document.getElementById('pmResponsavel').value=item?.responsavel||'';
}
function fecharModalPowerMeter(){document.getElementById('modalPowerMeter').classList.add('oculto');}
function editarPowerMeter(id){ if(!estaLogado()){ alert('Apenas o usuário administrador logado pode editar os Power Meters.'); return; } const item=powerMeters.find(x=>String(x.id)===String(id)); if(item) abrirModalPowerMeter(item);}
async function salvarPowerMeter(){
 if(!estaLogado()){ alert('Apenas o usuário administrador logado pode salvar alterações.'); return; }
 const item={id:document.getElementById('pmId').value,numero:document.getElementById('pmNumero').value,modelo:document.getElementById('pmModelo').value.trim(),colaborador:document.getElementById('pmColaborador').value.trim(),patrimonio:document.getElementById('pmPatrimonio').value,sinalPadrao:document.getElementById('pmPadrao').value,sinalEncontrado:document.getElementById('pmEncontrado').value,dataAfericao:document.getElementById('pmData').value,responsavel:document.getElementById('pmResponsavel').value.trim()};
 if(!item.modelo||!item.colaborador||!item.dataAfericao){alert('Preencha Marca/Modelo, Nome Colaborador e Data da aferição.');return;}
 try{const dados=await apiPost({acao:item.id?'editarPowerMeter':'adicionarPowerMeter',id:item.id || '',powerMeter:item}); if(!dados.sucesso)throw new Error(dados.mensagem||'Não foi possível salvar.'); fecharModalPowerMeter(); await carregarPowerMeters(true); alert(dados.mensagem||'Power Meter salvo.');}catch(e){alert('Erro ao salvar: '+e.message);}
}
async function excluirPowerMeter(id){
 if(!estaLogado()){ alert('Apenas o usuário administrador logado pode excluir registros.'); return; }
 const item=powerMeters.find(x=>String(x.id)===String(id)); if(!item)return; if(!confirm(`Excluir o Power Meter nº ${item.numero} da aba Santa Luzia?`))return;
 try{const dados=await apiPost({acao:'excluirPowerMeter',id:id});if(!dados.sucesso)throw new Error(dados.mensagem||'Não foi possível excluir.');await carregarPowerMeters(true);alert(dados.mensagem||'Registro excluído.');}catch(e){alert('Erro ao excluir: '+e.message);}
}
function escAttr(v){return String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* =========================================================
   DATAS
========================================================= */

function formatarData(d) {

    return String(d.getDate()).padStart(2, "0") +
        "/" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "/" +
        d.getFullYear();

}


function dataISO(d) {

    return d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");

}


/* =========================================================
   INÍCIO DA SEMANA
   Segunda-feira
========================================================= */

function inicioSemana(d) {

    let n =
        new Date(d);

    let dia =
        n.getDay();

    n.setDate(
        n.getDate() +
        (dia === 0 ? -6 : 1 - dia)
    );

    n.setHours(
        0,
        0,
        0,
        0
    );

    return n;

}


/* =========================================================
   CACHE LOCAL
========================================================= */

function bancoLocal() {

    localStorage.setItem(
        "agendaInspetor",
        JSON.stringify(atividades)
    );

}


function carregarCacheLocal() {

    try {

        atividades =
            JSON.parse(
                localStorage.getItem(
                    "agendaInspetor"
                ) || "[]"
            ) || [];

    } catch (e) {

        atividades = [];

    }

}


/* =========================================================
   STATUS DA CONEXÃO
========================================================= */

function setStatusConexao(
    texto,
    tipo = ""
) {

    const el =
        document.getElementById(
            "statusConexao"
        );

    if (!el) return;

    el.textContent =
        texto;

    el.className =
        "status-conexao" +
        (tipo
            ? " " + tipo + "-sync"
            : "");

}


/* =========================================================
   COMUNICAÇÃO COM GOOGLE APPS SCRIPT
========================================================= */

/*
 * Comunicação sem fetch/CORS.
 *
 * O site está hospedado no GitHub Pages e o Google Apps Script está em outro
 * domínio. Para evitar "Failed to fetch", as chamadas usam JSONP por GET.
 * O Apps Script recebe o mesmo payload e executa as mesmas ações do POST.
 */
function apiJsonp(payload) {
    return new Promise(function(resolve, reject) {
        const callbackName =
            "__agendaJsonp_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 1000000);

        const script = document.createElement("script");
        let finalizado = false;

        function limpar() {
            try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
            if (script.parentNode) script.parentNode.removeChild(script);
        }

        const timer = setTimeout(function() {
            if (finalizado) return;
            finalizado = true;
            limpar();
            reject(new Error(
                "Tempo esgotado ao comunicar com o Google Apps Script. " +
                "Verifique se a implantação /exec está disponível."
            ));
        }, 30000);

        window[callbackName] = function(dados) {
            if (finalizado) return;
            finalizado = true;
            clearTimeout(timer);
            limpar();
            resolve(dados);
        };

        script.onerror = function() {
            if (finalizado) return;
            finalizado = true;
            clearTimeout(timer);
            limpar();
            reject(new Error(
                "Não foi possível conectar ao Google Apps Script. " +
                "Confirme se a URL /exec do HTML é a mesma da implantação."
            ));
        };

        const query =
            "?payload=" +
            encodeURIComponent(JSON.stringify(payload || {})) +
            "&callback=" +
            encodeURIComponent(callbackName) +
            "&_=" +
            Date.now();

        script.src = API_URL + query;
        script.async = true;
        document.head.appendChild(script);
    });
}

async function apiGet() {
    return await apiJsonp({ acao: "listarAtividades" });
}

async function apiPost(payload) {
    const payloadSeguro = { ...(payload || {}), token: token || "" };
    return await apiJsonp(payloadSeguro);
}

function apiPostFormulario(payload) {
    return new Promise(function(resolve, reject) {
        const frameName = "__agendaPostFrame_" + Date.now() + "_" +
            Math.floor(Math.random() * 1000000);

        const iframe = document.createElement("iframe");
        iframe.name = frameName;
        iframe.style.display = "none";
        iframe.setAttribute("aria-hidden", "true");

        const form = document.createElement("form");
        form.method = "POST";
        form.action = API_URL;
        form.target = frameName;
        form.style.display = "none";

        const campo = document.createElement("input");
        campo.type = "hidden";
        campo.name = "payload";
        campo.value = JSON.stringify(payload || {});
        form.appendChild(campo);

        document.body.appendChild(iframe);
        document.body.appendChild(form);

        let finalizado = false;
        const timeout = setTimeout(function() {
            if (finalizado) return;
            finalizado = true;
            limpar();
            reject(new Error(
                "Tempo esgotado ao enviar os dados ao Google Apps Script."
            ));
        }, 30000);

        function limpar() {
            clearTimeout(timeout);
            try { form.remove(); } catch(e) {}
            try { iframe.remove(); } catch(e) {}
        }

        // Formulários HTML podem ser enviados para outro domínio sem CORS.
        // O iframe pode disparar um onload apenas para a resposta do POST;
        // não devemos esperar um "segundo load", pois isso fazia a tela
        // ficar aguardando até o timeout mesmo quando o Apps Script recebia
        // a gravação.
        let enviado = false;
        iframe.onload = function() {
            if (!enviado || finalizado) return;

            finalizado = true;
            limpar();

            resolve({
                sucesso: true,
                mensagem: "Dados enviados ao Google Apps Script."
            });
        };

        iframe.onerror = function() {
            if (finalizado) return;
            finalizado = true;
            limpar();
            reject(new Error(
                "Não foi possível enviar os dados ao Google Apps Script."
            ));
        };

        try {
            enviado = true;
            form.submit();
        } catch (e) {
            if (finalizado) return;
            finalizado = true;
            limpar();
            reject(e);
        }
    });
}


/* =========================================================
   SINCRONIZAÇÃO
========================================================= */

async function sincronizar() {

    if (sincronizando)
        return;


    sincronizando = true;


    setStatusConexao(
        "Sincronizando com a Google Planilha...",
        "aviso"
    );


    try {

        const dados =
            await apiGet();


        if (!dados.sucesso) {

            throw new Error(
                dados.erro ||
                dados.message ||
                dados.mensagem ||
                "Falha ao buscar os dados."
            );

        }


        atividades =
            Array.isArray(
                dados.atividades
            )
                ? dados.atividades
                : [];


        bancoLocal();

        atualizarFiltroTecnicos();

        renderizar();


        setStatusConexao(
            "✓ Dados sincronizados com a Google Planilha.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            "Erro na sincronização:",
            erro
        );


        carregarCacheLocal();

        atualizarFiltroTecnicos();

        renderizar();


        setStatusConexao(
            "⚠ Sem conexão. Exibindo o último cache local.",
            "erro"
        );


    } finally {

        sincronizando =
            false;

    }

}


/* =========================================================
   LOGIN
========================================================= */

function abrirLogin() {

    document
        .getElementById(
            "modalLogin"
        )
        .classList.remove(
            "oculto"
        );


    document
        .getElementById(
            "erroLogin"
        )
        .textContent = "";


    document
        .getElementById(
            "loginUsuario"
        )
        .focus();

}


function fecharLogin() {

    document
        .getElementById(
            "modalLogin"
        )
        .classList.add(
            "oculto"
        );

}


async function login() {

    const usuarioInput =
        document
            .getElementById(
                "loginUsuario"
            )
            .value
            .trim();


    const senha =
        document
            .getElementById(
                "loginSenha"
            )
            .value;


    const erro =
        document
            .getElementById(
                "erroLogin"
            );


    const botao =
        document
            .getElementById(
                "btnEntrar"
            );


    erro.textContent = "";


    if (
        !usuarioInput ||
        !senha
    ) {

        erro.textContent =
            "Informe usuário e senha.";

        return;

    }


    botao.disabled =
        true;

    botao.textContent =
        "Entrando...";


    try {

        const dados =
            await apiPost({

                acao: "login",

                usuario:
                    usuarioInput,

                senha:
                    senha

            });


        console.log(
            "Resposta do Google Apps Script:",
            dados
        );


        if (!dados.sucesso) {

            erro.textContent =
                dados.erro ||
                dados.message ||
                dados.mensagem ||
                "O servidor recusou o login.";

            return;

        }


        if (!dados.token) {

            erro.textContent =
                "Login aceito, mas o servidor não retornou o token.";

            return;

        }


        token = dados.token;
        adminAutenticado = true;


        usuario =
            dados.usuario ||
            usuarioInput;


        sessionStorage.setItem(
            "agendaToken",
            token
        );


        sessionStorage.setItem(
            "agendaUsuario",
            usuario
        );


        fecharLogin();

        atualizarInterfaceLogin();


        setStatusConexao(
            "✓ Administrador conectado.",
            "sucesso"
        );


    } catch (erroCatch) {

        console.error(
            "Erro no login:",
            erroCatch
        );


        erro.textContent =
            "Não foi possível comunicar com o servidor: " +
            erroCatch.message;


    } finally {

        botao.disabled =
            false;

        botao.textContent =
            "Entrar";

    }

}


function sair() {
    adminAutenticado = false;

    token = "";

    usuario = "";

    sessionStorage.removeItem(
        "agendaToken"
    );

    sessionStorage.removeItem(
        "agendaUsuario"
    );

    idEditando = null;

    cancelarEdicao();

    atualizarInterfaceLogin();


    setStatusConexao(
        "✓ Visualização pública. Login administrativo encerrado.",
        "sucesso"
    );

}


function estaLogado() {
    return !!token && adminAutenticado === true;
}

async function validarSessaoAdmin() {
    if (!token) { adminAutenticado = false; atualizarInterfaceLogin(); return false; }
    try {
        const resposta = await apiPost({ acao: "validarSessao" });
        adminAutenticado = !!(resposta && resposta.sucesso);
        if (!adminAutenticado) {
            token = ""; usuario = "";
            sessionStorage.removeItem("agendaToken");
            sessionStorage.removeItem("agendaUsuario");
        }
    } catch (e) { adminAutenticado = false; }
    atualizarInterfaceLogin();
    return adminAutenticado;
}

function atualizarInterfaceLogin() {

    const admin =
        estaLogado();

    const abaForms = document.getElementById('abaForms');
    abaForms.disabled = !admin;
    abaForms.setAttribute('aria-disabled', String(!admin));
    abaForms.title = admin ? 'Abrir catálogo de Forms' : 'Faça login para acessar os Forms';

    const formsView = document.getElementById('formsView');
    if (!admin && !formsView.classList.contains('oculto')) {
        abrirAbaInspetor('agenda');
    }


    document
        .getElementById(
            "painelCadastro"
        )
        .classList.toggle(
            "oculto",
            !admin
        );


    document
        .getElementById(
            "btnLimpar"
        )
        .classList.toggle(
            "oculto",
            !admin
        );


    document
        .getElementById(
            "btnLogin"
        )
        .classList.toggle(
            "oculto",
            admin
        );


    document
        .getElementById(
            "btnSair"
        )
        .classList.toggle(
            "oculto",
            !admin
        );


    document
        .getElementById(
            "statusLogin"
        )
        .textContent =
        admin
            ? "👤 Administrador: " +
              usuario
            : "👤 Visualização pública";


    renderizar();
    atualizarPermissoesPowerMeter();
    if (!admin) fecharModalPowerMeter();
    if (powerMetersCarregados) filtrarPowerMeters();

}


/* =========================================================
   FORMULÁRIO
========================================================= */

function limparFormulario() {

    document
        .getElementById(
            "data"
        )
        .value =
        dataISO(
            new Date()
        );


    document
        .getElementById(
            "atividade"
        )
        .value = "";

    document
        .getElementById("descricaoServico")
        .value = "";


    document
        .getElementById(
            "tecnico"
        )
        .value = "";


    document
        .getElementById(
            "local"
        )
        .value = "";


    document
        .getElementById(
            "prioridade"
        )
        .value =
        "Média";


    document
        .getElementById(
            "status"
        )
        .value =
        "Planejado";

}


function cancelarEdicao() {

    idEditando =
        null;

    limparFormulario();


    document
        .getElementById(
            "btnSalvar"
        )
        .innerText =
        "Adicionar atividade";


    document
        .getElementById(
            "btnCancelar"
        )
        .style.display =
        "none";


    renderizar();

}


/* =========================================================
   ADICIONAR / EDITAR
========================================================= */

async function salvarAtividade() {

    if (!estaLogado()) {

        abrirLogin();

        return;

    }


    const data =
        document
            .getElementById(
                "data"
            )
            .value;


    const atividade =
        document
            .getElementById(
                "atividade"
            )
            .value
            .trim();


    const tecnico =
        document
            .getElementById(
                "tecnico"
            )
            .value
            .trim();


    const local =
        document
            .getElementById(
                "local"
            )
            .value
            .trim();


    const prioridade =
        document
            .getElementById(
                "prioridade"
            )
            .value;


    const status =
        document
            .getElementById(
                "status"
            )
            .value;


    if (!data) {

        alert(
            "Escolha a data da atividade."
        );

        return;

    }


   if (
    !data ||
    !atividade ||
    !tecnico ||
    !local ||
    !prioridade ||
    !status
) {

    alert(
        "Preencha todos os campos da atividade."
    );

    return;

}


    const botao =
        document.getElementById(
            "btnSalvar"
        );


    botao.disabled =
        true;


    try {

        setStatusConexao(
            idEditando !== null
                ? "Salvando alteração..."
                : "Salvando atividade...",
            "aviso"
        );


        const payload = {

            acao:
                idEditando !== null
                    ? "editar"
                    : "adicionar",

            token:
                token,

            id:
                idEditando !== null
                    ? idEditando
                    : "",

            data:
                data,

            atividade:
                atividade,

            descricao:
                document.getElementById("descricaoServico").value.trim(),

            tecnico:
                tecnico,

            local:
                local,

            prioridade:
                prioridade,

            status:
                status

        };


        const retorno =
            await apiPost(
                payload
            );


        if (!retorno.sucesso) {

            throw new Error(
                retorno.erro ||
                retorno.message ||
                retorno.mensagem ||
                "Não foi possível salvar."
            );

        }


        cancelarEdicao();


        await sincronizar();


        setStatusConexao(
            "✓ Atividade salva na Google Planilha.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            erro
        );


        if (
            String(
                erro.message
            )
            .toLowerCase()
            .includes("sessão")
        ) {

            sair();

        }


        alert(
            "Não foi possível salvar na planilha.\n\n" +
            erro.message
        );


        setStatusConexao(
            "⚠ Erro ao salvar na planilha.",
            "erro"
        );


    } finally {

        botao.disabled =
            false;

    }

}


/* =========================================================
   EDITAR ATIVIDADE
========================================================= */

function editarAtividade(id) {

    if (!estaLogado()) {

        abrirLogin();

        return;

    }


    const x =
        atividades.find(
            function(a) {

                return String(a.id) ===
                    String(id);

            }
        );


    if (!x)
        return;


    idEditando =
        x.id;


    document
        .getElementById(
            "data"
        )
        .value =
        x.data;


    document
        .getElementById(
            "atividade"
        )
        .value =
        x.atividade;

    document
        .getElementById("descricaoServico")
        .value =
        x.descricao || "";


    document
        .getElementById(
            "tecnico"
        )
        .value =
        x.tecnico;


    document
        .getElementById(
            "local"
        )
        .value =
        x.local || "";


    document
        .getElementById(
            "prioridade"
        )
        .value =
        x.prioridade ||
        "Média";


    document
        .getElementById(
            "status"
        )
        .value =
        x.status ||
        "Planejado";


    document
        .getElementById(
            "btnSalvar"
        )
        .innerText =
        "Salvar alterações";


    document
        .getElementById(
            "btnCancelar"
        )
        .style.display =
        "inline-block";


    document
        .getElementById(
            "atividade"
        )
        .focus();


    renderizar();

}


/* =========================================================
   EXCLUIR
========================================================= */

async function excluirAtividade(id) {

    if (!estaLogado()) {

        abrirLogin();

        return;

    }


    if (
        !confirm(
            "Deseja excluir esta atividade?"
        )
    ) {

        return;

    }


    try {

        setStatusConexao(
            "Excluindo atividade...",
            "aviso"
        );


        const retorno =
            await apiPost({

                acao:
                    "excluir",

                token:
                    token,

                id:
                    id

            });


        if (!retorno.sucesso) {

            throw new Error(
                retorno.erro ||
                retorno.message ||
                retorno.mensagem ||
                "Não foi possível excluir."
            );

        }


        await sincronizar();


        setStatusConexao(
            "✓ Atividade excluída da planilha.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            erro
        );


        if (
            String(
                erro.message
            )
            .toLowerCase()
            .includes("sessão")
        ) {

            sair();

        }


        alert(
            "Não foi possível excluir na planilha.\n\n" +
            erro.message
        );


        setStatusConexao(
            "⚠ Erro ao excluir na planilha.",
            "erro"
        );

    }

}


/* =========================================================
   RENDERIZAÇÃO DA SEMANA
========================================================= */

function renderizar() {

    const inicio =
        inicioSemana(
            dataReferencia
        );


    const dias = [

        [
            "Segunda",
            "dataSegunda"
        ],

        [
            "Terça",
            "dataTerca"
        ],

        [
            "Quarta",
            "dataQuarta"
        ],

        [
            "Quinta",
            "dataQuinta"
        ],

        [
            "Sexta",
            "dataSexta"
        ],

        [
            "Sábado",
            "dataSabado"
        ],

        [
            "Domingo",
            "dataDomingo"
        ]

    ];


    const ft =
        document
            .getElementById(
                "filtroTecnico"
            )
            .value;


    const fs =
        document
            .getElementById(
                "filtroStatus"
            )
            .value;


    const pesquisa =
        document
            .getElementById(
                "pesquisa"
            )
            .value
            .toLowerCase()
            .trim();


    dias.forEach(
        function(d, i) {

            let data =
                new Date(
                    inicio
                );


            data.setDate(
                inicio.getDate() +
                i
            );


            document
                .getElementById(
                    d[0]
                )
                .innerHTML =
                "";


            document
                .getElementById(
                    d[1]
                )
                .innerText =
                formatarData(
                    data
                );


            let lista =
                atividades.filter(
                    function(x) {

                        return (

                            x.data ===
                            dataISO(data)

                            &&

                            (
                                !ft ||
                                x.tecnico === ft
                            )

                            &&

                            (
                                !fs ||
                                x.status === fs
                            )

                            &&

                            (
                                !pesquisa ||

                                (
                                    x.atividade +
                                    " " +
                                    (x.descricao || "") +
                                    " " +
                                    x.tecnico +
                                    " " +
                                    (x.local || "")
                                )
                                .toLowerCase()
                                .includes(
                                    pesquisa
                                )
                            )

                        );

                    }
                );


            const area =
                document.getElementById(
                    d[0]
                );


            if (!lista.length) {

                area.innerHTML =
                    '<div class="vazio">' +
                    'Nenhuma atividade' +
                    '</div>';

                return;

            }


            lista.forEach(
                function(x) {

                    let div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "atividade";


                    if (
                        String(x.id) ===
                        String(idEditando)
                    ) {

                        div.classList.add(
                            "editando"
                        );

                    }


                    let st = {

                        "Planejado":
                            "planejado",

                        "Em andamento":
                            "andamento",

                        "Concluído":
                            "concluido",

                        "Pendente":
                            "pendente"

                    }[
                        x.status
                    ] || "";


                    let pc = {

                        "Alta":
                            "alta",

                        "Média":
                            "media",

                        "Baixa":
                            "baixa"

                    }[
                        x.prioridade ||
                        "Média"
                    ];


                    let botoes =
                        estaLogado()

                            ? `

                                <button
                                    class="btn-editar"
                                    onclick="editarAtividade('${String(x.id).replace(/'/g, "\\'")}')">

                                    Editar

                                </button>

                                <button
                                    class="btn-excluir"
                                    onclick="excluirAtividade('${String(x.id).replace(/'/g, "\\'")}')">

                                    Excluir

                                </button>

                            `

                            : "";


                    div.innerHTML =

                        `<strong>
                            ${esc(x.atividade)}
                        </strong>

                        <div class="tecnico">
                            👷 Técnico:
                            ${esc(x.tecnico)}
                        </div>

                        ${
                            x.local
                                ? `
                                    <div class="local">
                                        📍 ${esc(x.local)}
                                    </div>
                                  `
                                : ""
                        }

                        <div class="prioridade ${pc}">
                            ● Prioridade:
                            ${esc(
                                x.prioridade ||
                                "Média"
                            )}
                        </div>

                        <br>

                        <span class="status ${st}">
                            ${esc(
                                x.status
                            )}
                        </span>

                        ${
                            x.descricao
                                ? `<details class="descricao-servico"><summary>Mais detalhes</summary><p>${esc(x.descricao)}</p></details>`
                                : ""
                        }

                        <br>

                        ${botoes}`;


                    area.appendChild(
                        div
                    );

                }
            );

        }
    );


    /* MOSTRA QUAL SEMANA ESTÁ SENDO VISUALIZADA */

    let fim =
        new Date(
            inicio
        );


    fim.setDate(
        inicio.getDate() +
        6
    );


    document
        .getElementById(
            "semanaInfo"
        )
        .innerText =

        "Semana: " +
        formatarData(inicio) +
        " até " +
        formatarData(fim);

    
    atualizarResumo();

}


/* =========================================================
   RESUMO
========================================================= */

function atualizarResumo() {

    document
        .getElementById(
            "total"
        )
        .innerText =
        atividades.length;


    document
        .getElementById(
            "planejados"
        )
        .innerText =

        atividades.filter(
            function(x) {

                return x.status ===
                    "Planejado";

            }
        ).length;


    document
        .getElementById(
            "andamento"
        )
        .innerText =

        atividades.filter(
            function(x) {

                return x.status ===
                    "Em andamento";

            }
        ).length;


    document
        .getElementById(
            "concluidos"
        )
        .innerText =

        atividades.filter(
            function(x) {

                return x.status ===
                    "Concluído";

            }
        ).length;


    document
        .getElementById(
            "pendentes"
        )
        .innerText =

        atividades.filter(
            function(x) {

                return x.status ===
                    "Pendente";

            }
        ).length;

}


/* =========================================================
   FILTRO DE TÉCNICOS
========================================================= */

function atualizarFiltroTecnicos() {

    const select =
        document.getElementById(
            "filtroTecnico"
        );


    const atual =
        select.value;


    const tecnicos =

        [
            ...new Set(

                atividades

                    .map(
                        function(x) {

                            return x.tecnico;

                        }
                    )

                    .filter(Boolean)

            )
        ]

        .sort(
            function(a, b) {

                return a.localeCompare(
                    b
                );

            }
        );


    select.innerHTML =
        '<option value="">' +
        'Todos os técnicos' +
        '</option>';


    tecnicos.forEach(
        function(x) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                x;

            option.textContent =
                x;


            select.appendChild(
                option
            );

        }
    );


    select.value =
        atual;

}


/* =========================================================
   NAVEGAÇÃO ENTRE SEMANAS
========================================================= */

function semanaAnterior() {

    dataReferencia.setDate(
        dataReferencia.getDate() -
        7
    );


    renderizar();

}


function proximaSemana() {

    dataReferencia.setDate(
        dataReferencia.getDate() +
        7
    );


    renderizar();

}


function irParaHoje() {

    dataReferencia =
        new Date();


    renderizar();

}


/* =========================================================
   ESCAPE DE HTML
========================================================= */

function esc(v) {

    return String(
        v ?? ""
    )
    .replace(
        /[&<>"']/g,
        function(c) {

            return {

                "&":
                    "&amp;",

                "<":
                    "&lt;",

                ">":
                    "&gt;",

                '"':
                    "&quot;",

                "'":
                    "&#039;"

            }[c];

        }
    );

}


/* =========================================================
   EXPORTAR CSV
========================================================= */

function exportarCSV() {

    if (!atividades.length) {

        alert(
            "Não há atividades para exportar."
        );

        return;

    }


    let linhas = [

        [
            "ID",
            "Data",
            "Atividade",
            "Descrição do serviço",
            "Técnico",
            "Local",
            "Prioridade",
            "Status"
        ],

        ...atividades.map(
            function(x) {

                return [

                    x.id,

                    x.data,

                    x.atividade,

                    x.descricao || "",

                    x.tecnico,

                    x.local || "",

                    x.prioridade ||
                        "Média",

                    x.status

                ];

            }
        )

    ];


    let csv =

        linhas

            .map(
                function(l) {

                    return l

                        .map(
                            function(v) {

                                return '"' +
                                    String(v)
                                    .replace(
                                        /"/g,
                                        '""'
                                    ) +
                                    '"';

                            }
                        )

                        .join(";");

                }
            )

            .join("\n");


    let a =
        document.createElement(
            "a"
        );


    a.href =
        URL.createObjectURL(

            new Blob(
                [
                    "\ufeff" +
                    csv
                ],

                {
                    type:
                        "text/csv;charset=utf-8"
                }
            )

        );


    a.download =
        "agenda_inspetor.csv";


    a.click();

}


/* =========================================================
   LIMPAR AGENDA
========================================================= */

async function limparAgenda() {

    if (!estaLogado()) {

        abrirLogin();

        return;

    }


    if (!atividades.length)
        return;


    if (
        !confirm(
            "Isso apagará TODAS as atividades da Google Planilha. Continuar?"
        )
    ) {

        return;

    }


    try {

        setStatusConexao(
            "Limpando agenda na planilha...",
            "aviso"
        );


        const retorno =
            await apiPost({

                acao:
                    "limpar",

                token:
                    token

            });


        if (!retorno.sucesso) {

            throw new Error(
                retorno.erro ||
                retorno.message ||
                retorno.mensagem ||
                "Não foi possível limpar."
            );

        }


        await sincronizar();

        cancelarEdicao();


        setStatusConexao(
            "✓ Agenda limpa na Google Planilha.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            erro
        );


        if (
            String(
                erro.message
            )
            .toLowerCase()
            .includes("sessão")
        ) {

            sair();

        }


        alert(
            "Não foi possível limpar a planilha.\n\n" +
            erro.message
        );


        setStatusConexao(
            "⚠ Erro ao limpar a planilha.",
            "erro"
        );

    }

}


/* =========================================================
   ENTER NO LOGIN
========================================================= */

document
    .getElementById(
        "loginSenha"
    )
    .addEventListener(
        "keydown",
        function(e) {

            if (
                e.key ===
                "Enter"
            ) {

                login();

            }

        }
    );


/* =========================================================
   FECHAR LOGIN CLICANDO FORA
========================================================= */

document
    .getElementById(
        "modalTecnico"
    )
    .addEventListener(
        "click",
        function(e) {
            if (e.target === this) {
                fecharDetalhesTecnico();
            }
        }
    );


document
    .getElementById(
        "modalLogin"
    )
    .addEventListener(
        "click",
        function(e) {

            if (
                e.target === this
            ) {

                fecharLogin();

            }

        }
    );


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document
    .getElementById(
        "data"
    )
    .value =
    dataISO(
        new Date()
    );


carregarCacheLocal();

atualizarFiltroTecnicos();

atualizarInterfaceLogin();

validarSessaoAdmin();

renderizar();

sincronizar();


/* =========================================================
   SINCRONIZAÇÃO AUTOMÁTICA
========================================================= */

setInterval(
    sincronizar,
    30000
);


/* =========================================================
   ATUALIZA AO VOLTAR PARA A ABA
========================================================= */

document.addEventListener(
    "visibilitychange",
    function() {

        if (!document.hidden) {

            sincronizar();

        }

    }
);

