import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";
import { TecnicoResponsavel, TecnicoPrioridade, TecnicoStatus, TECNICO_RESPONSAVEIS, TECNICO_PRIORIDADES, TECNICO_STATUS_OPTIONS } from "@/lib/mock-data";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportedTecnicoRow {
  empresa: string;
  cnpj: string;
  responsavel: TecnicoResponsavel;
  regiao: string;
  prioridade: TecnicoPrioridade;
  data: string;
  status_tecnico: TecnicoStatus;
  contato_nome: string;
  contato_telefone: string;
  contato_email: string;
  dados_extras: string;
  selected: boolean;
}

function matchOption<T extends string>(value: string, options: T[], fallback: T): T {
  if (!value) return fallback;
  const lower = value.toLowerCase().trim();
  const exact = options.find((o) => o.toLowerCase() === lower);
  if (exact) return exact;
  const partial = options.find((o) => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()));
  return partial || fallback;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  empresa: ["empresa", "empresas", "nome", "razão social", "razao social", "cliente", "company"],
  cnpj: ["cnpj", "cnpj/cpf"],
  responsavel: ["responsável", "responsavel", "técnico", "tecnico", "resp"],
  regiao: ["região", "regiao", "local", "cidade", "uf", "estado", "localidade"],
  prioridade: ["prioridade", "prior", "urgência", "urgencia", "priority"],
  data: ["data", "date", "prazo", "vencimento", "dt"],
  status_tecnico: ["status", "situação", "situacao", "fase", "etapa"],
  contato_nome: ["contato", "nome contato", "nome do contato"],
  contato_telefone: ["telefone", "tel", "celular", "phone"],
  contato_email: ["email", "e-mail", "email contato"],
  dados_extras: ["dados extras", "observação", "observacao", "obs", "notas", "extra"],
};

function detectColumn(header: string): string | null {
  const lower = header.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((a) => lower.includes(a))) return field;
  }
  return null;
}

// Format CNPJ
const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

export const ImportSpreadsheetModal = () => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportedTecnicoRow[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { addTecnicoProject, users } = useProjects();
  const responsavelOptions = [...users.map(u => u.full_name), "Zona de espera"];

  const parseSpreadsheet = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (json.length < 2) {
          toast.error("Planilha vazia ou sem dados suficientes.");
          return;
        }

        const headerRow = json[0].map((c: any) => String(c || "").trim());
        const columnMap: Record<string, number> = {};
        
        headerRow.forEach((header: string, idx: number) => {
          const field = detectColumn(header);
          if (field && !(field in columnMap)) {
            columnMap[field] = idx;
          }
        });

        const parsed: ImportedTecnicoRow[] = [];

        if ("empresa" in columnMap) {
          for (let r = 1; r < json.length; r++) {
            const row = json[r];
            if (!row || row.every((c: any) => !c || String(c).trim() === "")) continue;

            const getCell = (field: string) => {
              const idx = columnMap[field];
              return idx !== undefined ? String(row[idx] || "").trim() : "";
            };

            const empresa = getCell("empresa");
            if (!empresa) continue;

            const rawCnpj = getCell("cnpj");

            parsed.push({
              empresa,
              cnpj: rawCnpj ? formatCNPJ(rawCnpj) : "",
              responsavel: matchOption(getCell("responsavel"), [...responsavelOptions], "Zona de Espera"),
              regiao: getCell("regiao"),
              prioridade: matchOption(getCell("prioridade"), [...TECNICO_PRIORIDADES], "Baixa"),
              data: getCell("data"),
              status_tecnico: matchOption(getCell("status_tecnico"), [...TECNICO_STATUS_OPTIONS], "Não cadastradas no ESO"),
              contato_nome: getCell("contato_nome"),
              contato_telefone: getCell("contato_telefone"),
              contato_email: getCell("contato_email"),
              dados_extras: getCell("dados_extras"),
              selected: true,
            });
          }
        } else {
          for (let r = 0; r < json.length; r++) {
            const row = json[r];
            if (!row || row.every((c: any) => !c || String(c).trim() === "")) continue;
            const firstCell = String(row[0] || "").toLowerCase().trim();
            if (firstCell === "empresa" || firstCell === "empresas" || firstCell === "nome") continue;
            const cells = row.map((c: any) => String(c || "").trim());
            if (!cells[0]) continue;

            parsed.push({
              empresa: cells[0] || "",
              cnpj: cells[1] ? formatCNPJ(cells[1]) : "",
              responsavel: matchOption(cells[2] || "", [...responsavelOptions], "Zona de Espera"),
              regiao: cells[3] || "",
              prioridade: matchOption(cells[4] || "", [...TECNICO_PRIORIDADES], "Baixa"),
              data: cells[5] || "",
              status_tecnico: matchOption(cells[6] || "", [...TECNICO_STATUS_OPTIONS], "Não cadastradas no ESO"),
              contato_nome: cells[7] || "",
              contato_telefone: cells[8] || "",
              contato_email: cells[9] || "",
              dados_extras: cells[10] || "",
              selected: true,
            });
          }
        }

        if (parsed.length === 0) {
          toast.error("Nenhum dado válido encontrado na planilha.");
          return;
        }

        setRows(parsed);
        setFileName(file.name);
        toast.success(`${parsed.length} itens encontrados na planilha!`);
      } catch {
        toast.error("Erro ao processar o arquivo. Verifique o formato.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseSpreadsheet(file);
  };

  const toggleRow = (idx: number) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r)));
  };

  const updateRow = (idx: number, data: Partial<ImportedTecnicoRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...data } : r)));
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImport = () => {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      toast.error("Selecione ao menos um item para importar.");
      return;
    }

    selected.forEach((r) => {
      addTecnicoProject({
        empresa: r.empresa,
        cnpj: r.cnpj,
        responsavel: r.responsavel,
        regiao: r.regiao,
        prioridade: r.prioridade,
        data: r.data,
        status_tecnico: r.status_tecnico,
        contato_nome: r.contato_nome,
        contato_telefone: r.contato_telefone,
        contato_email: r.contato_email,
        dados_extras: r.dados_extras,
        sector: "tecnico",
      });
    });

    toast.success(`${selected.length} projetos importados com sucesso!`);
    setRows([]);
    setFileName("");
    setOpen(false);
  };

  const handleClose = () => {
    setRows([]);
    setFileName("");
    setOpen(false);
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button className="btn-3d gap-2 bg-gradient-to-r from-medwork-500 to-medwork-600 hover:from-medwork-600 hover:to-medwork-700 text-primary-foreground">
          <Upload className="w-4 h-4" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-medwork-500" />
            Importar Dados de Planilha
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo .xlsx ou .csv. Os dados serão mapeados automaticamente.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div
            className="border-2 border-dashed border-medwork-300 rounded-2xl p-12 text-center cursor-pointer hover:border-medwork-500 hover:bg-medwork-50/5 transition-all duration-300 group"
            onClick={() => fileRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-medwork-400/20 to-medwork-600/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-3d">
              <Upload className="w-8 h-8 text-medwork-500" />
            </div>
            <p className="text-foreground font-semibold mb-1">Arraste ou clique para selecionar</p>
            <p className="text-muted-foreground text-sm">Formatos aceitos: .xlsx, .xls, .csv</p>
            <p className="text-muted-foreground text-xs mt-2">Colunas: Empresa, CNPJ, Responsável, Região, Prioridade, Data, Status, Contato, Telefone, Email</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 bg-medwork-50/10 border border-medwork-200/30 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-medwork-500" />
                <span className="font-medium text-foreground">{fileName}</span>
                <span className="text-muted-foreground">• {rows.length} itens</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-8">✓</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">Empresa</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">CNPJ</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">Responsável</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">Região</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">Prioridade</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">Data</th>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-b border-border/50 transition-colors ${r.selected ? "bg-card" : "bg-muted/20 opacity-50"}`}>
                      <td className="px-2 py-1.5">
                        <button onClick={() => toggleRow(i)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${r.selected ? "border-medwork-500 bg-medwork-500" : "border-border"}`}>
                          {r.selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                        </button>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={r.empresa} onChange={(e) => updateRow(i, { empresa: e.target.value })} className="h-7 text-xs" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={r.cnpj} onChange={(e) => updateRow(i, { cnpj: formatCNPJ(e.target.value) })} className="h-7 text-xs w-[140px]" placeholder="00.000.000/0000-00" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Select value={r.responsavel} onValueChange={(v) => updateRow(i, { responsavel: v as TecnicoResponsavel })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{responsavelOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={r.regiao} onChange={(e) => updateRow(i, { regiao: e.target.value })} className="h-7 text-xs" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Select value={r.prioridade} onValueChange={(v) => updateRow(i, { prioridade: v as TecnicoPrioridade })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{TECNICO_PRIORIDADES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={r.data} onChange={(e) => updateRow(i, { data: e.target.value })} className="h-7 text-xs w-24" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Select value={r.status_tecnico} onValueChange={(v) => updateRow(i, { status_tecnico: v as TecnicoStatus })}>
                          <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{TECNICO_STATUS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {selectedCount > 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-medwork-500" />
                  <span className="text-foreground font-medium">{selectedCount} itens selecionados para importação</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-destructive font-medium">Nenhum item selecionado</span>
                </>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="rounded-xl">Cancelar</Button>
          {rows.length > 0 && (
            <Button onClick={handleImport} disabled={selectedCount === 0} className="btn-3d gap-2 bg-gradient-to-r from-medwork-500 to-medwork-600 hover:from-medwork-600 hover:to-medwork-700 text-primary-foreground rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Importar {selectedCount} {selectedCount === 1 ? "projeto" : "projetos"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
