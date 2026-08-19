import {
  type EventoNotaFiscal,
  formatBRL,
  formatDateTime,
  type ItemNotaFiscal,
} from "../../lib/portal-transparencia";
import styles from "./nf.module.css";

export function Campo({
  label,
  valor,
  sub,
}: {
  label: string;
  valor: string;
  sub?: string;
}) {
  return (
    <div className={styles.campo}>
      <dt>{label}</dt>
      <dd>
        {valor}
        {sub && <span className={styles.muted}>{sub}</span>}
      </dd>
    </div>
  );
}

export function CampoChave({
  label,
  valor,
  mono,
}: {
  label: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div className={`${styles.campo} ${mono ? styles.campoMono : ""}`}>
      <dt>{label}</dt>
      <dd className={styles.mono}>{valor}</dd>
    </div>
  );
}

export function ItemLinha({ item }: { item: ItemNotaFiscal }) {
  return (
    <tr>
      <td>{item.numeroProduto}</td>
      <td>{item.descricaoProdutoServico}</td>
      <td className={styles.mono}>{item.codigoNcmSh || item.ncmSh}</td>
      <td className={styles.mono}>{item.cfop}</td>
      <td>
        {item.quantidade} {item.unidade}
      </td>
      <td>{formatBRL(item.valorUnitario)}</td>
      <td>{formatBRL(item.valor)}</td>
    </tr>
  );
}

export function EventoLinha({ evento }: { evento: EventoNotaFiscal }) {
  return (
    <tr>
      <td>{formatDateTime(evento.dataEvento)}</td>
      <td>
        <div>{evento.evento}</div>
        {evento.tipoEvento && (
          <div className={styles.muted}>{evento.tipoEvento}</div>
        )}
      </td>
      <td>{evento.motivo}</td>
    </tr>
  );
}
