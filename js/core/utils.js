import { state } from "./state.js";

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(
        result[3],
        16,
      )}`
    : "245 158 11";
}

export function applyTheme() {
  document.documentElement.style.setProperty(
    "--accent-rgb",
    state.theme.accentRgb,
  );
  localStorage.setItem("themeAccent", state.theme.accent);
  localStorage.setItem("themeAccentRgb", state.theme.accentRgb);
}

export function selectAll(el) {
  setTimeout(() => {
    if (!el || document.activeElement !== el) return;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.select();
    } else {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, 50);
}

// Bind to window for HTML accessibility
window.selectAll = selectAll;
window.applyTheme = applyTheme;
