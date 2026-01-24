import { state } from "../../core/state.js";
import { NavLink } from "../navigation.js";

export const Sidebar = () => `
    <aside class="hidden md:flex flex-col h-full bg-surface-section transition-all duration-300 w-20 hover:w-64 group/sidebar z-50 overflow-hidden border-none text-white">
        <!-- Brand Section (Head) -->
        <div class="h-24 flex items-center group-hover/sidebar:justify-start transition-all overflow-hidden shrink-0">
            <div class="w-20 shrink-0 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full overflow-hidden shadow-2xl border border-white/5 bg-surface-page">
                    <img src="assets/logo.png" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=L&background=09090B&color=D4D4D8'">
                </div>
            </div>
            <div class="flex flex-col opacity-0 group-hover/sidebar:opacity-100 transition-opacity whitespace-nowrap">
                <h1 class="text-xs font-black text-white uppercase tracking-tighter">L. DO CORTE</h1>
                <p class="text-[8px] text-brand-primary font-black uppercase tracking-widest">Premium Admin</p>
            </div>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 px-0 space-y-1">
            ${NavLink("dashboard", "fa-chart-line", "Dashboard")}
            ${NavLink("records", "fa-calendar-alt", "Agenda")}
            ${NavLink("clients", "fa-users", "Clientes")}
            ${NavLink("plans", "fa-crown", "Planos")}
            ${NavLink("expenses", "fa-minus-circle", "Saídas")}
            ${NavLink("cards", "fa-credit-card", "Cartões")}
            ${NavLink("setup", "fa-cog", "Ajustes")}
        </nav>
    </aside>
`;
