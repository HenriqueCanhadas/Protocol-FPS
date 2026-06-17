/**
 * components/ConfirmModal.jsx — PROTOCOL FPS
 */
export default function ConfirmModal({ confirm, onCancel, onOk }) {
  if (!confirm) return null;
  const { titulo, corpo, icone, isDanger } = confirm;
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <div className="confirm-icon">{icone || "⚡"}</div>
        <div className="confirm-title">{titulo}</div>
        <div
          className="confirm-body"
          dangerouslySetInnerHTML={{ __html: corpo }}
        />
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>CANCELAR</button>
          <button className={isDanger ? "btn-danger" : "btn-primary"} onClick={onOk}>
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  );
}
