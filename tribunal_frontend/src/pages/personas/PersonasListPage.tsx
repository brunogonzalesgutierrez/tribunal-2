import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PERSONAS,
  CREAR_PERSONA,
  ACTUALIZAR_PERSONA,
  ELIMINAR_PERSONA,
} from "../../graphql/personas";
import { User, Plus, Edit, Trash2, Scale, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Persona, nombreCompleto,
  AbogadoBadge,
  Modal, Field, CheckboxField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

const initForm = {
  nombre: "", primerApellido: "", segundoApellido: "",
  numeroDocumento: "", estamento: "", registroUniversitario: "",
  titularA: "", esAbogado: false,
};

export default function PersonasListPage() {
  const { data, loading, refetch } = useQuery(GET_PERSONAS);
  const [crearPersona]      = useMutation(CREAR_PERSONA);
  const [actualizarPersona] = useMutation(ACTUALIZAR_PERSONA);
  const [eliminarPersona]   = useMutation(ELIMINAR_PERSONA);

  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Persona');
  const toast = useToast();

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Persona | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const personas: Persona[] = data?.allPersonas ?? [];
  
  // ✅ Filtrar personas por búsqueda
  const personasFiltradas = personas.filter(p =>
    `${p.nombre} ${p.primerApellido} ${p.segundoApellido ?? ""} ${p.numeroDocumento} ${p.estamento ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(personasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPersonas = personasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const abogados = personas.filter(p => p.esAbogado).length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setErr(""); 
    setModal(true); 
  };

  const abrirEditar = (p: Persona) => {
    setEdit(p);
    setForm({
      nombre:               p.nombre,
      primerApellido:       p.primerApellido,
      segundoApellido:      p.segundoApellido ?? "",
      numeroDocumento:      p.numeroDocumento,
      estamento:            p.estamento ?? "",
      registroUniversitario: p.registroUniversitario ?? "",
      titularA:             p.titularA ?? "",
      esAbogado:            p.esAbogado,
    });
    setErr(""); 
    setModal(true);
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (value: string) => {
    setBusq(value);
    setCurrentPage(1);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!form.nombre || !form.primerApellido || !form.numeroDocumento) {
      toast.error("Nombre, primer apellido y documento son obligatorios.");
      return;
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarPersona({
            variables: {
              id: Number(editando.idPersona),
              input: {
                nombre:               form.nombre,
                primerApellido:       form.primerApellido,
                segundoApellido:      form.segundoApellido || undefined,
                estamento:            form.estamento || undefined,
                registroUniversitario: form.registroUniversitario || undefined,
                titularA:             form.titularA || undefined,
                esAbogado:            form.esAbogado,
                numeroDocumento:      form.numeroDocumento,
              },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearPersona({
            variables: {
              input: {
                numeroDocumento:      form.numeroDocumento,
                nombre:               form.nombre,
                primerApellido:       form.primerApellido,
                segundoApellido:      form.segundoApellido || undefined,
                estamento:            form.estamento || undefined,
                registroUniversitario: form.registroUniversitario || undefined,
                titularA:             form.titularA || undefined,
                esAbogado:            form.esAbogado,
              },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      }
    } catch (e: any) { 
      setErr(e.message ?? "Error."); 
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (p: Persona) => {
    if (deletingId === p.idPersona) return;
    setDeletingId(p.idPersona);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarPersona({ variables: { id: Number(p.idPersona) } });
          if (!data?.eliminarPersona?.ok) {
            throw new Error(data?.eliminarPersona?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando a ${nombreCompleto(p)}...`,
          success: `Persona eliminada exitosamente`,
          error: `Error al eliminar la persona`,
        },
        `¿Eliminar a ${nombreCompleto(p)}?`
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="w-7 h-7 text-blue-500" />
            Personas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registro de personas del sistema • {personas.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nueva persona
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total personas</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{personas.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registradas en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Abogados</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{abogados}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((abogados / (personas.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Otros participantes</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{personas.length - abogados}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sin perfil de abogado</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={handleBusquedaChange} placeholder="Buscar por nombre, documento o estamento..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {personasFiltradas.length} resultado{personasFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["Documento", "Nombre completo", "Estamento", "Reg. universitario", "Abogado", "Titular a", "Acciones"]}
        loading={loading}
        emptyMsg="No hay personas registradas"
        emptyIcon={<User className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedPersonas.map(p => (
          <tr key={p.idPersona} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-mono text-blue-500 font-bold text-sm">{p.numeroDocumento}</span>
            </td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
              {nombreCompleto(p)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {p.estamento ?? "—"}
            </td>
            <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
              {p.registroUniversitario ?? "—"}
            </td>
            <td className="px-6 py-4">
              {p.esAbogado ? <AbogadoBadge /> : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {p.titularA ?? "—"}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(p)} onDelete={() => eliminar(p)} disabled={saving} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, personasFiltradas.length)} de {personasFiltradas.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cards Móvil con datos paginados */}
      <div className="lg:hidden space-y-3">
        {paginatedPersonas.map(p => (
          <div key={p.idPersona} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{nombreCompleto(p)}</p>
                <span className="font-mono text-blue-500 text-xs">{p.numeroDocumento}</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(p)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminar(p)} 
                  disabled={deletingId === p.idPersona}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {p.estamento && <span className="text-xs text-gray-400">{p.estamento}</span>}
              {p.esAbogado && <AbogadoBadge />}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar persona" : "Nueva persona"}
          icon={<User className="w-5 h-5 text-blue-500" />}
        >
          <div className="grid grid-cols-2 gap-x-4">
            <Field 
              label="Nombre" 
              value={form.nombre} 
              onChange={f("nombre")} 
              required 
              disabled={saving}
            />
            <Field 
              label="Primer apellido" 
              value={form.primerApellido} 
              onChange={f("primerApellido")} 
              required 
              disabled={saving}
            />
            <Field 
              label="Segundo apellido" 
              value={form.segundoApellido} 
              onChange={f("segundoApellido")} 
              disabled={saving}
            />
            <Field 
              label="N° Documento" 
              value={form.numeroDocumento} 
              onChange={f("numeroDocumento")} 
              required 
              disabled={saving}
            />
            <Field 
              label="Estamento" 
              value={form.estamento} 
              onChange={f("estamento")} 
              placeholder="ej: Docente, Estudiante"
              disabled={saving}
            />
            <Field 
              label="Registro universitario" 
              value={form.registroUniversitario} 
              onChange={f("registroUniversitario")} 
              disabled={saving}
            />
          </div>
          <Field 
            label="Titular a" 
            value={form.titularA} 
            onChange={f("titularA")} 
            placeholder="ej: Cargo o representación"
            disabled={saving}
          />
          <CheckboxField 
            label="Es abogado" 
            value={form.esAbogado} 
            onChange={v => setForm(p => ({ ...p, esAbogado: v }))}
            disabled={saving}
          />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear persona"}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}