<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Agenda do Inspetor</title>

<style>
* {
    box-sizing: border-box;
    font-family: Arial, sans-serif;
}

body {
    margin: 0;
    background: #f4f6f8;
    color: #263238;
}

.container {
    max-width: 1200px;
    margin: auto;
    padding: 20px;
}

h1 {
    color: #1565c0;
    margin-bottom: 5px;
}

.subtitulo {
    color: #607d8b;
    margin-bottom: 20px;
}

.painel {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin-bottom: 20px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

label {
    font-size: 13px;
    font-weight: bold;
    color: #455a64;
    display: block;
    margin-bottom: 5px;
}

input, select {
    width: 100%;
    padding: 10px;
    border: 1px solid #cfd8dc;
    border-radius: 6px;
    font-size: 14px;
}

button {
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}

.btn-adicionar {
    background: #1565c0;
    color: white;
    margin-top: 20px;
}

.btn-adicionar:hover {
    background: #0d47a1;
}

.btn-excluir {
    background: #ef5350;
    color: white;
    padding: 5px 8px;
    font-size: 11px;
    margin-top: 8px;
}

.btn-editar {
    background: #ff9800;
    color: white;
    padding: 5px 8px;
    font-size: 11px;
    margin-top: 8px;
}

.filtros {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 15px;
}

.filtros select {
    max-width: 220px;
}

.semana-info {
    background: #e3f2fd;
    color: #1565c0;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-weight: bold;
}

.agenda {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
}

.dia {
    background: #ffffff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    min-height: 220px;
}

.cabecalho-dia {
    background: #1565c0;
    color: white;
    text-align: center;
    padding: 10px 5px;
    font-weight: bold;
}

.data-dia {
    font-size: 12px;
    font-weight: normal;
    margin-top: 3px;
}

.atividade {
    margin: 10px;
    padding: 10px;
    border-radius: 8px;
    background: #f5f5f5;
    border-left: 5px solid #90a4ae;
}

.atividade strong {
    display: block;
    margin-bottom: 5px;
}

.tecnico {
    font-size: 13px;
    color: #546e7a;
    margin-top: 5px;
}

.status {
    display: inline-block;
    margin-top: 8px;
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: bold;
}

.planejado {
    background: #e3f2fd;
    color: #1565c0;
}

.andamento {
    background: #fff3e0;
    color: #ef6c00;
}

.concluido {
    background: #e8f5e9;
    color: #2e7d32;
}

.pendente {
    background: #ffebee;
    color: #c62828;
}

.vazio {
    text-align: center;
    color: #90a4ae;
    font-size: 13px;
    padding: 20px 5px;
}

.resumo {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.card-resumo {
    flex: 1;
    min-width: 150px;
    background: white;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.07);
}

.numero {
    font-size: 25px;
    font-weight: bold;
    color: #1565c0;
}

.descricao {
    color: #607d8b;
    font-size: 13px;
}

.navegacao {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    gap: 10px;
}

.btn-semana {
    background: #546e7a;
    color: white;
}

.btn-hoje {
    background: #1565c0;
    color: white;
}

@media (max-width: 900px) {
    .agenda {
        grid-template-columns: repeat(2, 1fr);
    }

    .form-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .agenda {
        grid-template-columns: 1fr;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .navegacao {
        flex-direction: column;
    }
}

.form-grid { grid-template-columns: repeat(5, 1fr); }
.btn-secundario { background:#eceff1; color:#263238; margin-top:20px; }
.btn-editar { margin-right:5px; }
.btn-exportar { background:#2e7d32; color:white; }
.btn-limpar { background:#78909c; color:white; }
.acoes-topo { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:15px; }
.pesquisa { max-width:420px; }
.prioridade { display:inline-block; margin-top:7px; font-size:11px; font-weight:bold; }
.alta { color:#c62828; } .media { color:#ef6c00; } .baixa { color:#2e7d32; }
.local { font-size:13px; color:#546e7a; margin-top:5px; }
.editando { border:2px solid #ff9800; }
.sucesso-sync { color:#2e7d32 !important; }
.erro-sync { color:#c62828 !important; }
.aviso-sync { color:#ef6c00 !important; }
@media (max-width: 1100px) { .form-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 600px) { .form-grid { grid-template-columns:1fr; } }

</style>
</head>

<body>

<div class="container">

<h1>📋 Agenda de Atividades do Inspetor</h1>

<div class="subtitulo">
Planejamento e acompanhamento semanal dos serviços
</div>

<div class="painel" style="padding:14px 20px;">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
    <div>
      <strong>☁️ Sincronização com Google Planilhas</strong>
      <div id="statusConexao" style="font-size:12px;color:#607d8b;margin-top:4px;">
        Configure a URL do Google Apps Script para sincronizar os dados.
      </div>
    </div>
    <button class="btn-secundario" onclick="configurarAPI()" style="margin-top:0;">
      ⚙ Configurar conexão
    </button>
  </div>
</div>


<!-- RESUMO -->

<div class="resumo">

<div class="card-resumo">
<div class="numero" id="total">0</div>
<div class="descricao">Total de atividades</div>
</div>

<div class="card-resumo">
<div class="numero" id="planejados">0</div>
<div class="descricao">Planejadas</div>
</div>

<div class="card-resumo">
<div class="numero" id="andamento">0</div>
<div class="descricao">Em andamento</div>
</div>

<div class="card-resumo">
<div class="numero" id="concluidos">0</div>
<div class="descricao">Concluídas</div>
</div>
<div class="card-resumo">
<div class="numero" id="pendentes">0</div>
<div class="descricao">Pendentes</div>
</div>

</div>


<!-- CADASTRO -->

<div class="painel">

<h2>➕ Nova atividade</h2>

<div class="form-grid">
<div><label>Data da atividade</label><input type="date" id="data"></div>
<div><label>Atividade</label><input type="text" id="atividade" placeholder="Ex.: Inspeção de instalação"></div>
<div><label>Nome do técnico</label><input type="text" id="tecnico" placeholder="Nome do técnico"></div>
<div><label>Cidade / Local</label><input type="text" id="local" placeholder="Ex.: Soledade - PB"></div>
<div><label>Prioridade</label><select id="prioridade"><option value="Média">Média</option><option value="Alta">Alta</option><option value="Baixa">Baixa</option></select></div>
<div><label>Status do serviço</label><select id="status"><option value="Planejado">Planejado</option><option value="Em andamento">Em andamento</option><option value="Concluído">Concluído</option><option value="Pendente">Pendente</option></select></div>
</div>
<button class="btn-adicionar" id="btnSalvar" onclick="salvarAtividade()">Adicionar atividade</button>
<button class="btn-secundario" id="btnCancelar" onclick="cancelarEdicao()" style="display:none">Cancelar edição</button>

</div>


<!-- FILTROS -->

<div class="painel">

<h2>🔎 Filtros</h2>
<div class="acoes-topo">
<input class="pesquisa" type="text" id="pesquisa" placeholder="🔎 Pesquisar atividade, técnico ou local" oninput="renderizar()">
<button class="btn-exportar" onclick="exportarCSV()">⬇ Exportar CSV</button>
<button class="btn-limpar" onclick="limparAgenda()">🗑 Limpar agenda</button>
</div>

<div class="filtros">

<select
id="filtroTecnico"
onchange="renderizar()"
>

<option value="">
Todos os técnicos
</option>

</select>


<select
id="filtroStatus"
onchange="renderizar()"
>

<option value="">
Todos os status
</option>

<option value="Planejado">
Planejado
</option>

<option value="Em andamento">
Em andamento
</option>

<option value="Concluído">
Concluído
</option>

<option value="Pendente">
Pendente
</option>

</select>

</div>

</div>


<!-- NAVEGAÇÃO -->

<div class="painel">

<div class="navegacao">

<button
class="btn-semana"
onclick="semanaAnterior()"
>
◀ Semana anterior
</button>

<button
class="btn-hoje"
onclick="irParaHoje()"
>
📅 Semana atual
</button>

<button
class="btn-semana"
onclick="proximaSemana()"
>
Próxima semana ▶
</button>

</div>

<div
class="semana-info"
id="semanaInfo"
>
</div>

</div>


<!-- AGENDA -->

<div class="agenda">

<div class="dia">
<div class="cabecalho-dia">
SEGUNDA
<div class="data-dia" id="dataSegunda"></div>
</div>
<div id="Segunda"></div>
</div>


<div class="dia">
<div class="cabecalho-dia">
TERÇA
<div class="data-dia" id="dataTerca"></div>
</div>
<div id="Terça"></div>
</div>


<div class="dia">
<div class="cabecalho-dia">
QUARTA
<div class="data-dia" id="dataQuarta"></div>
</div>
<div id="Quarta"></div>
</div>


<div class="dia">
<div class="cabecalho-dia">
QUINTA
<div class="data-dia" id="dataQuinta"></div>
</div>
<div id="Quinta"></div>
</div>


<div class="dia">
<div class="cabecalho-dia">
SEXTA
<div class="data-dia" id="dataSexta"></div>
</div>
<div id="Sexta"></div>
</div>


<div class="dia">
<div class="cabecalho-dia">
SÁBADO
<div class="data-dia" id="dataSabado"></div>
</div>
<div id="Sábado"></div>
</div>


<div class="dia">
<div class="cabecalho-dia">
DOMINGO
<div class="data-dia" id="dataDomingo"></div>
</div>
<div id="Domingo"></div>
</div>

</div>

</div>


<script>
/*
 * AGENDA DO INSPETOR — GOOGLE PLANILHAS
 * 1) Publique o Apps Script como aplicativo da web.
 * 2) Cole a URL /exec abaixo.
 * 3) O site passa a buscar e salvar os dados na planilha.
 */
const API_URL_PADRAO = "";
let API_URL = localStorage.getItem("agendaInspetorApiUrl") || API_URL_PADRAO;

let atividades = [];
let dataReferencia = new Date();
let idEditando = null;
let sincronizando = false;

function formatarData(d){
    return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();
}
function dataISO(d){
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function inicioSemana(d){
    let n=new Date(d), dia=n.getDay();
    n.setDate(n.getDate()+(dia===0?-6:1-dia));
    n.setHours(0,0,0,0);
    return n;
}
function bancoLocal(){
    localStorage.setItem("agendaInspetor", JSON.stringify(atividades));
}
function carregarCacheLocal(){
    try { atividades = JSON.parse(localStorage.getItem("agendaInspetor") || "[]") || []; }
    catch(e){ atividades=[]; }
}
function setStatusConexao(texto, tipo=""){
    const el=document.getElementById("statusConexao");
    if(!el) return;
    el.textContent=texto;
    el.className = tipo ? tipo+"-sync" : "";
}
function apiConfigurada(){
    return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/i.test(API_URL || "");
}
function configurarAPI(){
    const atual = API_URL || "";
    const nova = prompt(
        "Cole aqui a URL do Google Apps Script publicada como aplicativo da web (termina em /exec):",
        atual
    );
    if(nova === null) return;
    const valor=nova.trim();
    if(valor && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/i.test(valor)){
        alert("URL inválida. Use a URL do aplicativo da web do Google Apps Script, terminando em /exec.");
        return;
    }
    API_URL=valor;
    if(valor) localStorage.setItem("agendaInspetorApiUrl", valor);
    else localStorage.removeItem("agendaInspetorApiUrl");
    sincronizar();
}

async function apiGet(){
    const resposta=await fetch(API_URL, {method:"GET", cache:"no-store"});
    if(!resposta.ok) throw new Error("HTTP "+resposta.status);
    return await resposta.json();
}
async function apiPost(payload){
    // text/plain evita preflight CORS no Google Apps Script.
    const resposta=await fetch(API_URL, {
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify(payload)
    });
    if(!resposta.ok) throw new Error("HTTP "+resposta.status);
    return await resposta.json();
}

async function sincronizar(){
    if(!apiConfigurada()){
        setStatusConexao("Modo local: configure a URL do Google Apps Script para sincronizar.", "aviso");
        carregarCacheLocal();
        atualizarFiltroTecnicos();
        renderizar();
        return;
    }
    if(sincronizando) return;
    sincronizando=true;
    setStatusConexao("Sincronizando com a planilha...", "aviso");
    try{
        const dados=await apiGet();
        if(!dados.sucesso) throw new Error(dados.mensagem || "Falha ao buscar dados.");
        atividades=Array.isArray(dados.atividades) ? dados.atividades : [];
        bancoLocal();
        atualizarFiltroTecnicos();
        renderizar();
        setStatusConexao("✓ Conectado e sincronizado com a Google Planilha.", "sucesso");
    }catch(erro){
        console.error(erro);
        carregarCacheLocal();
        atualizarFiltroTecnicos();
        renderizar();
        setStatusConexao("⚠ Não foi possível conectar. Exibindo o último cache local.", "erro");
    }finally{
        sincronizando=false;
    }
}

function limparFormulario(){
    ["atividade","tecnico","local"].forEach(id=>document.getElementById(id).value="");
    document.getElementById("prioridade").value="Média";
    document.getElementById("status").value="Planejado";
}
function cancelarEdicao(){
    idEditando=null;
    limparFormulario();
    document.getElementById("btnSalvar").innerText="Adicionar atividade";
    document.getElementById("btnCancelar").style.display="none";
}
async function salvarAtividade(){
    const data=document.getElementById("data").value;
    const atividade=document.getElementById("atividade").value.trim();
    const tecnico=document.getElementById("tecnico").value.trim();
    const local=document.getElementById("local").value.trim();
    const prioridade=document.getElementById("prioridade").value;
    const status=document.getElementById("status").value;

    if(!data) return alert("Escolha a data da atividade.");
    if(!atividade||!tecnico) return alert("Preencha a atividade e o nome do técnico.");

    const item = {
        id: idEditando !== null ? idEditando : Date.now(),
        data, atividade, tecnico, local, prioridade, status
    };

    const botao=document.getElementById("btnSalvar");
    botao.disabled=true;

    try{
        if(apiConfigurada()){
            setStatusConexao(idEditando!==null ? "Salvando alteração..." : "Salvando atividade...", "aviso");
            const retorno=await apiPost({
                acao: idEditando!==null ? "editar" : "adicionar",
                atividade:item
            });
            if(!retorno.sucesso) throw new Error(retorno.mensagem || "Não foi possível salvar.");
            atividades=retorno.atividades || [];
            bancoLocal();
            setStatusConexao("✓ Dados salvos na Google Planilha.", "sucesso");
        }else{
            if(idEditando!==null){
                const x=atividades.find(a=>a.id===idEditando);
                if(x) Object.assign(x,item);
            }else{
                atividades.push(item);
            }
            bancoLocal();
            setStatusConexao("Modo local: configure a conexão para salvar na planilha.", "aviso");
        }
        cancelarEdicao();
        atualizarFiltroTecnicos();
        renderizar();
    }catch(erro){
        console.error(erro);
        alert("Não foi possível salvar na planilha.\n\n"+erro.message);
        setStatusConexao("⚠ Erro ao salvar na planilha.", "erro");
    }finally{
        botao.disabled=false;
    }
}
function editarAtividade(id){
    let x=atividades.find(a=>String(a.id)===String(id));
    if(!x)return;
    idEditando=x.id;
    document.getElementById("data").value=x.data;
    document.getElementById("atividade").value=x.atividade;
    document.getElementById("tecnico").value=x.tecnico;
    document.getElementById("local").value=x.local||"";
    document.getElementById("prioridade").value=x.prioridade||"Média";
    document.getElementById("status").value=x.status||"Planejado";
    document.getElementById("btnSalvar").innerText="Salvar alterações";
    document.getElementById("btnCancelar").style.display="inline-block";
    document.getElementById("atividade").focus();
    renderizar();
}
async function excluirAtividade(id){
    if(!confirm("Deseja excluir esta atividade?")) return;
    try{
        if(apiConfigurada()){
            setStatusConexao("Excluindo atividade...", "aviso");
            const retorno=await apiPost({acao:"excluir", id:id});
            if(!retorno.sucesso) throw new Error(retorno.mensagem || "Não foi possível excluir.");
            atividades=retorno.atividades || [];
            bancoLocal();
            setStatusConexao("✓ Atividade excluída da planilha.", "sucesso");
        }else{
            atividades=atividades.filter(x=>String(x.id)!==String(id));
            bancoLocal();
        }
        atualizarFiltroTecnicos();
        renderizar();
    }catch(erro){
        console.error(erro);
        alert("Não foi possível excluir na planilha.\n\n"+erro.message);
        setStatusConexao("⚠ Erro ao excluir na planilha.", "erro");
    }
}
function esc(v){
    return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function renderizar(){
    const inicio=inicioSemana(dataReferencia);
    const dias=[
        ["Segunda","dataSegunda"],["Terça","dataTerca"],["Quarta","dataQuarta"],
        ["Quinta","dataQuinta"],["Sexta","dataSexta"],["Sábado","dataSabado"],["Domingo","dataDomingo"]
    ];
    const ft=document.getElementById("filtroTecnico").value;
    const fs=document.getElementById("filtroStatus").value;
    const p=document.getElementById("pesquisa").value.toLowerCase().trim();

    dias.forEach((d,i)=>{
        let data=new Date(inicio);
        data.setDate(inicio.getDate()+i);
        document.getElementById(d[0]).innerHTML="";
        document.getElementById(d[1]).innerText=formatarData(data);

        let lista=atividades.filter(x=>
            x.data===dataISO(data) &&
            (!ft||x.tecnico===ft) &&
            (!fs||x.status===fs) &&
            (!p||(x.atividade+" "+x.tecnico+" "+(x.local||"")).toLowerCase().includes(p))
        );

        const area=document.getElementById(d[0]);
        if(!lista.length){
            area.innerHTML='<div class="vazio">Nenhuma atividade</div>';
            return;
        }

        lista.forEach(x=>{
            let div=document.createElement("div");
            div.className="atividade"+(String(x.id)===String(idEditando)?" editando":"");
            let st={"Planejado":"planejado","Em andamento":"andamento","Concluído":"concluido","Pendente":"pendente"}[x.status]||"";
            let pc={"Alta":"alta","Média":"media","Baixa":"baixa"}[x.prioridade||"Média"];

            div.innerHTML=
                `<strong>${esc(x.atividade)}</strong>
                <div class="tecnico">👷 Técnico: ${esc(x.tecnico)}</div>
                ${x.local?`<div class="local">📍 ${esc(x.local)}</div>`:""}
                <div class="prioridade ${pc}">● Prioridade: ${esc(x.prioridade||"Média")}</div><br>
                <span class="status ${st}">${esc(x.status)}</span><br>
                <button class="btn-editar" onclick="editarAtividade('${String(x.id).replace(/'/g,"\\'")}')">Editar</button>
                <button class="btn-excluir" onclick="excluirAtividade('${String(x.id).replace(/'/g,"\\'")}')">Excluir</button>`;
            area.appendChild(div);
        });
    });

    let fim=new Date(inicio);
    fim.setDate(inicio.getDate()+6);
    document.getElementById("semanaInfo").innerText="Semana: "+formatarData(inicio)+" até "+formatarData(fim);
    atualizarResumo();
}
function atualizarResumo(){
    document.getElementById("total").innerText=atividades.length;
    document.getElementById("planejados").innerText=atividades.filter(x=>x.status==="Planejado").length;
    document.getElementById("andamento").innerText=atividades.filter(x=>x.status==="Em andamento").length;
    document.getElementById("concluidos").innerText=atividades.filter(x=>x.status==="Concluído").length;
    document.getElementById("pendentes").innerText=atividades.filter(x=>x.status==="Pendente").length;
}
function atualizarFiltroTecnicos(){
    let s=document.getElementById("filtroTecnico"), at=s.value;
    let t=[...new Set(atividades.map(x=>x.tecnico).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    s.innerHTML='<option value="">Todos os técnicos</option>';
    t.forEach(x=>{
        let o=document.createElement("option");
        o.value=x; o.textContent=x; s.appendChild(o);
    });
    s.value=at;
}
function semanaAnterior(){dataReferencia.setDate(dataReferencia.getDate()-7);renderizar();}
function proximaSemana(){dataReferencia.setDate(dataReferencia.getDate()+7);renderizar();}
function irParaHoje(){dataReferencia=new Date();renderizar();}
function exportarCSV(){
    if(!atividades.length)return alert("Não há atividades para exportar.");
    let linhas=[
        ["ID","Data","Atividade","Técnico","Local","Prioridade","Status"],
        ...atividades.map(x=>[x.id,x.data,x.atividade,x.tecnico,x.local||"",x.prioridade||"Média",x.status])
    ];
    let csv=linhas.map(l=>l.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
    let a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));
    a.download="agenda_inspetor.csv";
    a.click();
}
async function limparAgenda(){
    if(!atividades.length)return;
    if(!confirm("Isso apagará TODAS as atividades da Google Planilha. Continuar?"))return;

    try{
        if(apiConfigurada()){
            setStatusConexao("Limpando agenda na planilha...", "aviso");
            const retorno=await apiPost({acao:"limpar"});
            if(!retorno.sucesso) throw new Error(retorno.mensagem || "Não foi possível limpar.");
            atividades=[];
            bancoLocal();
            setStatusConexao("✓ Agenda limpa na Google Planilha.", "sucesso");
        }else{
            atividades=[];
            bancoLocal();
            setStatusConexao("Agenda local limpa.", "aviso");
        }
        cancelarEdicao();
        atualizarFiltroTecnicos();
        renderizar();
    }catch(erro){
        console.error(erro);
        alert("Não foi possível limpar a planilha.\n\n"+erro.message);
        setStatusConexao("⚠ Erro ao limpar a planilha.", "erro");
    }
}

document.getElementById("data").value=dataISO(new Date());
carregarCacheLocal();
atualizarFiltroTecnicos();
renderizar();
sincronizar();

// Atualiza os dados periodicamente para que outros usuários apareçam no site.
setInterval(sincronizar, 60000);
</script>

</body>
</html>
