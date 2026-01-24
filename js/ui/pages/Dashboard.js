import { state } from "../../core/state.js";

const maskPrivacy = (val) => (state.privacyMode ? "R$ ••••" : val);

export const KPICard = (title, value, icon) => `
    <div class="bg-surface-section/30 p-5 rounded-2xl group transition-all duration-300 relative border border-transparent hover:bg-surface-section/50">
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-text-muted group-hover:text-brand-primary transition-colors">
                <i class="fas ${icon} text-sm"></i>
            </div>
            <div>
                <p class="text-[9px] font-black text-text-muted uppercase tracking-widest">${title}</p>
                <h2 class="text-text-primary text-xl sm:text-2xl font-display font-black tracking-tighter">${maskPrivacy(value)}</h2>
            </div>
        </div>
    </div>
`;

export const Dashboard = () => {
  if (!state.isIntegrated) {
    return `
            <div class="p-8 h-full flex items-center justify-center">
                <div class="text-center space-y-4">
                    <i class="fas fa-database text-text-muted text-6xl mb-4"></i>
                    <h2 class="text-text-primary text-2xl font-bold">Nenhum dado conectado</h2>
                    <button onclick="navigate('setup')" class="btn-primary">Configurar Agora</button>
                </div>
            </div>
        `;
  }

  window.renderCharts = () => {
    if (state.charts.profit) state.charts.profit.destroy();
    const targetDay = parseInt(state.filters.day);
    const targetMonth = String(state.filters.month).padStart(2, "0");
    const targetYear = String(state.filters.year);
    const monthPrefix = `${targetYear}-${targetMonth}`;
    const dayPrefix = `${monthPrefix}-${String(targetDay).padStart(2, "0")}`;

    let profitRecords = [];
    let groupKeyFn;
    let labelFn = (k) => k;

    if (state.profitFilter === "diario") {
      profitRecords = state.records.filter(
        (r) =>
          r.date ===
          (targetDay === 0
            ? new Date().toISOString().split("T")[0]
            : dayPrefix),
      );
      groupKeyFn = (r) => r.time.split(":")[0] + ":00";
    } else if (state.profitFilter === "semanal") {
      const targetDate =
        targetDay === 0
          ? new Date()
          : new Date(
              state.filters.year,
              state.filters.month - 1,
              state.filters.day,
            );
      const currentWeekDay = targetDate.getDay();
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - currentWeekDay);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const startStr = startOfWeek.toISOString().split("T")[0];
      const endStr = endOfWeek.toISOString().split("T")[0];
      profitRecords = state.records.filter(
        (r) => r.date >= startStr && r.date <= endStr,
      );
      groupKeyFn = (r) => {
        const parts = r.date.split("-");
        return new Date(parts[0], parts[1] - 1, parts[2]).getDay();
      };
      const wDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      labelFn = (k) => wDays[parseInt(k)];
    } else if (state.profitFilter === "mensal") {
      profitRecords = state.records.filter((r) =>
        r.date.startsWith(monthPrefix),
      );
      groupKeyFn = (r) => r.date.split("-")[2];
      labelFn = (k) => `Dia ${k}`;
    } else if (state.profitFilter === "anual") {
      profitRecords = state.records.filter((r) =>
        r.date.startsWith(targetYear),
      );
      groupKeyFn = (r) => r.date.split("-")[1];
      const monthNames = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      labelFn = (k) => monthNames[parseInt(k) - 1];
    }

    const profitStats = profitRecords.reduce((acc, r) => {
      const key = groupKeyFn(r);
      acc[key] = (acc[key] || 0) + r.value;
      return acc;
    }, {});

    const targetDateStr =
      targetDay === 0 ? new Date().toISOString().split("T")[0] : dayPrefix;
    const relevantPlanPayments = (state.allPlanPayments || []).filter((p) => {
      if (state.profitFilter === "diario")
        return p.data_pagamento === targetDateStr;
      if (state.profitFilter === "semanal") {
        const targetDate =
          targetDay === 0
            ? new Date()
            : new Date(
                state.filters.year,
                state.filters.month - 1,
                state.filters.day,
              );
        const currentWeekDay = targetDate.getDay();
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - currentWeekDay);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const pDate = new Date(p.data_pagamento + "T12:00:00");
        return pDate >= startOfWeek && pDate <= endOfWeek;
      }
      if (state.profitFilter === "mensal")
        return p.data_pagamento.startsWith(monthPrefix);
      if (state.profitFilter === "anual")
        return p.data_pagamento.startsWith(targetYear);
      return false;
    });

    relevantPlanPayments.forEach((p) => {
      let key;
      if (state.profitFilter === "diario") key = "12:00";
      else if (state.profitFilter === "semanal") {
        const parts = p.data_pagamento.split("-");
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        key = d.getDay();
      } else if (state.profitFilter === "mensal")
        key = p.data_pagamento.split("-")[2];
      else if (state.profitFilter === "anual")
        key = p.data_pagamento.split("-")[1];

      if (key !== undefined)
        profitStats[key] = (profitStats[key] || 0) + parseFloat(p.valor);
    });

    const sortedKeys = Object.keys(profitStats).sort();
    const ctx2 = document.getElementById("profitChart")?.getContext("2d");
    if (ctx2) {
      state.charts.profit = new Chart(ctx2, {
        type: "line",
        data: {
          labels: sortedKeys.map(labelFn),
          datasets: [
            {
              label: "Faturamento R$",
              data: sortedKeys.map((k) => profitStats[k]),
              borderColor: state.theme.accent,
              backgroundColor: `rgba(${state.theme.accentRgb}, 0.1)`,
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: state.theme.accent,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              grid: { color: "rgba(255,255,255,0.03)" },
              ticks: { color: "#64748b", font: { size: 10 } },
            },
            x: {
              grid: { display: false },
              ticks: { color: "#64748b", font: { size: 10 } },
            },
          },
        },
      });
    }
  };

  window.updateProfitFilter = (val) => {
    state.profitFilter = val;
    if (window.render) window.render();
  };

  setTimeout(() => window.renderCharts(), 0);

  return `
        <div class="px-4 py-6 sm:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8 max-w-7xl mx-auto">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div class="space-y-0.5">
                    <h2 class="text-text-primary text-xl font-display font-black uppercase tracking-tighter">${state.barbershopName} — PAINEL</h2>
                    <p class="text-[9px] text-text-muted font-black uppercase tracking-widest">Painel de Performance Estratégica</p>
                </div>
                <button onclick="window.navigate('expenses')" 
                        class="text-[9px] font-black text-rose-500/50 hover:text-rose-500 transition-all uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-arrow-trend-down"></i> Gerar Relatório de Saídas
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                ${KPICard("Dia Atual", state.kpis.diario, "fa-calendar-day")}
                ${KPICard("Mês Corrente", state.kpis.mensal, "fa-calendar-days")}
                ${KPICard("Fechamento Anual", state.kpis.anual, "fa-calendar-check")}
            </div>

            <div class="space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                    <h3 class="text-[10px] font-black text-white uppercase tracking-widest italic">Análise de Lucro Bruto</h3>
                    <div class="flex bg-surface-section rounded-lg p-0.5">
                        ${["diario", "semanal", "mensal", "anual"]
                          .map(
                            (f) => `
                            <button onclick="window.updateProfitFilter('${f}')" 
                                    class="px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all
                                    ${state.profitFilter === f ? "bg-brand-primary text-surface-page" : "text-text-muted hover:text-white"}">
                                ${f}
                            </button>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
                <div class="bg-surface-section/30 p-6 rounded-[2rem] h-[350px] flex flex-col">
                    <div class="flex-1 min-h-0"><canvas id="profitChart"></canvas></div>
                </div>
            </div>
        </div>
    `;
};
