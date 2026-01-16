/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/useInventario.js (CON OPCIÓN DE MARCAR LEÍDO)                 */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect, useMemo } from 'react';

// Subimos versión para asegurar estructura nueva
const STORAGE_KEY = 'likeStore_inventario_v4';

export function useInventario() {
  const [productos, setProductos] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [cupones, setCupones] = useState([]);
  
  // NUEVO: Lista de IDs de notificaciones que el usuario ya cerró
  const [ignoradas, setIgnoradas] = useState([]); 

  const getHoyString = () => new Date().toLocaleDateString('en-CA');

  const calcularDiasRestantes = (fechaCaducidad) => {
    if (!fechaCaducidad) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 
    const [y, m, d] = fechaCaducidad.split('-').map(Number);
    const vence = new Date(y, m - 1, d); 
    const diferenciaTiempo = vence - hoy;
    return Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const datos = localStorage.getItem(STORAGE_KEY);
    if (datos) {
      const { prods, kar, cups, ign } = JSON.parse(datos);
      setProductos(prods || []);
      setKardex(kar || []);
      setCupones(cups || []);
      setIgnoradas(ign || []); // Cargamos las ignoradas
    } else {
      // DATOS DE PRUEBA
      const hoy = new Date();
      const fechaFutura = new Date(hoy); fechaFutura.setDate(hoy.getDate() + 30);
      const fechaCercana = new Date(hoy); fechaCercana.setDate(hoy.getDate() + 5);

      const iniciales = [
        { 
          id: 'PROD-1', nombre: 'Termo Oficial', costo: 50, totalStock: 15,
          lotes: [{ id: 'L1', cantidad: 15, fechaIngreso: getHoyString(), caducidad: '' }]
        },
        { 
          id: 'PROD-2', nombre: 'Doritos', costo: 5, totalStock: 6,
          lotes: [
            { id: 'L2', cantidad: 1, fechaIngreso: getHoyString(), caducidad: fechaCercana.toISOString().split('T')[0] }, 
            { id: 'L3', cantidad: 5, fechaIngreso: getHoyString(), caducidad: fechaFutura.toISOString().split('T')[0] }  
          ]
        },
      ];
      setProductos(iniciales);
      guardar(iniciales, [], [], []);
    }
  }, []);

  const guardar = (p, k, c, i) => {
    // Guardamos también las ignoradas (i)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ prods: p, kar: k, cups: c, ign: i }));
  };

  // --- ACCIONES ---
  const agregarProducto = (datos) => {
    let nuevosProductos;
    const existe = productos.find(p => p.nombre.toLowerCase() === datos.nombre.toLowerCase());
    const nuevoLote = {
      id: `LOTE-${Date.now()}`, cantidad: Number(datos.stock),
      fechaIngreso: getHoyString(), caducidad: datos.caducidad || ''
    };

    if (existe) {
      nuevosProductos = productos.map(p => 
        p.id === existe.id 
          ? { ...p, lotes: [...p.lotes, nuevoLote], totalStock: p.totalStock + Number(datos.stock), costo: Number(datos.costo) } 
          : p
      );
    } else {
      nuevosProductos = [...productos, {
        id: `PROD-${Date.now()}`, nombre: datos.nombre, costo: Number(datos.costo),
        totalStock: Number(datos.stock), lotes: [nuevoLote]
      }];
    }
    const movimiento = { id: Date.now(), fecha: getHoyString(), tipo: 'ENTRADA', detalle: `Ingreso ${datos.stock}u`, producto: datos.nombre, costo: datos.costo || 0, usuario: 'Admin' };
    const nuevoKardex = [movimiento, ...kardex];
    setProductos(nuevosProductos); setKardex(nuevoKardex); guardar(nuevosProductos, nuevoKardex, cupones, ignoradas);
  };

  const registrarSalida = (carrito, colaborador, totalPuntos, cuponAplicado) => {
    let productosTemp = [...productos];
    carrito.forEach(item => {
      const index = productosTemp.findIndex(p => p.id === item.id);
      if (index === -1) return;
      let cantidadRestante = item.cantidad;
      let producto = { ...productosTemp[index] };
      
      producto.lotes.sort((a, b) => {
        if (!a.caducidad) return 1; 
        if (!b.caducidad) return -1;
        return new Date(a.caducidad) - new Date(b.caducidad);
      });

      const nuevosLotes = [];
      for (let lote of producto.lotes) {
        if (cantidadRestante > 0) {
          if (lote.cantidad > cantidadRestante) {
            nuevosLotes.push({ ...lote, cantidad: lote.cantidad - cantidadRestante });
            cantidadRestante = 0;
          } else {
            cantidadRestante -= lote.cantidad;
          }
        } else {
          nuevosLotes.push(lote);
        }
      }
      producto.lotes = nuevosLotes;
      producto.totalStock = producto.totalStock - item.cantidad;
      productosTemp[index] = producto;
    });

    const movimiento = { id: Date.now(), fecha: getHoyString(), tipo: 'SALIDA', detalle: `Canje ${carrito.length} items (${totalPuntos} pts)`, producto: 'Varios', costo: totalPuntos, usuario: colaborador.nombre };
    const nuevoKardex = [movimiento, ...kardex];
    setProductos(productosTemp); setKardex(nuevoKardex); guardar(productosTemp, nuevoKardex, cupones, ignoradas);
  };

  const darDeBajaLote = (idProducto, idLote) => {
    const producto = productos.find(p => p.id === idProducto);
    if (!producto) return;
    const lote = producto.lotes.find(l => l.id === idLote);
    if (!lote) return;

    const nuevosLotes = producto.lotes.filter(l => l.id !== idLote);
    const nuevoStock = Math.max(0, producto.totalStock - lote.cantidad);
    const productoActualizado = { ...producto, lotes: nuevosLotes, totalStock: nuevoStock };
    const nuevosProductos = productos.map(p => p.id === idProducto ? productoActualizado : p);

    const movimiento = { id: Date.now(), fecha: getHoyString(), tipo: 'BAJA', detalle: `Merma/Caducidad: ${producto.nombre} (${lote.cantidad}u)`, producto: producto.nombre, costo: 0, usuario: 'Admin' };
    const nuevoKardex = [movimiento, ...kardex];

    setProductos(nuevosProductos); setKardex(nuevoKardex); guardar(nuevosProductos, nuevoKardex, cupones, ignoradas);
  };

  // --- GESTIÓN DE NOTIFICACIONES ---
  
  // Función para ignorar una alerta específica
  const marcarNotificacionLeida = (idNotificacion) => {
    const nuevasIgnoradas = [...ignoradas, idNotificacion];
    setIgnoradas(nuevasIgnoradas);
    guardar(productos, kardex, cupones, nuevasIgnoradas);
  };

  const notificaciones = useMemo(() => {
    const alertas = [];
    productos.forEach(p => {
      // 1. Stock General (ID único: STOCK + ID_PRODUCTO)
      if (p.totalStock === 0) {
        alertas.push({ id: `STOCK-0-${p.id}`, tipo: 'danger', msj: `AGOTADO: ${p.nombre}` });
      } else if (p.totalStock <= 3) {
        alertas.push({ id: `STOCK-LOW-${p.id}`, tipo: 'warning', msj: `Stock bajo: ${p.nombre} (${p.totalStock}u)` });
      }
      
      // 2. Caducidad (ID único: CAD + ID_LOTE)
      p.lotes.forEach(lote => {
        if (lote.caducidad) {
          const dias = calcularDiasRestantes(lote.caducidad);
          const idBase = `CAD-${lote.id}`;
          
          if (dias < 0) alertas.push({ id: `${idBase}-VENCIDO`, tipo: 'danger', msj: `CADUCADO: ${p.nombre} (${lote.cantidad}u)` });
          else if (dias === 0) alertas.push({ id: `${idBase}-HOY`, tipo: 'danger', msj: `VENCE HOY: ${p.nombre}` });
          else if (dias <= 30) alertas.push({ id: `${idBase}-PRONTO`, tipo: 'warning', msj: `Vence pronto: ${p.nombre} (${dias}d)` });
        }
      });
    });

    // FILTRAMOS: Solo devolvemos las que NO están en la lista de ignoradas
    return alertas.filter(a => !ignoradas.includes(a.id));

  }, [productos, ignoradas]); // Recalcula si cambian productos o la lista negra

  const agregarCupon = (c) => { const n = [...cupones, { ...c, id: Date.now() }]; setCupones(n); guardar(productos, kardex, n, ignoradas); };
  const eliminarCupon = (id) => { const n = cupones.filter(c => c.id !== id); setCupones(n); guardar(productos, kardex, n, ignoradas); };
  const validarCupon = (c) => { if (!c.caducidad) return true; return new Date() <= new Date(c.caducidad + 'T23:59:59'); };

  return {
    productos, kardex, cupones, agregarProducto, registrarSalida, 
    agregarCupon, eliminarCupon, validarCupon, notificaciones, darDeBajaLote,
    marcarNotificacionLeida // <--- Exportamos la nueva función
  };
}