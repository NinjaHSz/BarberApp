import { PremiumSelector } from "./PremiumSelector.js";
import { state } from "../../core/state.js";
import { updateInternalStats } from "../../services/stats.js";
import { syncFromSheet } from "../../api/sync.js";
import { fetchClients, fetchProcedures } from "../../api/supabase.js";

export const Header = () => {
  window.updateFilter = (type, val) => {
    state.filters[type] = parseInt(val);
    updateInternalStats();
    if (window.render) window.render();
  };

  window.changeDay = (delta) => {
    const current = new Date(
      state.filters.year,
      state.filters.month - 1,
      state.filters.day,
    );
    current.setDate(current.getDate() + delta);

    state.filters.day = current.getDate();
    state.filters.month = current.getMonth() + 1;
    state.filters.year = current.getFullYear();

    updateInternalStats();
    if (window.render) window.render();
  };

  window.syncAll = async () => {
    const btn = document.getElementById("globalSyncBtn");
    if (btn) btn.classList.add("fa-spin");

    await Promise.all([
      syncFromSheet(state.sheetUrl),
      fetchClients(),
      fetchProcedures(),
    ]);

    if (btn) btn.classList.remove("fa-spin");
  };

  const months = [
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
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Mapeamento de opções para os PremiumSelectors
  const dayOptions = days.map((d) => {
    const dayDate = new Date(state.filters.year, state.filters.month - 1, d);
    const weekday = dayDate
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase()
      .substring(0, 3);
    return { value: d, label: `${weekday} ${String(d).padStart(2, "0")}` };
  });

  const monthOptions = months.map((m, i) => ({
    value: i + 1,
    label: m.substring(0, 3).toUpperCase(),
  }));

  const yearOptions = [
    { value: 2025, label: "'25" },
    { value: 2026, label: "'26" },
  ];

  return `
        <header class="h-16 md:h-14 border-none flex items-center justify-between px-4 md:px-8 bg-surface-page sticky top-0 z-20">
            <!-- Navegação de Data Premium -->
            <div class="flex items-center space-x-2">
                <!-- Dia/Dia Semana -->
                <div class="flex items-center bg-surface-section rounded-2xl p-0.5">
                    <button onclick="window.changeDay(-1)" class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white transition-colors">
                        <i class="fas fa-chevron-left text-[10px]"></i>
                    </button>
                    
                    ${PremiumSelector({
                      id: "daySelector",
                      value: state.filters.day,
                      options: dayOptions,
                      onSelect: "(val) => window.updateFilter('day', val)",
                      className: "bg-transparent !px-2 !py-1.5 w-[85px]",
                    })}

                    <button onclick="window.changeDay(1)" class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white transition-colors">
                        <i class="fas fa-chevron-right text-[10px]"></i>
                    </button>
                </div>

                <!-- Mês -->
                <div class="flex items-center bg-surface-section rounded-2xl p-0.5">
                    ${PremiumSelector({
                      id: "monthSelector",
                      value: state.filters.month,
                      options: monthOptions,
                      onSelect: "(val) => window.updateFilter('month', val)",
                      className: "bg-transparent !px-3 !py-1.5 min-w-[70px]",
                    })}
                </div>

                <!-- Ano -->
                <div class="hidden sm:flex items-center bg-surface-section rounded-2xl p-0.5">
                    ${PremiumSelector({
                      id: "yearSelector",
                      value: state.filters.year,
                      options: yearOptions,
                      onSelect: "(val) => window.updateFilter('year', val)",
                      className: "bg-transparent !px-3 !py-1.5 min-w-[60px]",
                    })}
                </div>

                <!-- Ano Mobile (Compact) -->
                <div class="sm:hidden flex items-center bg-surface-section rounded-2xl p-0.5 px-3 py-2">
                   <span class="text-[11px] font-black text-text-primary">'${String(state.filters.year).slice(-2)}</span>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <h1 class="text-sm font-display font-black text-brand-primary italic tracking-tighter opacity-80">BARBER</h1>
                <button onclick="window.syncAll()" class="w-9 h-9 rounded-2xl bg-surface-section hover:bg-surface-subtle transition-all flex items-center justify-center border-none">
                    <i id="globalSyncBtn" class="fas fa-arrows-rotate text-[11px] text-text-primary"></i>
                </button>
            </div>
        </header>
    `;
};
