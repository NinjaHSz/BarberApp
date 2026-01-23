import { state } from "./state.js";

export function updateInternalStats() {
  const formatCurrency = (val) =>
    "R$ " +
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.substring(0, 7);
  const thisYear = today.substring(0, 4);

  const calculateCombinedTotal = (datePredicate) => {
    const serviceTotal = state.records
      .filter((r) => datePredicate(r.date))
      .reduce((acc, r) => acc + (parseFloat(r.value) || 0), 0);

    const planTotal = (state.allPlanPayments || [])
      .filter((p) => datePredicate(p.data_pagamento))
      .reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);

    return serviceTotal + planTotal;
  };

  state.kpis.diario = formatCurrency(
    calculateCombinedTotal((d) => d === today),
  );
  state.kpis.mensal = formatCurrency(
    calculateCombinedTotal((d) => d.startsWith(thisMonth)),
  );
  state.kpis.anual = formatCurrency(
    calculateCombinedTotal((d) => d.startsWith(thisYear)),
  );

  if (window.render) window.render();
}

window.updateInternalStats = updateInternalStats;
