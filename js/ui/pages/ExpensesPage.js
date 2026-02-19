import { state } from "../../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../../core/config.js";
import { fetchExpenses } from "../../api/supabase.js";
import { PremiumSelector } from "../components/PremiumSelector.js";

export const ExpensesPage = () => {
  const targetMonth = state.filters.month;
  const targetYear = state.filters.year;
  const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

  const searchTerm = (state.expenseSearchTerm || "").toLowerCase();
  const statusFilter = state.expenseStatusFilter || "TODOS";
  const periodFilter = state.expensePeriodFilter || "mensal";
  const isCompact = state.displayMode === "compact";

  let filteredExpenses = state.expenses;
  const selectedDate = new Date(
    state.filters.year,
    state.filters.month - 1,
    state.filters.day,
  );

  if (periodFilter === "diario") {
    const dateStr = selectedDate.toISOString().split("T")[0];
    filteredExpenses = filteredExpenses.filter((e) => e.vencimento === dateStr);
  } else if (periodFilter === "semanal") {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    filteredExpenses = filteredExpenses.filter((e) => {
      const ev = new Date(e.vencimento + "T00:00:00");
      return ev >= startOfWeek && ev <= endOfWeek;
    });
  } else if (periodFilter === "mensal") {
    filteredExpenses = filteredExpenses.filter((e) =>
      e.vencimento.startsWith(monthPrefix),
    );
  }

  if (searchTerm) {
    filteredExpenses = filteredExpenses.filter(
      (e) =>
        e.descricao.toLowerCase().includes(searchTerm) ||
        (e.cartao && e.cartao.toLowerCase().includes(searchTerm)),
    );
  }

  if (statusFilter !== "TODOS") {
    const isPaid = statusFilter === "PAGO";
    filteredExpenses = filteredExpenses.filter((e) => e.paga === isPaid);
  }

  const sort = state.expenseSort || "vencimento_asc";
  filteredExpenses.sort((a, b) => {
    if (sort === "vencimento_asc")
      return new Date(a.vencimento) - new Date(b.vencimento);
    if (sort === "vencimento_desc")
      return new Date(b.vencimento) - new Date(a.vencimento);
    if (sort === "valor_asc")
      return (parseFloat(a.valor) || 0) - (parseFloat(b.valor) || 0);
    if (sort === "valor_desc")
      return (parseFloat(b.valor) || 0) - (parseFloat(a.valor) || 0);
    if (sort === "descricao_asc")
      return (a.descricao || "").localeCompare(b.descricao || "");
    return 0;
  });

  const totalPago = filteredExpenses
    .filter((e) => e.paga)
    .reduce((acc, e) => acc + (parseFloat(e.valor) || 0), 0);
  const totalAPagar = filteredExpenses
    .filter((e) => !e.paga)
    .reduce((acc, e) => acc + (parseFloat(e.valor) || 0), 0);
  const totalGeral = totalPago + totalAPagar;

  window.toggleExpenseStatus = async (id, status) => {
    const isPaid = status === "PAGO";
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/saidas?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paga: isPaid,
          data_pagamento: isPaid ? today : null,
        }),
      });
      if (res.ok) fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  window.deleteExpense = async (id) => {
    const performDelete = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/saidas?id=eq.${id}`, {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
          },
        });
        if (res.ok) fetchExpenses();
      } catch (err) {
        console.error(err);
      }
    };

    if (window.showConfirm) {
      window.showConfirm("Excluir esta conta permanentemente?", performDelete);
    }
  };

  window.openExpenseModal = (expense = null) => {
    state.editingExpense = expense || {
      vencimento: monthPrefix + "-01",
      descricao: "",
      valor: 0,
      paga: false,
    };
    state.isExpenseModalOpen = true;
    if (window.render) window.render();
  };

  window.closeExpenseModal = () => {
    state.isExpenseModalOpen = false;
    state.editingExpense = null;
    if (window.render) window.render();
  };

  window.saveExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      vencimento: formData.get("vencimento"),
      descricao: formData.get("descricao").toUpperCase(),
      valor: parseFloat(formData.get("valor")) || 0,
      paga: formData.get("paga") === "on",
      cartao: (formData.get("cartao") || "").trim().toUpperCase() || "OUTROS",
      data_compra: formData.get("data_compra"),
      valor_total: parseFloat(formData.get("valor_total")) || 0,
      parcela: formData.get("parcela"),
      valor_pago: parseFloat(formData.get("valor_pago")) || 0,
    };
    if (data.paga) {
      data.data_pagamento = new Date().toISOString().split("T")[0];
      if (!data.valor_pago) data.valor_pago = data.valor;
    }

    const id = state.editingExpense.id;
    const method = id ? "PATCH" : "POST";
    const url = id
      ? `${SUPABASE_URL}/rest/v1/saidas?id=eq.${id}`
      : `${SUPABASE_URL}/rest/v1/saidas`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        window.closeExpenseModal();
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.saveExpenseInline = async (el) => {
    const id = el.dataset.id;
    const field = el.dataset.field;
    let value = el.innerText.trim();
    if (["valor", "valor_pago", "valor_total"].includes(field)) {
      value = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    } else if (field === "descricao") {
      value = value.toUpperCase();
    } else if (field === "cartao") {
      value = value.toUpperCase() || "OUTROS";
    } else if (field === "vencimento" || field === "data_pagamento") {
      value = el.value || null;
    }
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/saidas?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) fetchExpenses();
    } catch (err) {
      console.error("Erro no salvamento inline de saída:", err);
    }
  };

  window.clearExpenseFilters = () => {
    state.expenseSearchTerm = "";
    state.expenseStatusFilter = "TODOS";
    state.expenseSort = "vencimento_asc";
    if (window.render) window.render();
  };

  window.setExpenseFilter = (field, val) => {
    state[field] = val;
    if (field === "expenseSearchTerm") {
      const inputId = "expenseSearchInput";
      const cursorPosition = document.getElementById(inputId)?.selectionStart;
      if (window.render) window.render();
      const input = document.getElementById(inputId);
      if (input) {
        input.focus();
        if (cursorPosition)
          input.setSelectionRange(cursorPosition, cursorPosition);
      }
    } else {
      if (window.render) window.render();
    }
  };

  const monthsLong = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const statusOptions = [
    { value: "TODOS", label: "Todos os Status" },
    { value: "PAGO", label: "Somente Pagos" },
    { value: "PENDENTE", label: "Somente Pendentes" },
  ];

  const sortOptions = [
    { value: "vencimento_asc", label: "Data (Mais Antiga)" },
    { value: "vencimento_desc", label: "Data (Mais Recente)" },
    { value: "valor_asc", label: "Valor (Menor Primeiro)" },
    { value: "valor_desc", label: "Valor (Maior Primeiro)" },
    { value: "descricao_asc", label: "Descrição (A-Z)" },
  ];

  return `
        <div class="px-4 pt-6 sm:px-8 sm:pt-6 space-y-6 animate-in fade-in duration-500 pb-32">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-sm">
                <div>
                    <h2 class="text-4xl md:text-3xl font-display font-black tracking-tight">Saídas <span class="text-slate-600 font-medium md:text-3xl text-2xl">${periodFilter === "total" ? "Totais" : periodFilter === "diario" ? `${state.filters.day} de ${monthsLong[targetMonth - 1]}` : periodFilter === "semanal" ? "da Semana" : `${monthsLong[targetMonth - 1]}${targetYear !== new Date().getFullYear() ? " " + targetYear : ""}`}</span></h2>
                    <div class="flex items-center gap-2 mt-2">
                        <div class="flex bg-dark-900 border border-transparent rounded-xl p-0.5">
                            ${["diario", "semanal", "mensal", "total"]
                              .map(
                                (p) => `
                                <button onclick="window.setExpenseFilter('expensePeriodFilter', '${p}')" 
                                        class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                                        ${state.expensePeriodFilter === p ? "bg-slate-600 text-white shadow-lg shadow-slate-600/20" : "text-slate-500 hover:text-white"}">
                                    ${p === "diario" ? "Dia" : p === "semanal" ? "Semana" : p === "mensal" ? "Mês" : "Total"}
                                </button>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
                <div class="flex flex-wrap gap-4 w-full md:w-auto">
                    <div class="bg-slate-600/10 border border-slate-600/20 px-6 py-3 rounded-2xl flex flex-col justify-center">
                        <span class="text-[9px] font-black uppercase text-slate-600/60 tracking-tighter">Total Pago</span>
                        <span class="text-lg font-black text-slate-600">R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="bg-brand-primary/10 border border-transparent px-6 py-3 rounded-2xl flex flex-col justify-center">
                        <span class="text-[9px] font-black uppercase text-brand-primary/60 tracking-tighter">Total a Pagar</span>
                        <span class="text-lg font-black text-brand-primary">R$ ${totalAPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button onclick="window.openExpenseModal()" class="bg-slate-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 transition-all shadow-xl shadow-slate-600/20 border border-slate-600/50 flex items-center gap-2">
                        <i class="fas fa-plus"></i> Nova Conta
                    </button>
                </div>
            </div>

            <div class="flex flex-wrap gap-4 items-center bg-dark-900/50 p-4 rounded-[1.5rem] border border-transparent shadow-2xl">
                <div class="flex-1 min-w-[240px] relative group w-full">
                    <i class="fas fa-search absolute left-5 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg md:text-xs group-focus-within:text-slate-600 transition-colors"></i>
                    <input type="text" id="expenseSearchInput" placeholder="Buscar por descrição ou cartão..." value="${state.expenseSearchTerm || ""}" oninput="window.setExpenseFilter('expenseSearchTerm', this.value)"
                           class="w-full bg-dark-950 border border-transparent pl-14 md:pl-10 pr-4 h-14 md:h-auto rounded-3xl md:rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold text-sm md:text-xs uppercase text-white shadow-inner">
                </div>
                <div class="flex gap-2 flex-wrap sm:flex-nowrap">
                    ${PremiumSelector({
                      id: "expenseStatusSelector",
                      value: state.expenseStatusFilter || "TODOS",
                      options: statusOptions,
                      onSelect:
                        "(val) => window.setExpenseFilter('expenseStatusFilter', val)",
                      className: "min-w-[160px] !bg-dark-950",
                    })}
                    ${PremiumSelector({
                      id: "expenseSortSelector",
                      value: state.expenseSort || "vencimento_asc",
                      options: sortOptions,
                      onSelect:
                        "(val) => window.setExpenseFilter('expenseSort', val)",
                      className: "min-w-[170px] !bg-dark-950",
                    })}
                </div>
                ${state.expenseSearchTerm || state.expenseStatusFilter !== "TODOS" || state.expenseSort !== "vencimento_asc" ? `<button onclick="window.clearExpenseFilters()" class="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center gap-2 px-2 animate-in fade-in slide-in-from-right-2"><i class="fas fa-times-circle"></i> Limpar Tudo</button>` : ""}
            </div>

            <div class="space-y-4 md:space-y-0 md:bg-dark-900/30 md:rounded-[2rem] border border-transparent">
                <div class="hidden md:grid grid-cols-[120px_130px_1fr_100px_110px_120px_80px] bg-white/[0.02] border-b border-transparent text-[9px] font-black text-slate-500 uppercase tracking-widest px-6 py-4 items-center">
                    <div class="text-left px-2">Vencimento</div>
                    <div class="text-left px-2">Cartão/Outro</div>
                    <div class="text-left px-4">Descrição</div>
                    <div class="text-center">Valor</div>
                    <div class="text-center">Status</div>
                    <div class="text-center">Pagamento</div>
                    <div class="text-center">Ações</div>
                </div>
                <div id="expensesTableBody" class="space-y-1 md:space-y-0 md:divide-y md:divide-white/[0.02]">
                    ${
                      filteredExpenses.length === 0
                        ? `<div class="px-8 py-20 text-center text-slate-500 italic">Nenhuma conta registrada para este mês.</div>`
                        : filteredExpenses
                            .map((e) => {
                              const todayDate = new Date()
                                .toISOString()
                                .split("T")[0];
                              const diffDays = Math.ceil(
                                (new Date(e.vencimento + "T00:00:00") -
                                  new Date(todayDate + "T00:00:00")) /
                                  (1000 * 60 * 60 * 24),
                              );

                              const mobileRow = `
                                <div class="md:hidden grid grid-cols-[70px_1fr_90px] gap-3 items-center px-5 ${isCompact ? "py-2.5" : "py-4"} bg-surface-section/40 rounded-2xl mx-1 my-1 border-none focus-within:z-[100] z-[1]">
                                    <!-- Data & Status -->
                                    <div class="flex items-center gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full shrink-0 ${e.paga ? "bg-slate-300" : diffDays < 0 ? "bg-slate-600 animate-pulse" : "bg-brand-primary"}"></div>
                                        <div class="text-[13px] text-text-primary font-bold">
                                            ${e.vencimento.split("-")[2]}/${e.vencimento.split("-")[1]}
                                        </div>
                                    </div>
                                    
                                    <!-- Info -->
                                    <div class="flex flex-col min-w-0">
                                        <div class="text-[13px] font-black truncate uppercase text-white leading-tight">
                                            ${e.descricao}
                                        </div>
                                        <div class="text-[10px] font-black text-brand-primary tracking-tight">
                                            R$ ${(parseFloat(e.valor) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <!-- Ações -->
                                    <div class="flex justify-end items-center gap-2">
                                        <button onclick="window.openExpenseModal(${JSON.stringify(e).replace(/"/g, "&quot;")})" 
                                                class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-subtle text-text-secondary active:scale-95 transition-all">
                                            <i class="fas fa-edit text-base"></i>
                                        </button>
                                        <button onclick="window.deleteExpense(${e.id})" 
                                                class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-subtle text-text-secondary active:scale-95 transition-all">
                                            <i class="fas fa-trash-can text-base"></i>
                                        </button>
                                    </div>
                                </div>
                              `;

                              const desktopRow = `
                                <div class="hidden md:grid md:grid-cols-[120px_130px_1fr_100px_110px_120px_80px] items-center px-6 py-2.5 transition-colors group relative border-b border-transparent">
                                    <div class="w-full md:w-auto flex items-center gap-3">
                                        <span class="md:hidden text-[9px] font-black text-slate-500 uppercase">Vencimento</span>
                                        <div class="flex items-center gap-1.5">
                                            <div class="w-1.5 h-1.5 rounded-full ${e.paga ? "bg-slate-300" : diffDays < 0 ? "bg-slate-600 animate-pulse" : "bg-brand-primary"}"></div>
                                            <div class="flex items-center -ml-1 gap-1">
                                                <i class="far fa-calendar-alt text-[9px] text-slate-500 mt-0.5"></i>
                                                <input type="date" data-id="${e.id}" data-field="vencimento" value="${e.vencimento}" onchange="window.saveExpenseInline(this)" style="color-scheme: dark" class="bg-transparent border-none text-[12px] font-bold text-white outline-none cursor-pointer rounded pl-0.5 pr-1 transition-all">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="w-full md:w-auto px-2 mt-2 md:mt-0 relative min-w-0">
                                        <span class="md:hidden text-[9px] font-black text-slate-500 uppercase block mb-1">Cartão/Outro</span>
                                        <div class="flex flex-col gap-0.5">
                                            <div class="flex items-center gap-1.5">
                                                <i class="fas fa-credit-card text-[10px] text-slate-500/50"></i>
                                                <div contenteditable="true" data-id="${e.id}" data-field="cartao" onfocus="window.selectAll(this)" onblur="window.saveExpenseInline(this)" onkeydown="window.handleInlineKey(event)" oninput="window.showExpenseAutocomplete(this)" class="text-[10px] font-black text-brand-primary uppercase tracking-tight outline-none focus:bg-white/5 px-1 rounded transition-all truncate cursor-text">
                                                    ${e.cartao || "OUTROS"}
                                                </div>
                                            </div>
                                            ${(() => {
                                              const card = state.cards.find(
                                                (c) => c.nome === e.cartao,
                                              );
                                              return card && card.titular
                                                ? `<div class="flex items-center gap-1.5 ml-0.5 opacity-60"><i class="fas fa-user-circle text-[9px] text-slate-500/80"></i><span class="text-[9px] font-bold text-slate-400 uppercase truncate">${card.titular}</span></div>`
                                                : "";
                                            })()}
                                        </div>
                                        <div id="expenseAutocomplete_${e.id}" class="hidden absolute left-0 right-0 top-full mt-1 bg-dark-800 border border-transparent rounded-xl shadow-2xl z-50 p-1"></div>
                                    </div>
                                    <div class="w-full md:w-auto px-4 mt-2 md:mt-0 min-w-0">
                                        <span class="md:hidden text-[9px] font-black text-slate-500 uppercase block mb-1">Descrição</span>
                                        <div contenteditable="true" data-id="${e.id}" data-field="descricao" onfocus="window.selectAll(this)" onblur="window.saveExpenseInline(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="font-black text-xs text-white uppercase tracking-wider outline-none focus:bg-white/5 px-1 rounded transition-all truncate hover:whitespace-normal cursor-text w-full">
                                            ${e.descricao}
                                        </div>
                                    </div>
                                    <div class="text-center mt-2 md:mt-0">
                                        <span class="md:hidden text-[9px] font-black text-slate-500 uppercase">Valor</span>
                                        <div contenteditable="true" data-id="${e.id}" data-field="valor" onfocus="window.selectAll(this)" onblur="window.saveExpenseInline(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="font-black text-[12px] text-white outline-none focus:bg-white/5 px-1 rounded transition-all cursor-text inline-block">
                                            ${(parseFloat(e.valor) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div class="text-center mt-2 md:mt-0 px-2">
                                        <span class="md:hidden text-[9px] font-black text-slate-500 uppercase">Status</span>
                                        ${PremiumSelector({
                                          id: `expenseStatus_${e.id}`,
                                          value: e.paga
                                            ? "PAGO"
                                            : diffDays < 0
                                              ? "VENCIDO"
                                              : "A VENCER",
                                          options: [
                                            { value: "PAGO", label: "PAGO" },
                                            {
                                              value: "A VENCER",
                                              label: "A VENCER",
                                            },
                                            {
                                              value: "VENCIDO",
                                              label: "VENCIDO",
                                            },
                                          ],
                                          onSelect: `(val) => window.toggleExpenseStatus('${e.id}', val)`,
                                          className: `bg-white/5 !px-2 !py-1 w-full ${e.paga ? "text-slate-300" : diffDays < 0 ? "text-slate-600" : "text-brand-primary"}`,
                                        })}
                                    </div>
                                    <div class="text-center mt-2 md:mt-0">
                                        <span class="md:hidden text-[9px] font-black text-slate-500 uppercase">Pagamento</span>
                                        <input type="date" data-id="${e.id}" data-field="data_pagamento" value="${e.data_pagamento || ""}" onchange="window.saveExpenseInline(this)" style="color-scheme: dark" class="bg-transparent border-none text-[11px] font-bold text-slate-400 w-full text-center outline-none cursor-pointer rounded px-1 transition-all">
                                    </div>
                                    <div class="flex justify-center gap-2 mt-2 md:mt-0">
                                        <button onclick="window.openExpenseModal(${JSON.stringify(e).replace(/"/g, "&quot;")})" class="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-surface-page transition-all flex items-center justify-center"><i class="fas fa-edit text-[10px]"></i></button>
                                        <button onclick="window.deleteExpense(${e.id})" class="w-8 h-8 rounded-full bg-slate-600/10 text-slate-600 hover:bg-slate-600 hover:text-white transition-all flex items-center justify-center"><i class="fas fa-trash text-[10px]"></i></button>
                                    </div>
                                </div>
                              `;

                              return mobileRow + desktopRow;
                            })
                            .join("")
                    }
                    ${filteredExpenses.length > 0 ? `<div class="bg-white/[0.01] px-8 py-6 flex justify-between items-center border-t border-transparent"><span class="text-xs font-black uppercase tracking-widest text-slate-500">Total do Período</span><span class="text-xl font-black text-white">R$ ${totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>` : ""}
                </div>
            </div>

            ${
              state.isExpenseModalOpen
                ? `
                <div class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div class="glass-card w-full max-w-md rounded-[2.5rem] border border-transparent shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div class="py-4 px-6 border-b border-transparent flex justify-between items-center bg-dark-900/50">
                            <h3 class="text-xl font-bold">${state.editingExpense?.id ? "Editar Conta" : "Nova Conta"}</h3>
                            <button onclick="window.closeExpenseModal()" class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500"><i class="fas fa-times"></i></button>
                        </div>
                        <form onsubmit="window.saveExpense(event)" id="expenseModal" class="p-5 space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1 relative">
                                    <label class="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Cartão/Origem</label>
                                    <input type="text" name="cartao" value="${state.editingExpense?.cartao || ""}" placeholder="DINHEIRO / CARTÃO..." autocomplete="off" oninput="window.showExpenseAutocomplete(this, true, 'card')" onkeydown="window.handleEnterSelection(event, 'expenseAutocomplete_card_modal')" onblur="setTimeout(() => document.getElementById('expenseAutocomplete_card_modal')?.classList.add('hidden'), 200)" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold text-xs uppercase text-white">
                                    <div id="expenseAutocomplete_card_modal" class="hidden absolute z-[120] left-0 right-0 mt-2 bg-dark-900 border border-transparent rounded-2xl shadow-2xl max-h-48 overflow-y-auto custom-scroll p-2"></div>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Data da Compra</label>
                                    <input type="date" name="data_compra" value="${state.editingExpense?.data_compra || new Date().toISOString().split("T")[0]}" style="color-scheme: dark" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold text-xs">
                                </div>
                            </div>
                            <div class="space-y-1 relative">
                                <label class="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
                                <input type="text" name="descricao" required id="expenseModalDesc" value="${state.editingExpense?.descricao || ""}" placeholder="EX: COMPRA 1, ALUGUEL..." autocomplete="off" oninput="window.showExpenseAutocomplete(this, true, 'desc')" onkeydown="window.handleEnterSelection(event, 'expenseAutocomplete_desc_modal')" onblur="setTimeout(() => document.getElementById('expenseAutocomplete_desc_modal')?.classList.add('hidden'), 200)" class="w-full bg-dark-950 border border-transparent p-3.5 rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold uppercase text-sm">
                                <div id="expenseAutocomplete_desc_modal" class="hidden absolute z-[120] left-0 right-0 mt-2 bg-dark-900 border border-transparent rounded-2xl shadow-2xl max-h-48 overflow-y-auto custom-scroll p-2"></div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Valor Total (R$)</label>
                                    <input type="number" step="0.01" name="valor_total" value="${state.editingExpense?.valor_total || state.editingExpense?.valor || ""}" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold text-sm">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Parcela</label>
                                    <input type="text" name="parcela" value="${state.editingExpense?.parcela || "1/1"}" oninput="window.maskParcela(this)" placeholder="1/1" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold text-xs text-center">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Vencimento</label>
                                    <input type="date" name="vencimento" required value="${state.editingExpense?.vencimento || ""}" style="color-scheme: dark" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold text-xs">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Valor Parcela (R$)</label>
                                    <input type="number" step="0.01" name="valor" value="${state.editingExpense?.valor || ""}" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold text-sm">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Valor Pago (R$)</label>
                                    <input type="number" step="0.01" name="valor_pago" value="${state.editingExpense?.valor_pago || ""}" class="w-full bg-dark-950 border border-transparent p-3 rounded-xl outline-none focus:border-slate-600/50 transition-all font-bold text-sm text-slate-300">
                                </div>
                            </div>
                            <div class="flex items-center space-x-3 p-3 bg-dark-950 rounded-xl border border-transparent">
                                <input type="checkbox" name="paga" id="expensePaga" ${state.editingExpense?.paga ? "checked" : ""} class="w-5 h-5 rounded border-transparent bg-dark-900 text-slate-300 focus:ring-0">
                                <label for="expensePaga" class="text-xs font-bold text-slate-400">Marcar como JÁ PAGA</label>
                            </div>
                            <button type="submit" class="w-full bg-slate-600 text-white font-black py-4 rounded-xl border border-transparent shadow-lg shadow-slate-600/20 active:scale-95 uppercase tracking-widest text-xs transition-all mt-2">${state.editingExpense?.id ? "Salvar Alterações" : "Salvar Conta"}</button>
                        </form>
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `;
};
