import { useNavigate } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface text-primary transition-colors duration-300">
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 backdrop-blur h-14 flex items-center justify-between px-4 border-b transition-colors duration-300 
                   bg-surface/90 border-border-secondary text-primary shadow-sm
                   dark:bg-surface/70 dark:border-border-primary"
      >
        <button
          onClick={() => navigate('/temas')}
          className="font-semibold transition-colors cursor-pointer hover:text-accent"
        >
          Puzzle Generator
        </button>
        <ThemeToggle />
      </header>

      <main className="px-4 py-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
