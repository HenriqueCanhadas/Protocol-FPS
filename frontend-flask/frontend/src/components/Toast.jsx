/**
 * components/Toast.jsx — PROTOCOL FPS
 */
export default function Toast({ toast }) {
  if (!toast.visible) return null;
  return (
    <div
      id="toast"
      className={toast.tipo === "error" ? "error" : toast.tipo === "ok" ? "success" : ""}
    >
      {toast.msg}
    </div>
  );
}
