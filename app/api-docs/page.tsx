import type { Metadata } from "next";
import { Hero, styles } from "../_components/nf";
import ApiDocs from "./ApiDocs";

export const metadata: Metadata = {
  title: "Documentação da API — Portal da Transparência",
  description:
    "Swagger UI com todos os endpoints da API de Dados do Portal da Transparência do Governo Federal.",
};

export default function ApiDocsPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Hero
          atual="/api-docs"
          titulo="Documentação da API"
          descricao="Todos os endpoints da API de Dados do Portal da Transparência do Governo Federal, com parâmetros, schemas e exemplos."
        />
        <section className={styles.card}>
          <ApiDocs />
        </section>
      </main>
    </div>
  );
}
