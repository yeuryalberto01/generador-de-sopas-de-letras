import { useNavigate } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";
import { Search } from "lucide-react";

export default function Layout({ children, setCommandPaletteOpen }: { children: React.ReactNode, setCommandPaletteOpen: (open: boolean) => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Topbar con mejor contraste */}
      <header
        className="sticky top-0 z-50 backdrop-blur h-14 flex items-center justify-between px-6 border-b transition-colors duration-300 
                   bg-white/95 dark:bg-slate-900/95 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white shadow-sm"
      >
        <button
          onClick={() => navigate('/temas')}
          className="font-bold text-lg transition-colors cursor-pointer hover:text-blue-700 dark:hover:text-blue-300"
        >
          Puzzle Generator
        </button>
        <div className="flex items-center gap-4">
            <button
                onClick={() => setCommandPaletteOpen(true)}
                className="p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:bg-gray-200 dark:hover:bg-slate-700"
                title="Abrir menú de comandos (Ctrl+K)"
            >
                <Search size={20} />
            </button>
            <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
