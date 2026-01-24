import { state } from "../../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../../core/config.js";
import { fetchCards } from "../../api/supabase.js";
import { navigate } from "../navigation.js";

export const CardProfilePage = () => {
  const cardId = state.selectedCardId;
  const card = state.cards.find((c) => c.id === cardId);

  if (!card)
    return `
        <div class="px-4 pt-10 text-center">
            <h2 class="text-2xl font-bold">Cartão não encontrado</h2>
            <button onclick="navigate('cards')" class="mt-4 bg-brand-primary text-surface-page px-6 py-2 rounded-xl">Voltar para Cartões</button>
        </div>
    `;

  const allCardExpenses = state.expenses.filter(
    (e) =>
      e.cartao === card.nome ||
      (e.descricao &&
        e.descricao.toUpperCase().includes(card.nome.toUpperCase())),
  );

  const periodFilter = state.expensePeriodFilter || "mensal";
  const targetMonth = state.filters.month;
  const targetYear = state.filters.year;
  const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
  const selectedDate = new Date(
    state.filters.year,
    state.filters.month - 1,
    state.filters.day,
  );

  let filteredCardExpenses = allCardExpenses;

  if (periodFilter === "diario") {
    const dateStr = selectedDate.toISOString().split("T")[0];
    filteredCardExpenses = allCardExpenses.filter(
      (e) => e.vencimento === dateStr,
    );
  } else if (periodFilter === "semanal") {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    filteredCardExpenses = allCardExpenses.filter((e) => {
      if (!e.vencimento) return false;
      const ev = new Date(e.vencimento + "T12:00:00");
      return ev >= startOfWeek && ev <= endOfWeek;
    });
  } else if (periodFilter === "mensal") {
    filteredCardExpenses = allCardExpenses.filter((e) =>
      e.vencimento.startsWith(monthPrefix),
    );
  }

  const totalSpentPeriod = filteredCardExpenses.reduce(
    (acc, e) => acc + (parseFloat(e.valor) || 0),
    0,
  );

  window.saveCardEdit = async (field, value) => {
    const originalValue = card[field];
    try {
      const updateData = { [field]: value };
      Object.assign(card, updateData);
      if (window.render) window.render();

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/cartoes?id=eq.${card.id}`,
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
        fetchCards();
      } else {
        alert("Erro ao salvar alteração no banco.");
        Object.assign(card, { [field]: originalValue });
        if (window.render) window.render();
        fetchCards();
      }
    } catch (err) {
      console.error("Erro no salvamento parcial do cartão:", err);
      Object.assign(card, { [field]: originalValue });
      if (window.render) window.render();
      alert("⚠ Erro de conexão ao salvar alteração.");
      fetchCards();
    }
  };

  return `
        <div class="px-4 pt-6 sm:px-8 sm:pt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                <div class="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
                    <div class="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-brand-primary/10 flex items-center justify-center text-brand-primary text-3xl md:text-5xl font-black border-2 border-transparent shadow-2xl shadow-brand-primary/5 flex-shrink-0">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <div class="flex-1 text-center md:text-left">
                        <div class="flex flex-wrap justify-center md:justify-start items-center gap-2">
                            <input type="text" value="${card.nome}" onblur="window.saveCardEdit('nome', this.value.toUpperCase())"
                                   class="text-3xl md:text-5xl font-display font-black text-white bg-transparent border-b-2 border-transparent hover:border-transparent focus:border-brand-primary outline-none transition-all px-1 uppercase w-full md:w-auto">
                        </div>
                        <div class="text-slate-500 font-bold uppercase tracking-widest text-xs md:text-sm mt-1 flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-1 md:gap-6">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-university text-brand-primary/50"></i>
                                <input type="text" value="${card.banco || ""}" placeholder="Adicionar Banco" onblur="window.saveCardEdit('banco', this.value.toUpperCase())"
                                       class="bg-transparent border-b border-transparent hover:border-transparent focus:border-brand-primary outline-none transition-all px-1 uppercase w-40 font-black">
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-user-circle text-brand-primary/50"></i>
                                <input type="text" value="${card.titular || ""}" placeholder="Adicionar Titular" onblur="window.saveCardEdit('titular', this.value.toUpperCase())"
                                       class="bg-transparent border-b border-transparent hover:border-transparent focus:border-brand-primary outline-none transition-all px-1 uppercase w-56 font-black">
                            </div>
                        </div>
                    </div>
                </div>
                <button onclick="navigate('cards')" class="w-full md:w-auto px-6 py-3 bg-dark-900 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black transition-all border border-transparent uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="glass-card p-6 rounded-[2rem] border border-transparent space-y-2">
                    <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Fechamento</p>
                    <input type="date" value="${card.fechamento}" onchange="window.saveCardEdit('fechamento', this.value || null)" style="color-scheme: dark"
                           class="w-full bg-dark-900 border border-transparent p-4 rounded-2xl outline-none focus:border-transparent transition-all font-bold text-white">
                </div>
                <div class="glass-card p-6 rounded-[2rem] border border-transparent space-y-2">
                    <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Vencimento</p>
                    <input type="date" value="${card.vencimento}" onchange="window.saveCardEdit('vencimento', this.value || null)" style="color-scheme: dark"
                           class="w-full bg-dark-900 border border-transparent p-4 rounded-2xl outline-none focus:border-transparent transition-all font-bold text-brand-primary">
                </div>
                <div class="glass-card p-6 rounded-[2rem] border border-transparent flex flex-col justify-between min-h-[120px]">
                    <div class="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">Gasto no ${periodFilter === "diario" ? "Dia" : periodFilter === "semanal" ? "Período" : periodFilter === "mensal" ? "Mês" : "Total"}</p>
                        <div class="flex bg-dark-900 border border-transparent rounded-xl p-0.5 shadow-inner self-end sm:self-auto overflow-x-auto max-w-full">
                            ${["diario", "semanal", "mensal", "total"]
                              .map(
                                (p) => `
                                <button onclick="window.setExpenseFilter('expensePeriodFilter', '${p}')" 
                                        class="whitespace-nowrap px-2 md:px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all flex-shrink-0
                                        ${state.expensePeriodFilter === p ? "bg-brand-primary text-surface-page shadow-lg shadow-brand-primary/20" : "text-slate-500 hover:text-white"}">
                                    ${p === "diario" ? "Dia" : p === "semanal" ? "Semana" : p === "mensal" ? "Mês" : "Total"}
                                </button>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                    <h4 class="text-2xl md:text-3xl font-black text-slate-600 mt-2">R$ ${totalSpentPeriod.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h4>
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="text-lg font-bold text-slate-300 uppercase tracking-widest text-sm flex items-center gap-2 ml-2">
                    <i class="fas fa-list-ul"></i> Gastos do Período (${filteredCardExpenses.length})
                </h3>
                <div class="bg-dark-900/30 rounded-[2rem] border border-transparent">
                    <div class="divide-y divide-transparent">
                        ${
                          filteredCardExpenses.length === 0
                            ? `<div class="p-10 text-center text-slate-500 italic">Nenhum gasto encontrado para este período.</div>`
                            : filteredCardExpenses
                                .slice(0, 10)
                                .map(
                                  (e) => `
                            <div class="flex items-center justify-between px-4 md:px-8 py-4 hover:bg-white/[0.02] transition-all gap-4">
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs md:text-sm font-bold text-white uppercase truncate">${e.descricao}</p>
                                    <p class="text-[9px] md:text-[10px] text-slate-500 font-bold">${new Date(e.vencimento + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                                </div>
                                <div class="text-right flex-shrink-0">
                                    <p class="text-xs md:text-sm font-black ${e.paga ? "text-slate-300" : "text-slate-600"}">R$ ${(parseFloat(e.valor) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    <span class="text-[8px] md:text-[9px] font-black uppercase tracking-widest ${e.paga ? "text-slate-300/50" : "text-slate-600/50"}">${e.paga ? "PAGO" : "PENDENTE"}</span>
                                </div>
                            </div>
                        `,
                                )
                                .join("")
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
};
