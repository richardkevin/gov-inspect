import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DetalheNotaPanel from "./DetalheNotaPanel";
import type { DetalheNota } from "./tabela-types";

export default function DetalheDrawer({
  detalhe,
  carregando,
  erro,
  aoFechar,
}: {
  detalhe: DetalheNota | null;
  carregando: boolean;
  erro: string | null;
  aoFechar: () => void;
}) {
  return (
    <Drawer
      anchor="right"
      open={detalhe !== null || carregando}
      onClose={aoFechar}
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
            onClick={aoFechar}
            disabled={carregando}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />

        {carregando ? (
          <Stack
            spacing={2}
            sx={{
              flexGrow: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
            <Typography color="text.secondary">Carregando detalhes…</Typography>
          </Stack>
        ) : erro ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{erro}</Typography>
          </Box>
        ) : detalhe ? (
          <DetalheNotaPanel detalhe={detalhe} />
        ) : null}
      </Stack>
    </Drawer>
  );
}
