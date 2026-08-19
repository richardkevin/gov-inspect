"use client";

import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  DataGrid,
  type GridColDef,
  type GridSortModel,
} from "@mui/x-data-grid";
import { ptBR } from "@mui/x-data-grid/locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NotaRow } from "../../lib/db";
import DetalheDrawer from "./DetalheDrawer";
import SelectMulti from "./SelectMulti";
import {
  acumularOpcoes,
  type DetalheNota,
  type FiltrosDigitados,
  filtrosVazios,
  fmtChave,
  fmtData,
  fmtMoeda,
  type LinhaNota,
  type OpcoesVisao,
  toLinha,
} from "./tabela-types";

export { toLinha, fmtMoeda, fmtData, fmtChave };

export default function TabelaNotas({
  notasIniciais,
  opcoesIniciais,
  totalInicial,
  resumo,
}: {
  notasIniciais: NotaRow[];
  opcoesIniciais: OpcoesVisao;
  totalInicial: number;
  resumo: { total: number; valorTotal: number | null; meses: number };
}) {
  const [linhas, setLinhas] = useState<LinhaNota[]>(() =>
    notasIniciais.map(toLinha),
  );
  const [total, setTotal] = useState(totalInicial);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filtrosDigitados, setFiltrosDigitados] = useState<FiltrosDigitados>(
    () => ({ ...filtrosVazios, meses: opcoesIniciais.meses }),
  );
  const [filtros, setFiltros] = useState<FiltrosDigitados>(() => ({
    ...filtrosVazios,
    meses: opcoesIniciais.meses,
  }));
  const [opcoesDaVisao, setOpcoesDaVisao] =
    useState<OpcoesVisao>(opcoesIniciais);

  const [detalhe, setDetalhe] = useState<DetalheNota | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);

  const primeiroRender = useRef(true);

  const opcoesComSelecionados = useMemo(() => {
    const mesclar = (opcoes: string[], selecionados: string[]): string[] =>
      [...new Set([...opcoes, ...selecionados].filter((v) => v !== ""))].sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      );
    return {
      meses: mesclar(opcoesDaVisao.meses, filtrosDigitados.meses),
      emitentes: mesclar(opcoesDaVisao.emitentes, filtrosDigitados.emitente),
      municipios: mesclar(opcoesDaVisao.municipios, filtrosDigitados.municipio),
      orgaos: mesclar(opcoesDaVisao.orgaos, filtrosDigitados.orgao),
      orgaosSuperior: mesclar(
        opcoesDaVisao.orgaosSuperior,
        filtrosDigitados.orgaoSuperior,
      ),
    };
  }, [opcoesDaVisao, filtrosDigitados]);

  const carregar = useCallback(async () => {
    const params = new URLSearchParams({
      pagina: String(paginationModel.page + 1),
      tamanhoPagina: String(paginationModel.pageSize),
    });
    if (filtros.q) params.set("q", filtros.q);
    for (const v of filtros.meses) params.append("mes", v);
    for (const v of filtros.emitente) params.append("emitente", v);
    for (const v of filtros.municipio) params.append("municipio", v);
    for (const v of filtros.orgao) params.append("orgao", v);
    for (const v of filtros.orgaoSuperior) params.append("orgaoSuperior", v);
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
        opcoes?: OpcoesVisao;
        total: number;
      };
      setLinhas(data.notas.map(toLinha));
      setTotal(data.total);
      const opcoesNovas = data.opcoes;
      if (opcoesNovas)
        setOpcoesDaVisao((prev) => acumularOpcoes(prev, opcoesNovas));
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
        field: "orgaoSuperior",
        headerName: "Órgão superior",
        width: 230,
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
        field: "valor",
        headerName: "Valor",
        width: 140,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (value: number | null) => fmtMoeda(value),
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
              label="Mês"
              opcoes={opcoesComSelecionados.meses}
              valor={filtrosDigitados.meses}
              aoMudar={(v) => setFiltrosDigitados((f) => ({ ...f, meses: v }))}
              formatarOpcao={(mes) => `${mes.slice(5, 7)}/${mes.slice(0, 4)}`}
              larguraMinima={130}
            />
            <SelectMulti
              label="Emitente"
              opcoes={opcoesComSelecionados.emitentes}
              valor={filtrosDigitados.emitente}
              aoMudar={(v) =>
                setFiltrosDigitados((f) => ({ ...f, emitente: v }))
              }
              larguraMinima={280}
              larguraMaxima={360}
            />
            <SelectMulti
              label="Município do emitente"
              opcoes={opcoesComSelecionados.municipios}
              valor={filtrosDigitados.municipio}
              aoMudar={(v) =>
                setFiltrosDigitados((f) => ({ ...f, municipio: v }))
              }
              larguraMinima={230}
            />
            <SelectMulti
              label="Órgão destinatário"
              opcoes={opcoesComSelecionados.orgaos}
              valor={filtrosDigitados.orgao}
              aoMudar={(v) => setFiltrosDigitados((f) => ({ ...f, orgao: v }))}
              larguraMinima={230}
            />
            <SelectMulti
              label="Órgão superior"
              opcoes={opcoesComSelecionados.orgaosSuperior}
              valor={filtrosDigitados.orgaoSuperior}
              aoMudar={(v) =>
                setFiltrosDigitados((f) => ({ ...f, orgaoSuperior: v }))
              }
              larguraMinima={230}
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
            pageSizeOptions={[100, 200, 500]}
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

      <DetalheDrawer
        detalhe={detalhe}
        carregando={carregandoDetalhe}
        erro={erroDetalhe}
        aoFechar={() => setDetalhe(null)}
      />
    </Stack>
  );
}
