/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/page.tsx (PERSISTENCIA DE VISTA AGREGADA)                     */
/* -------------------------------------------------------------------------- */
'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; 
import { 
  MdDashboard, MdPeople, MdOutlineCloudUpload, MdInventory2, MdSettings, MdLogout,
  MdSearch, MdAdd, MdDeleteOutline, MdEdit, MdVisibility 
} from "react-icons/md";
import { FaStoreAlt, FaFileExcel } from "react-icons/fa";

// HOOKS
import { useColaboradores } from './useColaboradores';
import { useInventario } from './useInventario'; 

// COMPONENTES
import ModalColaborador from './components/ModalColaborador';
import ImportarInteracciones from './components/ImportarInteracciones';
import Inventario from './components/Inventario'; 

export default function Home() {
  const [vistaActual, setVistaActualState] = useState('colaboradores');

  // --- PERSISTENCIA DE VISTA ---
  useEffect(() => {
    // Al cargar la página, buscamos si hay una vista guardada
    const vistaGuardada = localStorage.getItem('likeStore_vista_actual');
    if (vistaGuardada) {
      setVistaActualState(vistaGuardada);
    }
  }, []);

  // Función wrapper para guardar la vista cada vez que cambia
  const setVistaActual = (vista) => {
    setVistaActualState(vista);
    localStorage.setItem('likeStore_vista_actual', vista);
  };

  // LÓGICA COLABORADORES
  const { 
    colaboradoresVisibles, 
    colaboradoresReales, 
    busqueda, 
    setBusqueda, 
    eliminarColaborador, 
    agregarColaborador,
    importarMasivo,
    actualizarColaborador, 
    registrarPuntosMasivos,
    eliminarImportacion,
    historial,
    paginacion 
  } = useColaboradores();

  // LÓGICA INVENTARIO
  const inventarioData = useInventario(); 

  const descontarPuntos = (idColaborador, puntos) => {
    const eventoRestar = {
        id: `CANJE-${Date.now()}`,
        fecha: new Date().toLocaleDateString(),
        marca: 'TIENDA',
        tipo: 'CANJE_PRODUCTOS',
        totalPuntos: -puntos, 
        detalles: [{ colaboradorId: idColaborador, puntosGanados: -puntos, nombre: 'Canje' }],
        cantidad: 1
    };
    registrarPuntosMasivos(eventoRestar);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradorEditar, setColaboradorEditar] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // LÓGICA EXCEL
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      const colaboradoresFormateados = data.map(row => ({
        id: row.ID || row.id || `IMP-${Math.floor(Math.random()*1000)}`,
        nombre: row.Nombre || row.nombre || 'Sin Nombre',
        puesto: row.Puesto || row.puesto || '',
        region: row.Region || row.region || '',
        marca: row.Marca || row.marca || '',
        telefono: row.Telefono || row.telefono || '',
        email: row.Email || row.email || '',
        facebook: row.Facebook || row.facebook || '',
        foto: null,
        fechaIngreso: row['Fecha Ingreso'] || row.fechaIngreso || new Date().toISOString().split('T')[0],
        cumpleanos: row.Cumpleanos || row.cumpleanos || ''
      }));
      importarMasivo(colaboradoresFormateados);
      alert(`¡Se importaron ${colaboradoresFormateados.length} colaboradores!`);
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6]">

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-[#111827] text-gray-400 z-50">
        <div className="p-6 pl-8 mb-4">
          <h1 className="text-white text-2xl font-bold flex items-center gap-3 font-sans">
            <FaStoreAlt className="text-red-500 text-xl" /> LikeStore
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1 ml-8">Panel de Control</p>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2 font-medium">
          <button onClick={() => setVistaActual('dashboard')} className={`w-full flex items-center px-6 py-3.5 rounded-xl transition-colors ${vistaActual === 'dashboard' ? 'bg-red-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <MdDashboard className="text-xl mr-4" /> Dashboard
          </button>
          <button onClick={() => setVistaActual('colaboradores')} className={`w-full flex items-center px-6 py-3.5 rounded-xl transition-colors ${vistaActual === 'colaboradores' ? 'bg-red-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <MdPeople className="text-xl mr-4" /> Colaboradores
          </button>
          <button onClick={() => setVistaActual('importar')} className={`w-full flex items-center px-6 py-3.5 rounded-xl transition-colors ${vistaActual === 'importar' ? 'bg-red-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <MdOutlineCloudUpload className="text-xl mr-4" /> Importar Puntos
          </button>
          <button onClick={() => setVistaActual('inventario')} className={`w-full flex items-center px-6 py-3.5 rounded-xl transition-colors ${vistaActual === 'inventario' ? 'bg-red-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <MdInventory2 className="text-xl mr-4" /> Inventario
          </button>
        </nav>

        <div className="px-4 py-6 border-t border-gray-800 space-y-2 font-medium">
          <a href="#" className="flex items-center px-6 py-3 hover:bg-gray-800 hover:text-white rounded-xl">
            <MdSettings className="text-xl mr-4 text-red-500/70" /> Ajustes
          </a>
          <a href="#" className="flex items-center px-6 py-3 hover:bg-red-900/20 text-red-400 rounded-xl">
            <MdLogout className="text-xl mr-4" /> Cerrar Sesión
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12">
         
         {/* VISTA: COLABORADORES */}
         {vistaActual === 'colaboradores' && (
           <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Colaboradores</h1>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none md:w-64">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                  <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
                <label className="p-2.5 bg-[#108741] text-white rounded-lg hover:bg-[#0c6b33] cursor-pointer relative">
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                  <FaFileExcel className="text-xl" />
                </label>
                <button onClick={() => { setColaboradorEditar(null); setIsViewOnly(false); setIsModalOpen(true); }}
                  className="flex items-center px-4 py-2.5 bg-[#DA291C] text-white font-medium rounded-lg hover:bg-[#b02117]">
                  <MdAdd className="text-xl mr-2" /> Nuevo
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 px-6 py-4 border-b border-gray-200 text-sm font-bold text-gray-600 uppercase">
                <div className="col-span-4">Nombre</div>
                <div className="col-span-5 text-center">Detalles</div>
                <div className="col-span-3 text-right">Acciones</div>
              </div>
              <div className="divide-y divide-gray-100">
                {colaboradoresVisibles.length > 0 ? (
                  colaboradoresVisibles.map((colaborador) => (
                    <div key={colaborador.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50">
                      <div className="col-span-4 pr-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-300">
                          {colaborador.foto ? <img src={colaborador.foto} alt="Avatar" className="w-full h-full object-cover" /> : 
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{colaborador.nombre?.charAt(0)}</div>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{colaborador.nombre}</p>
                          <p className="text-sm text-gray-500">{colaborador.puesto}</p>
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-bold">
                             {colaborador.puntos || 0} Pts
                          </span>
                        </div>
                      </div>
                      <div className="col-span-5 flex flex-col items-center justify-center text-sm text-gray-600">
                        <p><span className="font-medium">Región:</span> {colaborador.region}</p>
                        <p><span className="font-medium">Marca:</span> {colaborador.marca}</p>
                      </div>
                      <div className="col-span-3 flex justify-end gap-2">
                        <button onClick={() => { setColaboradorEditar(colaborador); setIsViewOnly(true); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><MdVisibility className="text-xl" /></button>
                        <button onClick={() => { setColaboradorEditar(colaborador); setIsViewOnly(false); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><MdEdit className="text-xl" /></button>
                        <button onClick={() => { if(window.confirm(`Eliminar a ${colaborador.nombre}?`)) eliminarColaborador(colaborador.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><MdDeleteOutline className="text-xl" /></button>
                      </div>
                    </div>
                  ))
                ) : <div className="px-6 py-8 text-center text-gray-500">Sin resultados.</div>}
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
                <button onClick={paginacion.irAPaginaAnterior} disabled={!paginacion.tieneAnterior} className="text-gray-600 disabled:opacity-50">Anterior</button>
                <span>Página {paginacion.paginaActual}</span>
                <button onClick={paginacion.irAPaginaSiguiente} disabled={!paginacion.tieneSiguiente} className="text-gray-600 disabled:opacity-50">Siguiente</button>
              </div>
            </div>
           </>
         )}

         {/* VISTA: DASHBOARD */}
         {vistaActual === 'dashboard' && (
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MdDashboard className="text-6xl mb-4 text-gray-300" />
              <h2 className="text-2xl font-bold">Panel de Control</h2>
              <p>Próximamente gráficos.</p>
           </div>
         )}

         {/* VISTA: IMPORTAR PUNTOS */}
         {vistaActual === 'importar' && (
           <ImportarInteracciones 
              colaboradores={colaboradoresReales} 
              historial={historial}
              onProcesar={registrarPuntosMasivos}
              onEliminarHistorial={eliminarImportacion}
           />
         )}

         {/* VISTA: INVENTARIO */}
         {vistaActual === 'inventario' && (
           <Inventario 
              colaboradores={colaboradoresReales}
              descontarPuntos={descontarPuntos}
              useInventarioData={inventarioData}
           />
         )}

         <ModalColaborador 
           isOpen={isModalOpen} 
           onClose={() => setIsModalOpen(false)}
           colaboradorAEditar={colaboradorEditar}
           isViewOnly={isViewOnly}
           onSave={(datos) => {
             colaboradorEditar ? actualizarColaborador(datos) : agregarColaborador(datos);
             setIsModalOpen(false);
           }}
         />
      </main>
    </div>
  );
}