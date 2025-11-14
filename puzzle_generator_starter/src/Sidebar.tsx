import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Menu minimalista */}
      <div className="fixed top-12 left-4 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 min-w-48">
        <nav className="py-2">
          <Link
            to="/"
            onClick={onClose}
            className={`block px-4 py-2 text-sm transition-colors ${
              location.pathname === "/"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            🏠 Inicio
          </Link>
          <Link
            to="/libros"
            onClick={onClose}
            className={`block px-4 py-2 text-sm transition-colors ${
              location.pathname === "/libros"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            📚 Libros
          </Link>
          <Link
            to="/temas"
            onClick={onClose}
            className={`block px-4 py-2 text-sm transition-colors ${
              location.pathname === "/temas"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            🏷️ Temas
          </Link>
          <Link
            to="/diagramacion"
            onClick={onClose}
            className={`block px-4 py-2 text-sm transition-colors ${
              location.pathname.startsWith("/diagramacion")
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            🎨 Diagramación
          </Link>
          <Link
            to="/panel-apis"
            onClick={onClose}
            className={`block px-4 py-2 text-sm transition-colors ${
              location.pathname === "/panel-apis"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            APIs
          </Link>
        </nav>
      </div>
    </>
  );
}