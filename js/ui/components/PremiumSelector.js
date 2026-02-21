export const PremiumSelector = ({
  id,
  value,
  options,
  onSelect,
  className = "",
}) => {
  const activeOption =
    options.find((o) => String(o.value) === String(value)) || options[0];
  const label = activeOption ? activeOption.label : value;

  // Serializando as opções para passar pro onclick de forma segura
  const serializedOptions = JSON.stringify(options).replace(/"/g, "&quot;");

  // Serializando o valor atual de forma segura
  const safeValue = String(value).replace(/'/g, "\\'");

  return `
        <div id="${id}" 
             onclick="window.showPremiumMenu(event, ${serializedOptions}, ${onSelect}, '${safeValue}')"
             class="flex items-center justify-between gap-2 bg-surface-section hover:bg-surface-subtle transition-all cursor-pointer px-4 py-2 rounded-2xl min-w-[120px] group ${className}">
            <span class="text-[11px] font-black uppercase text-text-primary truncate transition-all group-hover:tracking-wider">${label}</span>
            <i class="fas fa-chevron-down text-[8px] text-text-muted transition-transform group-hover:translate-y-0.5"></i>
        </div>
    `;
};

window.PremiumSelectorComponent = PremiumSelector;
