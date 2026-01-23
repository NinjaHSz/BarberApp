import { state } from "../../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../../core/config.js";
import { fetchClients, updateClientPlan } from "../../api/supabase.js";
import { syncFromSheet } from "../../api/sync.js";
import { navigate } from "../navigation.js";

export const ClientProfilePage = () => {
  const client = state.clients.find((c) => c.id == state.selectedClientId);
  if (!client) {
    return `
            <div class="p-8 h-full flex flex-col items-center justify-center text-center space-y-4">
                <i class="fas fa-user-slash text-6xl text-white/5"></i>
                <h2 class="text-2xl font-bold text-slate-400">Cliente não encontrado</h2>
                <button onclick="navigate('plans')" class="bg-amber-500 text-dark-950 px-6 py-2 rounded-xl font-bold">Voltar aos Planos</button>
            </div>
        `;
  }

  window.saveClientEdit = async (field, value) => {
    try {
      const updateData = { [field]: value };
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/clientes?id=eq.${client.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );
      if (res.ok) {
        Object.assign(client, updateData);
        fetchClients();
        if (field === "nome") {
          await syncFromSheet(state.sheetUrl);
          if (window.render) window.render();
        }
      } else {
        alert("Erro ao atualizar cliente.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clientRecords = state.records
    .filter(
      (r) =>
        (r.client || "").toLowerCase() === (client.nome || "").toLowerCase(),
    )
    .sort((a, b) => {
      const dateA = new Date(a.date + "T" + (a.time || "00:00"));
      const dateB = new Date(b.date + "T" + (b.time || "00:00"));
      return dateB - dateA;
    });

  const today = new Date().toISOString().split("T")[0];
  const pastRecords = clientRecords.filter((r) => r.date <= today);
  const totalSpent = pastRecords.reduce(
    (acc, r) => acc + (parseFloat(r.value) || 0),
    0,
  );
  const lastVisit = pastRecords.length > 0 ? pastRecords[0].date : "Nunca";

  return `
        <div class="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div class="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 text-3xl md:text-5xl font-black border-2 border-amber-500/20 shadow-2xl shadow-amber-500/5">
                    ${(client.nome || "?").charAt(0)}
                </div>
                <div class="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <div class="flex flex-wrap justify-center md:justify-start items-center gap-3">
                            <input type="text" value="${client.nome}" onfocus="window.selectAll(this)" onblur="window.saveClientEdit('nome', this.value)"
                                   class="text-3xl md:text-4xl font-display font-black text-white bg-transparent border-b-2 border-transparent hover:border-amber-500/30 focus:border-amber-500 outline-none transition-all px-2 -mx-2 uppercase">
                            ${client.plano !== "Nenhum" ? `<span class="px-3 py-1 bg-amber-500 text-dark-950 text-[10px] font-black uppercase rounded-lg shadow-lg shadow-amber-500/20">CLIENTE PREMIUM</span>` : ""}
                        </div>
                        <div class="mt-1 flex justify-center md:justify-start">
                            <div contenteditable="true" id="edit_prof_obs_${client.id}" spellcheck="false" autocomplete="off"
                                 onfocus="window.selectAll(this)" onblur="window.saveClientEdit('observacoes_cliente', this.innerText.trim())" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="text-xs text-slate-500 font-medium outline-none hover:text-white transition-all cursor-text whitespace-pre-wrap break-words italic max-w-sm md:max-w-md">${!client.observacoes_cliente || client.observacoes_cliente.includes("...") || client.observacoes_cliente.includes("permanentes") ? "Adcionar Nota..." : client.observacoes_cliente}</div>
                        </div>
                    </div>
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                        <button onclick="navigate('plans')" class="px-6 py-2 bg-dark-900 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/5 uppercase tracking-widest">
                            <i class="fas fa-arrow-left mr-2"></i> Voltar
                        </button>
                    </div>
                </div>
            </div>

            ${
              client.plano !== "Nenhum"
                ? `
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="glass-card p-6 rounded-[2rem] border border-amber-500/10 relative overflow-hidden group">
                        <div class="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl"></div>
                        <p class="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Tipo de Plano</p>
                        <h4 class="text-2xl font-black text-white">${client.plano}</h4>
                        <div class="mt-3 pt-3 border-t border-white/5">
                            <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Observações do Plano</p>
                            <div contenteditable="true" id="edit_prof_plan_obs_${client.id}" spellcheck="false" autocomplete="off"
                                 onfocus="window.selectAll(this)" onblur="window.saveClientEdit('observacoes_plano', this.innerText.trim())" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="text-[11px] text-slate-400 font-medium outline-none hover:text-white transition-all min-h-[1.5rem] cursor-text whitespace-pre-wrap break-words">${!client.observacoes_plano || client.observacoes_plano.includes("...") ? "Adcionar Nota..." : client.observacoes_plano}</div>
                        </div>
                    </div>
                    <div class="glass-card p-6 rounded-[2rem] border border-white/5">
                        <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Valor do Plano</p>
                        <div class="flex items-center gap-1">
                            <span class="text-slate-500 font-bold">R$</span>
                            <input type="number" step="0.01" value="${client.valor_plano || ""}" placeholder="0.00" onblur="window.saveClientEdit('valor_plano', this.value)"
                                   onkeydown="if(event.key==='Enter')this.blur()" class="bg-transparent border-none text-2xl font-black text-white hover:text-amber-500 transition-all outline-none w-full appearance-none">
                        </div>
                    </div>
                    <div class="glass-card p-6 rounded-[2rem] border border-white/5 relative group">
                        <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Último Ciclo/Pagamento</p>
                        <h4 class="text-2xl font-black text-white">${client.plano_pagamento ? new Date(client.plano_pagamento + "T00:00:00").toLocaleDateString("pt-BR") : "Não registrado"}</h4>
                        <button onclick="if(confirm('Deseja resetar o contador e iniciar um novo ciclo hoje?')){ window.updateClientPlan('${client.id}', { plano_pagamento: new Date().toISOString().split('T')[0] }) }" 
                                class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-white flex items-center justify-center" title="Resetar Ciclo Manualmente">
                            <i class="fas fa-rotate text-xs"></i>
                        </button>
                    </div>
                </div>
            `
                : ""
            }

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div class="bg-dark-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Investido</p>
                    <h3 class="text-2xl md:text-3xl font-display font-black text-amber-500">R$ ${totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h3>
                </div>
                <div class="bg-dark-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Visitas Realizadas</p>
                    <h3 class="text-2xl md:text-3xl font-display font-black text-white">${pastRecords.length}</h3>
                </div>
                <div class="bg-dark-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ticket Médio</p>
                    <h3 class="text-2xl md:text-3xl font-display font-black text-white">R$ ${(pastRecords.length ? totalSpent / pastRecords.length : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h3>
                </div>
                <div class="bg-dark-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Última Visita</p>
                    <h3 class="text-2xl md:text-3xl font-display font-black text-white">${lastVisit !== "Nunca" ? new Date(lastVisit + "T00:00:00").toLocaleDateString("pt-BR") : "Sem registros"}</h3>
                </div>
            </div>

            <div class="h-8"></div>

            <div class="space-y-4">
                <h3 class="text-lg font-bold text-white uppercase tracking-widest text-sm ml-2">Histórico de Visitas</h3>
                <div class="bg-dark-900/30 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                    ${
                      clientRecords.length === 0
                        ? `<div class="p-12 text-center text-slate-500 italic font-bold uppercase tracking-widest text-xs">Este cliente ainda não possui agendamentos registrados.</div>`
                        : `
                        <div class="divide-y divide-white/5 overflow-x-auto">
                            ${clientRecords
                              .map((r) => {
                                const id = r.id;
                                const rowId = `hist_${r.id}`;
                                return `
                                 <div class="px-8 py-5 flex flex-col md:flex-row items-center md:items-start justify-between hover:bg-white/[0.02] min-w-[600px] gap-6 group relative" style="z-index: 1;">
                                    <div class="flex items-start gap-6 flex-1 h-full">
                                        <div class="flex flex-col w-28 shrink-0">
                                            <div class="flex items-center gap-1.5 text-slate-500 mb-1">
                                                <i class="far fa-calendar-alt text-[10px]"></i>
                                                <span class="text-[10px] font-black uppercase tracking-tighter">Data</span>
                                            </div>
                                            <input type="date" data-id="${id}" data-ui-id="${rowId}" data-field="date" value="${r.date}" onchange="window.saveInlineEdit(this)" style="color-scheme: dark" class="bg-transparent border-none text-[12px] font-bold text-amber-500 outline-none cursor-pointer hover:bg-white/5 rounded px-1 transition-all">
                                        </div>
                                        <div class="flex flex-col w-48 shrink-0 relative">
                                            <div class="flex items-center gap-1.5 text-slate-500 mb-1">
                                                <i class="fas fa-cut text-[10px]"></i>
                                                <span class="text-[10px] font-black uppercase tracking-tighter">Procedimento</span>
                                            </div>
                                            <div contenteditable="true" data-id="${id}" data-ui-id="${rowId}" data-field="service" onfocus="this.parentElement.parentElement.parentElement.style.zIndex='100'; window.selectAll(this)" onblur="this.parentElement.parentElement.parentElement.style.zIndex='1'; window.saveInlineEdit(this)" onkeydown="window.handleInlineKey(event)" oninput="window.showInlineAutocomplete(this)" class="text-white font-black text-sm uppercase outline-none focus:bg-amber-500/10 rounded px-1 transition-all truncate">${r.service}</div>
                                            <div id="inlineAutocomplete_service_${rowId}" class="hidden absolute left-0 right-0 top-full mt-1 bg-dark-800 border border-white/10 rounded-xl shadow-2xl z-50 p-1"></div>
                                            <div class="flex items-center gap-2 mt-1">
                                                <input type="time" data-id="${id}" data-ui-id="${rowId}" data-field="time" value="${r.time.substring(0, 5)}" onchange="window.saveInlineEdit(this)" style="color-scheme: dark" class="bg-transparent border-none text-[10px] text-slate-500 font-bold outline-none cursor-pointer hover:bg-white/5 rounded px-1 transition-all">
                                                <span class="text-[10px] text-slate-700">·</span>
                                                <select onchange="window.saveInlineEdit(this)" data-id="${id}" data-ui-id="${rowId}" data-field="payment" class="appearance-none bg-transparent border-none text-[10px] text-slate-500 font-bold uppercase tracking-widest outline-none cursor-pointer hover:bg-white/5 rounded px-1 transition-all">
                                                    ${[
                                                      "PIX",
                                                      "DINHEIRO",
                                                      "CARTÃO",
                                                      "PLANO MENSAL",
                                                      "PLANO SEMESTRAL",
                                                      "PLANO ANUAL",
                                                      "CORTESIA",
                                                    ]
                                                      .map(
                                                        (p) => `
                                                        <option value="${p}" ${r.paymentMethod === p ? "selected" : ""} class="bg-dark-950">${p}</option>
                                                     `,
                                                      )
                                                      .join("")}
                                                </select>
                                            </div>
                                        </div>
                                        <div class="flex-1 flex flex-col min-h-[45px]">
                                            <div class="flex items-center gap-1.5 text-slate-500 mb-1">
                                                <i class="far fa-comment-alt text-[10px]"></i>
                                                <span class="text-[10px] font-black uppercase tracking-tighter">Observações</span>
                                            </div>
                                            <div contenteditable="true" data-id="${id}" data-ui-id="${rowId}" data-field="observations" onblur="window.saveInlineEdit(this)" onkeydown="window.handleInlineKey(event)" onfocus="window.selectAll(this)" class="text-[11px] text-slate-400 italic outline-none hover:text-slate-200 transition-all cursor-text min-h-[20px] px-1 rounded hover:bg-white/5 truncate focus:whitespace-normal focus:break-words focus:max-w-none max-w-[250px] lg:max-w-[400px]" title="${r.observations || ""}">
                                                ${r.observations || "Nenhuma observação..."}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-end gap-2 pr-2">
                                        <div class="flex items-center gap-1.5 text-slate-500 mb-0.5">
                                            <span class="text-[10px] font-black uppercase tracking-tighter">Valor</span>
                                        </div>
                                        <div class="flex items-center gap-6">
                                            <div class="flex items-center gap-1">
                                                <span class="text-xs font-black text-slate-500">R$</span>
                                                <div contenteditable="true" data-id="${id}" data-ui-id="${rowId}" data-field="value" onfocus="window.selectAll(this)" onblur="window.saveInlineEdit(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="text-lg font-black text-white outline-none focus:bg-amber-500/10 rounded px-1 transition-all">${(parseFloat(r.value) || 0).toFixed(2)}</div>
                                            </div>
                                            <button onclick="window.cancelAppointment('${r.id}')" class="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform active:scale-95 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg">
                                                <i class="fas fa-trash-can text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                `;
                              })
                              .join("")}
                        </div>
                    `
                    }
                </div>
            </div>
        </div>
    `;
};
