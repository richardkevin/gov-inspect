import type { Metadata } from "next";
import {
  contarNotas,
  listarNotas,
  opcoesDoRecorte,
  resumoNotas,
} from "../../lib/db";
import { Hero, styles } from "../_components/nf";
import TabelaNotas from "../_components/TabelaNotas";

export const metadata: Metadata = {
  title: "Tabela de Notas Fiscais — Portal da Transparência",
  description:
    "Todas as Notas Fiscais Eletrônicas (NFe) do Poder Executivo Federal de 2026, com busca, filtros e detalhamento por nota.",
};

export const dynamic = "force-dynamic";

export default function NotasPage() {
  const notasIniciais = listarNotas({}, { limite: 25, offset: 0 });
  const opcoesIniciais = opcoesDoRecorte({}, { limite: 25 * 6, offset: 0 });
  const totalInicial = contarNotas();
  const resumo = resumoNotas();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Hero
          atual="/notas"
          titulo="Tabela de Notas Fiscais"
          descricao="Todas as Notas Fiscais Eletrônicas (NFe) do Poder Executivo Federal emitidas em 2026 — clique em uma linha para ver os detalhes da nota."
        />

        <section className={styles.card}>
          <TabelaNotas
            notasIniciais={notasIniciais}
            opcoesIniciais={opcoesIniciais}
            totalInicial={totalInicial}
            resumo={resumo}
          />
        </section>
      </main>
    </div>
  );
}
