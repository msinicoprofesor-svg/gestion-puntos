/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ModalColaborador.tsx                               */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef, useEffect } from 'react'; // <--- IMPORTANTE: useEffect
import { MdClose, MdSave, MdCloudUpload, MdDelete } from "react-icons/md";

// Recibimos las propiedades: colaboradorAEditar e isViewOnly
export default function ModalColaborador({ isOpen, onClose, onSave, colaboradorAEditar, isViewOnly }) {
  // Si no está abierto, no pintamos nada
  if (!isOpen) return null;

  const fileInputRef = useRef(null);

  // Estado inicial vacío
  const [formData, setFormData] = useState({
    id: '', nombre: '', facebook: '', puesto: '', region: '', marca: '', 
    telefono: '', fechaIngreso: '', cumpleanos: '', foto: null
  });

  // -----------------------------------------------------------------------
  // EL CEREBRO DE LA EDICIÓN (useEffect)
  // Cada vez que se abre el modal (isOpen) o cambia el colaborador (colaboradorAEditar),
  // ejecutamos esto para rellenar el formulario.
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      if (colaboradorAEditar) {
        // Si hay alguien para editar, LLENAMOS los datos
        setFormData(colaboradorAEditar);
      } else {
        // Si no (es Nuevo), LIMPIAMOS el formulario
        setFormData({
            id: '', nombre: '', facebook: '', puesto: '', region: '', marca: '', 
            telefono: '', fechaIngreso: '', cumpleanos: '', foto: null
        });
      }
    }
  }, [isOpen, colaboradorAEditar]); // <--- Escuchamos cambios aquí

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar subida de imagen
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) return alert("Imagen muy pesada (Max 500KB)");
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, foto: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const quitarFoto = () => {
    setFormData(prev => ({ ...prev, foto: null }));
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id || !formData.nombre) return alert("Datos incompletos");
    onSave(formData);
    // Nota: El reseteo se hace arriba en el useEffect, no hace falta aquí.
  };

  // ESTILOS
  const baseClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition-all";
  
  // Lógica de colores: Gris si es solo lectura, Blanco si es editable
  const inputClass = `${baseClass} ${isViewOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500'}`;
  
  // Definición de la etiqueta (Lo que faltaba antes)
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ENCABEZADO */}
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-white text-xl font-bold">
            {/* Título dinámico */}
            {isViewOnly ? 'Detalles del Colaborador' : (colaboradorAEditar ? 'Editar Colaborador' : 'Nuevo Colaborador')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* FOTO */}
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center mb-2">
              <span className={labelClass}>Fotografía de Perfil</span>
              
              <div 
                // Solo permitimos clic si NO es modo lectura
                onClick={() => !isViewOnly && fileInputRef.current.click()}
                className={`relative w-32 h-32 rounded-full border-4 border-dashed flex items-center justify-center overflow-hidden transition-colors group 
                ${formData.foto ? 'border-red-500' : 'border-gray-300'}
                ${!isViewOnly ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
              >
                {formData.foto ? (
                    <img src={formData.foto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-2">
                        <MdCloudUpload className={`text-3xl mx-auto mb-1 ${isViewOnly ? 'text-gray-300' : 'text-gray-400 group-hover:text-red-500'}`} />
                        {!isViewOnly && <span className="text-[10px] text-gray-400 font-medium">Subir Foto</span>}
                    </div>
                )}
                
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>

              {/* Botón quitar foto solo si no es lectura y hay foto */}
              {formData.foto && !isViewOnly && (
                  <button type="button" onClick={quitarFoto} className="mt-2 text-xs text-red-500 font-medium flex items-center hover:underline">
                      <MdDelete className="mr-1" /> Quitar foto
                  </button>
              )}
            </div>

            {/* CAMPOS DE TEXTO (Todos llevan disabled={isViewOnly}) */}
            <div className="col-span-1 md:col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1 mb-2">
              Información Laboral
            </div>

            <div>
              <label className={labelClass}>ID Colaborador *</label>
              <input type="text" name="id" required value={formData.id} onChange={handleChange}
                className={inputClass} disabled={isViewOnly} placeholder="Ej: EMP-001" />
            </div>

            <div>
              <label className={labelClass}>Nombre Completo *</label>
              <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
                className={inputClass} disabled={isViewOnly} />
            </div>

            <div>
              <label className={labelClass}>Puesto</label>
              <input type="text" name="puesto" value={formData.puesto} onChange={handleChange}
                className={inputClass} disabled={isViewOnly} />
            </div>

             <div>
              <label className={labelClass}>Región / Dpto</label>
              <select name="region" value={formData.region} onChange={handleChange} className={inputClass} disabled={isViewOnly}>
                <option value="">Seleccionar...</option>
                <option value="Norte">Norte</option>
                <option value="Sur">Sur</option>
                <option value="Centro">Centro</option>
                <option value="Ventas">Ventas</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Fecha Ingreso</label>
              <input type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange}
                className={`${inputClass} [color-scheme:light]`} disabled={isViewOnly} />
            </div>

            <div>
              <label className={labelClass}>Marca</label>
              <input type="text" name="marca" value={formData.marca} onChange={handleChange} className={inputClass} disabled={isViewOnly} />
            </div>

            <div className="col-span-1 md:col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1 mb-2 mt-2">
              Contacto y Personal
            </div>

            <div>
              <label className={labelClass}>Teléfono</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className={inputClass} disabled={isViewOnly} />
            </div>

            <div>
              <label className={labelClass}>Cumpleaños</label>
              <input type="date" name="cumpleanos" value={formData.cumpleanos} onChange={handleChange}
                className={`${inputClass} [color-scheme:light]`} disabled={isViewOnly} />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Perfil Facebook</label>
              <input type="text" name="facebook" value={formData.facebook} onChange={handleChange}
                className={inputClass} disabled={isViewOnly} />
            </div>
          </div>

          {/* BOTONES ACCIÓN */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} 
              className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors">
              {isViewOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            
            {/* El botón Guardar solo aparece si NO es modo lectura */}
            {!isViewOnly && (
              <button type="submit" 
                className="px-6 py-2.5 bg-[#DA291C] text-white font-bold rounded-lg hover:bg-[#b02117] transition-all shadow-md hover:shadow-lg flex items-center">
                <MdSave className="mr-2 text-xl" /> Guardar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}