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
        if (errorData.code === "23505")
          alert("⚠ ERRO: Já existe um cartão com este nome.");
        else
          alert(
            "⚠ Erro ao salvar: " +
              (errorData.message || "Falha no banco de dados."),
          );
      }
    } catch (err) {
      console.error(err);
      alert("⚠ Erro de conexão ao salvar cartão.");
    }
  };

  window.deleteCard = async (id) => {
    if (!confirm("Excluir este cartão?")) return;
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
        alert("Erro ao salvar alteração.");
        fetchCards();
      }
    } catch (err) {
      console.error("Erro no salvamento inline de cartão:", err);
    }
  };

  return `
        <div class="px-4 pt-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-6 space-y-6 animate-in fade-in duration-500 pb-32">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-sm">
                <div>
                    <h2 class="text-3xl font-display font-black">Meus Cartões</h2>
                    <p class="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Datas de Fechamento e Vencimento</p>
                </div>
                <button onclick="window.openCardModal()" class="bg-amber-500 text-dark-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 border border-amber-400 flex items-center gap-2">
                    <i class="fas fa-plus"></i> Cadastrar Cartão
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${
                  state.cards.length === 0
                    ? `
                    <div class="col-span-full py-12 text-center text-slate-500 italic font-bold">Nenhum cartão cadastrado. Clique no botão acima para adicionar.</div>
                `
                    : state.cards
                        .map(
                          (c) => `
                    <div onclick="navigate('card-profile', ${c.id})" class="glass-card p-6 rounded-[2rem] border border-white/10 relative group overflow-hidden flex flex-col justify-between cursor-pointer hover:border-amber-500/50 transition-all" style="border-image: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%) 1;">
                        <div class="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                        <div class="flex justify-between items-start relative z-10">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-amber-500 flex-shrink-0">
                                    <i class="fas fa-credit-card text-xl"></i>
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <h3 contenteditable="true" onclick="event.stopPropagation()" onfocus="window.selectAll(this)" data-id="${c.id}" data-field="banco" onblur="window.saveCardInline(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="text-sm font-black text-slate-500 uppercase tracking-widest outline-none px-1 rounded hover:bg-white/5 truncate">${c.banco || "BANCO"}</h3>
                                    <h4 contenteditable="true" onclick="event.stopPropagation()" onfocus="window.selectAll(this)" data-id="${c.id}" data-field="titular" onblur="window.saveCardInline(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="text-xs font-bold text-slate-400 uppercase tracking-tighter outline-none px-1 rounded hover:bg-white/5 truncate -mt-1">${c.titular || "TITULAR"}</h4>
                                </div>
                            </div>
                            <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <button onclick="event.stopPropagation(); window.openCardModal(${JSON.stringify(c).replace(/"/g, "&quot;")})" class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-dark-950 transition-all flex items-center justify-center border border-amber-500/20">
                                    <i class="fas fa-edit text-xs"></i>
                                </button>
                                <button onclick="event.stopPropagation(); window.deleteCard(${c.id})" class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/20">
                                    <i class="fas fa-trash text-xs"></i>
                                </button>
                            </div>
                        </div>
                        <div class="relative z-10 mt-4">
                            <h2 contenteditable="true" onclick="event.stopPropagation()" onfocus="window.selectAll(this)" data-id="${c.id}" data-field="nome" onblur="window.saveCardInline(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}" class="text-2xl font-black text-white uppercase outline-none px-1 rounded hover:bg-white/5">${c.nome}</h2>
                        </div>
                        <div class="grid grid-cols-1 xs:grid-cols-2 gap-3 relative z-10 border-t border-white/5 pt-4 mt-2">
                            <div onclick="event.stopPropagation()" class="flex flex-col">
                                <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Fechamento</p>
                                <input type="date" data-id="${c.id}" data-field="fechamento" style="color-scheme: dark" value="${String(c.fechamento || "").includes("-") ? c.fechamento : ""}" onchange="window.saveCardInline(this)" class="w-full bg-dark-950/50 border border-white/5 p-2 rounded-xl outline-none focus:border-amber-500/50 transition-all font-bold text-[10px] text-white cursor-pointer hover:bg-white/5">
                            </div>
                            <div onclick="event.stopPropagation()" class="flex flex-col">
                                <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1 xs:text-right">Vencimento</p>
                                <input type="date" data-id="${c.id}" data-field="vencimento" style="color-scheme: dark" value="${String(c.vencimento || "").includes("-") ? c.vencimento : ""}" onchange="window.saveCardInline(this)" class="w-full bg-dark-950/50 border border-white/5 p-2 rounded-xl outline-none focus:border-amber-500/50 transition-all font-bold text-[10px] text-amber-500 cursor-pointer hover:bg-white/5 text-center xs:text-right">
                            </div>
                        </div>
                    </div>
                `,
                        )
                        .join("")
                }
            </div>

            ${
              state.isCardModalOpen
                ? `
                <div class="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div class="glass-card w-[98%] sm:w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[95vh] custom-scroll">
                        <div class="py-4 px-6 border-b border-white/5 flex justify-between items-center bg-dark-900/50 sticky top-0 z-10 backdrop-blur-md">
                            <h3 class="text-xl font-bold">${state.editingCard?.id ? "Editar Cartão" : "Novo Cartão"}</h3>
                            <button onclick="window.closeCardModal()" class="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500"><i class="fas fa-times"></i></button>
                        </div>
                        <form onsubmit="window.saveCard(event)" class="p-5 space-y-5">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nome do Cartão (Apelido)</label>
                                <input type="text" name="nome" required value="${state.editingCard?.nome || ""}" placeholder="EX: NUBANK PF, INTER..." class="w-full bg-dark-900 border border-white/5 p-4 rounded-2xl outline-none focus:border-amber-500/50 transition-all font-bold uppercase text-sm">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Banco / Emissor</label>
                                <input type="text" name="banco" value="${state.editingCard?.banco || ""}" placeholder="EX: ITAÚ, BRADESCO..." class="w-full bg-dark-900 border border-white/5 p-4 rounded-2xl outline-none focus:border-amber-500/50 transition-all font-bold uppercase text-sm">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Titular do Cartão</label>
                                <input type="text" name="titular" value="${state.editingCard?.titular || ""}" placeholder="EX: MEU NOME, ESPOSA..." class="w-full bg-dark-900 border border-white/5 p-4 rounded-2xl outline-none focus:border-amber-500/50 transition-all font-bold uppercase text-sm">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Data Fechamento</label>
                                    <input type="date" name="fechamento" style="color-scheme: dark" value="${String(state.editingCard?.fechamento || "").includes("-") ? state.editingCard.fechamento : ""}" class="w-full bg-dark-900 border border-white/5 p-4 rounded-2xl outline-none focus:border-amber-500/50 transition-all font-bold text-sm">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Data Vencimento</label>
                                    <input type="date" name="vencimento" style="color-scheme: dark" value="${String(state.editingCard?.vencimento || "").includes("-") ? state.editingCard.vencimento : ""}" class="w-full bg-dark-900 border border-white/5 p-4 rounded-2xl outline-none focus:border-amber-500/50 transition-all font-bold text-sm">
                                </div>
                            </div>
                            <button type="submit" class="w-full bg-amber-500 text-dark-950 font-black py-4 rounded-xl border border-transparent shadow-lg shadow-amber-500/20 active:scale-95 uppercase tracking-widest text-xs transition-all mt-2">${state.editingCard?.id ? "Salvar Alterações" : "Cadastrar Cartão"}</button>
                        </form>
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `;
};
