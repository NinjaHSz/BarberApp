import { state } from "../core/state.js";

export function updateInternalStats() {
  const targetDay = state.filters.day;
  const targetMonth = String(state.filters.month).padStart(2, "0");
  const targetYear = String(state.filters.year);
  const monthPrefix = `${targetYear}-${targetMonth}`;
  const dayPrefix = `${monthPrefix}-${String(targetDay).padStart(2, "0")}`;
  const displayDay =
    targetDay === 0 ? new Date().toISOString().split("T")[0] : dayPrefix;

  const calculateCombinedTotal = (datePredicate) => {
    const recTotal = (state.records || [])
      .filter((r) => datePredicate(r.date))
      .reduce((acc, r) => acc + (r.value || 0), 0);
    const planTotal = (state.allPlanPayments || [])
      .filter((p) => datePredicate(p.data_pagamento))
      .reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);
    return recTotal + planTotal;
  };

  const daily = calculateCombinedTotal((d) => d === displayDay);
  const monthly = calculateCombinedTotal((d) => d.startsWith(monthPrefix));
  const annual = calculateCombinedTotal((d) => d.startsWith(targetYear));

  state.kpis.diario = `R$ ${daily.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  state.kpis.mensal = `R$ ${monthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  state.kpis.anual = `R$ ${annual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  state.barbers = [
    { name: "Faturamento Período", revenue: monthly, score: 100 },
  ];
}

window.updateInternalStats = updateInternalStats;
