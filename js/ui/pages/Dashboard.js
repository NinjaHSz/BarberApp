import { state } from "../../core/state.js";

export const KPICard = (title, value, icon) => `
    <div class="glass-card p-5 sm:p-7 rounded-[2rem] group hover:border-amber-500/30 transition-all duration-500 relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
        <div class="flex justify-between items-start mb-4 sm:mb-6">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <i class="fas ${icon} text-xl sm:text-2xl"></i>
            </div>
        </div>
        <p class="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">${title}</p>
        <h2 class="text-2xl sm:text-4xl font-display font-extrabold mt-1 sm:mt-2 tracking-tight">${value}</h2>
    </div>
`;

export const Dashboard = () => {
  if (!state.isIntegrated) {
    return `
            <div class="p-8 h-full flex items-center justify-center">
                <div class="text-center space-y-4">
                    <i class="fas fa-database text-6xl text-white/5 mb-4"></i>
                    <h2 class="text-2xl font-bold">Nenhum dado conectado</h2>
                    <button onclick="navigate('setup')" class="bg-amber-500 text-dark-950 px-6 py-2 rounded-xl font-bold border border-transparent transition-all">Configurar Agora</button>
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
        <div class="px-4 pt-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-6 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="flex justify-between items-end">
                <div>
                    <h2 class="text-2xl sm:text-3xl font-display font-bold">Lucas do Corte - BI</h2>
                    <p class="text-slate-500 text-xs sm:text-sm mt-1">Gestão financeira e performance estratégica</p>
                </div>
                <button onclick="window.navigate('expenses')" 
                        class="bg-rose-500/10 text-rose-500 px-6 py-2.5 rounded-xl font-bold border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-rose-500/5 group">
                    <i class="fas fa-arrow-trend-down group-hover:-translate-y-0.5 transition-transform"></i>
                    SAÍDAS
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${KPICard("Faturamento do Dia", state.kpis.diario, "fa-calendar-day")}
                ${KPICard("Faturamento do Mês", state.kpis.mensal, "fa-calendar-days")}
                ${KPICard("Faturamento do Ano", state.kpis.anual, "fa-calendar-check")}
            </div>
            <div class="grid grid-cols-1 gap-6 sm:gap-8 pb-8">
                <div class="glass-card p-6 sm:p-8 rounded-[2rem] h-[400px] sm:h-[450px] flex flex-col">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                        <h3 class="text-lg font-bold">Lucro Bruto</h3>
                        <div class="flex bg-dark-950 p-1 rounded-xl border border-white/5 space-x-1 overflow-x-auto max-w-full no-scrollbar">
                            ${["diario", "semanal", "mensal", "anual"]
                              .map(
                                (f) => `
                                <button onclick="window.updateProfitFilter('${f}')" 
                                        class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all
                                        ${state.profitFilter === f ? "bg-amber-500 text-dark-950 shadow-lg shadow-amber-500/20" : "text-slate-500 hover:text-white"}">
                                    ${f}
                                </button>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                    <div class="flex-1 min-h-0"><canvas id="profitChart"></canvas></div>
                </div>
            </div>
        </div>
    `;
};
