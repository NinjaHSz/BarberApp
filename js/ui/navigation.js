import { state } from "../core/state.js";
import { fetchExpenses, fetchCards } from "../api/supabase.js";

export function navigate(page, data = null) {
  if (page === "manage") {
    if (window.openAddModal) {
      window.openAddModal(
        data || "",
        `${state.filters.year}-${String(state.filters.month).padStart(2, "0")}-${String(state.filters.day).padStart(2, "0")}`,
      );
    }
    return;
  }
  if (page === "expenses") {
    fetchExpenses();
    fetchCards();
  }
  if (page === "cards") {
    fetchCards();
  }
  if (page === "card-profile") {
    state.selectedCardId = data;
  }
  if (page === "client-profile") {
    state.selectedClientId = data;
  }
  state.currentPage = page;
  state.clientSearch = "";
  state.isClientDropdownOpen = false;
  state.editingRecord = null;
  if (window.render) window.render();
}

export const NavLink = (page, icon, label) => {
  const isActive = state.currentPage === page;
  return `
        <button onclick="window.navigate('${page}')" 
                class="flex items-center w-full px-0 rounded-xl transition-all duration-200 group border border-transparent min-h-[48px]
                ${isActive ? "bg-brand-primary text-surface-page shadow-lg shadow-brand-primary/20" : "text-text-muted hover:bg-white/5 hover:text-text-primary"}">
            <div class="w-20 shrink-0 flex items-center justify-center">
                <i class="fas ${icon} text-lg ${isActive ? "" : "group-hover:text-brand-primary"}"></i>
            </div>
            <span class="font-black text-[10px] uppercase tracking-widest whitespace-nowrap hidden group-hover/sidebar:block opacity-100 transition-all duration-300 ml-0">${label}</span>
        </button>
    `;
};

export const MobileNavLink = (page, icon, label) => {
  const isActive = state.currentPage === page;
  return `
        <button onclick="window.navigate('${page}')" 
                class="flex flex-col items-center space-y-1 transition-all
                ${isActive ? "text-brand-primary" : "text-text-secondary"}">
            <i class="fas ${icon} text-lg"></i>
            <span class="text-[9px] font-black uppercase tracking-tighter">${label}</span>
        </button>
    `;
};

window.navigate = navigate;
