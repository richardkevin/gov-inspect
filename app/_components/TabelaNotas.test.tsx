// @vitest-environment jsdom

// biome-ignore-all lint/a11y: o mock do DataGrid reproduz a semântica real da grade (divs com roles)
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent, {
  PointerEventsCheckLevel,
} from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ItemRow, NotaRow } from "../../lib/db";
import TabelaNotas, {
  fmtChave,
  fmtData,
  fmtMoeda,
  toLinha,
} from "./TabelaNotas";

type ColunaMock = {
  field: string;
  headerName?: string;
  valueFormatter?: (valor: unknown) => unknown;
  renderCell?: (params: { row: Record<string, unknown> }) => ReactNode;
};

type PropsGridMock = {
  rows: Record<string, unknown>[];
  columns: ColunaMock[];
  rowCount: number;
  loading?: boolean;
  paginationModel?: { page: number; pageSize: number };
  pageSizeOptions?: number[];
  onPaginationModelChange?: (model: { page: number; pageSize: number }) => void;
  onSortModelChange?: (model: unknown[]) => void;
  onRowClick?: (params: { row: Record<string, unknown> }) => void;
};

const { ultimasPropsGrid } = vi.hoisted(() => ({
  ultimasPropsGrid: { current: null as PropsGridMock | null },
}));

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: (props: PropsGridMock) => {
    ultimasPropsGrid.current = props;
    return (
      <div role="grid">
        <div role="row" aria-label="cabeçalho">
          {props.columns.map((coluna) => (
            <span key={coluna.field} role="columnheader">
              {coluna.headerName}
            </span>
          ))}
        </div>
        {props.rows.map((linha) => (
          <div
            key={String(linha.id)}
            role="row"
            aria-label={String(linha.chave)}
            onClick={() => props.onRowClick?.({ row: linha })}
          >
            {props.columns.map((coluna) => (
              <span key={coluna.field} role="cell">
                {coluna.renderCell
                  ? coluna.renderCell({ row: linha })
                  : coluna.valueFormatter
                    ? String(coluna.valueFormatter(linha[coluna.field]))
                    : String(linha[coluna.field])}
              </span>
            ))}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            props.onPaginationModelChange?.({
              page: (props.paginationModel?.page ?? 0) + 1,
              pageSize: props.paginationModel?.pageSize ?? 100,
            })
          }
        >
          Próxima página
        </button>
      </div>
    );
  },
}));

type OpcoesVisaoKey =
  | "emitentes"
  | "municipios"
  | "orgaos"
  | "orgaosSuperior"
  | "meses";

type OpcoesIniciais = Record<OpcoesVisaoKey, string[]>;

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  ultimasPropsGrid.current = null;
});

function montarNota(parcial: Partial<NotaRow> = {}): NotaRow {
  return {
    chave: "n1",
    modelo: "55",
    serie: "1",
    numero: 123,
    natureza: "Venda",
    dataEmissao: "2026-08-03 10:00:00",
    tipoEvento: "Autorizado",
    dataEvento: "2026-08-03 10:05:00",
    cpfCnpjEmitente: "12345678000199",
    razaoSocialEmitente: "Empresa A",
    inscricaoEstadualEmitente: null,
    ufEmitente: "SP",
    municipioEmitente: "São Paulo",
    codigoOrgaoSuperior: "37000",
    orgaoSuperior: "Ministério da Defesa",
    codigoOrgao: "37001",
    orgao: "Órgão X",
    cnpjDestinatario: null,
    nomeDestinatario: "Exército",
    ufDestinatario: null,
    indicadorIE: null,
    destinoOperacao: null,
    consumidorFinal: null,
    presencaComprador: null,
    valor: 1000,
    mes: "2026-08",
    ...parcial,
  };
}

function montarItem(parcial: Partial<ItemRow> = {}): ItemRow {
  return {
    chave: "n1",
    numeroProduto: "001",
    descricao: "Combustível",
    codigoNcm: null,
    ncmTipo: null,
    cfop: null,
    quantidade: 2,
    unidade: "un",
    valorUnitario: 500,
    valorTotal: 1000,
    ...parcial,
  };
}

function stubFetch(
  handlers: {
    lista?: (url: URL) => { ok: boolean; corpo: unknown };
    detalhe?: (url: URL) => { ok: boolean; corpo: unknown };
  } = {},
) {
  const fn = vi.fn(async (input: string | URL) => {
    const url = new URL(String(input), "http://localhost");
    const handler = url.pathname.startsWith("/api/notas/")
      ? handlers.detalhe
      : handlers.lista;
    const resposta = handler?.(url) ?? {
      ok: true,
      corpo: { notas: [], total: 0 },
    };
    return {
      ok: resposta.ok,
      status: resposta.ok ? 200 : 500,
      json: async () => resposta.corpo,
    };
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function renderizar(
  overrides: {
    notas?: NotaRow[];
    opcoes?: Partial<Record<OpcoesVisaoKey, string[]>>;
    total?: number;
    resumo?: { total: number; valorTotal: number | null; meses: number };
  } = {},
) {
  const notas = overrides.notas ?? [montarNota()];
  const opcoes: OpcoesIniciais = {
    emitentes: ["Empresa A"],
    municipios: ["São Paulo"],
    orgaos: ["Órgão X"],
    orgaosSuperior: ["Ministério da Defesa"],
    meses: ["2026-08"],
    ...overrides.opcoes,
  };
  const user = userEvent.setup({
    pointerEventsCheck: PointerEventsCheckLevel.Never,
  });
  render(
    <TabelaNotas
      notasIniciais={notas}
      opcoesIniciais={opcoes}
      totalInicial={overrides.total ?? notas.length}
      resumo={
        overrides.resumo ?? {
          total: notas.length,
          valorTotal: 1425,
          meses: 3,
        }
      }
    />,
  );
  return { user };
}

describe("TabelaNotas", () => {
  it("renderiza notas iniciais, chips do resumo e colunas", () => {
    renderizar({
      notas: [
        montarNota(),
        montarNota({
          chave: "n2",
          razaoSocialEmitente: "Empresa B",
          valor: 50,
          mes: "2026-07",
        }),
      ],
      total: 2,
    });

    expect(screen.getByText("2 notas fiscais")).toBeInTheDocument();
    expect(
      screen.getByText("Total acumulado 2026: R$ 1.425,00"),
    ).toBeInTheDocument();
    expect(screen.getByText("3 meses de 2026")).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Emissão" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Órgão destinatário" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: "n1" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: "n2" })).toBeInTheDocument();
    expect(screen.getByText("Empresa B")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument();
  });

  it("não dispara fetch no primeiro carregamento", () => {
    const fetchFn = stubFetch();
    renderizar();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("aplica busca por texto e consulta a API", async () => {
    const fetchFn = stubFetch({
      lista: () => ({
        ok: true,
        corpo: {
          notas: [
            montarNota({ chave: "n2", razaoSocialEmitente: "Empresa B" }),
          ],
          total: 1,
        },
      }),
    });
    const { user } = renderizar();

    await user.type(
      screen.getByRole("textbox", { name: /Buscar/ }),
      "exército",
    );
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    const url = new URL(String(fetchFn.mock.calls[0][0]), "http://localhost");
    expect(url.searchParams.get("q")).toBe("exército");
    expect(url.searchParams.get("pagina")).toBe("1");
    expect(url.searchParams.get("tamanhoPagina")).toBe("100");
    expect(await screen.findByText("Empresa B")).toBeInTheDocument();
  });

  it("limpar reseta a busca e reconsulta sem filtros", async () => {
    const fetchFn = stubFetch();
    const { user } = renderizar();

    const campo = screen.getByRole("textbox", { name: /Buscar/ });
    await user.type(campo, "x");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: "Limpar" }));
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));

    const url = new URL(String(fetchFn.mock.calls[1][0]), "http://localhost");
    expect(url.searchParams.has("q")).toBe(false);
    expect(campo).toHaveValue("");
  });

  it("pré-seleciona todos os meses do recorte e formata MM/AAAA", async () => {
    const { user } = renderizar({
      opcoes: { meses: ["2026-06", "2026-07", "2026-08"] },
    });

    expect(screen.getByRole("button", { name: /Mês/ })).toHaveTextContent(
      "3 selecionados",
    );

    await user.click(screen.getByRole("button", { name: /Mês/ }));
    expect(screen.getByText("06/2026")).toBeInTheDocument();
    expect(screen.getByText("07/2026")).toBeInTheDocument();
    expect(screen.getByText("08/2026")).toBeInTheDocument();
  });

  it("desmarcar um mês e aplicar envia os meses restantes", async () => {
    const fetchFn = stubFetch();
    const { user } = renderizar({
      opcoes: { meses: ["2026-06", "2026-07", "2026-08"] },
    });

    await user.click(screen.getByRole("button", { name: /Mês/ }));
    await user.click(screen.getByText("08/2026"));
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(2);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /Mês/ })).toHaveTextContent(
      "2 selecionados",
    );

    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    const url = new URL(String(fetchFn.mock.calls[0][0]), "http://localhost");
    expect(url.searchParams.getAll("mes")).toEqual(["2026-06", "2026-07"]);
  });

  it("abre o drawer de detalhes ao clicar na linha", async () => {
    const fetchFn = stubFetch({
      detalhe: () => ({
        ok: true,
        corpo: { nota: montarNota(), itens: [montarItem()] },
      }),
    });
    const { user } = renderizar();

    await user.click(screen.getByRole("row", { name: "n1" }));

    expect(
      await screen.findByText("Detalhes da nota fiscal"),
    ).toBeInTheDocument();
    expect(fetchFn).toHaveBeenCalledWith("/api/notas/n1");
    expect(screen.getByText("Valor da nota")).toBeInTheDocument();
    expect(screen.getByText("Itens da nota fiscal")).toBeInTheDocument();
    expect(screen.getByText("Combustível")).toBeInTheDocument();
    expect(screen.getByText("2 un")).toBeInTheDocument();
    expect(screen.getByText("Empresa A — 12345678000199")).toBeInTheDocument();
  });

  it("mostra erro quando o detalhe falha", async () => {
    const fetchFn = stubFetch({
      detalhe: () => ({ ok: false, corpo: { erro: "Nota não encontrada." } }),
    });
    const { user } = renderizar();

    await user.click(screen.getByRole("row", { name: "n1" }));

    expect(await screen.findByText("Nota não encontrada.")).toBeInTheDocument();
    expect(fetchFn).toHaveBeenCalledWith("/api/notas/n1");
  });

  it("zera a tabela quando a consulta falha", async () => {
    const fetchFn = stubFetch({ lista: () => ({ ok: false, corpo: {} }) });
    const { user } = renderizar();

    await user.type(screen.getByRole("textbox", { name: /Buscar/ }), "x");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(fetchFn).toHaveBeenCalled());
    expect(await screen.findByText("0 notas fiscais")).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: "n1" })).not.toBeInTheDocument();
  });

  it("avança a página e consulta a API", async () => {
    const fetchFn = stubFetch();
    const { user } = renderizar();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    const url = new URL(String(fetchFn.mock.calls[0][0]), "http://localhost");
    expect(url.searchParams.get("pagina")).toBe("2");
  });

  it("configura paginação por servidor no DataGrid", () => {
    renderizar({ total: 42 });

    expect(ultimasPropsGrid.current?.rowCount).toBe(42);
    expect(ultimasPropsGrid.current?.paginationModel).toEqual({
      page: 0,
      pageSize: 100,
    });
    expect(ultimasPropsGrid.current?.pageSizeOptions).toEqual([100, 200, 500]);
  });

  it("exige busca e limita a 200 opções quando há mais de 400", async () => {
    const emitentes = Array.from(
      { length: 401 },
      (_, i) => `Empresa ${String(i).padStart(3, "0")}`,
    );
    const { user } = renderizar({ opcoes: { emitentes } });

    await user.click(screen.getByRole("button", { name: /Emitente/ }));
    expect(
      screen.getByText(/Digite para buscar entre 401 opções/),
    ).toBeInTheDocument();

    const campo = screen.getByPlaceholderText(/Buscar entre 401 opções/);
    await user.type(campo, "Empresa 3");
    expect(screen.getAllByText(/^Empresa 3\d\d$/)).toHaveLength(100);

    await user.clear(campo);
    await user.type(campo, "Empresa");
    expect(
      screen.getByText("Mostrando 200 de 401 — refine a busca."),
    ).toBeInTheDocument();

    await user.clear(campo);
    await user.type(campo, "zzz");
    expect(screen.getByText("Nenhum resultado.")).toBeInTheDocument();
  });
});

describe("formatadores", () => {
  it("formata moeda brasileira", () => {
    expect(fmtMoeda(1234.5)).toBe("R$\u00a01.234,50");
    expect(fmtMoeda(null)).toBe("—");
  });

  it("formata data de emissão", () => {
    expect(fmtData("2026-08-03 10:00:00")).toBe("03/08/2026");
    expect(fmtData(null)).toBe("—");
    expect(fmtData("valor estranho")).toBe("valor estranho");
  });

  it("agrupa a chave em blocos", () => {
    const chave = "ABCD".repeat(6) + "WXYZ".repeat(5);
    expect(fmtChave(chave).split(" ")).toEqual([
      "ABCD",
      "ABCD",
      "ABCD",
      "ABCD",
      "ABCD",
      "ABCD",
      "WXYZWXYZWX",
      "YZWXYZWXYZ",
    ]);
  });

  it("converte NotaRow em linha da grade", () => {
    const linha = toLinha(montarNota());
    expect(linha).toMatchObject({
      id: "n1",
      chave: "n1",
      dataEmissao: "2026-08-03 10:00:00",
      municipioEmitente: "São Paulo",
      razaoSocialEmitente: "Empresa A",
      cpfCnpjEmitente: "12345678000199",
      orgao: "Órgão X",
      orgaoSuperior: "Ministério da Defesa",
      valor: 1000,
      mes: "2026-08",
    });
  });
});
