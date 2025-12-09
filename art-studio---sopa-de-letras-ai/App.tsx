import React from 'react';
import { ArtStudio } from './components/ArtStudio';
import { PuzzleInfo } from './features/artstudio/lib/types';

// DATOS REALES DE MATATIEMPO (JSON ORIGINAL)
const MATATIEMPO_DATA = {
  "id": "e0c4b39c-618f-462f-a955-6f56c57f3945",
  "name": "Matatiempo",
  "config": {
    "title": "Pasatiempos Favoritos",
    "headerLeft": "Sopa de Letras",
    "headerRight": "Edición Especial",
    "difficulty": "EASY",
    "words": [
      "AJEDREZ", "LECTURA", "MUSICA", "BAILE", "CINE",
      "JUEGOS", "ARTE", "DEPORTE", "COCINA", "VIAJES"
    ],
    "themeData": {
      "primaryColor": "#FF5733",
      "textColor": "#000000"
    }
  },
  "puzzleData": {
    "grid": [
      ["E", "W", "X", "Q", "Q", "C", "Y", "S", "X", "U", "Y", "O", "L", "E", "B"],
      ["M", "I", "S", "Q", "F", "T", "W", "W", "J", "D", "Q", "I", "E", "M", "H"],
      ["I", "O", "P", "I", "Z", "B", "A", "I", "L", "E", "D", "F", "C", "U", "R"],
      ["G", "L", "W", "I", "V", "O", "W", "K", "P", "H", "T", "L", "T", "S", "O"],
      ["S", "P", "S", "W", "E", "Z", "J", "U", "E", "G", "O", "S", "U", "I", "A"],
      ["I", "B", "I", "C", "I", "N", "E", "T", "F", "C", "S", "V", "R", "C", "F"],
      ["P", "P", "T", "I", "Y", "D", "H", "Q", "W", "W", "J", "K", "A", "A", "O"],
      ["C", "Z", "Y", "E", "G", "Y", "V", "W", "N", "C", "E", "U", "P", "R", "W"],
      ["Z", "K", "R", "C", "W", "E", "V", "K", "J", "A", "N", "E", "D", "D", "Y"],
      ["V", "K", "K", "R", "P", "X", "I", "F", "Z", "J", "K", "C", "G", "E", "M"],
      ["Z", "X", "W", "I", "A", "Z", "A", "N", "P", "E", "J", "O", "X", "P", "I"],
      ["X", "B", "E", "L", "S", "P", "J", "U", "F", "D", "R", "C", "I", "O", "N"],
      ["L", "W", "B", "Q", "Z", "S", "E", "Q", "O", "R", "C", "I", "F", "R", "D"],
      ["A", "G", "S", "W", "A", "X", "S", "F", "F", "E", "G", "N", "X", "T", "N"],
      ["A", "R", "T", "E", "U", "F", "Y", "X", "Y", "Z", "U", "A", "R", "E", "K"]
    ]
  }
};

const puzzleAdapter = (data: typeof MATATIEMPO_DATA): PuzzleInfo => {
  return {
    title: data.config.title,
    headerLeft: data.config.headerLeft,
    headerRight: data.config.headerRight,
    levelText: `NIVEL ${data.config.difficulty === 'EASY' ? 'FÁCIL' : 'MEDIO'}`,
    words: data.config.words,
    grid: data.puzzleData.grid
  };
};

const App: React.FC = () => {
  const puzzle = puzzleAdapter(MATATIEMPO_DATA);

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-pink-500/30 selection:text-pink-100">
      
      {/* Background Decor */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Glass Header */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
               <span className="font-display font-bold text-white text-lg">C</span>
            </div>
            <h1 className="text-sm font-display font-bold text-white tracking-wider">CENE<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">COMPUC</span></h1>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
            AI Training Studio v2.0
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-28 pb-10 h-screen flex flex-col">
        <div className="flex-1 h-full min-h-0">
          <ArtStudio puzzle={puzzle} />
        </div>
      </main>

    </div>
  );
};

export default App;