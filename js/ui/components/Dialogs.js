import { state } from "../../core/state.js";

export const initDialogs = () => {
  // --- Custom Alert ---
  window.showAlert = (message, type = "info") => {
    const oldAlert = document.getElementById("custom-alert");
    if (oldAlert) oldAlert.remove();

    const alertEl = document.createElement("div");
    alertEl.id = "custom-alert";
    alertEl.className =
      "fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-bottom-4 duration-300";

    const icon =
      type === "error"
        ? "fa-circle-xmark text-rose-500"
        : "fa-circle-check text-emerald-500";

    alertEl.innerHTML = `
      <div class="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 bg-surface-section/95 backdrop-blur-xl shadow-2xl border-none">
        <i class="fas ${icon} text-xl"></i>
        <p class="text-sm font-bold text-text-primary capitalize">${message}</p>
      </div>
    `;

    document.body.appendChild(alertEl);
    setTimeout(() => {
      alertEl.classList.add("fade-out", "slide-out-to-bottom-4");
      setTimeout(() => alertEl.remove(), 300);
    }, 3000);
  };

  // --- Custom Confirm ---
  window.showConfirm = (message, onConfirm) => {
    const overlay = document.createElement("div");
    overlay.id = "confirm-overlay";
    overlay.className =
      "fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200";

    overlay.innerHTML = `
      <div class="glass-card w-full max-w-xs bg-surface-section/95 rounded-3xl p-8 shadow-2xl border-none animate-in zoom-in-95 duration-200">
        <div class="flex flex-col items-center text-center gap-6">
          <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-text-primary">
            <i class="fas fa-question text-2xl"></i>
          </div>
          <p class="text-base font-bold text-text-primary leading-tight">${message}</p>
          
          <div class="flex flex-col w-full gap-3 mt-2">
            <button id="confirm-yes" class="w-full py-4 rounded-2xl bg-text-primary text-surface-page font-black uppercase text-xs tracking-widest active:scale-95 transition-all border-none">
              Confirmar
            </button>
            <button id="confirm-no" class="w-full py-4 rounded-2xl bg-surface-subtle text-text-secondary font-black uppercase text-xs tracking-widest active:scale-95 transition-all border-none">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.add("fade-out");
      overlay.querySelector("div").classList.add("zoom-out-95");
      setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector("#confirm-yes").onclick = () => {
      onConfirm();
      close();
    };

    overlay.querySelector("#confirm-no").onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };
  };
};
