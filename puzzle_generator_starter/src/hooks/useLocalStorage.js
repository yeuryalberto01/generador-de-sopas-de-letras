import { useCallback, useEffect, useState } from 'react';

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const result = JSON.parse(localStorage.getItem(key) || 'null');
        if (result !== null) {
          setStoredValue(result);
        }
      } catch (error) {
        // Silenciar error de localStorage para evitar warnings
      }
    };

    loadValue();
  }, [key]);

  const setValue = useCallback((value) => {
    try {
      // Permite que `value` sea una función para tener la misma API que el setter de `useState`
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Guarda el estado
      setStoredValue(valueToStore);
      // Guarda en localStorage
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Silenciar errores de localStorage
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

export default useLocalStorage;
