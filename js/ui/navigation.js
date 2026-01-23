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
                class="flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group border border-transparent
                ${isActive ? "bg-amber-500 text-dark-950 shadow-lg shadow-amber-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}">
            <i class="fas ${icon} w-6 text-lg ${isActive ? "" : "group-hover:text-amber-500"}"></i>
            <span class="ml-3 font-semibold">${label}</span>
        </button>
    `;
};

export const MobileNavLink = (page, icon, label) => {
  const isActive = state.currentPage === page;
  return `
        <button onclick="window.navigate('${page}')" 
                class="flex flex-col items-center space-y-1 transition-all
                ${isActive ? "text-amber-500" : "text-slate-500"}">
            <i class="fas ${icon} text-lg"></i>
            <span class="text-[9px] font-black uppercase tracking-tighter">${label}</span>
        </button>
    `;
};

window.navigate = navigate;
