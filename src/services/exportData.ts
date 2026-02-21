function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: unknown[], filename: string): void {
  if (data.length === 0) throw new Error("Nenhum dado para exportar.");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${filename}.json`);
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) throw new Error("Nenhum dado para exportar.");
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(";"),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(";")
    ),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportRelatorioSemanalCSV(
  relatorios: { semanaInicio: string; semanaFim: string; descricaoAtividades: string; observacoesTecnicas: string; criadoPorNome: string; createdAt: string }[],
  obraNome: string
): void {
  const data = relatorios.map((r) => ({
    Obra: obraNome,
    "Semana Início": r.semanaInicio,
    "Semana Fim": r.semanaFim,
    "Descrição das Atividades": r.descricaoAtividades,
    "Observações Técnicas": r.observacoesTecnicas,
    "Criado Por": r.criadoPorNome,
    "Data Criação": r.createdAt.split("T")[0],
  }));
  exportToCSV(data, `relatorios_semanais_${obraNome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`);
}
