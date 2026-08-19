import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { DetalheNota } from "./tabela-types";
import { fmtChave, fmtData, fmtMoeda } from "./tabela-types";

export default function DetalheNotaPanel({
  detalhe,
}: {
  detalhe: DetalheNota;
}) {
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

      <Box sx={{ borderTop: 1, borderColor: "divider", p: 3, pt: 2 }}>
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
