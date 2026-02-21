export const selectAll = (el) => {
  if (!el) return;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    el.select();
  } else {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

export const selectText = (el) => {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

export const showPremiumMenu = (event, options, onSelect, activeValue) => {
  // Prevent click from propagating to window listener
  if (event) event.stopPropagation();

  // Remove existing menus
  document.querySelectorAll(".premium-menu").forEach((m) => m.remove());

  const menu = document.createElement("div");
  menu.className = "premium-menu custom-scroll fixed h-auto min-w-[140px]";

  menu.innerHTML = options
    .map((opt) => {
      const safeValue = String(opt.value).replace(/'/g, "\\'");
      const safeLabel = String(opt.label).replace(/'/g, "\\'");
      return `
        <div class="premium-item ${opt.value == activeValue ? "active" : ""}" 
             onmousedown="window.selectPremiumOption(this, '${safeValue}', '${safeLabel}')">
            <span>${opt.label}</span>
            ${opt.value == activeValue ? '<i class="fas fa-check"></i>' : ""}
        </div>
      `;
    })
    .join("");

  document.body.appendChild(menu);

  // Position
  const rect = event.currentTarget.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let top = rect.bottom + 8;
  let left = rect.left;

  // Adjust if off-screen
  if (top + menuRect.height > window.innerHeight) {
    top = rect.top - menuRect.height - 8;
  }
  if (left + menuRect.width > window.innerWidth) {
    left = window.innerWidth - menuRect.width - 16;
  }

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;

  // Store callback
  window._premiumOnSelect = onSelect;

  // Close on outside click
  const close = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      window.removeEventListener("mousedown", close);
    }
  };
  window.addEventListener("mousedown", close, { once: true });
};

window.selectPremiumOption = (el, value, label) => {
  if (window._premiumOnSelect) {
    window._premiumOnSelect(value, label);
  }
  el.closest(".premium-menu")?.remove();
};

window.selectAll = selectAll;
window.selectText = selectText;
window.showPremiumMenu = showPremiumMenu;
