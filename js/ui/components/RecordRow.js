import { state } from "../../core/state.js";
import { navigate } from "../navigation.js";

export const viewProfileByName = (name) => {
  const client = state.clients.find(
    (c) => (c.nome || "").toLowerCase() === name.toLowerCase(),
  );
  if (client) {
    navigate("client-profile", client.id);
  } else {
    alert("Cliente não encontrado.");
  }
};

window.viewProfileByName = viewProfileByName;

export const RecordRow = (record) => {
  const isEmpty = !!record.isEmpty;
  const isBreak = record.client === "PAUSA";
  const id = record.id || "new";
  const rowId = record.id
    ? `rec_${record.id}`
    : `new_${record.time.replace(/:/g, "")}`;

  const isCompact = state.displayMode === "compact";

  // Grid Mobile Simplificado: [70px (Time) | 1fr (Client) | 80px (Actions)]
  return `
    <div class="grid grid-cols-[70px_1fr_80px] md:grid-cols-[70px_1.5fr_1.2fr_1fr_100px_130px_100px] gap-4 items-center px-6 ${isCompact ? "py-2" : "py-4"} hover:bg-surface-subtle transition-colors group relative border-none ${isBreak ? "bg-surface-subtle" : ""} focus-within:z-[100] z-[1]">

      <!-- HORARIO -->
      <div class="text-[13px] md:text-sm text-text-primary font-bold md:font-medium flex items-center gap-2">
        <i class="far fa-clock text-[10px] opacity-40 md:hidden"></i>
        <span>${record.time.substring(0, 5)}</span>
      </div>

      <!-- CLIENTE -->
      <div class="text-[13px] md:text-sm font-black md:font-semibold truncate uppercase ${isEmpty ? "text-text-muted" : "text-text-primary text-white"}">
        ${record.client}
      </div>

      <!-- SERVIÇO (Hidden on Mobile) -->
      <div class="hidden md:block text-sm font-black md:font-medium truncate uppercase ${isEmpty ? "text-text-muted" : "text-text-primary text-white opacity-80"}">
        ${record.service}
      </div>

      <!-- VALOR (Hidden on Mobile) -->
      <div class="hidden md:block text-sm font-bold text-text-primary">
        R$ ${record.value.toFixed(2)}
      </div>

      <!-- AÇÕES -->
      <div class="flex justify-end items-center gap-2">
        ${
          !isEmpty
            ? `<div class="flex gap-2.5">
               <button onclick="window.editAppointment('${record.id}')" class="text-text-secondary hover:text-white transition-all"><i class="fas fa-edit text-xs"></i></button>
               <button onclick="window.cancelAppointment('${record.id}')" class="text-text-secondary hover:text-white transition-all"><i class="fas fa-trash-can text-xs"></i></button>
             </div>`
            : `<button onclick="window.openAddModal('${record.time}', '${record.date}')" 
                     class="px-3 py-1.5 rounded-lg bg-text-primary text-surface-page text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95 border-none">
                Agendar
             </button>`
        }
      </div>

      <!-- Observações e Pagamento (Apenas Desktop / Detalhes) -->
      <div class="hidden md:block text-xs text-text-secondary italic truncate">
        ${record.observations || "---"}
      </div>
      <div class="hidden md:block text-[10px] font-black uppercase text-text-muted">
        ${record.paymentMethod || "---"}
      </div>
    </div>
  `;
};
