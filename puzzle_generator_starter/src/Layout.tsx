import ThemeToggle from "./components/ThemeToggle";

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Topbar */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-900/60 border-b border-white/10 h-14 flex items-center justify-between px-4">
        <div className="font-semibold">Puzzle Generator</div>
        <ThemeToggle />
      </header>

      <main className="px-4 py-6">{children}</main>
    </div>
  );
}