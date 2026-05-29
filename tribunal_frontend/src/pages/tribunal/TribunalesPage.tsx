import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TRIBUNALES,
  GET_SALAS_TRIBUNAL,
  CREAR_TRIBUNAL,
  ACTUALIZAR_TRIBUNAL,
  ELIMINAR_TRIBUNAL,
} from "../../graphql/tribunal";
import { Building2, Plus } from "lucide-react";
import {
  Tribunal, SalaTribunal,
  InstanciaBadge,
  Modal, Field, TextAreaField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

const initForm = { nombreTribunal: "", instancia: "", normaCreacion: "" };

export default function TribunalesPage() {
  const { data: dTrib, loading, refetch } = useQuery(GET_TRIBUNALES);
  const { data: dSala }                   = useQuery(GET_SALAS_TRIBUNAL);
  const [crearTribunal]  = useMutation(CREAR_TRIBUNAL);
  const [actualizarTrib] = useMutation(ACTUALIZAR_TRIBUNAL);
  const [eliminarTrib]   = useMutation(ELIMINAR_TRIBUNAL);

  // ✅ HOOK DE NOTIFICACIONES
  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Tribunal');
  const toast = useToast();

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Tribunal | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const tribunales: Tribunal[]     = dTrib?.allTribunales   ?? [];
  const salas:      SalaTribunal[] = dSala?.allSalasTribunal ?? [];

  const filtrados = tribunales.filter(t =>
    `${t.nombreTribunal} ${t.instancia} ${t.normaCreacion}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const p = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setErr(""); 
    setModal(true); 
  };
  
  const abrirEditar = (t: Tribunal) => {
    setEdit(t);
    setForm({ 
      nombreTribunal: t.nombreTribunal, 
      instancia: t.instancia, 
      normaCreacion: t.normaCreacion 
    });
    setErr(""); 
    setModal(true);
  };

  // ✅ GUARDAR CON NOTIFICACIONES
  const guardar = async () => {
    if (!form.nombreTribunal || !form.instancia || !form.normaCreacion) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }
    
    if (editando) {
      await executeUpdate(async () => {
        await actualizarTrib({ 
          variables: { 
            id: Number(editando.idTribunal), 
            ...form 
          } 
        });
        await refetch();
        setModal(false);
        return true;
      });
    } else {
      await executeCreate(async () => {
        await crearTribunal({ variables: form });
        await refetch();
        setModal(false);
        return true;
      });
    }
  };

  // ✅ ELIMINAR CON NOTIFICACIONES
  const eliminar = async (t: Tribunal) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarTrib({ variables: { id: Number(t.idTribunal) } });
        if (!data?.eliminarTribunal?.ok) {
          throw new Error(data?.eliminarTribunal?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando tribunal ${t.nombreTribunal}...`,
        success: `Tribunal ${t.nombreTribunal} eliminado exitosamente`,
        error: `Error al eliminar el tribunal`,
      },
      `¿Eliminar "${t.nombreTribunal}"? Se eliminarán todas sus salas.`
    );
  };

  const salasPorTribunal = (idTribunal: number) =>
    salas.filter(s => s.idTribunal.idTribunal === idTribunal).length;

  const totalSalas  = salas.length;
  const instancias  = [...new Set(tribunales.map(t => t.instancia))].length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-500" />
            Tribunales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registro de tribunales judiciales • {tribunales.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo tribunal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total tribunales" value={tribunales.length} color="text-blue-600 dark:text-blue-400"
          icon={<Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Registrados en el sistema" />
        <StatCard label="Total salas" value={totalSalas} color="text-purple-600 dark:text-purple-400"
          icon={<Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />} sub="Salas activas e inactivas" />
        <StatCard label="Instancias" value={instancias} color="text-emerald-600 dark:text-emerald-400"
          icon={<Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} sub="Instancias distintas" />
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por nombre, instancia o norma..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <TablaDesktop
        headers={["Nombre del tribunal", "Instancia", "Norma de creación", "Salas", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tribunales registrados"
      >
        {filtrados.map(t => {
          const nSalas = salasPorTribunal(t.idTribunal);
          return (
            <tr key={t.idTribunal} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
                {t.nombreTribunal}
              </td>
              <td className="px-6 py-4">
                <InstanciaBadge instancia={t.instancia} />
              </td>
              <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                {t.normaCreacion}
              </td>
              <td className="px-6 py-4">
                <span className="font-bold text-purple-600 dark:text-purple-400">{nSalas}</span>
                <span className="text-xs text-gray-400 ml-1">sala{nSalas !== 1 ? "s" : ""}</span>
              </td>
              <td className="px-6 py-4">
                <ActionBtns onEdit={() => abrirEditar(t)} onDelete={() => eliminar(t)} />
              </td>
            </tr>
          );
        })}
      </TablaDesktop>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar tribunal" : "Nuevo tribunal"}
          icon={<Building2 className="w-5 h-5 text-blue-500" />}
        >
          <Field
            label="Nombre del tribunal"
            value={form.nombreTribunal}
            onChange={p("nombreTribunal")}
            required
            placeholder="Ej: Tribunal Disciplinario Universitario"
          />
          <Field
            label="Instancia"
            value={form.instancia}
            onChange={p("instancia")}
            required
            placeholder="Ej: Primera instancia"
          />
          <TextAreaField
            label="Norma de creación"
            value={form.normaCreacion}
            onChange={p("normaCreacion")}
            required
            placeholder="Ej: Resolución HCU N° 001/2020"
          />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear tribunal"}
          />
        </Modal>
      )}
    </div>
  );
}