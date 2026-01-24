import { state } from "../../core/state.js";
import { applyTheme, hexToRgb } from "../../ui/theme.js";
import { syncFromSheet } from "../../api/sync.js";

export const SetupPage = () => {
  window.validateConnection = async () => {
    const url = document.getElementById("sheetUrl").value.trim();
    if (!url) return alert("Por favor, insira a URL da planilha ou do script.");
    state.isValidating = true;
    if (window.render) window.render();
    const success = await syncFromSheet(url);
    state.isValidating = false;
    if (success) {
      alert("Conectado com sucesso!");
    } else {
      alert(
        "Não foi possível ler dados neste link. Verifique se o link está correto e público.",
      );
    }
    if (window.render) window.render();
  };

  window.disconnectSheet = () => {
    if (
      confirm(
        "Deseja realmente desconectar a planilha? Todos os dados locais serão limpos.",
      )
    ) {
      localStorage.removeItem("sheetUrl");
      localStorage.removeItem("isIntegrated");
      state.sheetUrl = "";
      state.isIntegrated = false;
      state.records = [];
      state.kpis = { diario: "R$ 0,00", mensal: "R$ 0,00", anual: "R$ 0,00" };
      if (window.render) window.render();
    }
  };

  return `
        <div class="p-4 sm:p-8 flex items-center justify-center min-h-[80vh] animate-in fade-in duration-500">
            <div class="max-w-2xl w-full glass-card p-6 sm:p-12 rounded-2xl border-none shadow-2xl">
                <div class="text-center space-y-6">
                    <h2 class="text-text-primary text-4xl font-display font-black">Configuração de Dados</h2>
                    <p class="text-text-secondary">Cole a URL do Google Sheets ou do seu Apps Script Pro.</p>
                    <div class="space-y-4 pt-8 text-left">
                        <label class="text-xs font-bold text-text-muted uppercase">Link de Integração</label>
                        <input type="text" id="sheetUrl" value="${state.sheetUrl || ""}" placeholder="https://script.google.com/macros/s/..." 
                               class="w-full bg-surface-section border-none p-5 rounded-xl outline-none focus:ring-1 focus:ring-border-focus transition-all font-mono text-xs text-text-primary">
                        <div class="flex gap-4">
                            <button onclick="window.validateConnection()" class="flex-1 btn-primary text-lg">
                                ${state.isValidating ? "Sincronizando..." : "Conectar e Carregar"}
                            </button>
                            ${
                              state.isIntegrated
                                ? `
                                <button onclick="window.disconnectSheet()" class="px-6 bg-status-error/10 text-status-error border-none rounded-xl font-bold hover:bg-status-error hover:text-white transition-all">
                                    <i class="fas fa-unlink"></i>
                                </button>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    <div class="text-xs text-text-muted mt-8 space-y-2">
                        <p>💡 <b>Dica:</b> Para o Método 2, use o link que termina em <span class="text-brand-primary">/exec</span>.</p>
                        <p>O app salvará automaticamente este link no seu navegador.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};
