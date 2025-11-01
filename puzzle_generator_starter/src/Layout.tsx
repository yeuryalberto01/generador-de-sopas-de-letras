import { useNavigate } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Topbar */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-900/60 border-b border-white/10 h-14 flex items-center justify-between px-4">
        <button
          onClick={() => navigate('/temas')}
          className="font-semibold hover:text-blue-400 transition-colors cursor-pointer"
        >
          Puzzle Generator
        </button>
        <ThemeToggle />
      </header>

      <main className="px-4 py-6">{children}</main>
    </div>
  );
}