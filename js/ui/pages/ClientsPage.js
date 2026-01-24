import { state } from "../../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../../core/config.js";
import {
  fetchClients,
  fetchProcedures,
  updateClientField,
  updateClientPlan,
} from "../../api/supabase.js";
import { navigate } from "../navigation.js";

export const ClientsPage = () => {
  window.switchClientView = (view) => {
    state.clientView = view;
    state.editingClient = null;
    state.editingProcedure = null;
    state.managementSearch = "";
    if (window.render) window.render();
  };

  window.handleManagementSearch = (val) => {
    state.managementSearch = val;
    if (window.render) window.render();
    setTimeout(() => {
      const input = document.getElementById("managementSearchInput");
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }, 50);
  };

  window.saveNewClient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const btn = e.target.querySelector('button[type="submit"]');
    const isEditing = !!(state.editingClient && state.editingClient.id);

    const clientData = {
      nome: formData.get("nome"),
      plano: formData.get("plano") || "Nenhum",
      plano_inicio: formData.get("plano_inicio") || null,
      plano_pagamento: formData.get("plano_pagamento") || null,
      novo_cliente: formData.get("novo_cliente") === "on",
    };

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isEditing ? "Salvando..." : "Cadastrando..."}`;

    try {
      const url = isEditing
        ? `${SUPABASE_URL}/rest/v1/clientes?id=eq.${state.editingClient.id}`
        : `${SUPABASE_URL}/rest/v1/clientes`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(clientData),
      });

      if (res.ok) {
        state.editingClient = null;
        e.target.reset();
        fetchClients();
      } else {
        const errorData = await res.json();
        if (errorData.code === "23505")
          alert("⚠ ERRO: Este cliente já está cadastrado.");
        else
          alert(
            "⚠ Erro ao salvar: " +
              (errorData.message || "Falha no banco de dados."),
          );
      }
    } catch (err) {
      alert("⚠ Erro de conexão.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = isEditing ? "Salvar Alterações" : "Cadastrar Cliente";
    }
  };

  window.editClient = (client) => {
    state.clientView = "clients";
    state.editingClient = client;
    if (window.render) window.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.cancelEditClient = () => {
    state.editingClient = null;
    if (window.render) window.render();
  };

  window.deleteClient = async (id) => {
    if (
      !confirm(
        "Deseja excluir este cliente? Isso não afetará os agendamentos já feitos.",
      )
    )
      return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      });
      fetchClients();
    } catch (err) {
      alert("Erro ao excluir cliente.");
    }
  };

  window.saveProcedure = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const btn = e.target.querySelector('button[type="submit"]');
    const isEditing = !!(state.editingProcedure && state.editingProcedure.id);

    const procedureData = {
      nome: formData.get("nome"),
      preco: parseFloat(formData.get("preco")) || 0,
    };

    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isEditing ? "Salvando..." : "Cadastrando..."}`;

    try {
      const url = isEditing
        ? `${SUPABASE_URL}/rest/v1/procedimentos?id=eq.${state.editingProcedure.id}`
        : `${SUPABASE_URL}/rest/v1/procedimentos`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(procedureData),
      });

      if (res.ok) {
        state.editingProcedure = null;
        e.target.reset();
        fetchProcedures();
      } else {
        alert("⚠ Erro ao salvar procedimento.");
      }
    } catch (err) {
      alert("⚠ Erro de conexão.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = isEditing
        ? "Salvar Alterações"
        : "Cadastrar Procedimento";
    }
  };

  window.editProcedure = (proc) => {
    state.clientView = "procedures";
    state.editingProcedure = proc;
    if (window.render) window.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.cancelEditProcedure = () => {
    state.editingProcedure = null;
    if (window.render) window.render();
  };

  window.deleteProcedure = async (id) => {
    if (!confirm("Deseja excluir este procedimento?")) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/procedimentos?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      });
      fetchProcedures();
    } catch (err) {
      alert("Erro ao excluir procedimento.");
    }
  };

  const isClients = state.clientView === "clients";

  return `
        <div class="px-4 pt-6 sm:px-8 sm:pt-6 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl sm:text-3xl font-display font-bold">Gestão Local</h2>
                    <p class="text-slate-500 text-xs sm:text-sm mt-1">Gerencie sua base de clientes e tabela de preços</p>
                </div>
                <div class="flex bg-dark-900 border border-transparent p-1 rounded-2xl w-full sm:w-auto">
                    <button onclick="window.switchClientView('clients')" 
                            class="flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isClients ? "bg-brand-primary text-surface-page shadow-lg shadow-brand-primary/20" : "text-slate-500 hover:text-white"}">
                        Clientes
                    </button>
                    <button onclick="window.switchClientView('procedures')" 
                            class="flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isClients ? "bg-brand-primary text-surface-page shadow-lg shadow-brand-primary/20" : "text-slate-500 hover:text-white"}">
                        Procedimentos
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-1">
                    <div class="glass-card p-8 rounded-[2rem] border border-transparent">
                        ${
                          isClients
                            ? `
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-bold text-brand-primary uppercase tracking-widest text-sm">${state.editingClient ? "Editar Cliente" : "Novo Cliente"}</h3>
                                ${state.editingClient ? `<button onclick="window.cancelEditClient()" class="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest">Cancelar</button>` : ""}
                            </div>
                            <form onsubmit="window.saveNewClient(event)" class="space-y-6">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nome Completo</label>
                                    <input type="text" name="nome" required placeholder="Ex: Lucas Ferreira" value="${state.editingClient?.nome || ""}"
                                           class="w-full bg-dark-900 border border-transparent p-4 rounded-xl outline-none focus:border-transparent transition-all font-bold">
                                </div>
                                <div class="flex items-center gap-3 bg-dark-900 border border-transparent p-4 rounded-xl mb-4">
                                    <div class="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="novo_cliente" id="novo_cliente_toggle" class="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1 top-1 transition-transform checked:translate-x-5 checked:border-brand-primary" ${state.editingClient?.novo_cliente ? "checked" : ""}/>
                                        <label for="novo_cliente_toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-slate-800 cursor-pointer border border-transparent"></label>
                                    </div>
                                    <label for="novo_cliente_toggle" class="text-xs font-bold text-white uppercase tracking-widest cursor-pointer">Marcar como Novo Cliente</label>
                                </div>
                                <button type="submit" class="w-full bg-brand-primary text-surface-page font-black py-4 rounded-xl border border-transparent transition-all uppercase tracking-widest text-sm shadow-xl shadow-brand-primary/10 active:scale-95">
                                    ${state.editingClient ? "Salvar Alterações" : "Cadastrar Cliente"}
                                </button>
                            </form>
                        `
                            : `
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-bold text-brand-primary uppercase tracking-widest text-sm">${state.editingProcedure ? "Editar Serviço" : "Novo Serviço"}</h3>
                                ${state.editingProcedure ? `<button onclick="window.cancelEditProcedure()" class="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest">Cancelar</button>` : ""}
                            </div>
                            <form onsubmit="window.saveProcedure(event)" class="space-y-6">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nome do Serviço</label>
                                    <input type="text" name="nome" required placeholder="Ex: Corte Degradê" value="${state.editingProcedure?.nome || ""}"
                                           class="w-full bg-dark-900 border border-transparent p-4 rounded-xl outline-none focus:border-transparent transition-all font-bold">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Preço Sugerido (R$ - Opcional)</label>
                                    <input type="number" step="0.01" name="preco" placeholder="0,00" value="${state.editingProcedure?.preco || ""}"
                                           class="w-full bg-dark-900 border border-transparent p-4 rounded-xl outline-none focus:border-transparent transition-all font-bold">
                                </div>
                                <button type="submit" class="w-full bg-brand-primary text-surface-page font-black py-4 rounded-xl hover:bg-brand-hover transition-all uppercase tracking-widest text-sm shadow-xl shadow-brand-primary/10 active:scale-95">
                                    ${state.editingProcedure ? "Salvar Alterações" : "Adicionar Serviço"}
                                </button>
                            </form>
                        `
                        }
                    </div>
                </div>

                <div class="lg:col-span-2">
                    <div class="glass-card rounded-[2rem] overflow-hidden border border-transparent">
                        <div class="p-6 bg-white/[0.02] border-b border-transparent space-y-4">
                            <div class="flex justify-between items-center">
                                <h3 class="font-bold flex items-center">
                                    <i class="fas ${isClients ? "fa-users-viewfinder" : "fa-list-check"} mr-3 text-brand-primary"></i>
                                    ${isClients ? `Clientes Registrados (${state.clients.length})` : `Procedimentos Ativos (${state.procedures.length})`}
                                </h3>
                                <button onclick="${isClients ? "fetchClients()" : "fetchProcedures()"}" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-brand-primary/10 hover:text-brand-primary transition-all flex items-center justify-center">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                            <div class="relative">
                                <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input type="text" id="managementSearchInput" placeholder="Pesquisar ${isClients ? "cliente" : "procedimento"}..." 
                                       oninput="window.handleManagementSearch(this.value)" value="${state.managementSearch}"
                                       class="w-full bg-dark-900 border border-transparent py-3 pl-12 pr-4 rounded-xl text-sm outline-none focus:border-transparent transition-all font-medium">
                            </div>
                        </div>
                        
                        <div class="max-h-[600px] overflow-y-auto custom-scroll">
                            ${
                              isClients
                                ? `
                                <div class="hidden sm:block">
                                    <table class="w-full text-left">
                                        <thead class="bg-white/[0.01] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <tr>
                                                <th class="px-4 py-4 border-b border-transparent">Nome</th>
                                                <th class="px-4 py-4 border-b border-transparent text-center">Plano</th>
                                                <th class="px-4 py-4 border-b border-transparent">Observações</th>
                                                <th class="px-4 py-4 border-b border-transparent text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-transparent text-sm">
                                            ${state.clients
                                              .filter((c) =>
                                                c.nome
                                                  .toLowerCase()
                                                  .includes(
                                                    state.managementSearch.toLowerCase(),
                                                  ),
                                              )
                                              .map(
                                                (c) => `
                                                <tr class="hover:bg-white/[0.01] transition-colors group">
                                                    <td class="px-4 py-4 font-bold text-white uppercase cursor-pointer hover:text-brand-primary transition-colors whitespace-nowrap" onclick="navigate('client-profile', '${c.id}')">
                                                        ${c.nome} ${c.novo_cliente ? '<span class="ml-1 bg-brand-primary/20 text-brand-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Novo</span>' : ""}
                                                    </td>
                                                    <td class="px-4 py-4 text-center">
                                                        <span class="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.plano === "Mensal" ? "bg-brand-primary/10 text-brand-primary border border-transparent" : c.plano === "Anual" ? "bg-slate-500/10 text-slate-500 border border-slate-500/20" : "text-slate-500 border border-transparent"}">
                                                            ${c.plano || "Nenhum"}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-4">
                                                        <div contenteditable="true" id="edit_mgmt_obs_${c.id}" spellcheck="false" autocomplete="off"
                                                             onblur="window.updateClientField('${c.id}', 'observacoes_cliente', this.innerText.trim())" onfocus="window.selectAll(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="bg-transparent text-[10px] text-slate-400 font-medium outline-none hover:text-white transition-colors whitespace-pre-wrap break-words min-w-[120px] max-w-[200px] cursor-text">${!c.observacoes_cliente || c.observacoes_cliente.includes("...") || c.observacoes_cliente.includes("permanentes") ? "Adcionar Nota..." : c.observacoes_cliente}</div>
                                                    </td>
                                                    <td class="px-4 py-4 text-right">
                                                        <div class="flex justify-end space-x-1.5">
                                                            <button onclick='window.editClient(${JSON.stringify(c)})' class="w-8 h-8 rounded-xl bg-slate-400/10 text-slate-400 hover:bg-slate-400 hover:text-white transition-all transform active:scale-90 flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
                                                            <button onclick="window.deleteClient('${c.id}')" class="w-8 h-8 rounded-xl bg-slate-600/10 text-slate-600 hover:bg-slate-600 hover:text-white transition-all transform active:scale-90 flex items-center justify-center"><i class="fas fa-trash-alt text-xs"></i></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `,
                                              )
                                              .join("")}
                                        </tbody>
                                    </table>
                                </div>
                                <div class="sm:hidden divide-y divide-transparent">
                                    ${state.clients
                                      .filter((c) =>
                                        c.nome
                                          .toLowerCase()
                                          .includes(
                                            state.managementSearch.toLowerCase(),
                                          ),
                                      )
                                      .map(
                                        (c) => `
                                        <div class="p-6 space-y-4">
                                            <div class="flex justify-between items-start">
                                                <div onclick="navigate('client-profile', '${c.id}')" class="cursor-pointer group/name">
                                                    <p class="text-lg font-bold text-white uppercase group-hover/name:text-brand-primary transition-colors">${c.nome}</p>
                                                </div>
                                                <div class="flex space-x-2">
                                                    <button onclick='window.editClient(${JSON.stringify(c)})' class="w-10 h-10 rounded-xl bg-slate-400/10 text-slate-400 flex items-center justify-center"><i class="fas fa-edit"></i></button>
                                                    <button onclick="window.deleteClient('${c.id}')" class="w-10 h-10 rounded-xl bg-slate-600/10 text-slate-600 flex items-center justify-center"><i class="fas fa-trash-alt"></i></button>
                                                </div>
                                            </div>
                                            <div class="flex items-center space-x-4">
                                                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.plano === "Mensal" ? "bg-brand-primary/10 text-brand-primary" : "text-slate-500 border border-transparent"}">${c.plano || "Nenhum"}</span>
                                            </div>
                                        </div>
                                    `,
                                      )
                                      .join("")}
                                </div>
                            `
                                : `
                                <div class="hidden sm:block">
                                    <table class="w-full text-left">
                                        <thead class="bg-white/[0.01] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <tr>
                                                <th class="px-4 py-4 border-b border-transparent">Serviço</th>
                                                <th class="px-4 py-4 border-b border-transparent">Preço Base</th>
                                                <th class="px-4 py-4 border-b border-transparent text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-transparent text-sm">
                                            ${state.procedures
                                              .filter((p) =>
                                                p.nome
                                                  .toLowerCase()
                                                  .includes(
                                                    state.managementSearch.toLowerCase(),
                                                  ),
                                              )
                                              .map(
                                                (p) => `
                                                <tr class="hover:bg-white/[0.01] transition-colors group">
                                                    <td class="px-4 py-4 font-bold text-white uppercase whitespace-nowrap">${p.nome}</td>
                                                    <td class="px-4 py-4 text-slate-300 font-black">R$ ${p.preco.toFixed(2).replace(".", ",")}</td>
                                                    <td class="px-4 py-4 text-right">
                                                        <div class="flex justify-end space-x-1.5">
                                                            <button onclick='window.editProcedure(${JSON.stringify(p)})' class="w-8 h-8 rounded-xl bg-slate-400/10 text-slate-400 hover:bg-slate-400 hover:text-white transition-all transform active:scale-90 flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
                                                            <button onclick="window.deleteProcedure('${p.id}')" class="w-8 h-8 rounded-xl bg-slate-600/10 text-slate-600 hover:bg-slate-600 hover:text-white transition-all transform active:scale-90 flex items-center justify-center"><i class="fas fa-trash-alt text-xs"></i></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `,
                                              )
                                              .join("")}
                                        </tbody>
                                    </table>
                                </div>
                                <div class="sm:hidden divide-y divide-transparent">
                                    ${state.procedures
                                      .filter((p) =>
                                        p.nome
                                          .toLowerCase()
                                          .includes(
                                            state.managementSearch.toLowerCase(),
                                          ),
                                      )
                                      .map(
                                        (p) => `
                                        <div class="p-6 flex justify-between items-center">
                                            <div>
                                                <p class="text-lg font-bold text-white uppercase">${p.nome}</p>
                                                <p class="text-slate-300 font-black">R$ ${p.preco.toFixed(2).replace(".", ",")}</p>
                                            </div>
                                            <div class="flex space-x-2">
                                                <button onclick='window.editProcedure(${JSON.stringify(p)})' class="w-10 h-10 rounded-xl bg-slate-400/10 text-slate-400 flex items-center justify-center"><i class="fas fa-edit"></i></button>
                                                <button onclick="window.deleteProcedure('${p.id}')" class="w-10 h-10 rounded-xl bg-slate-600/10 text-slate-600 flex items-center justify-center"><i class="fas fa-trash-alt"></i></button>
                                            </div>
                                        </div>
                                    `,
                                      )
                                      .join("")}
                                </div>
                            `
                            }
                            ${(isClients ? state.clients : state.procedures).filter((x) => x.nome.toLowerCase().includes(state.managementSearch.toLowerCase())).length === 0 ? '<div class="p-20 text-center text-slate-500 font-bold italic">Nenhum registro encontrado.</div>' : ""}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};
