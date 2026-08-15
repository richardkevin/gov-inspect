import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatBRL,
  formatChave,
  formatCnpj,
  formatDate,
  formatDateTime,
  getApiKey,
  listarNotasFiscaisPorMes,
  parseMoney,
} from "./portal-transparencia";

describe("getApiKey", () => {
  afterEach(() => {
    delete process.env.GOV_API_KEY;
  });

  it("retorna a chave trimada", () => {
    process.env.GOV_API_KEY = "  chave-secreta  ";
    expect(getApiKey()).toBe("chave-secreta");
  });

  it("retorna vazio quando não configurada", () => {
    expect(getApiKey()).toBe("");
  });
});

describe("parseMoney", () => {
  it("converte valores brasileiros", () => {
    expect(parseMoney("1.234,56")).toBe(1234.56);
    expect(parseMoney("1.000")).toBe(1);
    expect(parseMoney("1234")).toBe(1234);
  });

  it("converte valores com ponto decimal", () => {
    expect(parseMoney("1234.56")).toBe(1234.56);
  });

  it("retorna null para valores vazios ou inválidos", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("  ")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
  });
});

describe("formatBRL", () => {
  it("formata moeda brasileira", () => {
    expect(formatBRL("1.234,56")).toBe("R$\u00a01.234,56");
  });

  it("retorna travessão para valores inválidos", () => {
    expect(formatBRL("")).toBe("—");
    expect(formatBRL("abc")).toBe("—");
  });
});

describe("formatDate", () => {
  it("formata datas brasileiras", () => {
    expect(formatDate("15/08/2026")).toBe("15/08/2026");
    expect(formatDate("15/08/2026 10:30:00")).toBe("15/08/2026");
  });

  it("preserva texto não parseável", () => {
    expect(formatDate("abc")).toBe("abc");
    expect(formatDate("  ")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("formata data e hora", () => {
    expect(formatDateTime("15/08/2026T10:30:00")).toBe("15/08/2026, 10:30");
    expect(formatDateTime("01/02/2026")).toBe("01/02/2026, 00:00");
  });

  it("preserva texto não parseável", () => {
    expect(formatDateTime("abc")).toBe("abc");
    expect(formatDateTime("  ")).toBe("—");
  });
});

describe("formatCnpj", () => {
  it("mascara CNPJ de 14 dígitos", () => {
    expect(formatCnpj("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("retorna o valor para tamanhos inválidos", () => {
    expect(formatCnpj("123")).toBe("123");
    expect(formatCnpj("  ")).toBe("—");
  });
});

describe("formatChave", () => {
  it("remove caracteres não numéricos", () => {
    expect(formatChave("12.345/678-000199")).toBe("12345678000199");
    expect(formatChave("abc123")).toBe("123");
  });

  it("retorna travessão quando vazia", () => {
    expect(formatChave("abc")).toBe("—");
  });
});

describe("listarNotasFiscaisPorMes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetch(paginas: Record<number, unknown[]>) {
    const fn = vi.fn(async (url: string | URL) => {
      const sp = new URL(url, "http://localhost").searchParams;
      const pagina = Number(sp.get("pagina"));
      const corpo = paginas[pagina] ?? [];
      return { ok: true, status: 200, json: async () => corpo };
    });
    vi.stubGlobal("fetch", fn);
    return fn;
  }

  function nota(id: number, dataEmissao: string) {
    return { id, dataEmissao };
  }

  it("coleta notas do mês, ignorando fora do período e parando em página curta", async () => {
    const fetchFn = mockFetch({
      1: [
        ...Array.from({ length: 15 }, (_, i) => nota(i, "05/08/2026")),
        nota(20, "05/07/2026"),
        nota(21, "06/07/2026"),
        nota(22, "07/07/2026"),
        nota(23, "08/07/2026"),
        nota(24, "09/07/2026"),
      ],
      2: [
        nota(25, "10/08/2026"),
        nota(26, "11/08/2026"),
        nota(27, "12/08/2026"),
      ],
    });

    const notas = await listarNotasFiscaisPorMes({ mes: "2026-08" }, "chave");

    expect(notas).toHaveLength(18);
    expect(notas.every((n) => n.dataEmissao.endsWith("/08/2026"))).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn.mock.calls[0][0]).toContain("pagina=1");
    expect(fetchFn.mock.calls[1][0]).toContain("pagina=2");
  });

  it("repassa os filtros opcionais na query", async () => {
    const fetchFn = mockFetch({
      1: [nota(1, "05/08/2026")],
    });

    await listarNotasFiscaisPorMes(
      {
        mes: "2026-08",
        cnpjEmitente: "12345678000199",
        codigoOrgao: "37001",
        nomeProduto: "combustível",
      },
      "chave",
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.searchParams.get("pagina")).toBe("1");
    expect(url.searchParams.get("cnpjEmitente")).toBe("12345678000199");
    expect(url.searchParams.get("codigoOrgao")).toBe("37001");
    expect(url.searchParams.get("nomeProduto")).toBe("combustível");
  });

  it("valida o formato do mês", async () => {
    await expect(
      listarNotasFiscaisPorMes({ mes: "2026" }, "chave"),
    ).rejects.toThrow("Informe o mês no formato AAAA-MM.");
    await expect(
      listarNotasFiscaisPorMes({ mes: "2026-13" }, "chave"),
    ).rejects.toThrow("Mês inválido. Use um valor entre 01 e 12.");
  });
});
