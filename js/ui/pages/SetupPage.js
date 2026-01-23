import { state } from "../../core/state.js";
import { applyTheme, hexToRgb } from "../../ui/theme.js";
import { syncFromSheet } from "../../api/sync.js";

export const SetupPage = () => {
  window.updateColor = (hex) => {
    state.theme.accent = hex;
    state.theme.accentRgb = hexToRgb(hex);
    applyTheme();
    if (window.render) window.render();
  };

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
            <div class="max-w-2xl w-full glass-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-2xl">
                <div class="text-center space-y-6">
                    <h2 class="text-4xl font-display font-black">Configuração de Dados</h2>
                    <p class="text-slate-400">Cole a URL do Google Sheets ou do seu Apps Script Pro.</p>
                    <div class="space-y-4 pt-8 text-left">
                        <label class="text-xs font-bold text-slate-500 uppercase">Link de Integração</label>
                        <input type="text" id="sheetUrl" value="${state.sheetUrl || ""}" placeholder="https://script.google.com/macros/s/..." 
                               class="w-full bg-dark-900 border border-white/10 p-5 rounded-2xl outline-none focus:border-amber-500 transition-all font-mono text-xs">
                        <div class="flex gap-4">
                            <button onclick="window.validateConnection()" class="flex-1 bg-amber-500 text-dark-950 p-5 rounded-2xl font-bold text-lg border border-transparent transition-all">
                                ${state.isValidating ? "Sincronizando..." : "Conectar e Carregar"}
                            </button>
                            ${
                              state.isIntegrated
                                ? `
                                <button onclick="window.disconnectSheet()" class="px-6 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-bold hover:bg-rose-500 hover:text-white transition-all">
                                    <i class="fas fa-unlink"></i>
                                </button>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    <div class="text-xs text-slate-600 mt-8 space-y-2">
                        <p>💡 <b>Dica:</b> Para o Método 2, use o link que termina em <span class="text-amber-500">/exec</span>.</p>
                        <p>O app salvará automaticamente este link no seu navegador.</p>
                    </div>
                </div>
                <!-- Configuração de Tema -->
                <div class="mt-12 pt-12 border-t border-white/5 text-left">
                    <h3 class="text-xl font-bold mb-2">Personalização</h3>
                    <p class="text-slate-500 text-sm mb-8">Escolha a cor de destaque do seu dashboard.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-4">
                            <label class="text-xs font-bold text-slate-500 uppercase">Cor de Destaque</label>
                            <div class="flex items-center space-x-4 bg-dark-900 border border-white/10 p-4 rounded-2xl">
                                <input type="color" id="colorPicker" value="${state.theme.accent}" oninput="window.updateColor(this.value)"
                                       class="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer">
                                <span class="font-mono text-sm font-bold uppercase">${state.theme.accent}</span>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <label class="text-xs font-bold text-slate-500 uppercase">Sugestões (Premium)</label>
                            <div class="flex flex-wrap gap-3">
                                ${[
                                  "#F59E0B",
                                  "#10B981",
                                  "#3B82F6",
                                  "#8B5CF6",
                                  "#F43F5E",
                                  "#737373",
                                ]
                                  .map(
                                    (color) => `
                                    <button onclick="window.updateColor('${color}')" class="w-8 h-8 rounded-full border-2 ${state.theme.accent === color ? "border-white" : "border-transparent"}"
                                            style="background-color: ${color}"></button>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};
