import { state } from "../../core/state.js";
import { applyTheme, hexToRgb } from "../../ui/theme.js";
import { syncFromSheet } from "../../api/sync.js";

export const SetupPage = () => {
  window.updateSetupValue = (key, val) => {
    state[key] = val;
    localStorage.setItem(key, val);
    if (window.render) window.render();
  };

  window.togglePrivacy = () => {
    state.privacyMode = !state.privacyMode;
    localStorage.setItem("privacyMode", state.privacyMode);
    if (window.render) window.render();
  };

  window.handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      window.updateSetupValue("customLogo", event.target.result);
    };
    reader.readAsDataURL(file);
  };

  window.validateConnection = async () => {
    const url = document.getElementById("sheetUrl").value.trim();
    if (!url) {
      window.showAlert("Por favor, insira a URL da planilha.", "info");
      return;
    }
    state.isValidating = true;
    if (window.render) window.render();
    const success = await syncFromSheet(url);
    state.isValidating = false;
    if (success) {
      window.showAlert("Conectado com sucesso!");
    } else {
      window.showAlert(
        "Não foi possível ler dados neste link. Verifique se o link está correto e público.",
        "error",
      );
    }
    if (window.render) window.render();
  };

  window.disconnectSheet = () => {
    const performDisconnect = () => {
      localStorage.removeItem("sheetUrl");
      localStorage.removeItem("isIntegrated");
      state.sheetUrl = "";
      state.isIntegrated = false;
      state.records = [];
      if (window.render) window.render();
    };

    window.showConfirm(
      "Deseja realmente desconectar a planilha? Todos os dados locais serão limpos.",
      performDisconnect,
    );
  };

  return `
        <div class="px-4 py-8 sm:px-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center space-y-2">
                <h2 class="text-3xl font-display font-black text-white uppercase tracking-tighter">Configurações</h2>
                <p class="text-[10px] text-text-muted font-black uppercase tracking-widest italic">Personalize sua experiência de gestão</p>
            </div>

            <!-- Identity Section -->
            <div class="space-y-6">
                <div class="flex items-center gap-3 px-2 border-b border-white/5 pb-4">
                    <i class="fas fa-id-card text-brand-primary text-xs"></i>
                    <h3 class="text-[10px] font-black text-white uppercase tracking-widest">Identidade Visual</h3>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-surface-section/20 p-8 rounded-[2.5rem]">
                    <div class="flex flex-col items-center gap-4">
                        <div class="relative group cursor-pointer">
                            <div class="w-24 h-24 rounded-full bg-surface-page flex items-center justify-center overflow-hidden border border-white/5 shadow-2xl transition-all group-hover:brightness-125">
                                <img src="${state.customLogo}" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fas fa-camera text-white text-xl"></i>
                                </div>
                            </div>
                            <input type="file" onchange="window.handleLogoUpload(event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer">
                        </div>
                        <p class="text-[8px] font-black text-text-muted uppercase tracking-widest">Logo da Unidade</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Nome da Unidade</label>
                            <input type="text" value="${state.barbershopName}" 
                                   onchange="window.updateSetupValue('barbershopName', this.value.toUpperCase())"
                                   class="w-full bg-surface-page border-none p-4 rounded-xl outline-none text-white font-black text-sm uppercase tracking-tighter focus:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Management UX Section -->
            <div class="space-y-6">
                <div class="flex items-center gap-3 px-2 border-b border-white/5 pb-4">
                    <i class="fas fa-sliders text-brand-primary text-xs"></i>
                    <h3 class="text-[10px] font-black text-white uppercase tracking-widest">Experiência e Gestão</h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Privacy Mode -->
                    <div onclick="window.togglePrivacy()" class="bg-surface-section/20 p-6 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-surface-section/40 transition-all">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted">
                                <i class="fas ${state.privacyMode ? "fa-eye-slash text-brand-primary" : "fa-eye"}"></i>
                            </div>
                            <div>
                                <h4 class="text-[10px] font-black text-white uppercase tracking-tighter">Modo Privacidade</h4>
                                <p class="text-[8px] text-text-muted font-bold uppercase">Esconder valores financeiros</p>
                            </div>
                        </div>
                        <div class="w-10 h-5 rounded-full ${state.privacyMode ? "bg-brand-primary" : "bg-white/10"} relative transition-all">
                            <div class="absolute top-1 ${state.privacyMode ? "right-1" : "left-1"} w-3 h-3 rounded-full bg-white transition-all"></div>
                        </div>
                    </div>

                    <!-- Display Mode -->
                    <div class="bg-surface-section/20 p-6 rounded-2xl flex justify-between items-center">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted">
                                <i class="fas fa-up-down-left-right text-xs"></i>
                            </div>
                            <div>
                                <h4 class="text-[10px] font-black text-white uppercase tracking-tighter">Visualização</h4>
                                <p class="text-[8px] text-text-muted font-bold uppercase">Layout do painel principal</p>
                            </div>
                        </div>
                        <select onchange="window.updateSetupValue('displayMode', this.value)" class="bg-surface-page border-none text-[9px] font-black uppercase p-2 rounded-lg outline-none cursor-pointer">
                            <option value="comfortable" ${state.displayMode === "comfortable" ? "selected" : ""}>Confortável</option>
                            <option value="compact" ${state.displayMode === "compact" ? "selected" : ""}>Compacto</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Integration Hub -->
            <div class="space-y-6">
                <div class="flex items-center gap-3 px-2 border-b border-white/5 pb-4">
                    <i class="fas fa-database text-brand-primary text-xs"></i>
                    <h3 class="text-[10px] font-black text-white uppercase tracking-widest">Integração de Dados</h3>
                </div>

                <div class="bg-surface-section/20 p-8 rounded-[2.5rem] space-y-4">
                    <label class="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Webhook / Google Script URL</label>
                    <input type="text" id="sheetUrl" value="${state.sheetUrl || ""}" 
                           placeholder="https://script.google.com/macros/s/..."
                           class="w-full bg-surface-page border-none p-5 rounded-xl outline-none text-[10px] text-text-primary font-mono focus:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                    
                    <div class="flex gap-4">
                        <button onclick="window.validateConnection()" class="flex-1 bg-brand-primary text-surface-page py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/10 active:scale-[0.98] transition-all">
                            ${state.isValidating ? "Sincronizando..." : "Atualizar Integração"}
                        </button>
                        ${
                          state.isIntegrated
                            ? `
                            <button onclick="window.disconnectSheet()" class="px-6 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                                <i class="fas fa-unlink"></i>
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
};
