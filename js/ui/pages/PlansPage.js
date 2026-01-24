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
      valor_plano: parseFloat(formData.get("valor_plano")) || 0,
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

  // Metrics calculation
  const pendingRenewals = clientsWithPlans.filter((c) => {
    if (!c.plano_pagamento) return true;
    const diff =
      (new Date() - new Date(c.plano_pagamento)) / (1000 * 60 * 60 * 24);
    return diff > 30;
  }).length;

  const mrrTotal = clientsWithPlans.reduce(
    (acc, c) => acc + (parseFloat(c.valor_plano) || 0),
    0,
  );

  return `
        <div class="px-4 py-6 sm:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 max-w-7xl mx-auto">
            <!-- Header & KPIs -->
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div class="space-y-1">
                        <h2 class="text-2xl font-display font-black text-white uppercase tracking-tighter">Gestão de Planos</h2>
                        <p class="text-[9px] text-text-muted font-black uppercase tracking-widest italic">Performance e Retenção de Assinantes</p>
                    </div>
                    <button onclick="window.toggleAddPlanModal(true)" class="w-full sm:w-auto px-6 py-3 bg-brand-primary text-surface-page rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/10">
                        <i class="fas fa-plus text-[10px]"></i> Novo Assinante
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-surface-section/30 p-5 rounded-2xl flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-text-muted"><i class="fas fa-users text-sm"></i></div>
                        <div>
                            <p class="text-[8px] font-black text-text-muted uppercase tracking-widest">Ativos</p>
                            <h3 class="text-xl font-display font-black text-white">${clientsWithPlans.length}</h3>
                        </div>
                    </div>
                    <div class="bg-surface-section/30 p-5 rounded-2xl flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-text-muted"><i class="fas fa-clock text-sm"></i></div>
                        <div>
                            <p class="text-[8px] font-black text-text-muted uppercase tracking-widest">Pendentes</p>
                            <h3 class="text-xl font-display font-black text-white">${pendingRenewals}</h3>
                        </div>
                    </div>
                    <div class="bg-surface-section/30 p-5 rounded-2xl flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-text-muted"><i class="fas fa-sack-dollar text-sm"></i></div>
                        <div>
                            <p class="text-[8px] font-black text-text-muted uppercase tracking-widest">Receita Mensal</p>
                            <h3 class="text-xl font-display font-black text-brand-primary">R$ ${mrrTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
                    <div class="flex items-center gap-3">
                        <h3 class="text-[10px] font-black text-white uppercase tracking-widest italic">Lista de Assinantes</h3>
                        <span class="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-text-muted uppercase">${filteredPlans.length} resultados</span>
                    </div>
                    <div class="relative w-full sm:w-64">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[10px]"></i>
                        <input type="text" id="planSearchInput" placeholder="BUSCAR..." 
                               oninput="window.handlePlanSearch(this.value)" value="${state.planSearchTerm || ""}"
                               class="w-full bg-surface-section/50 border-none py-2 pl-9 pr-4 rounded-lg text-[10px] font-black uppercase tracking-widest text-white outline-none focus:bg-surface-section transition-all">
                    </div>
                </div>

                <div class="space-y-1">
                    ${
                      filteredPlans.length === 0
                        ? `<div class="p-20 text-center text-text-muted text-[10px] font-black uppercase tracking-widest italic opacity-20">Nenhum registro encontrado</div>`
                        : filteredPlans
                            .map((c) => {
                              const planStats = window.getClientPlanUsage
                                ? window.getClientPlanUsage(c.nome)
                                : { usageCount: 0 };
                              const usagePercent = Math.min(
                                100,
                                ((planStats?.usageCount || 0) /
                                  (c.limite_cortes || 99)) *
                                  100,
                              );
                              const isOver =
                                planStats?.usageCount >=
                                (c.limite_cortes || 99);
                              const isPending =
                                c.plano_pagamento &&
                                (new Date() - new Date(c.plano_pagamento)) /
                                  (1000 * 60 * 60 * 24) >
                                  30;

                              return `
                            <div class="bg-surface-section/20 hover:bg-surface-section/40 p-4 sm:p-5 rounded-2xl transition-all group flex flex-col md:flex-row items-center gap-6">
                                <!-- Info Principal -->
                                <div class="flex items-center gap-4 w-full md:w-64 shrink-0">
                                    <div class="w-10 h-10 rounded-full bg-surface-page flex items-center justify-center text-text-muted font-black text-xs shadow-xl border border-white/5 group-hover:text-brand-primary transition-colors">
                                        ${c.nome.charAt(0)}
                                    </div>
                                    <div class="min-w-0">
                                        <h4 class="text-[11px] font-black text-white uppercase tracking-tighter truncate group-hover:text-brand-primary transition-colors cursor-pointer" onclick="navigate('client-profile', '${c.id}')">${c.nome}</h4>
                                        <select onchange="window.updateClientPlan('${c.id}', { plano: this.value })" 
                                                class="bg-transparent border-none text-[8px] font-bold text-text-muted uppercase tracking-widest p-0 outline-none cursor-pointer hover:text-white transition-colors appearance-none">
                                            <option value="Mensal" ${c.plano === "Mensal" ? "selected" : ""} class="bg-surface-page">Mensal</option>
                                            <option value="Semestral" ${c.plano === "Semestral" ? "selected" : ""} class="bg-surface-page">Semestral</option>
                                            <option value="Anual" ${c.plano === "Anual" ? "selected" : ""} class="bg-surface-page">Anual</option>
                                            <option value="Pausado" ${c.plano === "Pausado" ? "selected" : ""} class="bg-surface-page">Pausado</option>
                                            <option value="Nenhum" ${c.plano === "Nenhum" ? "selected" : ""} class="bg-surface-page">Nenhum</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Uso / Medidor -->
                                <div class="flex flex-col gap-1 w-full md:w-40 shrink-0">
                                    <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                        <div class="flex items-center gap-1">
                                            <span class="${isOver ? "text-rose-500" : "text-white"}">${planStats?.usageCount || 0}</span>
                                            <span class="text-text-muted">/</span>
                                            <input type="number" value="${c.limite_cortes || 99}" 
                                                   onchange="window.updateClientPlan('${c.id}', { limite_cortes: parseInt(this.value) || 99 })"
                                                   class="bg-transparent border-none w-6 p-0 text-text-muted focus:text-white outline-none">
                                        </div>
                                        <span class="text-[8px] text-text-muted font-bold">${usagePercent.toFixed(0)}%</span>
                                    </div>
                                    <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div class="h-full ${isOver ? "bg-rose-500" : usagePercent > 80 ? "bg-brand-primary" : "bg-text-muted"} transition-all duration-700" style="width: ${usagePercent}%"></div>
                                    </div>
                                </div>

                                <!-- Vencimento / Ciclo -->
                                <div class="flex flex-col w-full md:w-32 shrink-0">
                                    <p class="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Último Pagamento</p>
                                    <input type="date" value="${c.plano_pagamento || ""}" 
                                           onchange="window.updateClientPlan('${c.id}', { plano_pagamento: this.value })"
                                           class="bg-transparent border-none text-[10px] font-black ${isPending ? "text-rose-500" : "text-white"} p-0 outline-none cursor-pointer" style="color-scheme: dark">
                                </div>

                                <!-- Valor do Plano -->
                                <div class="flex flex-col w-full md:w-24 shrink-0">
                                    <p class="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Valor</p>
                                    <div class="flex items-center gap-1">
                                        <span class="text-[10px] text-text-muted font-black">R$</span>
                                        <div contenteditable="true" onblur="window.updateClientPlan('${c.id}', { valor_plano: parseFloat(this.innerText) || 0 })"
                                             class="text-[10px] font-black text-white outline-none focus:text-brand-primary transition-colors min-w-[20px]">
                                            ${(c.valor_plano || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                <!-- Observações Silenciosas -->
                                <div class="flex-1 min-w-0 w-full">
                                    <div contenteditable="true" onblur="window.updateClientPlan('${c.id}', { observacoes_plano: this.innerText.trim() })"
                                         class="text-[10px] text-text-muted hover:text-white transition-colors italic outline-none truncate max-w-sm">
                                        ${!c.observacoes_plano || c.observacoes_plano.includes("...") ? "Adicionar nota..." : c.observacoes_plano}
                                    </div>
                                </div>

                                <!-- Ações -->
                                <div class="flex items-center gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick="if(confirm('Reiniciar ciclo?')){ window.updateClientPlan('${c.id}', { plano_pagamento: new Date().toISOString().split('T')[0] }) }" 
                                            class="p-2 text-text-muted hover:text-brand-primary transition-colors" title="Reset">
                                        <i class="fas fa-rotate text-[10px]"></i>
                                    </button>
                                    <button onclick="window.updateClientPlan('${c.id}', { plano: 'Pausado' })" 
                                            class="p-2 text-text-muted hover:text-white transition-colors" title="Pausar">
                                        <i class="fas fa-pause text-[10px]"></i>
                                    </button>
                                </div>
                            </div>
                            `;
                            })
                            .join("")
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
                            <div class="space-y-1">
                                <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Valor do Plano (R$)</label>
                                <div class="relative">
                                    <input type="number" step="0.01" name="valor_plano" placeholder="0,00" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-transparent transition-all font-bold text-white pl-10">
                                    <i class="fas fa-dollar-sign absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
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
