/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ImportarInteracciones.tsx (VISUAL TEXTOS OSCUROS)  */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdHistory, MdCheckCircle, MdWarning, MdContentPaste, MdClose, MdDeleteForever, MdSearch, MdAddCircle } from "react-icons/md";
import { FaThumbsUp, FaCommentDots, FaGem } from "react-icons/fa";

const PUNTOS_POR_MARCA = {
  'RK': 5, 'WIFICEL': 5, 'FIBROX': 4, 'INTERCHEAP': 3, 'DMG': 2
};

type Colaborador = {
  id: string;
  nombre: string;
  facebook?: string;
  foto?: string;
};

type DetalleInteraccion = {
  colaboradorId: string;
  nombre: string;
  usuarioFb: string;
  interaccion: string;
  puntosGanados: number;
};

type HistorialItem = {
  id: string;
  fecha: string;
  marca: string;
  tipo: string;
  totalPuntos: number;
  cantidad: number;
  detalles: DetalleInteraccion[];
};

type ImportarInteraccionesProps = {
  colaboradores: Colaborador[];
  historial: HistorialItem[];
  onProcesar: (data: HistorialItem) => void;
  onEliminarHistorial: (id: string) => void;
};

export default function ImportarInteracciones({
  colaboradores,
  historial,
  onProcesar,
  onEliminarHistorial
}: ImportarInteraccionesProps) {
  const [activeTab, setActiveTab] = useState('reacciones'); 
  const [marca, setMarca] = useState('WIFICEL');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [textoInput, setTextoInput] = useState('');
  const [previewData, setPreviewData] = useState(null);

  // Puntos Extra
  const [busquedaExtra, setBusquedaExtra] = useState('');
  const [seleccionados, setSeleccionados] = useState([]); 
  const [motivo, setMotivo] = useState('Participación');
  const [otroMotivo, setOtroMotivo] = useState('');
  const [puntosGlobales, setPuntosGlobales] = useState(10); 

  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextoInput(text);
    } catch (err) {
      alert('Pega manualmente (Ctrl+V).');
    }
  };

  const procesarLineas = (texto, tipoAnalisis) => {
    const lineas = texto.split('\n');
    const resultados = { encontrados: [], noEncontrados: [] };
    const inicio = tipoAnalisis === 'comentarios' ? 1 : 0;

    for (let i = inicio; i < lineas.length; i++) {
      const linea = lineas[i];
      if (!linea.trim()) continue;
      let columnas = [];
      let lineaProcesada = linea.trim();

      if (lineaProcesada.includes('" "')) {
        lineaProcesada = lineaProcesada.replace(/^"|"$/g, ''); 
        columnas = lineaProcesada.split('" "');
      } else if (lineaProcesada.includes('\t')) {
        columnas = lineaProcesada.split('\t');
      } else {
        columnas = [lineaProcesada]; 
      }

      let nombreFacebook = '';
      let interaccion = '';

      if (tipoAnalisis === 'reacciones') {
        if (columnas.length >= 3) {
           nombreFacebook = columnas[2];
           interaccion = columnas.length > 4 ? columnas[4] : 'Reacción';
        }
      } else if (tipoAnalisis === 'comentarios') {
        if (columnas.length >= 4) {
           nombreFacebook = columnas[3];
           interaccion = columnas.length > 4 ? columnas[4] : 'Comentario';
        }
      }

      nombreFacebook = nombreFacebook ? nombreFacebook.replace(/^"|"$/g, '').trim() : '';
      interaccion = interaccion ? interaccion.replace(/^"|"$/g, '').trim() : '';

      if (nombreFacebook) {
        if (nombreFacebook.toUpperCase() === 'NOMBRE DEL PERFIL' || nombreFacebook === 'USER ID') continue;
        const match = colaboradores.find(c => 
          c.nombre.toLowerCase().trim() === nombreFacebook.toLowerCase() ||
          (c.facebook && c.facebook.toLowerCase().includes(nombreFacebook.toLowerCase()))
        );

        if (match) {
          resultados.encontrados.push({
            colaboradorId: match.id, nombre: match.nombre, usuarioFb: nombreFacebook,
            interaccion: interaccion, puntosGanados: PUNTOS_POR_MARCA[marca] || 0
          });
        } else {
          resultados.noEncontrados.push(nombreFacebook);
        }
      }
    }
    return resultados;
  };

  const analizarTexto = () => {
    if (!textoInput.trim()) return alert("El campo está vacío.");
    const resultados = procesarLineas(textoInput, activeTab);
    setPreviewData(resultados);
  };

  const confirmarCargaMasiva = () => {
    if (!previewData || previewData.encontrados.length === 0) return;
    onProcesar({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha, marca, tipo: activeTab,
      totalPuntos: previewData.encontrados.reduce((acc, curr) => acc + curr.puntosGanados, 0),
      detalles: previewData.encontrados,
      cantidad: previewData.encontrados.length
    });
    alert("¡Puntos asignados correctamente!");
    setPreviewData(null);
    setTextoInput('');
  };

  // Puntos Extra
  const agregarASeleccion = (colaborador) => {
    if (seleccionados.find(s => s.id === colaborador.id)) return; 
    setSeleccionados([...seleccionados, { ...colaborador, puntosAsignados: puntosGlobales }]);
    setBusquedaExtra(''); 
  };
  const quitarDeSeleccion = (id) => setSeleccionados(seleccionados.filter(s => s.id !== id));
  const cambiarPuntosIndividual = (id, nuevosPuntos) => setSeleccionados(seleccionados.map(s => s.id === id ? { ...s, puntosAsignados: Number(nuevosPuntos) } : s));
  const aplicarPuntosATodos = () => setSeleccionados(seleccionados.map(s => ({ ...s, puntosAsignados: puntosGlobales })));
  
  const guardarPuntosExtra = () => {
    if (seleccionados.length === 0) return alert("Selecciona al menos un colaborador.");
    const motivoFinal = motivo === 'Otro' ? otroMotivo : motivo;
    if (!motivoFinal.trim()) return alert("Debes especificar el motivo.");

    const detalles = seleccionados.map(s => ({
        colaboradorId: s.id, nombre: s.nombre, usuarioFb: 'N/A', 
        interaccion: motivoFinal, puntosGanados: s.puntosAsignados
    }));
    onProcesar({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha, marca, tipo: 'Puntos Extra',
      totalPuntos: seleccionados.reduce((acc, curr) => acc + curr.puntosAsignados, 0),
      detalles: detalles, cantidad: seleccionados.length
    });
    alert("¡Puntos Extra asignados!");
    setSeleccionados([]); setOtroMotivo(''); setMotivo('Participación');
  };

  const resultadosBusqueda = busquedaExtra.length > 2 
    ? colaboradores.filter(c => c.nombre.toLowerCase().includes(busquedaExtra.toLowerCase()) && !seleccionados.find(s => s.id === c.id)).slice(0, 5)
    : [];

  const handleDeleteItem = (e, id) => {
    e.stopPropagation();
    if (window.confirm("⚠️ ¿Eliminar y RESTAR los puntos?")) onEliminarHistorial(id);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Importar Interacciones</h2>
        <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium shadow-sm">
          <MdHistory className="text-xl" /> Historial
        </button>
      </div>

      <div className="bg-white rounded-t-xl border-b border-gray-200 flex p-1">
        <button onClick={() => setActiveTab('reacciones')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'reacciones' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><FaThumbsUp /> Reacciones</button>
        <button onClick={() => setActiveTab('comentarios')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'comentarios' ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><FaCommentDots /> Comentarios</button>
        <button onClick={() => setActiveTab('puntos_extra')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'puntos_extra' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><FaGem /> Puntos Extra</button>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
        {(activeTab === 'reacciones' || activeTab === 'comentarios') && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Marca</label>
                <select value={marca} onChange={(e) => setMarca(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900">
                  {Object.keys(PUNTOS_POR_MARCA).map(m => <option key={m} value={m}>{m} ({PUNTOS_POR_MARCA[m]} pts)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Fecha Publicación</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none text-gray-900 [color-scheme:light]" />
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">{activeTab === 'reacciones' ? 'Pegar Reacciones' : 'Pegar Comentarios'}</label>
              <textarea rows={8} value={textoInput} onChange={(e) => setTextoInput(e.target.value)} placeholder={activeTab === 'reacciones' ? '"123" "Foto" ...' : '"ID" "User ID" ...'} className="w-full p-4 border border-gray-300 rounded-lg outline-none font-mono text-xs text-gray-900 resize-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all" />
              <button onClick={handlePaste} className="absolute top-8 right-3 p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 shadow-sm"><MdContentPaste className="text-lg" /></button>
            </div>
            <button onClick={analizarTexto} className={`w-full py-4 font-bold rounded-xl shadow-md transition-all text-lg text-white ${activeTab === 'reacciones' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>Analizar {activeTab === 'reacciones' ? 'Reacciones' : 'Comentarios'}</button>
          </div>
        )}
        {activeTab === 'puntos_extra' && (
           <div className="space-y-8 animate-fade-in">
              <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                 <h3 className="text-emerald-800 font-bold text-lg mb-4 flex items-center gap-2"><MdAddCircle /> Paso 1: Seleccionar Colaboradores</h3>
                 <div className="flex gap-4 items-end mb-4">
                    <div className="flex-1 relative">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Buscar Colaborador</label>
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-3 text-gray-400 text-xl" />
                            <input type="text" value={busquedaExtra} onChange={(e) => setBusquedaExtra(e.target.value)} placeholder="Escribe un nombre..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" />
                        </div>
                        {resultadosBusqueda.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-lg mt-1 border border-gray-100 z-10 overflow-hidden">
                                {resultadosBusqueda.map(c => (
                                    <div key={c.id} onClick={() => agregarASeleccion(c)} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-300">
                                            {c.foto ? <img src={c.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{c.nombre.charAt(0)}</div>}
                                        </div>
                                        <span className="font-medium text-gray-900">{c.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Puntos x Defecto</label>
                        <input type="number" value={puntosGlobales} onChange={(e) => setPuntosGlobales(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-center font-bold text-gray-900" />
                    </div>
                    <button onClick={aplicarPuntosATodos} className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 text-sm whitespace-nowrap">Aplicar a todos</button>
                 </div>
                 {seleccionados.length > 0 ? (
                     <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                         <table className="w-full text-sm">
                             <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs"><tr><th className="px-4 py-2 text-left">Colaborador</th><th className="px-4 py-2 text-center w-32">Puntos</th><th className="px-4 py-2 text-right w-16"></th></tr></thead>
                             <tbody className="divide-y divide-gray-100">
                                 {seleccionados.map((s) => (
                                     <tr key={s.id} className="group hover:bg-gray-50">
                                         <td className="px-4 py-2 font-bold text-gray-900 flex items-center gap-3">
                                             <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                                 {s.foto ? <img src={s.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">{s.nombre.charAt(0)}</div>}
                                             </div>
                                             {s.nombre}
                                         </td>
                                         <td className="px-4 py-2 text-center">
                                             <input type="number" value={s.puntosAsignados} onChange={(e) => cambiarPuntosIndividual(s.id, e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:border-emerald-500 outline-none font-bold text-emerald-600 bg-white text-gray-900" />
                                         </td>
                                         <td className="px-4 py-2 text-right">
                                             <button onClick={() => quitarDeSeleccion(s.id)} className="text-gray-400 hover:text-red-500 p-1"><MdClose className="text-lg" /></button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 ) : <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">Busca y selecciona colaboradores arriba para empezar.</div>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Marca</label>
                    <select value={marca} onChange={(e) => setMarca(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900">
                        {Object.keys(PUNTOS_POR_MARCA).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none text-gray-900 [color-scheme:light]" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Motivo</label>
                    <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-white text-gray-900">
                        <option value="Participación">Participación</option>
                        <option value="Recomendación">Recomendación</option>
                        <option value="Compartido">Compartido</option>
                        <option value="Otro">Otro (Escribir manual)</option>
                    </select>
                  </div>
              </div>
              {motivo === 'Otro' && <div className="animate-fade-in"><label className="block text-sm font-bold text-gray-700 mb-2">Especifique</label><input type="text" value={otroMotivo} onChange={(e) => setOtroMotivo(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none text-gray-900" /></div>}
              <button onClick={guardarPuntosExtra} disabled={seleccionados.length === 0} className={`w-full py-3 font-bold rounded-lg shadow-md transition-all text-base text-white flex items-center justify-center gap-2 ${seleccionados.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'}`}><FaGem /> Confirmar y Asignar</button>
           </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {previewData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Confirmar {activeTab}</h3>
              <p className="text-sm text-gray-500">{marca} • {previewData.encontrados.length} encontrados</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {previewData.encontrados.length > 0 ? (
                <table className="w-full text-sm text-left mb-6">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs"><tr><th className="px-4 py-3">Colaborador</th><th className="px-4 py-3">Usuario FB</th><th className="px-4 py-3">Info</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{previewData.encontrados.map((item, idx) => (<tr key={idx}><td className="px-4 py-2 font-bold text-gray-900">{item.nombre}</td><td className="px-4 py-2 text-gray-700">{item.usuarioFb}</td><td className="px-4 py-2 text-xs text-gray-700 truncate max-w-[150px]">{item.interaccion}</td></tr>))}</tbody>
                </table>
              ) : <p className="text-center text-gray-400">Sin coincidencias.</p>}
              
              {/* ERRORES (NO ENCONTRADOS) */}
              {previewData.noEncontrados.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                    <MdWarning /> No encontrados ({previewData.noEncontrados.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {previewData.noEncontrados.slice(0, 10).map((n, i) => (
                      <span key={i} className="px-2 py-1 bg-white border border-orange-200 rounded text-xs text-orange-700 font-bold">{n}</span>
                    ))}
                    {previewData.noEncontrados.length > 10 && <span className="text-xs text-orange-600 pt-1">...y otros más.</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3"><button onClick={() => setPreviewData(null)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={confirmarCargaMasiva} disabled={previewData.encontrados.length === 0} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md disabled:opacity-50">Confirmar</button></div>
          </div>
        </div>
      )}

      {/* HISTORIAL MODAL (FILTRADO Y OSCURO) */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2"><MdHistory /> Historial</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white"><MdClose className="text-2xl" /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 custom-scrollbar">
              {/* FILTRO PARA OCULTAR CANJES DE LA TIENDA */}
              {historial && historial.filter(h => h.tipo !== 'CANJE_PRODUCTOS').length > 0 ? (
                historial.filter(h => h.tipo !== 'CANJE_PRODUCTOS').map((evento) => (
                  <div key={evento.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-emerald-300 transition-all group relative"
                    onClick={() => setSelectedHistoryItem(selectedHistoryItem?.id === evento.id ? null : evento)}>
                    <button onClick={(e) => handleDeleteItem(e, evento.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-600 p-1"><MdDeleteForever className="text-xl" /></button>
                    <div className="pr-8">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">{evento.fecha}</p>
                      <h4 className="font-bold text-gray-800 text-sm">{evento.marca} • <span className="capitalize">{evento.tipo.replace('_', ' ')}</span></h4>
                      <p className="text-xs text-gray-500 mt-1">{evento.cantidad} personas ({evento.totalPuntos} pts)</p>
                    </div>
                    {selectedHistoryItem?.id === evento.id && (
                      <div className="mt-4 pt-3 border-t border-gray-100 animate-fade-in">
                        <ul className="space-y-2">{evento.detalles.map((det, i) => (<li key={i} className="text-xs flex justify-between items-center text-gray-700 bg-gray-50 px-2 py-1.5 rounded"><span className="font-medium">{det.nombre}</span><span className="text-green-600 font-bold">+{det.puntosGanados} pts</span></li>))}</ul>
                      </div>
                    )}
                  </div>
                ))
              ) : <div className="text-center py-10 text-gray-400 text-sm">Sin historial de importaciones.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}