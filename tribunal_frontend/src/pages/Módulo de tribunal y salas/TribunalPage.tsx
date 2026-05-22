import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import {
  GET_TRIBUNALES,
  CREATE_TRIBUNAL, UPDATE_TRIBUNAL, DELETE_TRIBUNAL,
  CREATE_SALA_TRIBUNAL, UPDATE_SALA_TRIBUNAL, DELETE_SALA_TRIBUNAL,
  CREATE_SALA_AUDIENCIA, UPDATE_SALA_AUDIENCIA, DELETE_SALA_AUDIENCIA,
} from "../../graphql/graphql/tribunal";

// ── Tipos ──────────────────────────────────────────────────
interface SalaTribunal {
  idSala: number;
  nombreSala: string;
  activa: boolean;
}

interface SalaAudiencia {
  idSalaAud: number;
  nombreSala: string;
  capacidad: number;
  equipadaVideoconf: boolean;
  enlaceVirtual: string | null;
  activa: boolean;
}

interface Tribunal {
  idTribunal: number;
  nombreTribunal: string;
  instancia: string;
  normaCreacion: string;
  salasTribunal: SalaTribunal[];
  salasAudiencia: SalaAudiencia[];
}

const emptyTribunal = { nombre: "", instancia: "", norma: "" };
const emptySalaT = { nombre: "", activa: true };
const emptySalaA = { nombre: "", capacidad: "", videoconf: false, enlace: "", activa: true };

type ModalMode = "crear" | "editar";

export default function TribunalPage() {
  const [tribunalSel, setTribunalSel] = useState<Tribunal | null>(null);
  const [tab, setTab] = useState<"salas" | "audiencias">("salas");

  const [modalT, setModalT] = useState(false);
  const [modeT, setModeT] = useState<ModalMode>("crear");
  const [formT, setFormT] = useState(emptyTribunal);
  const [editIdT, setEditIdT] = useState<number | null>(null);

  const [modalST, setModalST] = useState(false);
  const [modeST, setModeST] = useState<ModalMode>("crear");
  const [formST, setFormST] = useState(emptySalaT);
  const [editIdST, setEditIdST] = useState<number | null>(null);

  const [modalSA, setModalSA] = useState(false);
  const [modeSA, setModeSA] = useState<ModalMode>("crear");
  const [formSA, setFormSA] = useState(emptySalaA);
  const [editIdSA, setEditIdSA] = useState<number | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    mensaje: string;
    onConfirm: () => void;
  }>({ show: false, mensaje: "", onConfirm: () => { } });

  const { data, loading, error, refetch } = useQuery(GET_TRIBUNALES, {
    fetchPolicy: "network-only", // Evitar problemas de caché
  });

  const [crearTribunal] = useMutation(CREATE_TRIBUNAL);
  const [actualizarTribunal] = useMutation(UPDATE_TRIBUNAL);
  const [eliminarTribunal] = useMutation(DELETE_TRIBUNAL);
  const [crearSalaT] = useMutation(CREATE_SALA_TRIBUNAL);
  const [actualizarSalaT] = useMutation(UPDATE_SALA_TRIBUNAL);
  const [eliminarSalaT] = useMutation(DELETE_SALA_TRIBUNAL);
  const [crearSalaA] = useMutation(CREATE_SALA_AUDIENCIA);
  const [actualizarSalaA] = useMutation(UPDATE_SALA_AUDIENCIA);
  const [eliminarSalaA] = useMutation(DELETE_SALA_AUDIENCIA);

  // ── Helpers ────────────────────────────────────────────────
  const confirmar = (mensaje: string, onConfirm: () => void) =>
    setConfirmModal({ show: true, mensaje, onConfirm });

  const cerrarConfirm = () =>
    setConfirmModal({ show: false, mensaje: "", onConfirm: () => { } });

  const refetchYSincronizar = async () => {
    try {
      const res = await refetch();
      if (tribunalSel && res.data?.allTribunales) {
        const actualizado = res.data.allTribunales.find(
          (t: Tribunal) => t.idTribunal === tribunalSel.idTribunal
        );
        if (actualizado) setTribunalSel(actualizado);
      }
    } catch (error) {
      console.error("Error al refetch:", error);
    }
  };

  // ── TRIBUNAL ───────────────────────────────────────────────
  const abrirCrearTribunal = () => {
    setFormT(emptyTribunal);
    setModeT("crear");
    setEditIdT(null);
    setModalT(true);
  };

  const abrirEditarTribunal = (t: Tribunal) => {
    setFormT({ 
      nombre: t.nombreTribunal, 
      instancia: t.instancia, 
      norma: t.normaCreacion 
    });
    setModeT("editar");
    setEditIdT(t.idTribunal);
    setModalT(true);
  };

  const handleSubmitTribunal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formT.nombre.trim() || !formT.instancia.trim() || !formT.norma.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    try {
      if (modeT === "crear") {
        const result = await crearTribunal({
          variables: {
            nombre_tribunal: formT.nombre,
            instancia: formT.instancia,
            norma_creacion: formT.norma,
          },
        });
        
        if (result.data?.crearTribunal?.tribunal) {
          toast.success("Tribunal creado exitosamente");
          setModalT(false);
          await refetchYSincronizar();
        } else {
          toast.error("No se pudo crear el tribunal");
        }
      } else {
        const result = await actualizarTribunal({
          variables: {
            id: editIdT,
            nombre_tribunal: formT.nombre,
            instancia: formT.instancia,
            norma_creacion: formT.norma,
          },
        });
        
        if (result.data?.actualizarTribunal?.tribunal) {
          toast.success("Tribunal actualizado exitosamente");
          setModalT(false);
          await refetchYSincronizar();
        } else {
          toast.error("No se pudo actualizar el tribunal");
        }
      }
    } catch (err: any) {
      console.error("Error en tribunal:", err);
      toast.error(err?.message || "Error al guardar el tribunal");
    }
  };

  const handleEliminarTribunal = (t: Tribunal) => {
    confirmar(
      `¿Eliminar el tribunal "${t.nombreTribunal}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          const result = await eliminarTribunal({ 
            variables: { id: t.idTribunal } 
          });
          
          if (result.data?.eliminarTribunal?.ok) {
            toast.success("Tribunal eliminado exitosamente");
            if (tribunalSel?.idTribunal === t.idTribunal) {
              setTribunalSel(null);
            }
            await refetch();
          } else {
            toast.error(result.data?.eliminarTribunal?.mensaje || "Error al eliminar el tribunal");
          }
        } catch (err: any) {
          console.error("Error al eliminar:", err);
          toast.error(err?.message || "Error al eliminar el tribunal");
        }
        cerrarConfirm();
      }
    );
  };

  // ── SALA TRIBUNAL ──────────────────────────────────────────
  const abrirCrearSalaT = () => {
    if (!tribunalSel) {
      toast.error("Primero selecciona un tribunal");
      return;
    }
    setFormST(emptySalaT);
    setModeST("crear");
    setEditIdST(null);
    setModalST(true);
  };

  const abrirEditarSalaT = (s: SalaTribunal) => {
    setFormST({ nombre: s.nombreSala, activa: s.activa });
    setModeST("editar");
    setEditIdST(s.idSala);
    setModalST(true);
  };

  const handleSubmitSalaT = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tribunalSel) {
      toast.error("Debes seleccionar un tribunal primero");
      return;
    }
    
    if (!formST.nombre.trim()) {
      toast.error("El nombre de la sala es obligatorio");
      return;
    }
    
    try {
      if (modeST === "crear") {
        const result = await crearSalaT({
          variables: {
            id_tribunal: tribunalSel.idTribunal,
            nombre_sala: formST.nombre,
            activa: true, // Por defecto activa al crear
          },
        });
        
        if (result.data?.crearSalaTribunal?.sala) {
          toast.success("Sala de tribunal creada exitosamente");
          setModalST(false);
          await refetchYSincronizar();
        } else {
          toast.error("No se pudo crear la sala");
        }
      } else {
        const result = await actualizarSalaT({
          variables: {
            id: editIdST,
            nombre_sala: formST.nombre,
            activa: formST.activa,
          },
        });
        
        if (result.data?.actualizarSalaTribunal?.sala) {
          toast.success("Sala actualizada exitosamente");
          setModalST(false);
          await refetchYSincronizar();
        } else {
          toast.error("No se pudo actualizar la sala");
        }
      }
    } catch (err: any) {
      console.error("Error en sala tribunal:", err);
      toast.error(err?.message || "Error al guardar la sala");
    }
  };

  const handleEliminarSalaT = (s: SalaTribunal) => {
    confirmar(`¿Eliminar la sala "${s.nombreSala}"?`, async () => {
      try {
        const result = await eliminarSalaT({ 
          variables: { id: s.idSala } 
        });
        
        if (result.data?.eliminarSalaTribunal?.ok) {
          toast.success("Sala eliminada exitosamente");
          await refetchYSincronizar();
        } else {
          toast.error(result.data?.eliminarSalaTribunal?.mensaje || "Error al eliminar la sala");
        }
      } catch (err: any) {
        console.error("Error al eliminar:", err);
        toast.error(err?.message || "Error al eliminar la sala");
      }
      cerrarConfirm();
    });
  };

  // ── SALA AUDIENCIA ─────────────────────────────────────────
  const abrirCrearSalaA = () => {
    if (!tribunalSel) {
      toast.error("Primero selecciona un tribunal");
      return;
    }
    setFormSA(emptySalaA);
    setModeSA("crear");
    setEditIdSA(null);
    setModalSA(true);
  };

  const abrirEditarSalaA = (s: SalaAudiencia) => {
    setFormSA({
      nombre: s.nombreSala,
      capacidad: String(s.capacidad),
      videoconf: s.equipadaVideoconf,
      enlace: s.enlaceVirtual ?? "",
      activa: s.activa,
    });
    setModeSA("editar");
    setEditIdSA(s.idSalaAud);
    setModalSA(true);
  };

  const handleSubmitSalaA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tribunalSel) {
      toast.error("Debes seleccionar un tribunal primero");
      return;
    }
    
    if (!formSA.nombre.trim()) {
      toast.error("El nombre de la sala es obligatorio");
      return;
    }
    
    const capacidadNum = parseInt(formSA.capacidad);
    if (isNaN(capacidadNum) || capacidadNum < 1) {
      toast.error("La capacidad debe ser un número válido mayor a 0");
      return;
    }
    
    try {
      if (modeSA === "crear") {
        const result = await crearSalaA({
          variables: {
            id_tribunal: tribunalSel.idTribunal,
            nombre_sala: formSA.nombre,
            capacidad: capacidadNum,
            equipada_videoconf: formSA.videoconf,
            enlace_virtual: formSA.enlace || null,
            activa: true, // Por defecto activa al crear
          },
        });
        
        if (result.data?.crearSalaAudiencia?.sala) {
          toast.success("Sala de audiencia creada exitosamente");
          setModalSA(false);
          await refetchYSincronizar();
        } else {
          toast.error("No se pudo crear la sala de audiencia");
        }
      } else {
        const result = await actualizarSalaA({
          variables: {
            id: editIdSA,
            input: {
              nombreSala: formSA.nombre,
              capacidad: capacidadNum,
              equipadaVideoconf: formSA.videoconf,
              enlaceVirtual: formSA.enlace || null,
              activa: formSA.activa,
            },
          },
        });
        
        if (result.data?.actualizarSalaAudiencia?.sala) {
          toast.success("Sala de audiencia actualizada exitosamente");
          setModalSA(false);
          await refetchYSincronizar();
        } else {
          toast.error("No se pudo actualizar la sala de audiencia");
        }
      }
    } catch (err: any) {
      console.error("Error en sala audiencia:", err);
      toast.error(err?.message || "Error al guardar la sala de audiencia");
    }
  };

  const handleEliminarSalaA = (s: SalaAudiencia) => {
    confirmar(`¿Eliminar la sala "${s.nombreSala}"?`, async () => {
      try {
        const result = await eliminarSalaA({ 
          variables: { id: s.idSalaAud } 
        });
        
        if (result.data?.eliminarSalaAudiencia?.ok) {
          toast.success("Sala eliminada exitosamente");
          await refetchYSincronizar();
        } else {
          toast.error(result.data?.eliminarSalaAudiencia?.mensaje || "Error al eliminar la sala");
        }
      } catch (err: any) {
        console.error("Error al eliminar:", err);
        toast.error(err?.message || "Error al eliminar la sala");
      }
      cerrarConfirm();
    });
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) return <p className="p-6 text-gray-500">Cargando...</p>;
  if (error) {
    console.error("Error de GraphQL:", error);
    return <p className="p-6 text-red-500">Error al cargar datos: {error.message}</p>;
  }

  const tribunales: Tribunal[] = data?.allTribunales ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Tribunal y salas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tribunales, salas jurídicas y salas de audiencia</p>
        </div>
        <button 
          onClick={abrirCrearTribunal} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          + Nuevo tribunal
        </button>
      </div>

      {/* Layout */}
      <div className="flex gap-6">
        {/* Lista de tribunales */}
        <div className="w-72 shrink-0 space-y-2">
          {tribunales.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Sin tribunales registrados</p>
          )}
          {tribunales.map((t) => (
            <div
              key={t.idTribunal}
              onClick={() => { setTribunalSel(t); setTab("salas"); }}
              className={`w-full text-left px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                tribunalSel?.idTribunal === t.idTribunal
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
              }`}
            >
              <p className={`font-medium text-sm ${tribunalSel?.idTribunal === t.idTribunal ? "text-blue-700" : "text-gray-800"}`}>
                {t.nombreTribunal}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{t.instancia}</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>{t.salasTribunal.length} salas jurídicas</span>
                <span>{t.salasAudiencia.length} salas de audiencia</span>
              </div>
              <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => abrirEditarTribunal(t)} 
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleEliminarTribunal(t)} 
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Panel de detalle */}
        {tribunalSel ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">{tribunalSel.nombreTribunal}</h2>
              <p className="text-sm text-gray-500">{tribunalSel.instancia}</p>
              <p className="text-xs text-gray-400 mt-1">Norma de creación: {tribunalSel.normaCreacion}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
              {(["salas", "audiencias"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {t === "salas" ? "Salas de tribunal" : "Salas de audiencia"}
                </button>
              ))}
            </div>

            {/* Tab: Salas de tribunal */}
            {tab === "salas" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500">Salas jurídicas donde se asignan expedientes</p>
                  <button 
                    onClick={abrirCrearSalaT} 
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    + Agregar sala
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tribunalSel.salasTribunal.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Sin salas registradas</p>
                  )}
                  {tribunalSel.salasTribunal.map((s) => (
                    <div key={s.idSala} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${s.activa ? "bg-green-400" : "bg-gray-300"}`} />
                        <span className="text-sm font-medium text-gray-700">{s.nombreSala}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-3 py-1 rounded-full ${s.activa ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                          {s.activa ? "Activa" : "Inactiva"}
                        </span>
                        <button 
                          onClick={() => abrirEditarSalaT(s)} 
                          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleEliminarSalaT(s)} 
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Salas de audiencia */}
            {tab === "audiencias" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500">Espacios físicos o virtuales para audiencias</p>
                  <button 
                    onClick={abrirCrearSalaA} 
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    + Agregar sala
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tribunalSel.salasAudiencia.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Sin salas de audiencia registradas</p>
                  )}
                  {tribunalSel.salasAudiencia.map((s) => (
                    <div key={s.idSalaAud} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{s.nombreSala}</p>
                        <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                          <span>Capacidad: {s.capacidad} personas</span>
                          {s.equipadaVideoconf && <span className="text-blue-500">✓ Videoconferencia</span>}
                          {s.enlaceVirtual && (
                            <a 
                              href={s.enlaceVirtual} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-400 hover:text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver enlace
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-3 py-1 rounded-full ${s.activa ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                          {s.activa ? "Activa" : "Inactiva"}
                        </span>
                        <button 
                          onClick={() => abrirEditarSalaA(s)} 
                          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleEliminarSalaA(s)} 
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 min-h-[400px]">
            <div className="text-center">
              <p className="text-sm text-gray-400">Selecciona un tribunal para ver sus salas</p>
              <p className="text-xs text-gray-300 mt-1">o crea uno nuevo usando el botón superior</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Tribunal ── */}
      {modalT && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalT(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {modeT === "crear" ? "Nuevo tribunal" : "Editar tribunal"}
            </h3>
            <form onSubmit={handleSubmitTribunal} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">Nombre del tribunal</label>
                <input
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formT.nombre}
                  onChange={(e) => setFormT({ ...formT, nombre: e.target.value })}
                  placeholder="Ej: Tribunal Supremo"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Instancia</label>
                <input
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formT.instancia}
                  onChange={(e) => setFormT({ ...formT, instancia: e.target.value })}
                  placeholder="Ej: Primera Instancia"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Norma de creación</label>
                <textarea
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={formT.norma}
                  onChange={(e) => setFormT({ ...formT, norma: e.target.value })}
                  placeholder="Ley o decreto que crea el tribunal"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalT(false)} 
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  {modeT === "crear" ? "Crear tribunal" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Sala de tribunal ── */}
      {modalST && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalST(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {modeST === "crear" ? "Nueva sala de tribunal" : "Editar sala de tribunal"}
            </h3>
            <form onSubmit={handleSubmitSalaT} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">Nombre de la sala</label>
                <input
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Sala Primera"
                  value={formST.nombre}
                  onChange={(e) => setFormST({ ...formST, nombre: e.target.value })}
                  required
                />
              </div>
              {modeST === "editar" && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activaST"
                    checked={formST.activa}
                    onChange={(e) => setFormST({ ...formST, activa: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="activaST" className="text-sm text-gray-600">Sala activa</label>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalST(false)} 
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  {modeST === "crear" ? "Crear sala" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Sala de audiencia ── */}
      {modalSA && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalSA(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {modeSA === "crear" ? "Nueva sala de audiencia" : "Editar sala de audiencia"}
            </h3>
            <form onSubmit={handleSubmitSalaA} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">Nombre</label>
                <input
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Sala de Audiencias A"
                  value={formSA.nombre}
                  onChange={(e) => setFormSA({ ...formSA, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Capacidad (personas)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formSA.capacidad}
                  onChange={(e) => setFormSA({ ...formSA, capacidad: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="videoconf"
                  checked={formSA.videoconf}
                  onChange={(e) => setFormSA({ ...formSA, videoconf: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="videoconf" className="text-sm text-gray-600">Equipada para videoconferencia</label>
              </div>
              {formSA.videoconf && (
                <div>
                  <label className="text-sm text-gray-600 font-medium">Enlace virtual (opcional)</label>
                  <input
                    type="url"
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://meet.google.com/xxx"
                    value={formSA.enlace}
                    onChange={(e) => setFormSA({ ...formSA, enlace: e.target.value })}
                  />
                </div>
              )}
              {modeSA === "editar" && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activaSA"
                    checked={formSA.activa}
                    onChange={(e) => setFormSA({ ...formSA, activa: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="activaSA" className="text-sm text-gray-600">Sala activa</label>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalSA(false)} 
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  {modeSA === "crear" ? "Crear sala" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmación eliminar ── */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={cerrarConfirm}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Confirmar eliminación</h3>
            <p className="text-sm text-gray-500 mb-6">{confirmModal.mensaje}</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={cerrarConfirm} 
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}