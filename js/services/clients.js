import { state } from "../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../core/config.js";
import { fetchClients } from "../api/supabase.js";

export const getClientPlanUsage = (clientName) => {
  if (!clientName) return null;
  const client = state.clients.find(
    (c) =>
      (c.nome || "").trim().toLowerCase() === clientName.trim().toLowerCase(),
  );
  if (!client || client.plano === "Nenhum" || client.plano === "Pausado")
    return null;

  const lastRenewal = state.records
    .filter(
      (r) =>
        (r.client || "").toLowerCase() === clientName.toLowerCase() &&
        /RENOVA[CÇ][AÃ]O/i.test(r.service || ""),
    )
    .sort((a, b) => {
      const dtA = (a.date || a.data) + "T" + (a.time || a.horario || "00:00");
      const dtB = (b.date || b.data) + "T" + (b.time || b.horario || "00:00");
      return dtB.localeCompare(dtA);
    })[0];

  const baseDate = lastRenewal
    ? lastRenewal.date || lastRenewal.data
    : client.plano_pagamento;
  if (!baseDate) return null;

  const visits = state.records.filter((r) => {
    const clientNameInRecord = (r.client || r.cliente || "")
      .trim()
      .toLowerCase();
    if (clientNameInRecord !== client.nome.trim().toLowerCase()) return false;

    const rDate = r.date || r.data;
    const rTime = r.time || r.horario || "00:00";
    const service = r.service || r.procedimento || "";
    const isPlanService =
      /\d+\s*[ºº°]?\s*DIA/i.test(service) || /RENOVA[CÇ][AÃ]O/i.test(service);

    if (!isPlanService) return false;

    if (lastRenewal) {
      const rFull = rDate + "T" + rTime;
      const lastFull =
        (lastRenewal.date || lastRenewal.data) +
        "T" +
        (lastRenewal.time || lastRenewal.horario || "00:00");
      return rFull >= lastFull;
    }

    return rDate >= baseDate;
  }).length;

  const limit = parseInt(client.limite_cortes) || 99;

  return {
    usageCount: visits,
    nextVisit: visits + 1,
    isWithinLimit: visits < limit,
    startDate: client.plano_pagamento,
    limit: limit,
  };
};

export const saveClientInline = async (id, field, value) => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [field]: value.trim() }),
    });
    if (res.ok) {
      const client = state.clients.find((c) => c.id == id);
      if (client) client[field] = value.trim();
    }
  } catch (err) {
    console.error(err);
  }
};

export const adjustLimitCortes = async (clientId, newValue) => {
  const clampedValue = Math.max(1, Math.min(99, parseInt(newValue) || 99));
  const input = document.getElementById(`limit_input_${clientId}`);
  if (input) input.value = clampedValue;
  if (window.updateClientPlan) {
    await window.updateClientPlan(
      clientId,
      { limite_cortes: clampedValue },
      true,
    );
  }
};

window.getClientPlanUsage = getClientPlanUsage;
window.saveClientInline = saveClientInline;
window.adjustLimitCortes = adjustLimitCortes;
