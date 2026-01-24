import { state } from "../../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../../core/config.js";
import { fetchClients, updateClientPlan } from "../../api/supabase.js";
import { navigate } from "../navigation.js";

export const PlansPage = () => {
  window.handlePlanSearch = (val) => {
    state.planSearchTerm = val;
    if (window.render) window.render();
    setTimeout(() => {
      const input = document.getElementById("planSearchInput");
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }, 50);
  };

  window.togglePlanSort = (field) => {
    state.planSort =
      state.planSort === `${field}_asc` ? `${field}_desc` : `${field}_asc`;
    if (window.render) window.render();
  };

  window.toggleAddPlanModal = (show) => {
    state.isAddPlanModalOpen = show;
    if (window.render) window.render();
  };

  window.saveNewPlanClient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    const name = formData.get("nome");
    const existingClient = state.clients.find(
      (c) => c.nome.toLowerCase() === name.trim().toLowerCase(),
    );

    const payload = {
      nome: name,
      plano: formData.get("plano"),
      plano_pagamento: new Date().toISOString().split("T")[0],
      limite_cortes: parseInt(formData.get("limite_cortes")) || 99,
    };

    try {
      let url = `${SUPABASE_URL}/rest/v1/clientes`;
      let method = "POST";

      if (existingClient) {
        url += `?id=eq.${existingClient.id}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        state.isAddPlanModalOpen = false;
        fetchClients();
      } else {
        alert("Erro ao salvar dados do cliente.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  };

  window.filterPlanModalSuggestions = (val) => {
    const list = document.getElementById("plan-modal-suggestions");
    if (!list) return;

    if (!val) {
      list.classList.add("hidden");
      return;
    }

    const matches = state.clients
      .filter((c) => c.nome.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 5);

    if (matches.length === 0) {
      list.classList.add("hidden");
      return;
    }

    list.innerHTML = matches
      .map(
        (c) => `
        <div onclick="window.selectPlanModalClient('${c.nome}')" 
             class="p-4 hover:bg-white/5 cursor-pointer transition-colors flex justify-between items-center group/item border-b border-transparent last:border-0">
            <span class="font-bold text-white text-sm group-hover/item:text-brand-primary transition-colors">${c.nome}</span>
        </div>
    `,
      )
      .join("");
    list.classList.remove("hidden");
  };

  window.selectPlanModalClient = (nome) => {
    const form = document.querySelector("#plan-modal-form");
    if (form) form.nome.value = nome;
    document.getElementById("plan-modal-suggestions").classList.add("hidden");
  };

  const clientsWithPlans = state.clients.filter(
    (c) => c.plano && c.plano !== "Nenhum",
  );

  const sortedPlans = [...clientsWithPlans].sort((a, b) => {
    const field = state.planSort.split("_")[0];
    const order = state.planSort.split("_")[1];

    if (field === "nome") {
      const valA = (a.nome || "").toLowerCase();
      const valB = (b.nome || "").toLowerCase();
      return order === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return 0;
  });

  const filteredPlans = sortedPlans.filter((c) => {
    if (!state.planSearchTerm) return true;
    const search = state.planSearchTerm.toLowerCase();
    const name = (c.nome || "").toLowerCase();
    return name.includes(search);
  });

  return `
        <div class="px-4 pt-6 sm:px-8 sm:pt-6 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div class="flex justify-between items-end">
                <div>
                    <h2 class="text-2xl sm:text-3xl font-display font-bold">Planos</h2>
                    <p class="text-slate-500 text-xs sm:text-sm mt-1">Gestão de Assinaturas</p>
                </div>
                <div class="hidden sm:flex items-center gap-4">
                    <button onclick="window.toggleAddPlanModal(true)" class="bg-brand-primary text-surface-page px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-brand-primary/20">
                        <i class="fas fa-plus mr-2"></i> Novo Plano
                    </button>
                    <div class="bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-2xl border border-transparent flex items-center gap-3">
                        <i class="fas fa-chart-pie"></i>
                        <span class="text-xs font-black uppercase tracking-widest">${clientsWithPlans.length} Clientes Ativos</span>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 class="text-lg font-bold text-brand-primary uppercase tracking-widest text-sm flex items-center gap-2 ml-2">
                        <i class="fas fa-crown"></i> Assinantes Ativos
                    </h3>
                    <div class="relative w-full sm:w-80">
                        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                        <input type="text" id="planSearchInput" placeholder="Filtrar assinantes..." 
                               oninput="window.handlePlanSearch(this.value)" value="${state.planSearchTerm}"
                               class="w-full bg-dark-900 border border-transparent py-2.5 pl-11 pr-4 rounded-xl text-xs outline-none focus:border-brand-primary transition-all font-medium">
                    </div>
                </div>
                
                <div class="hidden md:grid grid-cols-12 gap-4 px-8 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-transparent bg-white/[0.01]">
                    <div class="col-span-2 pl-2 text-left cursor-pointer hover:text-brand-primary transition-colors flex items-center gap-2" onclick="window.togglePlanSort('nome')">
                        Cliente
                        <i class="fas fa-sort-${state.planSort === "nome_asc" ? "alpha-down" : "alpha-up"} text-brand-primary text-xs"></i>
                    </div>
                    <div class="col-span-2 text-left">Uso</div>
                    <div class="col-span-2 text-left">Últ. Pagto</div>
                    <div class="col-span-4 text-left">Observações</div>
                    <div class="col-span-1 text-left">Status</div>
                    <div class="col-span-1 text-left pr-2">Ações</div>
                </div>

                <div class="bg-dark-900/30 rounded-b-[2rem] rounded-t-none border border-transparent border-t-0 overflow-hidden min-h-[400px]">
                    ${
                      filteredPlans.length === 0
                        ? `
                        <div class="h-[400px] flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <i class="fas fa-user-slash text-4xl opacity-20"></i>
                            <p class="italic text-sm">Nenhum assinante encontrado para "${state.planSearchTerm}".</p>
                        </div>
                    `
                        : `
                        <div class="divide-y divide-transparent max-h-[700px] overflow-y-auto custom-scroll">
                            ${filteredPlans
                              .map((c) => {
                                const planStats = window.getClientPlanUsage
                                  ? window.getClientPlanUsage(c.nome)
                                  : { usageCount: 0 };
                                return `
                                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-6 hover:bg-white/[0.02] transition-colors group plan-client-card" data-name="${c.nome}">
                                    <div class="md:col-span-2 flex items-center justify-start gap-3 cursor-pointer group/name" onclick="navigate('client-profile', '${c.id}')">
                                        <div class="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold shrink-0 group-hover/name:bg-brand-primary group-hover/name:text-surface-page transition-all relative">
                                            ${c.nome.charAt(0)}
                                            ${c.novo_cliente ? `<div class="absolute -top-1 -right-1 w-2 h-2 bg-brand-primary rounded-full border-2 border-dark-900 animate-pulse"></div>` : ""}
                                        </div>
                                        <div class="min-w-0 text-left">
                                            <p class="font-bold text-white group-hover/name:text-brand-primary transition-colors truncate text-[11px]" title="${c.nome}">${c.nome}</p>
                                        </div>
                                    </div>
                                    <div class="md:col-span-2 flex flex-col justify-center gap-1">
                                        <div class="flex items-center gap-1.5 text-[11px] font-black tracking-tighter group/limit">
                                            <span class="${planStats?.usageCount >= (c.limite_cortes || 99) ? "text-slate-600" : "text-slate-300"}">${planStats?.usageCount || 0}</span>
                                            <span class="text-slate-600">/</span>
                                            <input type="number" value="${c.limite_cortes || 99}" min="1" max="99" id="limit_input_${c.id}"
                                                   onchange="window.updateClientPlan('${c.id}', { limite_cortes: parseInt(this.value) || 99 })"
                                                   class="w-6 bg-transparent border-none text-[11px] font-black p-0 outline-none text-white/60 focus:text-brand-primary hover:text-white transition-colors text-center cursor-pointer [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                                            <div class="flex flex-col gap-0.5 opacity-50 group-hover/limit:opacity-100 transition-opacity">
                                                <button onclick="window.adjustLimitCortes('${c.id}', parseInt(document.getElementById('limit_input_${c.id}').value || 99) + 1)"
                                                        class="w-4 h-3 rounded-sm bg-white/5 text-slate-500 hover:bg-slate-300/30 hover:text-slate-300 active:scale-90 transition-all flex items-center justify-center text-[7px]">
                                                    <i class="fas fa-chevron-up"></i>
                                                </button>
                                                <button onclick="window.adjustLimitCortes('${c.id}', parseInt(document.getElementById('limit_input_${c.id}').value || 99) - 1)"
                                                        class="w-4 h-3 rounded-sm bg-white/5 text-slate-500 hover:bg-slate-600/30 hover:text-slate-600 active:scale-90 transition-all flex items-center justify-center text-[7px]">
                                                    <i class="fas fa-chevron-down"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                                            <div class="h-full ${planStats?.usageCount >= (c.limite_cortes || 99) ? "bg-slate-600" : "bg-slate-300"} transition-all duration-500" 
                                                 style="width: ${Math.min(100, ((planStats?.usageCount || 0) / (c.limite_cortes || 99)) * 100)}%"></div>
                                        </div>
                                    </div>
                                    <div class="md:col-span-2 flex flex-col justify-start">
                                        <input type="date" value="${c.plano_pagamento || ""}" 
                                               onchange="window.updateClientPlan('${c.id}', { plano_pagamento: this.value })"
                                               style="color-scheme: dark"
                                               class="w-full bg-dark-900 border ${c.plano_pagamento && (new Date() - new Date(c.plano_pagamento)) / (1000 * 60 * 60 * 24) > 30 ? "border-slate-600/50" : "border-transparent"} text-[10px] font-bold rounded-xl px-2 py-2 outline-none focus:border-transparent transition-all text-white cursor-pointer hover:bg-white/5 text-left">
                                        ${c.plano_pagamento && (new Date() - new Date(c.plano_pagamento)) / (1000 * 60 * 60 * 24) > 30 ? `<span class="text-[8px] text-slate-600 font-bold mt-1 uppercase tracking-tighter ml-1">Vencido</span>` : ""}
                                    </div>
                                    <div class="md:col-span-4 relative group/obs text-left">
                                        <div contenteditable="true" id="edit_plan_obs_${c.id}" spellcheck="false" autocomplete="off"
                                             onblur="window.updateClientPlan('${c.id}', { observacoes_plano: this.innerText.trim() })" onfocus="window.selectAll(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="w-full bg-dark-900 border border-transparent text-[10px] font-bold rounded-xl px-3 py-2.5 outline-none focus:border-transparent transition-all text-slate-400 focus:text-white whitespace-pre-wrap break-words cursor-text overflow-hidden text-left">${!c.observacoes_plano || c.observacoes_plano.includes("...") ? "Adicionar Nota..." : c.observacoes_plano}</div>
                                    </div>
                                    <div class="md:col-span-1 flex justify-start">
                                        <select onchange="window.updateClientPlan('${c.id}', { plano: this.value })" 
                                                class="w-full bg-dark-950 border border-transparent text-[10px] font-bold rounded-lg px-0 py-2 outline-none focus:border-brand-primary transition-all cursor-pointer appearance-none text-left hover:border-transparent ${c.plano === "Pausado" ? "text-text-primary" : "text-white"}">
                                            <option value="Mensal" ${c.plano === "Mensal" ? "selected" : ""}>MES</option>
                                            <option value="Semestral" ${c.plano === "Semestral" ? "selected" : ""}>SEM</option>
                                            <option value="Anual" ${c.plano === "Anual" ? "selected" : ""}>ANO</option>
                                            <option value="Pausado" ${c.plano === "Pausado" ? "selected" : ""}>PAUSE</option>
                                        </select>
                                    </div>
                                    <div class="md:col-span-1 flex justify-start gap-1">
                                        <button onclick="window.updateClientPlan('${c.id}', { plano: 'Pausado' })" 
                                                class="w-8 h-8 rounded-lg bg-text-primary/10 text-text-primary hover:bg-text-primary hover:text-surface-page transition-all flex items-center justify-center border border-text-primary/20 active:scale-95 shadow-lg shadow-text-primary/5"
                                                title="Pausar">
                                            <i class="fas fa-pause text-[10px]"></i>
                                        </button>
                                        <button onclick="if(confirm('Resetar ciclo?')){ window.updateClientPlan('${c.id}', { plano_pagamento: new Date().toISOString().split('T')[0] }) }" 
                                                class="w-8 h-8 rounded-lg bg-slate-300/10 text-slate-300 hover:bg-slate-300 hover:text-white transition-all flex items-center justify-center border border-slate-300/20 active:scale-95 shadow-lg shadow-slate-300/5"
                                                title="Resetar">
                                            <i class="fas fa-rotate text-[10px]"></i>
                                        </button>
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

            ${
              state.isAddPlanModalOpen
                ? `
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div class="bg-dark-900 border border-transparent rounded-[2rem] w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onclick="window.toggleAddPlanModal(false)" class="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Novo Assinante</h3>
                        <p class="text-slate-500 text-sm mb-6">Cadastre um novo cliente já com o plano ativo.</p>
                        <form id="plan-modal-form" onsubmit="window.saveNewPlanClient(event)" class="space-y-4" autocomplete="off">
                            <div class="space-y-1 relative">
                                <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nome do Cliente</label>
                                <input type="text" name="nome" required placeholder="Digite para buscar..." 
                                       oninput="window.filterPlanModalSuggestions(this.value)"
                                       onfocus="window.filterPlanModalSuggestions(this.value)"
                                       class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-transparent transition-all font-bold text-white">
                                <div id="plan-modal-suggestions" class="hidden absolute left-0 right-0 top-full mt-2 bg-dark-900 border border-transparent rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"></div>
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Plano</label>
                                <select name="plano" required class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-transparent transition-all font-bold text-white cursor-pointer appearance-none">
                                    <option value="Mensal">Mensal</option>
                                    <option value="Semestral">Semestral</option>
                                    <option value="Anual">Anual</option>
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Limite de Cortes</label>
                                <div class="relative">
                                    <input type="number" name="limite_cortes" value="99" min="1" max="99" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-transparent transition-all font-bold text-white pl-10">
                                    <i class="fas fa-scissors absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                                </div>
                            </div>
                            <div class="pt-4">
                                <button type="submit" class="w-full bg-brand-primary text-surface-page font-black py-4 rounded-xl hover:shadow-lg hover:shadow-brand-primary/20 transition-all uppercase tracking-widest text-xs">Cadastrar Assinante</button>
                            </div>
                        </form>
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `;
};
