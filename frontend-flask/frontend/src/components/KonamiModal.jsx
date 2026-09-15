/**
 * components/KonamiModal.jsx — PROTOCOL FPS
 * Modal arcade comemorativo do Easter Egg do Konami Code (Sprint 79).
 */
import TerminalModal from "./TerminalModal";

export default function KonamiModal({ open, onClose }) {
  if (!open) return null;

  return (
    <TerminalModal
      open={open}
      onClose={onClose}
      overlayClassName="konami-overlay"
      className="konami-box"
    >
      <style>{`
        .konami-overlay {
          position: fixed; inset: 0;
          background: rgba(4, 7, 5, 0.92);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 500;
          animation: konamiFadeIn 0.25s ease-out;
        }
        @keyframes konamiFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .konami-box {
          background: var(--bg2);
          border: 2px solid var(--green);
          box-shadow: 0 0 28px rgba(57, 255, 20, 0.28), inset 0 0 16px rgba(57, 255, 20, 0.08);
          padding: 2rem 1.6rem;
          width: min(480px, 92vw);
          max-width: 92vw;
          display: flex; flex-direction: column; gap: 1.3rem;
          text-align: center;
          position: relative;
          font-family: var(--mono);
          box-sizing: border-box;
        }
        .konami-header {
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px dashed var(--border2);
          padding-bottom: 0.8rem;
        }
        .konami-tag {
          font-size: var(--fs-xs);
          letter-spacing: 0.18em;
          color: var(--green);
          text-transform: uppercase;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .konami-btn-close {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-dim);
          font-family: var(--mono);
          font-size: 1rem;
          width: 28px; height: 28px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .konami-btn-close:hover {
          border-color: var(--red);
          color: var(--red);
        }
        .konami-title {
          font-family: var(--display);
          font-size: 2.5rem;
          letter-spacing: 0.08em;
          color: var(--green);
          text-shadow: 0 0 16px var(--green-dim);
          line-height: 1.1;
        }
        .konami-subtitle {
          font-size: var(--fs-sm);
          color: var(--amber);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .konami-keys-bar {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 0.35rem;
          margin: 0.4rem 0;
        }
        .konami-key-badge {
          background: var(--bg3);
          border: 1px solid var(--green);
          color: var(--green);
          padding: 0.3rem 0.5rem;
          font-size: var(--fs-xs);
          font-weight: 700;
          box-shadow: 0 0 8px rgba(57, 255, 20, 0.2);
          letter-spacing: 0.05em;
        }
        .konami-console {
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 0.9rem;
          text-align: left;
          font-size: 0.76rem;
          color: var(--text-dim);
          line-height: 1.6;
        }
        .konami-console-line-ok {
          color: var(--green);
        }
        .konami-hearts {
          font-size: 1.05rem;
          letter-spacing: 0.2em;
          color: #ff3366;
          text-shadow: 0 0 10px rgba(255, 51, 102, 0.4);
        }
        .konami-action {
          margin-top: 0.2rem;
        }
        .konami-btn-ok {
          background: var(--green-soft);
          border: 1px solid var(--green);
          color: var(--green);
          padding: 0.8rem 1.6rem;
          font-family: var(--mono);
          font-size: var(--fs-sm);
          font-weight: 700;
          letter-spacing: 0.14em;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s ease;
        }
        .konami-btn-ok:hover {
          background: var(--green);
          color: #000;
          box-shadow: 0 0 16px var(--green);
        }
        @media (max-width: 480px) {
          .konami-box { padding: 1.4rem 1rem; gap: 1rem; }
          .konami-title { font-size: 2.1rem; }
          .konami-key-badge { padding: 0.25rem 0.4rem; font-size: 0.68rem; }
          .konami-hearts { font-size: 0.9rem; }
        }
      `}</style>

      <div className="konami-header">
        <div className="konami-tag">
          <span>🕹️</span> CHEAT CODE DETECTADO
        </div>
        <button
          className="konami-btn-close"
          onClick={onClose}
          title="Fechar (Esc)"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div>
        <div className="konami-title">30 VIDAS EXTRA!</div>
        <div className="konami-subtitle">PROTOCOL FPS · MODO ARCADE HABILITADO</div>
      </div>

      <div className="konami-keys-bar">
        <span className="konami-key-badge">▲ CIMA</span>
        <span className="konami-key-badge">▲ CIMA</span>
        <span className="konami-key-badge">▼ BAIXO</span>
        <span className="konami-key-badge">▼ BAIXO</span>
        <span className="konami-key-badge">◄ ESQ</span>
        <span className="konami-key-badge">► DIR</span>
        <span className="konami-key-badge">◄ ESQ</span>
        <span className="konami-key-badge">► DIR</span>
        <span className="konami-key-badge">[ B ]</span>
        <span className="konami-key-badge">[ A ]</span>
      </div>

      <div className="konami-console">
        <div><span className="konami-console-line-ok">[OK]</span> Sequência Konami autêntica validada.</div>
        <div><span className="konami-console-line-ok">[OK]</span> Preços monitorados em modo turbo.</div>
        <div><span className="konami-console-line-ok">[OK]</span> Radar de ofertas calibrado com sucesso.</div>
        <div style={{ marginTop: "0.4rem", color: "var(--text)" }}>&gt; &quot;All your base are belong to us.&quot;</div>
      </div>

      <div className="konami-hearts">
        ♥♥♥♥♥ ♥♥♥♥♥ ♥♥♥♥♥ (+30)
      </div>

      <div className="konami-action">
        <button className="konami-btn-ok" onClick={onClose}>
          CONTINUAR NO PROTOCOL FPS
        </button>
      </div>
    </TerminalModal>
  );
}
