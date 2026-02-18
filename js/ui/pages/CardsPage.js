import { state } from "../../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../../core/config.js";
import { fetchCards } from "../../api/supabase.js";
import { navigate } from "../navigation.js";

export const CardsPage = () => {
  window.openCardModal = (card = null) => {
    state.editingCard = card || {
      nome: "",
      banco: "",
      titular: "",
      fechamento: "",
      vencimento: "",
    };
    state.isCardModalOpen = true;
    if (window.render) window.render();
  };

  window.closeCardModal = () => {
    state.isCardModalOpen = false;
    state.editingCard = null;
    if (window.render) window.render();
  };

  window.saveCard = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      nome: formData.get("nome").toUpperCase(),
      banco: formData.get("banco").toUpperCase(),
      titular: formData.get("titular").toUpperCase(),
      fechamento: formData.get("fechamento") || null,
      vencimento: formData.get("vencimento") || null,
    };

    const id = state.editingCard.id;
    const method = id ? "PATCH" : "POST";
    const url = id
      ? `${SUPABASE_URL}/rest/v1/cartoes?id=eq.${id}`
      : `${SUPABASE_URL}/rest/v1/cartoes`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        window.closeCardModal();
        fetchCards();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Erro Supabase:", errorData);
        const msg =
          errorData.code === "23505"
            ? "ERRO: Já existe um cartão com este nome."
            : "Erro ao salvar: " +
              (errorData.message || "Falha no banco de dados.");
        if (window.showAlert) window.showAlert(msg, "error");
      }
    } catch (err) {
      console.error(err);
      if (window.showAlert)
        window.showAlert("Erro de conexão ao salvar cartão.", "error");
    }
  };

  window.deleteCard = async (id) => {
    const performDelete = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/cartoes?id=eq.${id}`, {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
          },
        });
        if (res.ok) fetchCards();
      } catch (err) {
        console.error(err);
      }
    };

    if (window.showConfirm) {
      window.showConfirm("Deseja excluir este cartão?", performDelete);
    }
  };

  window.saveCardInline = async (el) => {
    const id = el.dataset.id;
    const field = el.dataset.field;
    let value = el.innerText.trim();

    if (field === "nome" || field === "banco" || field === "titular") {
      value = value.toUpperCase();
    } else if (field === "fechamento" || field === "vencimento") {
      value = el.value || null;
    }

    try {
      const card = state.cards.find((c) => c.id == id);
      if (card) card[field] = value;
      if (window.render) window.render();

      const res = await fetch(`${SUPABASE_URL}/rest/v1/cartoes?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        fetchCards();
      } else {
        if (window.showAlert)
          window.showAlert("Erro ao salvar alteração.", "error");
        fetchCards();
      }
    } catch (err) {
      console.error("Erro no salvamento inline de cartão:", err);
    }
  };

  return `
        <div class="px-4 py-6 sm:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 max-w-7xl mx-auto">
            <!-- Header Section -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div class="space-y-1">
                    <h2 class="text-2xl font-display font-black text-white uppercase tracking-tighter">Gestão de Cartões</h2>
                    <p class="text-[9px] text-text-muted font-black uppercase tracking-widest italic">Controle de ciclos e vencimentos</p>
                </div>
                <button onclick="window.openCardModal()" class="w-full sm:w-auto px-6 py-3 bg-brand-primary text-surface-page rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-brand-primary/10">
                    <i class="fas fa-plus text-[10px]"></i> Novo Cartão
                </button>
            </div>

            <!-- Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                ${
                  state.cards.length === 0
                    ? `<div class="col-span-full p-12 bg-surface-section/30 rounded-[2rem] text-center text-text-muted text-[10px] font-black uppercase tracking-widest italic">Nenhum cartão ativo</div>`
                    : state.cards
                        .map(
                          (c) => `
                    <div onclick="navigate('card-profile', ${c.id})" class="bg-surface-section/40 p-6 rounded-[2rem] flex flex-col justify-between min-h-[200px] hover:bg-surface-section/60 transition-all group cursor-pointer relative overflow-hidden">
                        <!-- Card Branding -->
                        <div class="flex justify-between items-start">
                            <div class="flex-1 space-y-0.5">
                                <div contenteditable="true" onclick="event.stopPropagation()" onblur="window.saveCardInline(this)" data-id="${c.id}" data-field="banco" class="text-[9px] font-black text-brand-primary uppercase tracking-widest outline-none truncate hover:text-white transition-colors">${c.banco || "EMISSOR"}</div>
                                <div contenteditable="true" onclick="event.stopPropagation()" onblur="window.saveCardInline(this)" data-id="${c.id}" data-field="titular" class="text-[10px] font-bold text-text-muted uppercase tracking-tighter outline-none truncate italic">${c.titular || "TITULAR"}</div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="event.stopPropagation(); window.openCardModal(${JSON.stringify(c).replace(/"/g, "&quot;")})" class="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-white/5 text-text-muted hover:text-white transition-all flex items-center justify-center">
                                    <i class="fas fa-pencil text-[9px]"></i>
                                </button>
                                <button onclick="event.stopPropagation(); window.deleteCard(${c.id})" class="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-rose-500/5 text-text-muted hover:text-rose-500 transition-all flex items-center justify-center">
                                    <i class="fas fa-trash-can text-[9px]"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Card Name -->
                        <div class="mt-4">
                            <div contenteditable="true" onclick="event.stopPropagation()" onblur="window.saveCardInline(this)" data-id="${c.id}" data-field="nome" class="text-lg font-display font-black text-white uppercase tracking-tighter outline-none hover:text-brand-primary transition-colors">${c.nome}</div>
                        </div>

                        <!-- Card Meta -->
                        <div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                            <div onclick="event.stopPropagation()" class="space-y-1">
                                <p class="text-[8px] font-black text-text-muted uppercase tracking-widest">Fechamento</p>
                                <input type="date" value="${c.fechamento}" data-id="${c.id}" data-field="fechamento" onchange="window.saveCardInline(this)" class="bg-transparent border-none text-[10px] font-black text-white outline-none w-full p-0 cursor-pointer" style="color-scheme: dark">
                            </div>
                            <div onclick="event.stopPropagation()" class="space-y-1">
                                <p class="text-[8px] font-black text-text-muted uppercase tracking-widest">Vencimento</p>
                                <input type="date" value="${c.vencimento}" data-id="${c.id}" data-field="vencimento" onchange="window.saveCardInline(this)" class="bg-transparent border-none text-[10px] font-black text-brand-primary outline-none w-full p-0 cursor-pointer" style="color-scheme: dark">
                            </div>
                        </div>

                        <!-- Subtle Chip Decor -->
                        <div class="absolute -bottom-8 -right-8 w-24 h-24 bg-brand-primary/5 rounded-full blur-xl animate-pulse"></div>
                    </div>
                `,
                        )
                        .join("")
                }
            </div>

            <!-- Edit Modal -->
            ${
              state.isCardModalOpen
                ? `
                <div class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-surface-page/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div class="bg-surface-section w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
                        <div class="flex justify-between items-center">
                            <h3 class="text-[10px] font-black text-white uppercase tracking-widest">${state.editingCard?.id ? "Editar Registro" : "Novo Registro"}</h3>
                            <button onclick="window.closeCardModal()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-all"><i class="fas fa-times text-[10px]"></i></button>
                        </div>
                        <form onsubmit="window.saveCard(event)" class="space-y-4">
                            <div class="space-y-1.5">
                                <label class="text-[8px] font-black uppercase text-text-muted tracking-widest ml-1">Apelido do Cartão</label>
                                <input type="text" name="nome" required value="${state.editingCard?.nome || ""}" placeholder="EX: NUBANK PF" class="w-full bg-surface-page border-none p-4 rounded-xl outline-none text-white font-bold text-xs uppercase tracking-tighter focus:shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition-all">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1.5">
                                    <label class="text-[8px] font-black uppercase text-text-muted tracking-widest ml-1">Banco</label>
                                    <input type="text" name="banco" value="${state.editingCard?.banco || ""}" placeholder="EMISSOR" class="w-full bg-surface-page border-none p-4 rounded-xl outline-none text-white font-bold text-xs uppercase tracking-tighter">
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-[8px] font-black uppercase text-text-muted tracking-widest ml-1">Titular</label>
                                    <input type="text" name="titular" value="${state.editingCard?.titular || ""}" placeholder="NOME" class="w-full bg-surface-page border-none p-4 rounded-xl outline-none text-white font-bold text-xs uppercase tracking-tighter">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1.5">
                                    <label class="text-[8px] font-black uppercase text-text-muted tracking-widest ml-1">Fechamento</label>
                                    <input type="date" name="fechamento" value="${state.editingCard?.fechamento || ""}" class="w-full bg-surface-page border-none p-4 rounded-xl outline-none text-white font-bold text-xs uppercase tracking-tighter" style="color-scheme: dark">
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-[8px] font-black uppercase text-text-muted tracking-widest ml-1">Vencimento</label>
                                    <input type="date" name="vencimento" value="${state.editingCard?.vencimento || ""}" class="w-full bg-surface-page border-none p-4 rounded-xl outline-none text-white font-bold text-xs uppercase tracking-tighter" style="color-scheme: dark">
                                </div>
                            </div>
                            <button type="submit" class="w-full bg-brand-primary text-surface-page font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-widest text-[10px] mt-4 shadow-xl shadow-brand-primary/10">
                                ${state.editingCard?.id ? "Salvar Alterações" : "Ativar Cartão"}
                            </button>
                        </form>
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `;
};
