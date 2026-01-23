import { state } from "../../core/state.js";

export const setupExpenseAutocomplete = () => {
  window.showExpenseAutocomplete = (el, isModal = false, type = "card") => {
    const id = isModal ? `${type}_modal` : el.dataset.id;
    const val = (isModal ? el.value : el.innerText).trim().toLowerCase();
    const dropdown = document.getElementById(`expenseAutocomplete_${id}`);
    if (!dropdown) return;

    if (val.length < 1) {
      dropdown.classList.add("hidden");
      return;
    }

    let matches = [];
    if (type === "card") {
      matches = state.cards
        .filter((c) => c.nome.toLowerCase().includes(val))
        .slice(0, 5);
    } else if (type === "desc") {
      const commonDescs = [...new Set(state.expenses.map((e) => e.descricao))];
      matches = commonDescs
        .filter((d) => d && d.toLowerCase().includes(val))
        .slice(0, 5)
        .map((d) => ({ nome: d }));
    }

    if (matches.length === 0) {
      dropdown.classList.add("hidden");
      return;
    }

    dropdown.innerHTML = matches
      .map(
        (match) => `
        <div class="px-3 py-2 hover:bg-amber-500 hover:text-dark-950 cursor-pointer rounded-lg transition-colors font-bold uppercase truncate text-[11px]"
             onmousedown="window.selectExpenseData('${id}', '${match.nome}', ${isModal}, '${type}')">
            <i class="fas ${type === "card" ? "fa-credit-card" : "fa-tag"} mr-2 text-[10px] text-amber-500/50"></i>
            ${match.nome}
        </div>
    `,
      )
      .join("");
    dropdown.classList.remove("hidden");
  };

  window.selectExpenseData = (id, value, isModal = false, type = "card") => {
    if (isModal) {
      const fieldName = type === "card" ? "cartao" : "descricao";
      const el = document.querySelector(
        `#expenseModal input[name="${fieldName}"]`,
      );
      if (el) el.value = value.toUpperCase();
      const dropdown = document.getElementById(`expenseAutocomplete_${id}`);
      if (dropdown) dropdown.classList.add("hidden");
    } else {
      const el = document.querySelector(
        `[data-field="cartao"][data-id="${id}"]`,
      );
      if (el) {
        el.innerText = value.toUpperCase();
        el.dataset.beganTyping = "false";
        const dropdown = document.getElementById(`expenseAutocomplete_${id}`);
        if (dropdown) dropdown.classList.add("hidden");
        if (window.saveExpenseInline) window.saveExpenseInline(el);
      }
    }
  };

  window.maskParcela = (el) => {
    let value = el.value.replace(/[^\d/]/g, "");
    const parts = value.split("/");
    if (parts.length > 2) value = parts[0] + "/" + parts[1];
    if (parts[0] && parts[0].length > 2)
      value =
        parts[0].substring(0, 2) +
        (parts[1] !== undefined ? "/" + parts[1] : "");
    if (parts[1] && parts[1].length > 2)
      value = (parts[0] || "") + "/" + parts[1].substring(0, 2);
    el.value = value;
  };
};
