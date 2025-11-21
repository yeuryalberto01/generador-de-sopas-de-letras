import { useNavigate } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";
import { Search } from "lucide-react";

export default function Layout({ children, setCommandPaletteOpen }: { children: React.ReactNode, setCommandPaletteOpen: (open: boolean) => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-slate-200 transition-colors duration-300">
      {/* Topbar unificado con el nuevo tema oscuro */}
      <header
        className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 border-b 
                   bg-indigo-700 dark:bg-gray-900 border-indigo-600 dark:border-gray-700 text-white shadow-md"
      >
        <button
          onClick={() => navigate('/temas')}
          className="font-bold text-xl transition-transform duration-300 ease-in-out hover:scale-105"
        >
          🧩 Puzzle Generator
        </button>
        <div className="flex items-center gap-4">
            <button
                onClick={() => setCommandPaletteOpen(true)}
                className="p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 dark:focus:ring-offset-gray-900 focus:ring-white/80
                           hover:bg-white/10"
                title="Abrir menú de comandos (Ctrl+K)"
            >
                <Search size={20} />
            </button>
            <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
