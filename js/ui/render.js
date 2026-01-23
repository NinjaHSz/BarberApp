import { state } from "../core/state.js";
import { Sidebar } from "./components/Sidebar.js";
import { Header } from "./components/Header.js";
import { MobileNav } from "./components/MobileNav.js";
import { EditModal } from "./modals/EditModal.js";
import { pages } from "./pages/index.js";

export function render() {
  const app = document.getElementById("app");
  if (!app) return;

  const mainEl = app.querySelector("main");
  const scrollPos = mainEl ? mainEl.scrollTop : 0;

  const activeEl = document.activeElement;
  const activeId = activeEl ? activeEl.id : null;
  let selection = null;
  let activeValue = null;

  if (activeEl) {
    if (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") {
      selection = {
        start: activeEl.selectionStart,
        end: activeEl.selectionEnd,
        type: "input",
      };
      activeValue = activeEl.value;
    } else if (activeEl.isContentEditable) {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        selection = {
          start: range.startOffset,
          end: range.endOffset,
          type: "contenteditable",
        };
        activeValue = activeEl.innerText;
      }
    }
  }

  const contentFn = pages[state.currentPage] || (() => "404");
  const content = contentFn();

  app.innerHTML = `
        <div class="flex h-full w-full bg-pattern text-white">
            ${Sidebar()}
            <div class="flex-1 flex flex-col min-w-0 h-full relative">
                ${Header()}
                <main id="mainContent" class="flex-1 overflow-y-auto custom-scroll pb-24 md:pb-0">
                    ${content}
                </main>
                ${MobileNav()}
            </div>
            ${state.isEditModalOpen ? EditModal() : ""}
        </div>
    `;

  const newMain = document.getElementById("mainContent");
  if (newMain) newMain.scrollTop = scrollPos;

  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      if (activeValue !== null) {
        if (
          selection &&
          selection.type === "input" &&
          (el.tagName === "INPUT" || el.tagName === "TEXTAREA")
        ) {
          if (el.value !== activeValue) el.value = activeValue;
        } else if (
          selection &&
          selection.type === "contenteditable" &&
          el.isContentEditable
        ) {
          if (el.innerText !== activeValue) el.innerText = activeValue;
        }
      }

      el.focus();
      if (selection) {
        if (
          selection.type === "input" &&
          (el.tagName === "INPUT" || el.tagName === "TEXTAREA")
        ) {
          el.setSelectionRange(selection.start, selection.end);
        } else if (
          selection.type === "contenteditable" &&
          el.isContentEditable
        ) {
          try {
            const range = document.createRange();
            const sel = window.getSelection();
            if (el.firstChild) {
              const textNode = el.firstChild;
              const len = textNode.textContent.length;
              range.setStart(textNode, Math.min(selection.start, len));
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            } else if (activeValue) {
              el.innerText = activeValue;
              const textNode = el.firstChild;
              if (textNode) {
                range.setStart(
                  textNode,
                  Math.min(selection.start, textNode.length),
                );
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          } catch (e) {
            console.warn("Erro ao restaurar cursor:", e);
          }
        }
      }
    }
  }
}

window.render = render;
