/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/useColaboradores.js (CORREGIDO: SUMA NUMÉRICA)                */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';

// Mantenemos la versión para no perder tus datos actuales, 
// pero el código ahora forzará la conversión a número al operar.
const LOCAL_STORAGE_KEY = 'likeStore_colaboradores_v4';

export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [historial, setHistorial] = useState([]); 
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const colaboradoresPorPagina = 10;

  // CARGAR DATOS
  useEffect(() => {
    const datosGuardados = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (datosGuardados) {
      try {
        const { cols, hist } = JSON.parse(datosGuardados);
        setColaboradores(cols || []);
        setHistorial(hist || []);
      } catch (error) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } else {
      // DATOS DE PRUEBA
      const datosIniciales = Array.from({ length: 5 }).map((_, i) => ({
        id: `EMP-${100 + i}`,
        nombre: `Colaborador ${i + 1}`,
        puesto: 'Vendedor',
        region: 'Norte',
        marca: 'LikeStore',
        fechaIngreso: '2023-01-15',
        telefono: '555-0000',
        email: `colaborador${i}@ejemplo.com`,
        facebook: '', 
        foto: null,
        puntos: 0 
      }));
      setColaboradores(datosIniciales);
      guardarEnStorage(datosIniciales, []);
    }
  }, []);

  const guardarEnStorage = (cols, hist) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ cols, hist }));
  };

  // --- FUNCIONES BÁSICAS ---
  const agregarColaborador = (nuevo) => {
    // Aseguramos que puntos sea número 0
    const nuevaLista = [{ ...nuevo, puntos: 0 }, ...colaboradores];
    setColaboradores(nuevaLista);
    guardarEnStorage(nuevaLista, historial);
  };

  const eliminarColaborador = (id) => {
    const nuevaLista = colaboradores.filter(col => col.id !== id);
    setColaboradores(nuevaLista);
    guardarEnStorage(nuevaLista, historial);
  };

  const importarMasivo = (listaNuevos) => {
    const nuevaLista = [...listaNuevos, ...colaboradores];
    setColaboradores(nuevaLista);
    guardarEnStorage(nuevaLista, historial);
  };

  const actualizarColaborador = (datos) => {
    const nuevaLista = colaboradores.map(col => col.id === datos.id ? datos : col);
    setColaboradores(nuevaLista);
    guardarEnStorage(nuevaLista, historial);
  };

  // --- GESTIÓN DE PUNTOS (CORREGIDO EL ERROR DE CONCATENACIÓN) ---

  // 1. SUMAR PUNTOS
  const registrarPuntosMasivos = (evento) => {
    const nuevoHistorial = [evento, ...historial];
    setHistorial(nuevoHistorial);

    const colaboradoresActualizados = colaboradores.map(col => {
      const participacion = evento.detalles.find(d => d.colaboradorId === col.id);
      if (participacion) {
        // CORRECCIÓN: Usamos Number() para evitar que sume textos ("100" + "200" = "100200")
        const puntosActuales = Number(col.puntos) || 0;
        const puntosNuevos = Number(participacion.puntosGanados) || 0;
        
        return { ...col, puntos: puntosActuales + puntosNuevos };
      }
      return col;
    });

    setColaboradores(colaboradoresActualizados);
    guardarEnStorage(colaboradoresActualizados, nuevoHistorial);
  };

  // 2. ELIMINAR HISTORIAL (DESHACER PUNTOS)
  const eliminarImportacion = (idEvento) => {
    const eventoABorrar = historial.find(e => e.id === idEvento);
    if (!eventoABorrar) return;

    // Restamos los puntos
    const colaboradoresCorregidos = colaboradores.map(col => {
      const participacion = eventoABorrar.detalles.find(d => d.colaboradorId === col.id);
      if (participacion) {
        // CORRECCIÓN: Aseguramos operación numérica también al restar
        const puntosActuales = Number(col.puntos) || 0;
        const puntosARestar = Number(participacion.puntosGanados) || 0;
        
        // Permitimos negativos si es necesario para cuadrar, o usamos Math.max(0, ...)
        return { ...col, puntos: puntosActuales - puntosARestar };
      }
      return col;
    });

    const nuevoHistorial = historial.filter(e => e.id !== idEvento);

    setColaboradores(colaboradoresCorregidos);
    setHistorial(nuevoHistorial);
    guardarEnStorage(colaboradoresCorregidos, nuevoHistorial);
  };

  // VISTA
  const colaboradoresFiltrados = colaboradores.filter(col => 
    col.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  const totalPaginas = Math.ceil(colaboradoresFiltrados.length / colaboradoresPorPagina);
  const indiceUltimo = paginaActual * colaboradoresPorPagina;
  const indicePrimero = indiceUltimo - colaboradoresPorPagina;
  const colaboradoresPaginados = colaboradoresFiltrados.slice(indicePrimero, indiceUltimo);

  return {
    colaboradoresVisibles: colaboradoresPaginados,
    colaboradoresReales: colaboradores, 
    historial,
    busqueda,
    setBusqueda,
    eliminarColaborador,
    agregarColaborador,
    importarMasivo,
    actualizarColaborador,
    registrarPuntosMasivos,
    eliminarImportacion, 
    paginacion: {
      paginaActual,
      totalPaginas,
      irAPaginaSiguiente: () => setPaginaActual(p => Math.min(p + 1, totalPaginas)),
      irAPaginaAnterior: () => setPaginaActual(p => Math.max(p - 1, 1)),
      tieneSiguiente: paginaActual < totalPaginas,
      tieneAnterior: paginaActual > 1
    }
  };
}