import { state } from "../../core/state.js";
import { NavLink } from "../navigation.js";

export const Sidebar = () => `
    <aside class="hidden md:flex w-64 bg-dark-900 border-r border-white/5 flex flex-col h-full transition-all duration-300">
        <div class="p-6 overflow-hidden">
            <h1 class="text-xl font-display font-extrabold text-amber-500 tracking-tighter italic whitespace-nowrap">
                LUCAS <span class="text-white"> DO CORTE</span>
            </h1>
        </div>
        <nav class="flex-1 px-4 space-y-2 mt-4">
            ${NavLink("dashboard", "fa-chart-line", "Dashboard")}
            ${NavLink("records", "fa-table", "Agendamentos")}
            ${NavLink("clients", "fa-sliders", "Gestão")}
            ${NavLink("plans", "fa-id-card", "Planos")}
            ${NavLink("expenses", "fa-arrow-trend-down", "Saídas")}
            ${NavLink("cards", "fa-credit-card", "Cartões")}
            ${NavLink("setup", "fa-gears", "Configuração")}
        </nav>
        <div class="p-4 border-t border-white/5">
            <div class="flex items-center space-x-3 p-2 rounded-xl bg-dark-950/50">
                <div class="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-dark-900 shadow-lg shadow-black/20">
                    <img src="assets/logo.png" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=Lucas+do+Corte&background=F59E0B&color=000'">
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold truncate text-white uppercase">Lucas do Corte</p>
                    <p class="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Premium Plan</p>
                </div>
            </div>
        </div>
    </aside>
`;
