/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/Inventario.tsx (CON BOTÓN ELIMINAR NOTIFICACIÓN)   */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
  MdAdd, MdRemove, MdHistory, MdNotifications, MdLocalOffer, MdSearch, 
  MdShoppingCart, MdDelete, MdClose, MdExpandMore, MdExpandLess, MdAddCircle, MdWarning, MdDeleteForever, MdCheckCircle 
} from "react-icons/md";

export default function Inventario({ colaboradores, descontarPuntos, useInventarioData }) {
  const { 
    productos, kardex, cupones, agregarProducto, registrarSalida, 
    agregarCupon, eliminarCupon, validarCupon, notificaciones, darDeBajaLote,
    marcarNotificacionLeida // <--- Traemos la nueva función
  } = useInventarioData;

  const [modalOpen, setModalOpen] = useState(null); 
  const [nuevoProd, setNuevoProd] = useState({ nombre: '', stock: 1, costo: 0, caducidad: '' });
  const [productoExpandido, setProductoExpandido] = useState(null); 
  const [tabKardex, setTabKardex] = useState('SALIDAS'); 

  const [colabBusqueda, setColabBusqueda] = useState('');
  const [colabSeleccionado, setColabSeleccionado] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [cuponAplicado, setCuponAplicado] = useState(null);

  const agregarAlCarrito = (producto) => {
    if (producto.totalStock <= 0) return alert("Sin stock físico");
    if (colabSeleccionado.puntos < producto.costo) return alert("Puntos insuficientes");
    const enCarrito = carrito.find(c => c.id === producto.id);
    if (enCarrito) {
      if (enCarrito.cantidad >= producto.totalStock) return alert("No hay más stock disponible");
      if ((enCarrito.cantidad + 1) * producto.costo > colabSeleccionado.puntos) return alert("No alcanzan los puntos");
      setCarrito(carrito.map(c => c.id === producto.id ? { ...c, cantidad: c.cantidad + 1 } : c));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const quitarDelCarrito = (id) => setCarrito(carrito.filter(c => c.id !== id));

  const calcularTotal = () => {
    let total = carrito.reduce((acc, curr) => acc + (curr.costo * curr.cantidad), 0);
    if (cuponAplicado) {
      const descuento = (total * cuponAplicado.descuento) / 100;
      total = total - descuento;
    }
    return Math.ceil(total);
  };

  const finalizarCompra = () => {
    const total = calcularTotal();
    if (colabSeleccionado.puntos < total) return alert("Puntos insuficientes");
    descontarPuntos(colabSeleccionado.id, total);
    registrarSalida(carrito, colabSeleccionado, total, cuponAplicado);
    alert("¡Canje exitoso!");
    setModalOpen(null); setCarrito([]); setColabSeleccionado(null); setCuponAplicado(null);
  };

  const abrirModalAgregar = (productoExistente = null) => {
    if (productoExistente) {
      setNuevoProd({ nombre: productoExistente.nombre, stock: 1, costo: productoExistente.costo, caducidad: '' });
    } else {
      setNuevoProd({ nombre: '', stock: 1, costo: 0, caducidad: '' });
    }
    setModalOpen('entrada');
  };

  return (
    <div className="flex flex-col h-full relative font-sans text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <div className="flex gap-3">
          <button onClick={() => setModalOpen('notif')} className="relative w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-blue-600">
            <MdNotifications className="text-xl" />
            {notificaciones.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{notificaciones.length}</span>}
          </button>
          <button onClick={() => setModalOpen('cupones')} className="relative w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-purple-600">
            <MdLocalOffer className="text-xl" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setModalOpen('kardex')} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm"><MdHistory className="text-xl" /> Kárdex</button>
        <button onClick={() => abrirModalAgregar()} className="px-6 py-2.5 bg-[#DA291C] text-white rounded-lg font-bold hover:bg-[#b02117] flex items-center gap-2 shadow-md"><MdAdd className="text-xl" /> Nuevo</button>
        <button onClick={() => setModalOpen('salida')} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold hover:bg-black flex items-center gap-2 shadow-md"><MdRemove className="text-xl" /> Salida</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="grid grid-cols-12 bg-gray-100 px-6 py-3 border-b border-gray-200 text-xs font-extrabold text-gray-600 uppercase tracking-wider">
          <div className="col-span-5">Producto</div><div className="col-span-2 text-center">Stock Total</div><div className="col-span-2 text-center">Costo</div><div className="col-span-3 text-right">Acciones</div>
        </div>
        <div className="divide-y divide-gray-100 overflow-y-auto custom-scrollbar flex-1">
          {productos.map((prod) => (
            <div key={prod.id} className="group">
              <div className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setProductoExpandido(productoExpandido === prod.id ? null : prod.id)}>
                <div className="col-span-5 flex items-center gap-2">
                   {prod.lotes.length > 1 ? (productoExpandido === prod.id ? <MdExpandLess className="text-gray-400" /> : <MdExpandMore className="text-gray-400" />) : <span className="w-4"></span>}
                   <span className="font-bold text-gray-900 text-sm">{prod.nombre}</span>
                </div>
                <div className={`col-span-2 text-center font-bold text-sm ${prod.totalStock <= 3 ? 'text-red-600' : 'text-green-700'}`}>{prod.totalStock}</div>
                <div className="col-span-2 text-center text-gray-900 font-medium text-sm">{prod.costo} pts</div>
                <div className="col-span-3 text-right flex justify-end gap-2">
                   <button onClick={(e) => { e.stopPropagation(); abrirModalAgregar(prod); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip" title="Agregar Stock"><MdAddCircle className="text-2xl" /></button>
                </div>
              </div>
              {productoExpandido === prod.id && (
                <div className="bg-gray-50 px-6 py-3 border-y border-gray-100 animate-fade-in">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 pl-6">Desglose por lotes</p>
                  {prod.lotes.map((lote) => (
                    <div key={lote.id} className="grid grid-cols-12 text-xs text-gray-600 pl-6 py-1 items-center">
                       <div className="col-span-5">Ingreso: {lote.fechaIngreso}</div>
                       <div className="col-span-2 text-center">{lote.cantidad} uds</div>
                       <div className="col-span-4 text-right">
                         Caduca: <span className={`${lote.caducidad ? 'font-medium' : ''} ${new Date(lote.caducidad) < new Date() ? 'text-red-600 font-bold' : ''}`}>{lote.caducidad || 'N/A'}</span>
                       </div>
                       <div className="col-span-1 text-right">
                         <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`⚠️ ¿Dar de baja este lote de ${lote.cantidad} unidades?\nSe registrará como MERMA/CADUCIDAD.`)) darDeBajaLote(prod.id, lote.id); }} className="text-gray-300 hover:text-red-600 transition-colors" title="Dar de baja (Merma/Caducidad)"><MdDeleteForever className="text-lg" /></button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {modalOpen === 'entrada' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6 border-b pb-2">Agregar Producto / Stock</h2>
            <div className="space-y-5">
              <div><label className="text-sm font-bold text-gray-700">Nombre</label><input type="text" list="listaProductos" placeholder="Escribe o selecciona..." value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-red-500 text-gray-900" /><datalist id="listaProductos">{productos.map(p => <option key={p.id} value={p.nombre} />)}</datalist></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="text-sm font-bold text-gray-700">Cantidad</label><input type="number" min="1" value={nuevoProd.stock} onChange={e => setNuevoProd({...nuevoProd, stock: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 font-bold" /></div>
                <div className="flex-1"><label className="text-sm font-bold text-gray-700">Costo (Pts)</label><input type="number" min="0" value={nuevoProd.costo} onChange={e => setNuevoProd({...nuevoProd, costo: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 font-bold" /></div>
              </div>
              <div><label className="text-sm font-bold text-gray-700">Caducidad (Opcional)</label><input type="date" value={nuevoProd.caducidad} onChange={e => setNuevoProd({...nuevoProd, caducidad: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg mt-1 outline-none text-gray-900" /></div>
            </div>
            <div className="mt-8 flex justify-end gap-3"><button onClick={() => setModalOpen(null)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={() => { agregarProducto(nuevoProd); setModalOpen(null); }} className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700">Guardar</button></div>
          </div>
        </div>
      )}

      {modalOpen === 'salida' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex overflow-hidden shadow-2xl">
            <div className="flex-1 bg-gray-50 p-6 flex flex-col border-r border-gray-200">
              {!colabSeleccionado ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">¿Quién canjea los puntos?</h3>
                    <div className="relative w-full max-w-md"><MdSearch className="absolute left-4 top-3.5 text-gray-400 text-xl" /><input type="text" placeholder="Buscar colaborador..." value={colabBusqueda} onChange={(e) => setColabBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-lg shadow-sm" />{colabBusqueda.length > 2 && (<div className="absolute top-full w-full bg-white shadow-xl mt-2 rounded-xl overflow-hidden border border-gray-100 z-10">{colaboradores.filter(c => c.nombre.toLowerCase().includes(colabBusqueda.toLowerCase())).map(c => (<div key={c.id} onClick={() => { setColabSeleccionado(c); setColabBusqueda(''); }} className="p-4 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"><div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">{c.foto ? <img src={c.foto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{c.nombre.charAt(0)}</div>}</div><div><p className="font-bold text-gray-900">{c.nombre}</p><p className="text-sm text-green-600 font-bold">{c.puntos} pts disponibles</p></div></div>))}</div>)}</div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-green-500">{colabSeleccionado.foto ? <img src={colabSeleccionado.foto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-xl">{colabSeleccionado.nombre.charAt(0)}</div>}</div><div><h3 className="font-extrabold text-gray-900 text-lg">{colabSeleccionado.nombre}</h3><p className="text-green-600 font-bold">{colabSeleccionado.puntos} Puntos disponibles</p></div></div><button onClick={() => { setColabSeleccionado(null); setCarrito([]); }} className="px-3 py-1 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg">Cambiar</button></div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar"><h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Productos Disponibles</h4><div className="grid grid-cols-1 gap-3">{productos.filter(p => p.totalStock > 0).map(prod => {const alcanza = colabSeleccionado.puntos >= prod.costo;return (<div key={prod.id} className={`flex justify-between items-center p-4 bg-white rounded-xl border transition-all ${alcanza ? 'hover:shadow-md border-gray-200' : 'opacity-60 border-gray-100 grayscale'}`}><div><p className={`font-bold text-base ${alcanza ? 'text-gray-900' : 'text-gray-500'}`}>{prod.nombre}</p><p className="text-xs text-gray-500 font-medium">{prod.totalStock} disponibles</p></div>{alcanza ? (<button onClick={() => agregarAlCarrito(prod)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-800 flex items-center gap-1">{prod.costo} pts <MdAddCircle className="text-lg text-blue-600"/></button>) : (<span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">Insuficiente</span>)}</div>);})}</div></div>
                </>
              )}
            </div>
            <div className="w-96 bg-white p-6 flex flex-col border-l border-gray-200 shadow-xl z-10">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2"><MdShoppingCart /> Carrito</h3>
                <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">{carrito.length === 0 ? <p className="text-gray-400 text-sm text-center mt-20 italic">Agrega productos...</p> : (<ul className="space-y-4">{carrito.map(item => (<li key={item.id} className="flex justify-between items-start text-sm border-b border-gray-100 pb-3"><div><p className="font-bold text-gray-900">{item.nombre}</p><p className="text-xs text-gray-500 font-medium">{item.cantidad} x {item.costo} pts</p></div><div className="flex items-center gap-3"><span className="font-bold text-gray-800 text-lg">{item.cantidad * item.costo}</span><button onClick={() => quitarDelCarrito(item.id)} className="text-gray-300 hover:text-red-500"><MdDelete className="text-lg" /></button></div></li>))}</ul>)}</div>
                <div className="mb-4"><label className="text-xs font-bold text-gray-500 uppercase">Cupón</label><select onChange={(e) => {const cupon = cupones.find(c => c.id === Number(e.target.value)); setCuponAplicado(cupon || null);}} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 outline-none" disabled={carrito.length === 0}><option value="">Sin cupón</option>{cupones.filter(c => validarCupon(c)).map(c => (<option key={c.id} value={c.id}>{c.nombre} (-{c.descuento}%)</option>))}</select></div>
                <div className="border-t border-gray-200 pt-4 space-y-2">{cuponAplicado && (<div className="flex justify-between text-green-600 text-sm font-bold"><span>Desc. {cuponAplicado.nombre}</span><span>- {Math.round(carrito.reduce((acc, c) => acc + c.costo * c.cantidad, 0) * (cuponAplicado.descuento/100))} pts</span></div>)}<div className="flex justify-between text-2xl font-extrabold text-gray-900"><span>Total</span><span>{calcularTotal()} pts</span></div></div>
                <button onClick={finalizarCompra} disabled={!colabSeleccionado || carrito.length === 0} className="w-full mt-6 py-4 bg-[#DA291C] text-white font-bold rounded-xl hover:bg-[#b02117] disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg">Confirmar Canje</button><button onClick={() => setModalOpen(null)} className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-800 font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen === 'kardex' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-900">Historial de Movimientos</h2><button onClick={() => setModalOpen(null)} className="text-gray-400 hover:text-gray-800"><MdClose className="text-2xl"/></button></div>
            <div className="flex mb-4 border-b border-gray-200"><button onClick={() => setTabKardex('SALIDAS')} className={`px-6 py-3 font-bold text-sm ${tabKardex === 'SALIDAS' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-800'}`}>SALIDAS (Canjes)</button><button onClick={() => setTabKardex('ENTRADAS')} className={`px-6 py-3 font-bold text-sm ${tabKardex === 'ENTRADAS' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-800'}`}>ENTRADAS (Stock)</button><button onClick={() => setTabKardex('BAJA')} className={`px-6 py-3 font-bold text-sm ${tabKardex === 'BAJA' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-800'}`}>MERMAS (Bajas)</button></div>
            <div className="overflow-y-auto flex-1 custom-scrollbar"><table className="w-full text-sm text-left"><thead className="bg-gray-50 font-extrabold text-gray-600 uppercase text-xs"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">{tabKardex === 'SALIDAS' ? 'Colaborador' : 'Usuario'}</th><th className="px-4 py-3">Detalle</th><th className="px-4 py-3 text-right">Valor</th></tr></thead><tbody className="divide-y divide-gray-100">{kardex.filter(k => { if(tabKardex === 'BAJA') return k.tipo === 'BAJA'; return tabKardex === 'SALIDAS' ? k.tipo === 'SALIDA' : k.tipo === 'ENTRADA'; }).map((k, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-500 font-medium">{k.fecha}</td><td className="px-4 py-3 font-bold text-gray-900">{k.usuario}</td><td className="px-4 py-3 text-gray-700">{k.detalle}</td><td className={`px-4 py-3 text-right font-bold ${k.tipo === 'SALIDA' ? 'text-red-600' : (k.tipo === 'BAJA' ? 'text-orange-500' : 'text-green-600')}`}>{k.costo > 0 ? `${k.costo} pts` : '-'}</td></tr>))}</tbody></table>{kardex.filter(k => { if(tabKardex === 'BAJA') return k.tipo === 'BAJA'; return tabKardex === 'SALIDAS' ? k.tipo === 'SALIDA' : k.tipo === 'ENTRADA'; }).length === 0 && (<p className="text-center py-10 text-gray-400">No hay movimientos registrados.</p>)}</div>
          </div>
        </div>
      )}

       {modalOpen === 'cupones' && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900"><MdLocalOffer /> Gestionar Cupones</h2>
             <form onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.target); agregarCupon({ nombre: data.get('nombre'), descuento: data.get('descuento'), caducidad: data.get('caducidad') }); e.target.reset(); }} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200"><input name="nombre" placeholder="Nombre (Ej: PROMO10)" required className="w-full p-2.5 border rounded-lg mb-3 text-sm font-bold text-gray-900 uppercase" /><div className="flex gap-2 mb-3"><input name="descuento" type="number" placeholder="%" required className="w-24 p-2.5 border rounded-lg text-sm font-bold" /><input name="caducidad" type="date" required className="flex-1 p-2.5 border rounded-lg text-sm text-gray-900" /></div><button type="submit" className="w-full bg-purple-600 text-white rounded-lg py-2.5 font-bold text-sm hover:bg-purple-700">Crear Cupón</button></form>
             <ul className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">{cupones.map(c => { const activo = validarCupon(c); return (<li key={c.id} className={`flex justify-between items-center border p-3 rounded-lg text-sm ${activo ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100 opacity-60'}`}><div><p className="font-extrabold text-purple-800 uppercase">{c.nombre}</p><p className="text-xs text-gray-500">{c.descuento}% OFF • Vence: {c.caducidad} {!activo && '(CADUCADO)'}</p></div><button onClick={() => eliminarCupon(c.id)} className="text-red-400 hover:text-red-600"><MdDelete className="text-lg"/></button></li>); })}</ul>
             <button onClick={() => setModalOpen(null)} className="w-full mt-6 text-gray-500 text-sm hover:text-gray-900 font-bold">Cerrar</button>
           </div>
         </div>
       )}

       {/* MODAL NOTIFICACIONES (ACTUALIZADO CON OPCIÓN DE IGNORAR) */}
       {modalOpen === 'notif' && (
         <div className="absolute top-16 right-4 bg-white shadow-2xl border border-gray-200 rounded-xl w-80 z-50 p-0 overflow-hidden animate-fade-in">
             <div className="bg-gray-900 text-white p-3 font-bold text-sm">Alertas de Inventario</div>
             <div className="max-h-80 overflow-y-auto p-2">
                {notificaciones.length === 0 ? <p className="text-xs text-gray-400 p-4 text-center">Todo en orden.</p> : (
                    <ul className="space-y-2">
                        {notificaciones.map((n, i) => (
                            <li key={i} className={`text-xs p-2 rounded-lg border-l-4 font-medium flex items-start justify-between gap-2 group
                                ${n.tipo === 'danger' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-orange-50 border-orange-400 text-orange-800'}`}>
                                <div className="flex gap-2">
                                    {n.tipo === 'danger' ? <MdWarning className="text-base shrink-0"/> : <MdNotifications className="text-base shrink-0"/>}
                                    <span>{n.msj}</span>
                                </div>
                                <button 
                                    onClick={() => marcarNotificacionLeida(n.id)} 
                                    className="text-gray-400 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" 
                                    title="Marcar como leída / Ignorar"
                                >
                                    <MdCheckCircle className="text-lg" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
             </div>
             <button onClick={() => setModalOpen(null)} className="w-full py-2 text-center text-xs text-gray-500 hover:bg-gray-50 font-bold border-t">Cerrar</button>
         </div>
       )}
    </div>
  );
}