import { motion } from 'framer-motion';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash: FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/temas');
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-center flex flex-col items-center"
      >
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 dark:from-slate-100 to-gray-600 dark:to-slate-400 py-2">
          Caza Palabras
        </h1>

        <p className="max-w-xl mx-auto my-6 text-lg text-gray-600 dark:text-slate-400">
          Herramienta inteligente para diseñar, diagramar y exportar sopas de letras. Comienza a crear tu próximo puzzle en segundos.
        </p>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className="px-10 py-4 font-semibold text-white bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 transition-all duration-300 relative z-10"
        >
          Empezar a Crear
        </motion.button>

        <div className="mt-16 text-sm text-gray-500 dark:text-slate-600">
          <p>Versión 2.0 - Edición Inteligente</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Splash;
