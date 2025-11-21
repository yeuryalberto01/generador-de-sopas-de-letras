import { ChangeEvent, FC, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Loader2, Download, RefreshCcw, Save, Settings, X } from 'lucide-react';
import { parseWords, temasService } from '../../services/temas';
import WordSearchGenerator from '../../services/wordSearchAlgorithm';
import { generatePDF } from '../../services/pdfExporter.js';
import type { Tema } from '../../types';

// --- TIPOS ---
type WizardStep = 'definir' | 'visualizar';
interface ParseResult { words: string[]; duplicates: number; invalid: number; }
type GridResult = {
  grid: { letter: string; isWord: boolean }[][];
  stats: { totalWords: number; placedWords: number; successRate: number };
  words: string[];
};

// --- CONSTANTES ---
const MAX_WORDS_PER_THEME = 500;

// --- PASO 1: DEFINIR TEMA ---
interface StepDefinirProps {
  title: string;
  setTitle: (t: string) => void;
  batchInput: string;
  setBatchInput: (b: string) => void;
  preview: ParseResult | null;
  error: string;
  handleParse: () => void;
  handleClear: () => void;
}
const StepDefinir: FC<StepDefinirProps> = (props) => (
  <motion.div key="definir" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
    <div className="p-6 sm:p-8 bg-card rounded-lg border border-border-primary">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Título del tema *</label>
            <input type="text" value={props.title} onChange={(e) => props.setTitle(e.target.value)} placeholder="Ej.: Animales del Bosque" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-input border-border-secondary focus:ring-border-focus text-primary" />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-secondary mb-1">Lista de palabras</label>
            <textarea value={props.batchInput} onChange={(e) => props.setBatchInput(e.target.value)} placeholder="Pega aquí tus palabras..." className="flex-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none font-mono text-sm bg-input border-border-secondary focus:ring-border-focus text-primary" rows={10} />
          </div>
          <div className="flex gap-2">
            <button onClick={props.handleParse} className="flex-1 px-4 py-2 border border-border-secondary rounded-lg font-medium hover:bg-surface text-primary disabled:opacity-50">Analizar</button>
            <button onClick={props.handleClear} className="flex-1 px-4 py-2 border border-border-secondary rounded-lg font-medium hover:bg-surface text-primary disabled:opacity-50">Limpiar</button>
          </div>
        </div>
        <div className="rounded-lg p-4 border bg-surface border-border-secondary min-h-[200px]">
          <h3 className="text-lg font-semibold text-primary mb-3">Previsualización</h3>
          {props.preview ? (
            <div className='flex flex-col gap-3'>
              <p className="text-sm font-medium text-accent">{props.preview.words.length} palabras válidas.</p>
              {props.preview.duplicates > 0 && <p className="text-xs text-secondary">{props.preview.duplicates} duplicados ignorados.</p>}
              {props.preview.invalid > 0 && <p className="text-xs text-warning">{props.preview.invalid} con formato inválido.</p>}
              <div className="flex flex-wrap gap-1.5 mt-2 max-h-48 overflow-y-auto">{props.preview.words.slice(0, 50).map((word, idx) => (<span key={idx} className="px-2 py-0.5 rounded-full text-xs border bg-card border-border-secondary text-secondary">{word}</span>))} {props.preview.words.length > 50 && <span className="text-xs text-secondary px-2 py-1">y {props.preview.words.length - 50} más...</span>}</div>
            </div>
          ) : (<div className="flex items-center justify-center h-full text-center text-secondary"><p>Presiona "Analizar" para ver un resumen.</p></div>)}
        </div>
      </div>
      {props.error && (<div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-300 dark:border-red-500/30"><AlertCircle size={16} /><span>{props.error}</span></div>)}
    </div>
  </motion.div>
);

// --- PASO 2: VISUALIZAR Y AJUSTAR ---
interface StepVisualizarProps {
  result: GridResult | null;
  isGenerating: boolean;
  gridSize: number;
  setGridSize: (s: number) => void;
  allowDiagonal: boolean;
  setAllowDiagonal: (d: boolean) => void;
  allowReverse: boolean;
  setAllowReverse: (r: boolean) => void;
  handleGenerate: () => void;
}
const StepVisualizar: FC<StepVisualizarProps> = (props) => (
  <motion.div key="visualizar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      <div className="lg:col-span-1 p-6 bg-card rounded-lg border border-border-primary space-y-6">
        <h3 className="font-bold text-xl text-primary flex items-center gap-2"><Settings size={20} /> Opciones</h3>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-secondary">Tamaño del tablero: <strong>{props.gridSize}×{props.gridSize}</strong></label>
          <input type="range" min={10} max={25} value={props.gridSize} onChange={(e) => props.setGridSize(Number(e.target.value))} className="w-full" />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-secondary"><input type="checkbox" checked={props.allowDiagonal} onChange={(e) => props.setAllowDiagonal(e.target.checked)} /> Permitir diagonales</label>
          <label className="flex items-center gap-2 text-sm text-secondary"><input type="checkbox" checked={props.allowReverse} onChange={(e) => props.setAllowReverse(e.target.checked)} /> Permitir palabras invertidas</label>
        </div>
        <button onClick={props.handleGenerate} disabled={props.isGenerating} className="w-full flex items-center justify-center gap-2 bg-accent-primary text-accent-text rounded-lg py-3 text-sm font-medium hover:bg-accent-primary-hover disabled:opacity-60">
          {props.isGenerating ? <><Loader2 className="h-5 w-5 animate-spin" />Generando...</> : <><RefreshCcw className="h-5 w-5" />Regenerar</>}
        </button>
      </div>
      <div className="lg:col-span-2 p-6 bg-card rounded-lg border border-border-primary">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl text-primary">Previsualización</h3>
          {props.result && <div className="text-sm text-secondary text-right"><div>Éxito: <strong>{props.result.stats.successRate.toFixed(1)}%</strong></div><div>({props.result.stats.placedWords}/{props.result.stats.totalWords} palabras)</div></div>}
        </div>
        <div className="aspect-square w-full overflow-auto border rounded-lg bg-surface flex items-center justify-center p-2">
          {props.result ? (
            <table className="mx-auto"><tbody>{props.result.grid.map((row, rIdx) => (<tr key={rIdx}>{row.map((cell, cIdx) => (<td key={cIdx} className="w-8 h-8 border border-border-secondary text-center font-mono font-semibold text-sm" style={{ backgroundColor: cell.isWord ? 'var(--color-bg-panel-expanded)' : 'transparent' }}>{cell.letter}</td>))}</tr>))}</tbody></table>
          ) : (<p className="text-secondary">Generando sopa de letras...</p>)}
        </div>
         {props.result && (
          <div className="mt-4">
            <h4 className="font-semibold text-primary mb-2">Palabras a encontrar:</h4>
            <div className="flex flex-wrap gap-2 text-sm max-h-24 overflow-y-auto">{props.result.words.map((p, idx) => (<span key={idx} className="px-2.5 py-1 bg-surface rounded-md border border-border-secondary text-secondary">{p}</span>))}</div>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

// --- COMPONENTE PRINCIPAL DEL ASISTENTE ---
export default function AsistenteCreacion() {
  const [step, setStep] = useState<WizardStep>('definir');
  const [isLoading, setIsLoading] = useState(false);
  const [createdTema, setCreatedTema] = useState<Tema | null>(null);

  // Estado para el Paso 1
  const [title, setTitle] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');

  // Estado para el Paso 2
  const [gridSize, setGridSize] = useState(15);
  const [allowDiagonal, setAllowDiagonal] = useState(true);
  const [allowReverse, setAllowReverse] = useState(true);
  const [result, setResult] = useState<GridResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleParse = useCallback(() => { setPreview(parseWords(batchInput)); setError(''); }, [batchInput]);
  const handleClear = useCallback(() => { setBatchInput(''); setPreview(null); setError(''); }, []);

  const handleGoToStep2 = async () => {
    setError('');
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    const res = preview || parseWords(batchInput);
    if (res.words.length === 0) { setError('Agrega al menos una palabra válida.'); return; }
    if (res.words.length > MAX_WORDS_PER_THEME) { setError(`El máximo es ${MAX_WORDS_PER_THEME} palabras.`); return; }
    
    setIsLoading(true);
    try {
      const newTema = await temasService.createTema(title.trim(), res.words);
      setCreatedTema(newTema);
      setStep('visualizar');
    } catch (err) {
      setError('Error al guardar el tema.'); console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerate = useCallback(() => {
    if (!createdTema) return;
    setIsGenerating(true);
    setTimeout(() => {
      const words = createdTema.palabras.map(p => ({ texto: p.texto }));
      const generator = new WordSearchGenerator(gridSize, gridSize, { allowDiagonal, allowReverse });
      const generated = generator.generate(words);
      setResult({ grid: generated.grid, stats: generated.stats, words: words.map(w => w.texto) });
      setIsGenerating(false);
    }, 50);
  }, [createdTema, gridSize, allowDiagonal, allowReverse]);

  const handleExport = useCallback(async () => {
    if (!result || !createdTema) return;

    const config = {
      grid: result.grid,
      tema: createdTema,
      pageSize: 'LETTER', // Default, se puede hacer configurable
      gridConfig: {
        cols: gridSize,
        rows: gridSize,
      },
      wordBoxConfig: {
        visible: true,
        columns: 3,
      },
    };
    await generatePDF(config);
  }, [result, createdTema, gridSize]);

  useEffect(() => {
    if (step === 'visualizar') {
      handleGenerate();
    }
  }, [step, handleGenerate]);

  const renderStep = () => {
    switch (step) {
      case 'definir':
        return <StepDefinir title={title} setTitle={setTitle} batchInput={batchInput} setBatchInput={setBatchInput} preview={preview} error={error} handleParse={handleParse} handleClear={handleClear} />;
      case 'visualizar':
        return <StepVisualizar result={result} isGenerating={isGenerating} gridSize={gridSize} setGridSize={setGridSize} allowDiagonal={allowDiagonal} setAllowDiagonal={setAllowDiagonal} allowReverse={allowReverse} setAllowReverse={setAllowReverse} handleGenerate={handleGenerate} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <header className="text-center my-8 md:my-12">
        <AnimatePresence mode="wait">
          <motion.h1 key={step} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
            {step === 'definir' ? 'Paso 1: Define el Contenido' : 'Paso 2: Visualiza y Ajusta'}
          </motion.h1>
        </AnimatePresence>
        <p className="text-lg text-secondary mt-2">Un asistente para guiarte de principio a fin.</p>
      </header>
      
      <main>
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>

      <footer className="flex items-center justify-between mt-8">
        <button onClick={() => setStep('definir')} disabled={step === 'definir' || isLoading || isGenerating} className="px-6 py-3 rounded-lg bg-card text-primary border border-border-primary hover:border-border-secondary disabled:opacity-40 flex items-center gap-2">
          <ArrowLeft size={16} /> Anterior
        </button>
        {step === 'definir' ? (
          <button onClick={handleGoToStep2} disabled={isLoading} className="px-8 py-3 rounded-lg bg-accent-primary text-accent-text hover:bg-accent-primary-hover disabled:opacity-40 flex items-center gap-2">
            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : 'Siguiente: Visualizar'}
          </button>
        ) : (
          <button onClick={handleExport} disabled={isGenerating || !result} className="px-8 py-3 rounded-lg bg-accent-success text-white hover:bg-accent-success-hover disabled:opacity-40 flex items-center gap-2">
            <Download size={18} />
            Exportar PDF
          </button>
        )}
      </footer>
    </div>
  );
}