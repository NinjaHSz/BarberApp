import { state } from "../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../core/config.js";

export async function fetchClients() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?select=*&order=nome.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      },
    );
    if (res.ok) {
      state.clients = await res.json();
      if (window.render) window.render();
    }
  } catch (err) {
    console.error("Erro ao buscar clientes:", err);
  }
  await fetchAllPlanPayments();
  if (window.updateInternalStats) window.updateInternalStats();
  if (window.render) window.render();
}

export async function fetchProcedures() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/procedimentos?select=*&order=nome.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      },
    );
    if (res.ok) {
      state.procedures = await res.json();
      if (window.render) window.render();
    }
  } catch (err) {
    console.error("Erro ao buscar procedimentos:", err);
  }
}

export async function fetchPaymentHistory(clientId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pagamentos_planos?cliente_id=eq.${clientId}&select=*&order=data_pagamento.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      },
    );
    if (res.ok) {
      state.paymentHistory = await res.json();
      state.paymentsFetchedForClientId = clientId;

      if (state.paymentHistory.length > 0) {
        const sortedAsc = [...state.paymentHistory].sort(
          (a, b) => new Date(a.data_pagamento) - new Date(b.data_pagamento),
        );
        const firstPaymentDate = sortedAsc[0].data_pagamento;

        const client = state.clients.find((c) => c.id == clientId);
        if (client && client.plano_inicio !== firstPaymentDate) {
          fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${clientId}`, {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: "Bearer " + SUPABASE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ plano_inicio: firstPaymentDate }),
          }).then((r) => {
            if (r.ok) {
              client.plano_inicio = firstPaymentDate;
            }
          });
        }
      }
    }
    await fetchAllPlanPayments();
  } catch (err) {
    console.error("Erro ao buscar histórico de pagamentos:", err);
    state.paymentHistory = [];
    state.paymentsFetchedForClientId = clientId;
  }
}

export async function fetchAllPlanPayments() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pagamentos_planos?select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      },
    );
    if (res.ok) {
      state.allPlanPayments = await res.json();
      if (window.updateInternalStats) window.updateInternalStats();
    }
  } catch (e) {
    console.error("Erro ao buscar todos pagamentos:", e);
  }
}

export async function fetchExpenses() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/saidas?select=*&order=vencimento.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      },
    );
    if (res.ok) {
      state.expenses = await res.json();
      if (window.render) window.render();
    }
  } catch (err) {
    console.error("Erro ao buscar saídas:", err);
  }
}

export async function fetchCards() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cartoes?select=*&order=nome.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
        },
      },
    );
    if (res.ok) {
      state.cards = await res.json();
      if (window.render) window.render();
    }
  } catch (err) {
    console.error("Erro ao buscar cartões:", err);
  }
}

export async function renewPlan(clientId) {
  if (
    !confirm(
      "Deseja renovar o ciclo do plano para hoje? Isso resetará a contagem de cortes/dias.",
    )
  )
    return;
  const today = new Date().toISOString().split("T")[0];
  if (window.updateClientPlan)
    await window.updateClientPlan(clientId, { plano_pagamento: today });
}

export async function updateClientPlan(clientId, data, skipRender = false) {
  const payload = typeof data === "string" ? { plano: data } : data;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${clientId}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      },
    );

    if (res.ok) {
      const client = state.clients.find((c) => c.id == clientId);
      if (client) Object.assign(client, payload);
      if (!skipRender && window.render) window.render();
    } else {
      console.error("Erro Supabase ao atualizar plano");
    }
  } catch (err) {
    console.error("Erro de conexão:", err);
  }
}

export async function updateClientField(clientId, field, value) {
  try {
    const payload = { [field]: value };
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${clientId}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      },
    );

    if (res.ok) {
      const client = state.clients.find((c) => c.id == clientId);
      if (client) Object.assign(client, payload);
    } else {
      console.error("Erro ao salvar campo de cliente");
    }
  } catch (err) {
    console.error("Erro de conexão:", err);
  }
}

// Bind to window for HTML accessibility
window.renewPlan = renewPlan;
window.fetchClients = fetchClients;
window.fetchProcedures = fetchProcedures;
window.fetchExpenses = fetchExpenses;
window.fetchCards = fetchCards;
window.updateClientPlan = updateClientPlan;
window.updateClientField = updateClientField;
