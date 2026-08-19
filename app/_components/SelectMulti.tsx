"use client";

import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useRef, useState } from "react";

const LIMITE_SEM_BUSCA = 400;
const MAX_EXIBIDOS = 200;

export default function SelectMulti({
  label,
  opcoes,
  valor,
  aoMudar,
  formatarOpcao,
  larguraMinima,
  larguraMaxima,
}: {
  label: string;
  opcoes: string[];
  valor: string[];
  aoMudar: (valor: string[]) => void;
  formatarOpcao?: (opcao: string) => string;
  larguraMinima?: number;
  larguraMaxima?: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ancoraRef = useRef<HTMLButtonElement | null>(null);

  const resumo = valor.length === 0 ? "Todos" : `${valor.length} selecionados`;

  const precisaBusca = opcoes.length > LIMITE_SEM_BUSCA;
  const haBusca = busca.trim().length > 0;

  const opcoesFiltradas = useMemo(() => {
    if (!precisaBusca) return opcoes;
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return opcoes.filter((o) =>
      (formatarOpcao ? formatarOpcao(o) : o).toLowerCase().includes(termo),
    );
  }, [busca, formatarOpcao, opcoes, precisaBusca]);

  const truncadas = opcoesFiltradas.length > MAX_EXIBIDOS;
  const exibidas = truncadas
    ? opcoesFiltradas.slice(0, MAX_EXIBIDOS)
    : opcoesFiltradas;

  const fechar = () => {
    setAberto(false);
    setBusca("");
  };

  const alternar = (opcao: string) => {
    aoMudar(
      valor.includes(opcao)
        ? valor.filter((v) => v !== opcao)
        : [...valor, opcao],
    );
  };

  return (
    <>
      <Button
        ref={ancoraRef}
        variant="outlined"
        color="inherit"
        onClick={() => setAberto(true)}
        sx={{
          minWidth: larguraMinima,
          maxWidth: larguraMaxima,
          textTransform: "none",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0.25,
          px: 1.5,
          py: 0.75,
        }}
      >
        <Typography
          variant="caption"
          component="span"
          sx={{ color: "text.secondary", lineHeight: 1.2 }}
        >
          {label}
        </Typography>
        <span>{resumo}</span>
      </Button>
      <Popover
        open={aberto}
        anchorEl={ancoraRef.current}
        onClose={fechar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 380 } } }}
      >
        <Stack sx={{ p: 1, gap: 1 }}>
          {precisaBusca && (
            <TextField
              size="small"
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar entre ${opcoes.length.toLocaleString("pt-BR")} opções…`}
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
          )}
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => aoMudar(opcoes)}>
              Selecionar todos
            </Button>
            <Button size="small" onClick={() => aoMudar([])}>
              Limpar
            </Button>
          </Stack>
          <Divider />
          {precisaBusca && !haBusca ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              Digite para buscar entre {opcoes.length.toLocaleString("pt-BR")}{" "}
              opções.
            </Typography>
          ) : exibidas.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              Nenhum resultado.
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
              {exibidas.map((opcao) => (
                <Box
                  key={opcao}
                  onClick={() => alternar(opcao)}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Checkbox
                    checked={valor.includes(opcao)}
                    size="small"
                    disableRipple
                    tabIndex={-1}
                  />
                  <Typography variant="body2" noWrap>
                    {formatarOpcao ? formatarOpcao(opcao) : opcao}
                  </Typography>
                </Box>
              ))}
              {truncadas && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ p: 1 }}
                >
                  Mostrando {exibidas.length} de{" "}
                  {opcoesFiltradas.length.toLocaleString("pt-BR")} — refine a
                  busca.
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </Popover>
    </>
  );
}
