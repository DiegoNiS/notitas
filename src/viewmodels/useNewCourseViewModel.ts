// Ruta: src/viewmodels/useNewCourseViewModel.ts
import { useState, useEffect } from 'react';
import { db, Ambiente } from '../services/database';

export function useNewCourseViewModel(isOpen: boolean, onSuccess: () => void, onClose: () => void) {
  const [ambientesDB, setAmbientesDB] = useState<Ambiente[]>([]);
  const [abreviatura, setAbreviatura] = useState('');
  const [nombre, setNombre] = useState('');
  const [ambientesSeleccionados, setAmbientesSeleccionados] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      db.obtenerAmbientesBase().then(setAmbientesDB);
      setAbreviatura('');
      setNombre('');
      setAmbientesSeleccionados([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const toggleAmbiente = (id: string) => {
    setAmbientesSeleccionados(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await db.crearCurso(abreviatura, nombre, ambientesSeleccionados);
    onSuccess();
    onClose();
  };

  return {
    ambientesDB,
    abreviatura, setAbreviatura,
    nombre, setNombre,
    ambientesSeleccionados, toggleAmbiente,
    isSubmitting,
    handleSubmit
  };
}