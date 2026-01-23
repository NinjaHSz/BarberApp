import { state } from "../core/state.js";

export const applyTheme = () => {
  if (state.theme && state.theme.accentRgb) {
    document.documentElement.style.setProperty(
      "--accent-rgb",
      state.theme.accentRgb,
    );
  }
};

export const hexToRgb = (hex) => {
  // Remove # if present
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;

  // Handle 3-digit hex
  const r = parseInt(
    cleanHex.length === 3
      ? cleanHex[0] + cleanHex[0]
      : cleanHex.substring(0, 2),
    16,
  );
  const g = parseInt(
    cleanHex.length === 3
      ? cleanHex[1] + cleanHex[1]
      : cleanHex.substring(2, 4),
    16,
  );
  const b = parseInt(
    cleanHex.length === 3
      ? cleanHex[2] + cleanHex[2]
      : cleanHex.substring(4, 6),
    16,
  );

  return `${r} ${g} ${b}`;
};

window.applyTheme = applyTheme;
window.hexToRgb = hexToRgb;
