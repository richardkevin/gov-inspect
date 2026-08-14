const API_BASE = "https://api.portaldatransparencia.gov.br/api-de-dados";

export type NotaFiscal = {
  id: number;
  codigoOrgaoSuperiorDestinatario: string;
  orgaoSuperiorDestinatario: string;
  codigoOrgaoDestinatario: string;
  orgaoDestinatario: string;
  nomeFornecedor: string;
  cnpjFornecedor: string;
  municipioFornecedor: string;
  chaveNotaFiscal: string;
  valorNotaFiscal: string;
  tipoEventoMaisRecente: string;
  dataTipoEventoMaisRecente: string;
  dataEmissao: string;
  numero: number;
  serie: number;
};

export type ItemNotaFiscal = {
  numeroProduto: string;
  descricaoProdutoServico: string;
  codigoNcmSh: string;
  ncmSh: string;
  cfop: string;
  quantidade: string;
  unidade: string;
  valorUnitario: string;
  valor: string;
};

export type EventoNotaFiscal = {
  dataEvento: string;
  tipoEvento: string;
  evento: string;
  motivo: string;
};

export type DetalheNotaFiscal = {
  notaFiscalDTO: NotaFiscal;
  itensNotaFiscal: ItemNotaFiscal[];
  eventosNotaFiscal: EventoNotaFiscal[];
};

export type ListarNotasFiscaisParams = {
  pagina?: number;
  cnpjEmitente?: string;
  codigoOrgao?: string;
  nomeProduto?: string;
};

export class PortalApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PortalApiError";
    this.status = status;
  }
}

export function getApiKey(): string {
  return process.env.GOV_API_KEY?.trim() || "";
}

async function request<T>(path: string, apiKey: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "chave-api-dados": apiKey, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Erro ${res.status} ao consultar o Portal da Transparência.`;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      const error = body["Erro na API"];
      if (typeof error === "string") message = error;
    } catch {
      // corpo sem JSON tratável
    }
    throw new PortalApiError(message, res.status);
  }

  return (await res.json()) as T;
}

export async function listarNotasFiscais(
  params: ListarNotasFiscaisParams,
  apiKey: string,
): Promise<NotaFiscal[]> {
  const query = new URLSearchParams();
  query.set("pagina", String(params.pagina ?? 1));
  if (params.cnpjEmitente) query.set("cnpjEmitente", params.cnpjEmitente);
  if (params.codigoOrgao) query.set("codigoOrgao", params.codigoOrgao);
  if (params.nomeProduto) query.set("nomeProduto", params.nomeProduto);
  return request<NotaFiscal[]>(`/notas-fiscais?${query.toString()}`, apiKey);
}

export async function consultarNotaFiscalPorChave(
  chaveUnicaNotaFiscal: string,
  apiKey: string,
): Promise<DetalheNotaFiscal> {
  const chave = chaveUnicaNotaFiscal.replace(/\D/g, "");
  const query = new URLSearchParams({ chaveUnicaNotaFiscal: chave });
  return request<DetalheNotaFiscal>(
    `/notas-fiscais-por-chave?${query.toString()}`,
    apiKey,
  );
}

export function parseMoney(value: string): number | null {
  const s = value?.trim();
  if (!s) return null;
  let n: number;
  if (s.includes(",")) {
    n = Number(s.replace(/\./g, "").replace(/,/g, "."));
  } else {
    n = Number(s);
  }
  return Number.isFinite(n) ? n : null;
}

export function formatBRL(value: string): string {
  const n = parseMoney(value);
  if (n === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

function toDate(value: string): Date | null {
  if (!value) return null;
  const s = value.trim();
  const m = s.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s*[T]\s*(\d{2}):(\d{2}):?(\d{2})?)?/,
  );
  let iso = s;
  if (m) {
    const [, dd, mm, yyyy, hh = "00", min = "00", ss = "00"] = m;
    iso = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string): string {
  const d = toDate(value);
  if (!d) return value?.trim() || "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value: string): string {
  const d = toDate(value);
  if (!d) return value?.trim() || "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatCnpj(value: string): string {
  const d = value?.replace(/\D/g, "") || "";
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return value?.trim() || "—";
}

export function formatChave(value: string): string {
  return value?.replace(/\D/g, "") || "—";
}
