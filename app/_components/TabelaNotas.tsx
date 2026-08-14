"use client";

import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  DataGrid,
  type GridColDef,
  type GridSortModel,
} from "@mui/x-data-grid";
import { ptBR } from "@mui/x-data-grid/locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ItemRow, NotaRow } from "../../lib/db";

type LinhaNota = {
  id: string;
  chave: string;
  dataEmissao: string | null;
  municipioEmitente: string | null;
  razaoSocialEmitente: string | null;
  cpfCnpjEmitente: string | null;
  orgao: string | null;
  codigoOrgao: string | null;
  orgaoSuperior: string | null;
  valor: number | null;
  mes: string;
};

type FiltrosDigitados = {
  q: string;
  codigoOrgao: string[];
  municipio: string[];
  orgao: string[];
  orgaoSuperior: string[];
  emitente: string[];
};

type DetalheNota = {
  nota: NotaRow;
  itens: ItemRow[];
};

const filtrosVazios: FiltrosDigitados = {
  q: "",
  codigoOrgao: [],
  municipio: [],
  orgao: [],
  orgaoSuperior: [],
  emitente: [],
};

function toLinha(nota: NotaRow): LinhaNota {
  return {
    id: nota.chave,
    chave: nota.chave,
    dataEmissao: nota.dataEmissao,
    municipioEmitente: nota.municipioEmitente,
    razaoSocialEmitente: nota.razaoSocialEmitente,
    cpfCnpjEmitente: nota.cpfCnpjEmitente,
    orgao: nota.orgao,
    codigoOrgao: nota.codigoOrgao,
    orgaoSuperior: nota.orgaoSuperior,
    valor: nota.valor,
    mes: nota.mes,
  };
}

const fmtMoeda = (v: number | null): string =>
  v == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v);

const fmtData = (v: string | null): string => {
  if (!v) return "—";
  const d = new Date(v.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("pt-BR").format(d);
};

function fmtChave(chave: string): string {
  return `${chave.slice(0, 4)} ${chave.slice(4, 8)} ${chave.slice(8, 12)} ${chave.slice(12, 16)} ${chave.slice(16, 20)} ${chave.slice(20, 24)} ${chave.slice(24, 34)} ${chave.slice(34, 44)}`;
}

export default function TabelaNotas({
  notasIniciais,
  totalInicial,
  municipios,
  orgaos,
  orgaosSuperior,
  codigosOrgao,
  resumo,
}: {
  notasIniciais: NotaRow[];
  totalInicial: number;
  municipios: string[];
  orgaos: string[];
  orgaosSuperior: string[];
  codigosOrgao: string[];
  resumo: { total: number; valorTotal: number | null; meses: number };
}) {
  const [linhas, setLinhas] = useState<LinhaNota[]>(() =>
    notasIniciais.map(toLinha),
  );
  const [total, setTotal] = useState(totalInicial);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filtrosDigitados, setFiltrosDigitados] =
    useState<FiltrosDigitados>(filtrosVazios);
  const [filtros, setFiltros] = useState<FiltrosDigitados>(filtrosVazios);

  const [emitentes, setEmitentes] = useState<string[]>([]);

  useEffect(() => {
    let ativo = true;
    fetch("/api/emitentes?todos=1")
      .then((r) => r.json())
      .then((data: { emitentes: string[] }) => {
        if (ativo) setEmitentes(data.emitentes);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const [detalhe, setDetalhe] = useState<DetalheNota | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);

  const primeiroRender = useRef(true);

  const carregar = useCallback(async () => {
    const params = new URLSearchParams({
      pagina: String(paginationModel.page + 1),
      tamanhoPagina: String(paginationModel.pageSize),
    });
    if (filtros.q) params.set("q", filtros.q);
    if (
      filtros.emitente.length > 0 &&
      filtros.emitente.length < emitentes.length
    )
      for (const v of filtros.emitente) params.append("emitente", v);
    if (
      filtros.municipio.length > 0 &&
      filtros.municipio.length < municipios.length
    )
      for (const v of filtros.municipio) params.append("municipio", v);
    if (filtros.orgao.length > 0 && filtros.orgao.length < orgaos.length)
      for (const v of filtros.orgao) params.append("orgao", v);
    if (
      filtros.orgaoSuperior.length > 0 &&
      filtros.orgaoSuperior.length < orgaosSuperior.length
    )
      for (const v of filtros.orgaoSuperior) params.append("orgaoSuperior", v);
    if (
      filtros.codigoOrgao.length > 0 &&
      filtros.codigoOrgao.length < codigosOrgao.length
    )
      for (const v of filtros.codigoOrgao) params.append("codigoOrgao", v);
    const sorteio = sortModel[0];
    if (sorteio?.sort) {
      params.set("sortField", sorteio.field);
      params.set("sortDir", sorteio.sort);
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/notas?${params.toString()}`);
      if (!res.ok) throw new Error(`Erro ${res.status} na consulta.`);
      const data = (await res.json()) as {
        notas: NotaRow[];
        total: number;
      };
      setLinhas(data.notas.map(toLinha));
      setTotal(data.total);
    } catch {
      setLinhas([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filtros, paginationModel, sortModel]);

  useEffect(() => {
    if (primeiroRender.current) {
      primeiroRender.current = false;
      return;
    }
    void carregar();
  }, [carregar]);

  const aplicarFiltros = useCallback(() => {
    setFiltros(filtrosDigitados);
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [filtrosDigitados]);

  const limparFiltros = useCallback(() => {
    setFiltrosDigitados(filtrosVazios);
    setFiltros(filtrosVazios);
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, []);

  const abrirDetalhe = useCallback(async (chave: string) => {
    setCarregandoDetalhe(true);
    setErroDetalhe(null);
    try {
      const res = await fetch(`/api/notas/${chave}`);
      const data = (await res.json()) as DetalheNota & { erro?: string };
      if (!res.ok) throw new Error(data.erro ?? "Erro ao carregar detalhes.");
      setDetalhe(data);
    } catch (error) {
      setErroDetalhe(
        error instanceof Error ? error.message : "Erro inesperado.",
      );
    } finally {
      setCarregandoDetalhe(false);
    }
  }, []);

  const colunas = useMemo<GridColDef<LinhaNota>[]>(
    () => [
      {
        field: "dataEmissao",
        headerName: "Emissão",
        width: 110,
        valueFormatter: (value: string | null) => fmtData(value),
      },
      {
        field: "municipioEmitente",
        headerName: "Município",
        width: 170,
      },
      {
        field: "razaoSocialEmitente",
        headerName: "Emitente",
        width: 300,
        renderCell: ({ row }) => (
          <Stack>
            <span>{row.razaoSocialEmitente}</span>
            <Typography variant="caption" color="text.secondary">
              {row.cpfCnpjEmitente}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "orgao",
        headerName: "Órgão destinatário",
        width: 280,
        renderCell: ({ row }) => (
          <Stack>
            <span>{row.orgao}</span>
            <Typography variant="caption" color="text.secondary">
              {row.codigoOrgao}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "orgaoSuperior",
        headerName: "Órgão superior",
        width: 230,
      },
      {
        field: "valor",
        headerName: "Valor",
        width: 140,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (value: number | null) => fmtMoeda(value),
      },
      {
        field: "mes",
        headerName: "Mês",
        width: 100,
        valueFormatter: (value: string) =>
          `${value.slice(5, 7)}/${value.slice(0, 4)}`,
      },
    ],
    [],
  );

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ flexWrap: "wrap", alignItems: "center" }}
      >
        <Chip
          label={`${total.toLocaleString("pt-BR")} notas fiscais`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`Total acumulado 2026: ${fmtMoeda(resumo.valorTotal)}`}
          color="primary"
          variant="outlined"
        />
        <Chip label={`${resumo.meses} meses de 2026`} variant="outlined" />
      </Stack>

      <Paper
        variant="outlined"
        sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Box
          component="form"
          onSubmit={(event: React.FormEvent) => {
            event.preventDefault();
            aplicarFiltros();
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap", alignItems: "center" }}
          >
            <TextField
              label="Buscar (chave, emitente, órgão, município)"
              size="small"
              sx={{ flexGrow: 1, minWidth: 280 }}
              value={filtrosDigitados.q}
              onChange={(e) =>
                setFiltrosDigitados((f) => ({ ...f, q: e.target.value }))
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <SelectMulti
              label="Emitente"
              opcoes={emitentes}
              valor={filtrosDigitados.emitente}
              aoMudar={(v) =>
                setFiltrosDigitados((f) => ({ ...f, emitente: v }))
              }
              larguraMinima={280}
              larguraMaxima={360}
            />
            <SelectMulti
              label="Município do emitente"
              opcoes={municipios}
              valor={filtrosDigitados.municipio}
              aoMudar={(v) =>
                setFiltrosDigitados((f) => ({ ...f, municipio: v }))
              }
              larguraMinima={230}
            />
            <SelectMulti
              label="Órgão destinatário"
              opcoes={orgaos}
              valor={filtrosDigitados.orgao}
              aoMudar={(v) => setFiltrosDigitados((f) => ({ ...f, orgao: v }))}
              larguraMinima={230}
            />
            <SelectMulti
              label="Órgão superior"
              opcoes={orgaosSuperior}
              valor={filtrosDigitados.orgaoSuperior}
              aoMudar={(v) =>
                setFiltrosDigitados((f) => ({ ...f, orgaoSuperior: v }))
              }
              larguraMinima={230}
            />
            <SelectMulti
              label="Código do órgão"
              opcoes={codigosOrgao}
              valor={filtrosDigitados.codigoOrgao}
              aoMudar={(v) =>
                setFiltrosDigitados((f) => ({ ...f, codigoOrgao: v }))
              }
              larguraMinima={160}
            />
            <Button type="submit" variant="contained" disableElevation>
              Aplicar
            </Button>
            <Button variant="text" onClick={limparFiltros}>
              Limpar
            </Button>
          </Stack>
        </Box>

        <Box sx={{ height: "68vh", width: "100%" }}>
          <DataGrid
            rows={linhas}
            columns={colunas}
            getRowId={(row) => row.chave}
            rowCount={total}
            paginationMode="server"
            sortingMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            pageSizeOptions={[25, 50, 100]}
            loading={loading}
            disableRowSelectionOnClick
            onRowClick={(params) => {
              void abrirDetalhe(params.row.chave);
            }}
            density="compact"
            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
            sx={{
              border: 0,
              "& .MuiDataGrid-row": { cursor: "pointer" },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none",
              },
            }}
          />
        </Box>
      </Paper>

      <Drawer
        anchor="right"
        open={detalhe !== null || carregandoDetalhe}
        onClose={() => setDetalhe(null)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 620,
            maxWidth: "100vw",
          },
        }}
      >
        <Stack sx={{ height: "100%" }}>
          <Stack
            direction="row"
            sx={{
              px: 3,
              py: 2,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">Detalhes da nota fiscal</Typography>
            <IconButton
              aria-label="Fechar"
              onClick={() => setDetalhe(null)}
              disabled={carregandoDetalhe}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />

          {carregandoDetalhe ? (
            <Stack
              spacing={2}
              sx={{
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
              <Typography color="text.secondary">
                Carregando detalhes…
              </Typography>
            </Stack>
          ) : erroDetalhe ? (
            <Box sx={{ p: 3 }}>
              <Typography color="error">{erroDetalhe}</Typography>
            </Box>
          ) : detalhe ? (
            <DetalheNotaPanel detalhe={detalhe} />
          ) : null}
        </Stack>
      </Drawer>
    </Stack>
  );
}

function DetalheNotaPanel({ detalhe }: { detalhe: DetalheNota }) {
  const { nota, itens } = detalhe;
  return (
    <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
      <Box sx={{ p: 3, pt: 2 }}>
        <Typography
          variant="body2"
          component="p"
          sx={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            wordBreak: "break-all",
            mb: 2,
            userSelect: "all",
          }}
        >
          {fmtChave(nota.chave)}
        </Typography>

        <Stack spacing={1}>
          <CampoDetalhe
            label="Número"
            valor={
              nota.serie
                ? `${nota.serie} / ${nota.numero ?? "—"}`
                : String(nota.numero ?? "—")
            }
          />
          <CampoDetalhe
            label="Data de emissão"
            valor={fmtData(nota.dataEmissao)}
          />
          <CampoDetalhe label="Valor da nota" valor={fmtMoeda(nota.valor)} />
          <CampoDetalhe
            label="Emitente"
            valor={[nota.razaoSocialEmitente, nota.cpfCnpjEmitente]
              .filter(Boolean)
              .join(" — ")}
          />
          <CampoDetalhe
            label="Município / UF do emitente"
            valor={[nota.municipioEmitente, nota.ufEmitente]
              .filter(Boolean)
              .join(" / ")}
          />
          <CampoDetalhe
            label="Órgão destinatário"
            valor={[nota.orgao, nota.codigoOrgao].filter(Boolean).join(" — ")}
          />
          <CampoDetalhe
            label="Órgão superior destinatário"
            valor={[nota.orgaoSuperior, nota.codigoOrgaoSuperior]
              .filter(Boolean)
              .join(" — ")}
          />
          <CampoDetalhe label="Natureza da operação" valor={nota.natureza} />
          <CampoDetalhe label="Modelo" valor={nota.modelo} />
          <CampoDetalhe label="Série" valor={nota.serie} />
          <CampoDetalhe
            label="Evento mais recente"
            valor={[nota.tipoEvento, fmtData(nota.dataEvento)]
              .filter(Boolean)
              .join(" — ")}
          />
          <CampoDetalhe
            label="Destino da operação"
            valor={nota.destinoOperacao}
          />
          <CampoDetalhe label="Consumidor final" valor={nota.consumidorFinal} />
          <CampoDetalhe
            label="Presença do comprador"
            valor={nota.presencaComprador}
          />
        </Stack>
      </Box>

      <Divider />
      <Box sx={{ p: 3, pt: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Itens da nota fiscal
        </Typography>
        {itens.length === 0 ? (
          <Typography color="text.secondary">Nenhum item informado.</Typography>
        ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ maxHeight: 420 }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Descrição do produto/serviço</TableCell>
                  <TableCell>NCM</TableCell>
                  <TableCell>CFOP</TableCell>
                  <TableCell align="right">Qtd</TableCell>
                  <TableCell align="right">Unit.</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.numeroProduto ?? item.descricao}>
                    <TableCell>{item.numeroProduto ?? "—"}</TableCell>
                    <TableCell>{item.descricao ?? "—"}</TableCell>
                    <TableCell>
                      {item.codigoNcm ?? item.ncmTipo ?? "—"}
                    </TableCell>
                    <TableCell>{item.cfop ?? "—"}</TableCell>
                    <TableCell align="right">
                      {item.quantidade != null
                        ? `${item.quantidade}${item.unidade ? ` ${item.unidade}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {fmtMoeda(item.valorUnitario)}
                    </TableCell>
                    <TableCell align="right">
                      {fmtMoeda(item.valorTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}

const MARCA_SELECIONAR_TODOS = "__selecionar_todos__";
const MARCA_LIMPAR = "__limpar__";

function SelectMulti({
  label,
  opcoes,
  valor,
  aoMudar,
  larguraMinima,
  larguraMaxima,
}: {
  label: string;
  opcoes: string[];
  valor: string[];
  aoMudar: (valor: string[]) => void;
  larguraMinima?: number;
  larguraMaxima?: number;
}) {
  return (
    <Stack sx={{ minWidth: larguraMinima, maxWidth: larguraMaxima }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Select
        size="small"
        multiple
        displayEmpty
        value={valor}
        onChange={(e) => {
          const atual = e.target.value as string[];
          if (atual.includes(MARCA_SELECIONAR_TODOS)) {
            aoMudar(opcoes);
            return;
          }
          if (atual.includes(MARCA_LIMPAR)) {
            aoMudar([]);
            return;
          }
          aoMudar(atual);
        }}
        renderValue={(selecionados) => {
          const limpos = selecionados.filter(
            (v) => v !== MARCA_SELECIONAR_TODOS && v !== MARCA_LIMPAR,
          );
          if (limpos.length === 0 || limpos.length === opcoes.length)
            return <span>Todos</span>;
          return <span>{limpos.length} selecionados</span>;
        }}
        sx={{ minWidth: 130 }}
      >
        <MenuItem dense value={MARCA_SELECIONAR_TODOS}>
          Selecionar todos
        </MenuItem>
        <MenuItem dense value={MARCA_LIMPAR}>
          Limpar seleção
        </MenuItem>
        <Divider />
        {opcoes.map((opcao) => (
          <MenuItem key={opcao} value={opcao}>
            {opcao}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );
}

function CampoDetalhe({
  label,
  valor,
}: {
  label: string;
  valor: string | null;
}) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 170 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="p"
        sx={{ textAlign: "right", fontWeight: 500 }}
      >
        {valor ?? "—"}
      </Typography>
    </Stack>
  );
}
