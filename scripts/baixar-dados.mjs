import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";

const ANO = 2026;
const MESES = ["01", "02", "03", "04", "05", "06", "07", "08"];
const BASE =
  "https://dadosabertos-download.cgu.gov.br/PortalDaTransparencia/saida/nfe";
const DIR_CSV = "data/csv";

mkdirSync(DIR_CSV, { recursive: true });

let baixados = 0;
for (const mes of MESES) {
  const periodo = `${ANO}${mes}`;
  const zip = `${DIR_CSV}/${periodo}_NFe.zip`;
  if (!existsSync(zip)) {
    console.log(`Baixando ${periodo}...`);
    execSync(`curl -s -f -o "${zip}" "${BASE}/${periodo}_NFe.zip"`, {
      stdio: "inherit",
    });
    baixados++;
  }
  const destino = `${DIR_CSV}/${periodo}`;
  mkdirSync(destino, { recursive: true });
  const jaExtraido =
    readdirSync(destino).filter((f) => f.endsWith(".csv")).length > 0;
  if (!jaExtraido) {
    console.log(`Extraindo ${periodo}...`);
    execSync(`unzip -o "${zip}" -d "${destino}" >/dev/null`, {
      stdio: "inherit",
    });
  }
}

console.log(
  `Concluído. ${baixados} ZIP(s) baixados, ${MESES.length} meses disponíveis.`,
);
