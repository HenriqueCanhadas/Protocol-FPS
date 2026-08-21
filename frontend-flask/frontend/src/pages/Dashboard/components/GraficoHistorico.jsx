/**
 * pages/Dashboard/components/GraficoHistorico.jsx — PROTOCOL FPS
 * Gráfico tempo × preço (SVG puro, Sprint 10) — série única em linha, hover
 * com crosshair + tooltip (dia · valor), clique no ponto → onPontoClick(id).
 *
 * Extraído de ProductHistoryDialog.jsx na Sprint 21/V3 para ser reaproveitado
 * também pelo PriceChartPanel da sidebar — mesmo componente, sem duplicação.
 */
import { useState, useMemo } from "react";
import { dataBRT, horaBRT } from "@/utils/datas";
import { formatBRL } from "@/utils/format";

export default function GraficoHistorico({ dados, onPontoClick, dica = true }) {
  const [hover, setHover] = useState(null); // índice do ponto sob o mouse

  // pontos em ordem cronológica (a lista chega do mais novo p/ o mais antigo)
  const pontos = useMemo(
    () => [...(dados || [])]
      .filter((d) => d.preco != null)
      .reverse()
      .map((d) => ({ ...d, t: new Date(d.coletado_em).getTime(), preco: Number(d.preco) })),
    [dados]
  );

  const W = 640, H = 220, PAD = { top: 14, right: 16, bottom: 26, left: 62 };
  if (pontos.length < 2) return null; // com 0–1 leituras a linha não informa nada

  const t0 = pontos[0].t;
  const t1 = pontos[pontos.length - 1].t;
  const precos = pontos.map((p) => p.preco);
  const precoMinReal = Math.min(...precos);
  let pMin = precoMinReal, pMax = Math.max(...precos);
  if (pMin === pMax) { pMin -= 1; pMax += 1; }       // série constante
  const folga = (pMax - pMin) * 0.08;
  pMin -= folga; pMax += folga;

  const X = (t) => PAD.left + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.left - PAD.right);
  const Y = (v) => H - PAD.bottom - ((v - pMin) / (pMax - pMin)) * (H - PAD.top - PAD.bottom);

  const path = pontos.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.preco).toFixed(1)}`).join(" ");
  const yTicks = [0, 0.5, 1].map((f) => pMin + f * (pMax - pMin));
  const xTicks = t1 > t0 ? [0, 1 / 3, 2 / 3, 1].map((f) => t0 + f * (t1 - t0)) : [t0];
  const iMin   = precos.indexOf(precoMinReal);

  // ponto mais próximo do mouse no eixo X (o SVG escala com o container)
  const localizar = (evt) => {
    const rect = evt.currentTarget.getBoundingClientRect();
    const mx = ((evt.clientX - rect.left) / rect.width) * W;
    let melhor = 0, dist = Infinity;
    pontos.forEach((p, i) => {
      const d = Math.abs(X(p.t) - mx);
      if (d < dist) { dist = d; melhor = i; }
    });
    return melhor;
  };

  const alvo = hover != null ? pontos[hover] : null;

  return (
    <div className="hist-grafico">
      <div className="hg-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Gráfico do preço ao longo do tempo"
          onMouseMove={(e) => setHover(localizar(e))}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => onPontoClick?.(pontos[localizar(e)].id)}
        >
          {/* grade recessiva + rótulos do eixo Y */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={Y(v)} y2={Y(v)} stroke="var(--border)" strokeWidth="1" />
              <text x={PAD.left - 8} y={Y(v) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="var(--mono)">
                {formatBRL(v)}
              </text>
            </g>
          ))}
          {/* rótulos do eixo X (datas) */}
          {xTicks.map((t, i) => (
            <text key={i} x={X(t)} y={H - 8} fontSize="9" fill="var(--text-muted)" fontFamily="var(--mono)"
              textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}>
              {dataBRT(new Date(t).toISOString(), { day: "2-digit", month: "2-digit", year: "2-digit" })}
            </text>
          ))}
          {/* série */}
          <path d={path} fill="none" stroke="var(--green)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* marcador fixo do menor preço (âmbar, como o ★ da lista) */}
          <circle cx={X(pontos[iMin].t)} cy={Y(pontos[iMin].preco)} r="3.5" fill="var(--bg3)" stroke="var(--amber)" strokeWidth="2" />
          {/* crosshair + marcador do hover */}
          {alvo && (
            <g pointerEvents="none">
              <line x1={X(alvo.t)} x2={X(alvo.t)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--green-dim)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={X(alvo.t)} cy={Y(alvo.preco)} r="4.5" fill="var(--bg3)" stroke="var(--green)" strokeWidth="2" />
            </g>
          )}
        </svg>
        {alvo && (
          <div
            className="hg-tooltip"
            style={{
              left: `${(X(alvo.t) / W) * 100}%`,
              top:  `${(Y(alvo.preco) / H) * 100}%`,
              transform: `translate(${X(alvo.t) > W * 0.68 ? "calc(-100% - 12px)" : "12px"}, -120%)`,
            }}
          >
            <div>{dataBRT(alvo.coletado_em, { day: "2-digit", month: "2-digit", year: "numeric" })} · {horaBRT(alvo.coletado_em, { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="hg-preco">{formatBRL(alvo.preco)}{alvo.disponivel === false && <span className="hg-esg"> · esgotado</span>}</div>
          </div>
        )}
      </div>
      {dica && (
        <div className="hg-hint">◇ passe o mouse para inspecionar · clique em um ponto para ir à leitura na lista</div>
      )}
    </div>
  );
}
