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
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today);

  return `
        <header class="h-14 md:h-14 border-none flex items-center justify-between px-3 md:px-8 bg-surface-page/80 backdrop-blur-xl sticky top-0 z-20">
            <div class="flex items-center space-x-1.5 md:space-x-4">
                <select onchange="window.updateFilter('day', this.value)" class="bg-surface-section border-none text-[10px] md:text-xs font-bold rounded-lg px-2 md:px-3 py-1.5 outline-none focus:ring-1 focus:ring-border-focus w-20 md:w-auto text-text-primary">
                    ${days
                      .map((d) => {
                        const dayDate = new Date(
                          state.filters.year,
                          state.filters.month - 1,
                          d,
                        );
                        const weekday = dayDate
                          .toLocaleDateString("pt-BR", { weekday: "short" })
                          .replace(".", "")
                          .toUpperCase()
                          .substring(0, 3);
                        return `<option value="${d}" ${state.filters.day === d ? "selected" : ""}>${weekday} ${String(d).padStart(2, "0")}</option>`;
                      })
                      .join("")}
                </select>
                <select onchange="window.updateFilter('month', this.value)" class="bg-surface-section border-none text-[10px] md:text-xs font-bold rounded-lg px-1.5 md:px-3 py-1.5 outline-none focus:ring-1 focus:ring-border-focus w-16 md:w-auto text-text-primary">
                    ${months.map((m, i) => `<option value="${i + 1}" ${state.filters.month === i + 1 ? "selected" : ""}>${m.substring(0, 3).toUpperCase()}</option>`).join("")}
                </select>
                <select onchange="window.updateFilter('year', this.value)" class="bg-surface-section border-none text-[10px] md:text-xs font-bold rounded-lg px-1.5 md:px-3 py-1.5 outline-none focus:ring-1 focus:ring-border-focus w-14 md:w-auto text-text-primary">
                    <option value="2025" ${state.filters.year === 2025 ? "selected" : ""}>'25</option>
                    <option value="2026" ${state.filters.year === 2026 ? "selected" : ""}>'26</option>
                </select>
            </div>
            <div class="flex items-center space-x-2 md:space-x-4">
                <div class="hidden sm:flex items-center space-x-2 text-xs md:text-sm text-text-secondary">
                    <i class="fas fa-calendar"></i>
                    <span class="font-medium">${formattedDate}</span>
                </div>
                <div class="md:hidden flex items-center mr-2">
                    <h1 class="text-sm font-display font-black text-brand-primary italic tracking-tighter">BARBER</h1>
                </div>
                <button onclick="window.syncAll()" class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-surface-subtle hover:bg-brand-primary/10 hover:text-brand-primary transition-all flex items-center justify-center border-none uppercase">
                    <i id="globalSyncBtn" class="fas fa-sync-alt text-xs md:text-sm"></i>
                </button>
            </div>
        </header>
    `;
};
