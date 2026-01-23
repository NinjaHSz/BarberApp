import { MobileNavLink } from "../navigation.js";

export const MobileNav = () => `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-dark-900/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-40 pb-safe">
        ${MobileNavLink("dashboard", "fa-chart-line", "Início")}
        ${MobileNavLink("records", "fa-calendar", "Agenda")}
        ${MobileNavLink("clients", "fa-sliders", "Gestão")}
        ${MobileNavLink("expenses", "fa-arrow-trend-down", "Saídas")}
        ${MobileNavLink("setup", "fa-gears", "Ajustes")}
    </nav>
`;
