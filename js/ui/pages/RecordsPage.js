import { state } from "../../core/state.js";
import { RecordRow } from "../components/RecordRow.js";
import { navigate } from "../navigation.js";

export const RecordsPage = () => {
  if (!state.isIntegrated) {
    return `
            <div class="p-8 h-full flex items-center justify-center">
                <div class="text-center space-y-4">
                    <i class="fas fa-table text-6xl text-white/5 mb-4"></i>
                    <h2 class="text-2xl font-bold">Sem dados sincronizados</h2>
                    <button onclick="navigate('setup')" class="bg-brand-primary text-surface-page px-6 py-2 rounded-xl font-bold border border-transparent transition-all">Conectar Planilha</button>
                </div>
            </div>
        `;
  }

  const targetDay = parseInt(state.filters.day);
  const targetMonth = String(state.filters.month).padStart(2, "0");
  const targetYear = String(state.filters.year);
  const monthPrefix = `${targetYear}-${targetMonth}`;
  const dayPrefix = `${monthPrefix}-${String(targetDay).padStart(2, "0")}`;

  let recordsToDisplay = [];

  if (targetDay === 0) {
    recordsToDisplay = state.records
      .filter((r) => r.date.startsWith(monthPrefix))
      .filter(
        (r) =>
          (r.client || "")
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase()) ||
          (r.service || "")
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase()),
      );
  } else {
    const existingForDay = state.records.filter((r) => r.date === dayPrefix);

    if (state.searchTerm) {
      recordsToDisplay = existingForDay.filter(
        (r) =>
          (r.client || "")
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase()) ||
          (r.service || "")
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase()),
      );
    } else {
      const realAppointments = existingForDay.sort((a, b) =>
        a.time.localeCompare(b.time),
      );
      const dayStartMin = 7 * 60 + 20; // 07:20
      const dayEndMin = 20 * 60 + 40; // 20:40
      const lunchStartMin = 12 * 60; // 12:00
      const lunchEndMin = 13 * 60; // 13:00
      const slotDuration = 40;

      const toMin = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      const fromMin = (m) => {
        const h = Math.floor(m / 60);
        const min = m % 60;
        return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      };

      const records = [];
      const unhandledReals = [...realAppointments];
      let currentMin = dayStartMin;

      while (currentMin <= dayEndMin) {
        if (currentMin >= lunchStartMin && currentMin < lunchEndMin) {
          currentMin = lunchEndMin;
          continue;
        }

        const nextReal = unhandledReals[0];
        const nextRealMin = nextReal ? toMin(nextReal.time) : null;

        if (nextRealMin !== null && nextRealMin <= currentMin + 20) {
          records.push(nextReal);
          unhandledReals.shift();
        } else {
          records.push({
            time: fromMin(currentMin),
            client: "---",
            service: "A DEFINIR",
            value: 0,
            paymentMethod: "PIX",
            isEmpty: true,
            date: dayPrefix,
          });
        }
        currentMin += slotDuration;
        if (records.length > 100) break;
      }
      unhandledReals.forEach((r) => records.push(r));
      recordsToDisplay = records.sort((a, b) => a.time.localeCompare(b.time));

      if (!state.showEmptySlots) {
        recordsToDisplay = recordsToDisplay.filter((r) => !r.isEmpty);
      }
    }
  }

  const isCompact = state.displayMode === "compact";

  return `
        <div class="px-4 py-8 md:px-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-32">
             <!-- TÍTULOS -->
             <div class="mb-2">
                <h2 class="text-text-primary text-4xl font-black tracking-tight">Histórico</h2>
                <p class="text-text-secondary text-base mt-2 font-medium opacity-60">Sincronização Ativa</p>
            </div>

            <!-- BARRA DE AÇÕES -->
            <div class="flex items-center gap-3 w-full">
                <button onclick="navigate('manage')" 
                        class="flex items-center justify-center w-12 h-12 rounded-full bg-text-primary text-surface-page active:scale-95 transition-all shadow-lg shadow-white/10 shrink-0 border-none">
                    <i class="fas fa-plus text-xl"></i>
                </button>
                
                <button onclick="window.toggleEmptySlots()" 
                        class="flex items-center justify-center w-12 h-12 rounded-2xl border-none bg-surface-section active:scale-95 transition-all shrink-0">
                    <i class="fas ${state.showEmptySlots ? "fa-eye-slash" : "fa-eye"} text-text-primary text-lg"></i>
                </button>
                
                <button onclick="window.handleCopyTimes(event)" 
                        class="flex items-center justify-center w-12 h-12 rounded-2xl border-none bg-surface-section active:scale-95 transition-all shrink-0">
                    <i class="fas fa-copy text-text-primary text-lg"></i>
                </button>

                <div class="relative flex-1">
                    <i class="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-text-muted text-lg"></i>
                    <input type="text" 
                           id="recordsSearchInput"
                           placeholder="Buscar agendamento..." 
                           oninput="window.handleSearch(this)"
                           value="${state.searchTerm}"
                           class="bg-surface-section border-none h-14 pl-14 pr-6 rounded-3xl text-base text-text-primary outline-none w-full transition-all font-medium placeholder:text-text-muted">
                </div>
            </div>

            <!-- TABELA / LISTA -->
            <div class="mt-8 space-y-1">
                <!-- Cabeçalho (Simplificado Mobile: Horário, Cliente, Ações) -->
                <div class="grid grid-cols-[70px_1fr_80px] md:grid-cols-[70px_1.5fr_1.2fr_1fr_100px_130px_100px] gap-4 px-6 py-2 text-[11px] font-black text-text-secondary uppercase tracking-widest opacity-60">
                    <div class="text-left">Horário</div>
                    <div class="text-left">Cliente</div>
                    <div class="hidden md:block text-left">Serviço</div>
                    <div class="hidden md:block text-left">Valor</div>
                    <div class="text-right pr-2">Ações</div>
                </div>

                <div id="tableBody" class="space-y-1">
                    ${recordsToDisplay.map((r) => RecordRow(r)).join("")}
                </div>
            </div>
        </div>
    `;
};
