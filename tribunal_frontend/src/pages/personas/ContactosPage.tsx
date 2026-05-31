import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CONTACTOS,
  GET_PERSONAS,
  CREAR_CONTACTO,
  ACTUALIZAR_CONTACTO,
  ELIMINAR_CONTACTO,
} from "../../graphql/personas";
import { Phone, Plus, Edit, Trash2, Mail, Smartphone, Home, CheckCircle, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Contacto, Persona, nombreCompleto,
  TipoContactoBadge, PrincipalBadge, ValidadoBadge,
  Modal, Field, SelectField, CheckboxField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

const TIPO_CONTACTO_OPTS = [
  { value: "EMAIL",     label: "📧 Email" },
  { value: "TELEFONO",  label: "📞 Teléfono" },
  { value: "CELULAR",   label: "📱 Celular" },
  { value: "DOMICILIO", label: "🏠 Domicilio" },
];

const initForm = { idPersona: "", tipoContacto: "", valor: "", esPrincipal: false };

// ============================================================
// COMPONENTE: Buscador de Personas (Modal)
// ============================================================
function BuscadorPersona({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_PERSONAS);

  const personas: Persona[] = data?.allPersonas ?? [];

  const filtrados = personas.filter(p =>
    `${p.nombre} ${p.primerApellido} ${p.numeroDocumento}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-500" />
            Seleccionar Persona
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o documento..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron personas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((p: Persona, index: number) => (
                <button
                  key={p.idPersona}
                  onClick={() => {
                    onSelect(p.idPersona, `${p.nombre} ${p.primerApellido} (${p.numeroDocumento})`);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{p.nombre} {p.primerApellido}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{p.numeroDocumento}</p>
                    </div>
                    <div className="text-emerald-500">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function ContactosPage() {
  const { data, loading, refetch }   = useQuery(GET_CONTACTOS);
  const { data: dataPersonas }       = useQuery(GET_PERSONAS);
  const [crearContacto]      = useMutation(CREAR_CONTACTO);
  const [actualizarContacto] = useMutation(ACTUALIZAR_CONTACTO);
  const [eliminarContacto]   = useMutation(ELIMINAR_CONTACTO);

  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Contacto');
  const toast = useToast();

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [modal, setModal]   = useState(false);
  const [buscadorPersonaAbierto, setBuscadorPersonaAbierto] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState("");
  const [editando, setEdit] = useState<Contacto | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const contactos: Contacto[] = data?.allContactos ?? [];
  const personas: Persona[]   = dataPersonas?.allPersonas ?? [];

  // ✅ Filtrar contactos por búsqueda
  const contactosFiltrados = contactos.filter(c =>
    `${c.valor} ${c.tipoContacto} ${c.idPersona?.nombre ?? ""} ${c.idPersona?.primerApellido ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(contactosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContactos = contactosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const validados   = contactos.filter(c => c.validado).length;
  const principales = contactos.filter(c => c.esPrincipal).length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const seleccionarPersona = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idPersona: String(id) }));
    setPersonaSeleccionada(nombre);
  };

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setPersonaSeleccionada("");
    setErr(""); 
    setModal(true); 
  };

  const abrirEditar = (c: Contacto) => {
    setEdit(c);
    setForm({
      idPersona:     String(c.idPersona?.idPersona ?? ""),
      tipoContacto:  c.tipoContacto,
      valor:         c.valor,
      esPrincipal:   c.esPrincipal,
    });
    setPersonaSeleccionada(`${c.idPersona?.nombre} ${c.idPersona?.primerApellido} (${c.idPersona?.numeroDocumento})`);
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
    if (!form.valor || !form.tipoContacto) { 
      toast.error("Tipo y valor son obligatorios."); 
      return; 
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarContacto({
            variables: {
              id: Number(editando.idContacto),
              input: { valor: form.valor, esPrincipal: form.esPrincipal, validado: false },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        if (!form.idPersona) { 
          toast.error("Seleccioná una persona."); 
          return; 
        }
        await executeCreate(async () => {
          await crearContacto({
            variables: {
              idPersona:    Number(form.idPersona),
              tipoContacto: form.tipoContacto,
              valor:        form.valor,
              esPrincipal:  form.esPrincipal,
            },
          });
          await refetch();
          setModal(false);
          setPersonaSeleccionada("");
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (c: Contacto) => {
    if (deletingId === c.idContacto) return;
    setDeletingId(c.idContacto);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarContacto({ variables: { id: Number(c.idContacto) } });
          if (!data?.eliminarContacto?.ok) {
            throw new Error(data?.eliminarContacto?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando contacto ${c.valor}...`,
          success: `Contacto eliminado exitosamente`,
          error: `Error al eliminar el contacto`,
        },
        `¿Eliminar el contacto "${c.valor}"?`
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Toggle validado con bloqueo
  const toggleValidado = async (c: Contacto) => {
    if (togglingId === c.idContacto) return;
    setTogglingId(c.idContacto);
    
    try {
      await actualizarContacto({
        variables: { 
          id: Number(c.idContacto), 
          input: { validado: !c.validado } 
        },
      });
      await refetch();
      toast.success(`Contacto ${!c.validado ? 'validado' : 'invalidado'} correctamente`);
    } catch (error: any) {
      toast.error(error.message ?? "Error al cambiar estado");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Phone className="w-7 h-7 text-emerald-500" />
            Contactos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Información de contacto de personas • {contactos.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nuevo contacto
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total contactos</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{contactos.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registrados en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validados</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{validados}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((validados / (contactos.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Principales</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{principales}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Contacto de referencia</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={handleBusquedaChange} placeholder="Buscar por valor, tipo o persona..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {contactosFiltrados.length} resultado{contactosFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["Persona", "Documento", "Tipo", "Valor", "Principal", "Validado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay contactos registrados"
        emptyIcon={<Phone className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedContactos.map(c => (
          <tr key={c.idContacto} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
              {c.idPersona?.nombre} {c.idPersona?.primerApellido}
            </td>
            <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400 text-xs">
              {c.idPersona?.numeroDocumento}
            </td>
            <td className="px-6 py-4">
              <TipoContactoBadge tipo={c.tipoContacto} />
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{c.valor}</td>
            <td className="px-6 py-4">
              {c.esPrincipal ? <PrincipalBadge /> : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4">
              <ValidadoBadge validado={c.validado} onClick={() => toggleValidado(c)} disabled={togglingId === c.idContacto} />
            </td>
            <td className="px-6 py-4">
              <ActionBtns 
                onEdit={() => abrirEditar(c)} 
                onDelete={() => eliminar(c)} 
                disabled={saving}
              />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, contactosFiltrados.length)} de {contactosFiltrados.length}
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
        {paginatedContactos.map(c => (
          <div key={c.idContacto} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">
                  {c.idPersona?.nombre} {c.idPersona?.primerApellido}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5">{c.valor}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(c)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminar(c)} 
                  disabled={deletingId === c.idContacto}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <TipoContactoBadge tipo={c.tipoContacto} />
              {c.esPrincipal && <PrincipalBadge />}
              <ValidadoBadge 
                validado={c.validado} 
                onClick={() => toggleValidado(c)} 
                disabled={togglingId === c.idContacto}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar contacto" : "Nuevo contacto"}
          icon={<Phone className="w-5 h-5 text-emerald-500" />}
        >
          {!editando && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Persona <span className="text-red-500">*</span>
              </label>
              {personaSeleccionada ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{personaSeleccionada}</span>
                  <button
                    onClick={() => {
                      setForm(p => ({ ...p, idPersona: "" }));
                      setPersonaSeleccionada("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorPersonaAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar persona
                </button>
              )}
            </div>
          )}

          {/* En edición, mostrar la persona como texto */}
          {editando && (
            <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
              Persona: {personaSeleccionada}
            </div>
          )}

          <SelectField label="Tipo de contacto" value={form.tipoContacto} onChange={f("tipoContacto")} required disabled={saving}>
            <option value="">— Seleccionar tipo —</option>
            {TIPO_CONTACTO_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectField>
          
          <Field
            label="Valor" 
            value={form.valor} 
            onChange={f("valor")} 
            required
            placeholder="ej: correo@ejemplo.com / +591 71234567"
            disabled={saving}
          />
          
          <CheckboxField 
            label="Es contacto principal" 
            value={form.esPrincipal} 
            onChange={v => setForm(p => ({ ...p, esPrincipal: v }))}
            disabled={saving}
          />
          
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear contacto"}
            saving={saving}
          />
        </Modal>
      )}

      {/* Modal del buscador de personas */}
      {buscadorPersonaAbierto && (
        <BuscadorPersona
          onSelect={seleccionarPersona}
          onClose={() => setBuscadorPersonaAbierto(false)}
          disabled={saving}
        />
      )}
    </div>
  );
} 