import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_DENUNCIAS,
  GET_PERSONAS,
  CREAR_DENUNCIA,
  ACTUALIZAR_DENUNCIA,
  ELIMINAR_DENUNCIA,
} from "../../graphql/denuncias";
import { CREAR_PERSONA } from "../../graphql/personas";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import {
  AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  Edit, Eye, FileText, Plus, Search, Trash2, User, X,
  Scale,
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface Persona {
  idPersona: number;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  numeroDocumento: string;
}

interface Denuncia {
  id: number;
  numeroDenuncia: string;
  fechaDenuncia: string;
  denunciante: Persona;
  denunciado: Persona;
  tipoDenunciado: string;
  descripcion: string;
  estado: string;
  resolucion?: string;
  fechaResolucion?: string;
}

const initialForm = {
  numeroDenuncia: "",
  idDenunciante: 0,
  idDenunciado: 0,
  tipoDenunciado: "ESTUDIANTE",
  descripcion: "",
};

const ESTADOS = [
  { value: "REGISTRADA", label: "Registrada", color: "bg-gray-100 text-gray-700" },
  { value: "EN_TRAMITE", label: "En Trámite", color: "bg-blue-100 text-blue-700" },
  { value: "RESUELTA", label: "Resuelta", color: "bg-emerald-100 text-emerald-700" },
  { value: "APELADA", label: "Apelada", color: "bg-amber-100 text-amber-700" },
  { value: "ARCHIVADA", label: "Archivada", color: "bg-red-100 text-red-700" },
];

const TIPOS_DENUNCIADO = [
  { value: "ESTUDIANTE", label: "Estudiante" },
  { value: "DOCENTE", label: "Docente" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
];

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── MODAL ──────────────────────────────────────────────
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            {title}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", placeholder = "", required = false, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; disabled?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

// ─── BUSCADOR DE PERSONAS CON BOTÓN "+" ──────────────────────────────
function BuscadorPersona({
  onSelect,
  onClose,
  title = "Seleccionar Persona",
  onCrearPersona,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  title?: string;
  onCrearPersona: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_PERSONAS);

  const personas: Persona[] = data?.allPersonas ?? [];

  const filtrados = personas.filter(p =>
    `${p.nombre} ${p.primerApellido} ${p.segundoApellido || ""} ${p.numeroDocumento}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            {title}
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
              placeholder="Buscar por nombre o documento..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron personas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((p) => (
                <button
                  key={p.idPersona}
                  onClick={() => {
                    onSelect(p.idPersona, `${p.nombre} ${p.primerApellido} - ${p.numeroDocumento}`);
                    onClose();
                  }}
                  className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {p.nombre} {p.primerApellido} {p.segundoApellido || ""}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CI: {p.numeroDocumento}</p>
                    </div>
                    <div className="text-blue-500">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <div className="flex gap-2">
            <button
              onClick={onCrearPersona}
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Crear nueva persona
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function DenunciasPage() {
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Denuncia | null>(null);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState<number | null>(null);

  // Estados para modal de creación de persona
  const [modalPersonaAbierto, setModalPersonaAbierto] = useState(false);
  const [tipoPersona, setTipoPersona] = useState<"denunciante" | "denunciado">("denunciante");
  const [formPersona, setFormPersona] = useState({
    nombre: "",
    primerApellido: "",
    segundoApellido: "",
    numeroDocumento: "",
    estamento: "",
    registroUniversitario: "",
    titularA: "",
    esAbogado: false,
  });

  // Estados para buscadores modales
  const [buscadorDenuncianteAbierto, setBuscadorDenuncianteAbierto] = useState(false);
  const [buscadorDenunciadoAbierto, setBuscadorDenunciadoAbierto] = useState(false);

  const [denuncianteSeleccionado, setDenuncianteSeleccionado] = useState("");
  const [denunciadoSeleccionado, setDenunciadoSeleccionado] = useState("");

  const [estadoModal, setEstadoModal] = useState<{ open: boolean; denuncia: Denuncia | null; nuevoEstado: string }>({
    open: false, denuncia: null, nuevoEstado: "",
  });

  const { data, loading, refetch } = useQuery(GET_DENUNCIAS);
  const [crearDenuncia] = useMutation(CREAR_DENUNCIA);
  const [actualizarDenuncia] = useMutation(ACTUALIZAR_DENUNCIA);
  const [eliminarDenuncia] = useMutation(ELIMINAR_DENUNCIA);
  const [crearPersona] = useMutation(CREAR_PERSONA);

  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications('Denuncia');

  const denuncias: Denuncia[] = data?.allDenuncias ?? [];

  const denunciasFiltradas = denuncias.filter(d =>
    `${d.numeroDenuncia} ${d.denunciante?.nombre || ''} ${d.denunciado?.nombre || ''}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(denunciasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDenuncias = denunciasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const totalDenuncias = denuncias.length;
  const enTramite = denuncias.filter(d => d.estado === "EN_TRAMITE" || d.estado === "REGISTRADA").length;
  const resueltas = denuncias.filter(d => d.estado === "RESUELTA").length;

  const f = (field: string) => (v: string) => setForm(prev => ({ ...prev, [field]: v }));

  const seleccionarDenunciante = (id: number, nombre: string) => {
    setForm(prev => ({ ...prev, idDenunciante: id }));
    setDenuncianteSeleccionado(nombre);
    setBuscadorDenuncianteAbierto(false);
  };

  const seleccionarDenunciado = (id: number, nombre: string) => {
    setForm(prev => ({ ...prev, idDenunciado: id }));
    setDenunciadoSeleccionado(nombre);
    setBuscadorDenunciadoAbierto(false);
  };

  const handleCrearPersona = async () => {
    if (!formPersona.nombre || !formPersona.primerApellido || !formPersona.registroUniversitario) {
      toast.error("Nombre, primer apellido y N° Registro son obligatorios.");
      return;
    }

    try {
      const result = await crearPersona({
        variables: {
          input: {
            numeroDocumento: formPersona.numeroDocumento,
            nombre: formPersona.nombre,
            primerApellido: formPersona.primerApellido,
            segundoApellido: formPersona.segundoApellido || undefined,
            estamento: formPersona.estamento || undefined,
            registroUniversitario: formPersona.registroUniversitario,
            titularA: formPersona.titularA || undefined,
            esAbogado: formPersona.esAbogado,
          },
        },
      });

      const nuevaPersona = result?.data?.crearPersona?.persona;
      if (nuevaPersona) {
        toast.success(`Persona ${nuevaPersona.nombre} ${nuevaPersona.primerApellido} creada exitosamente`);

        const nombreCompleto = `${nuevaPersona.nombre} ${nuevaPersona.primerApellido} - ${nuevaPersona.numeroDocumento}`;

        if (tipoPersona === "denunciante") {
          seleccionarDenunciante(nuevaPersona.idPersona, nombreCompleto);
        } else {
          seleccionarDenunciado(nuevaPersona.idPersona, nombreCompleto);
        }

        setModalPersonaAbierto(false);
        setFormPersona({
          nombre: "",
          primerApellido: "",
          segundoApellido: "",
          numeroDocumento: "",
          estamento: "",
          registroUniversitario: "",
          titularA: "",
          esAbogado: false,
        });
      }
    } catch (error: any) {
      console.error("Error al crear persona:", error);
      toast.error(error.message || "Error al crear la persona");
    }
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(initialForm);
    setDenuncianteSeleccionado("");
    setDenunciadoSeleccionado("");
    setModalAbierto(true);
  };

  const abrirEditar = (d: Denuncia) => {
    setEditando(d);
    setForm({
      numeroDenuncia: d.numeroDenuncia,
      idDenunciante: d.denunciante?.idPersona || 0,
      idDenunciado: d.denunciado?.idPersona || 0,
      tipoDenunciado: d.tipoDenunciado,
      descripcion: d.descripcion,
    });
    setDenuncianteSeleccionado(d.denunciante ? `${d.denunciante.nombre} ${d.denunciante.primerApellido} - ${d.denunciante.numeroDocumento}` : "");
    setDenunciadoSeleccionado(d.denunciado ? `${d.denunciado.nombre} ${d.denunciado.primerApellido} - ${d.denunciado.numeroDocumento}` : "");
    setModalAbierto(true);
  };

  const cerrarModal = () => { 
    setModalAbierto(false); 
    setEditando(null); 
  };

  const guardar = async () => {
    if (!form.numeroDenuncia || !form.idDenunciante || !form.idDenunciado || !form.descripcion) {
      toast.error("Número de denuncia, denunciante, denunciado y descripción son obligatorios.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      if (editando) {
        // ✅ ACTUALIZACIÓN - Solo enviar los campos que el backend acepta
        await executeUpdate(async () => {
          await actualizarDenuncia({
            variables: { 
              id: Number(editando.id), 
              input: { 
                estado: editando.estado,
                resolucion: editando.resolucion,
                fechaResolucion: editando.fechaResolucion,
              } 
            },
          });
          await refetch();
          cerrarModal();
          return true;
        });
      } else {
        // ✅ CREACIÓN - Enviar todos los campos
        const input = {
          numeroDenuncia: form.numeroDenuncia,
          idDenunciante: Number(form.idDenunciante),
          idDenunciado: Number(form.idDenunciado),
          tipoDenunciado: form.tipoDenunciado,
          descripcion: form.descripcion,
        };

        await executeCreate(async () => {
          await crearDenuncia({ variables: { input } });
          await refetch();
          cerrarModal();
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const actualizarEstado = async (denuncia: Denuncia, nuevoEstado: string, resolucion?: string) => {
    setUpdatingEstado(denuncia.id);
    try {
      await executeUpdate(async () => {
        await actualizarDenuncia({
          variables: {
            id: Number(denuncia.id),
            input: { 
              estado: nuevoEstado, 
              resolucion: resolucion || denuncia.resolucion,
              fechaResolucion: nuevoEstado === "RESUELTA" ? new Date().toISOString().split('T')[0] : undefined
            },
          },
        });
        await refetch();
        setEstadoModal({ open: false, denuncia: null, nuevoEstado: "" });
        return true;
      });
    } finally {
      setUpdatingEstado(null);
    }
  };

  const eliminar = async (id: number, numero: string) => {
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarDenuncia({ variables: { id: Number(id) } });
          if (!data?.eliminarDenuncia?.ok) throw new Error(data?.eliminarDenuncia?.mensaje);
          await refetch();
          return true;
        },
        {
          loading: `Eliminando denuncia ${numero}...`,
          success: `Denuncia ${numero} eliminada exitosamente`,
          error: `Error al eliminar la denuncia`,
        },
        `¿Eliminar la denuncia ${numero}?`
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const found = ESTADOS.find(e => e.value === estado);
    return found?.color || "bg-gray-100 text-gray-700";
  };

  const getTipoDenunciadoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      ESTUDIANTE: "bg-blue-100 text-blue-700",
      DOCENTE: "bg-purple-100 text-purple-700",
      ADMINISTRATIVO: "bg-emerald-100 text-emerald-700",
    };
    return colors[tipo] || "bg-gray-100 text-gray-700";
  };

  // Función para abrir el modal de creación de persona desde el buscador
  const abrirModalCrearPersona = (tipo: "denunciante" | "denunciado") => {
    // Cerrar el buscador primero
    if (tipo === "denunciante") {
      setBuscadorDenuncianteAbierto(false);
    } else {
      setBuscadorDenunciadoAbierto(false);
    }
    // Luego abrir el modal de persona
    setTipoPersona(tipo);
    setModalPersonaAbierto(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-blue-500" />
            Denuncias
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de denuncias del Tribunal Universitario • {totalDenuncias} total
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Nueva denuncia
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Denuncias</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalDenuncias}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">En Trámite</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{enTramite}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resueltas</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{resueltas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Scale className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por número, denunciante o denunciado..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* TABLA */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {["N° Denuncia", "Denunciante", "Denunciado", "Tipo", "Estado", "Fecha", "Acciones"].map(h => (
                  <th key={h} className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${h === "Acciones" ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedDenuncias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No se encontraron denuncias</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDenuncias.map((denuncia) => (
                  <tr key={denuncia.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {denuncia.numeroDenuncia}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-800 dark:text-white">
                          {denuncia.denunciante?.nombre} {denuncia.denunciante?.primerApellido}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-800 dark:text-white">
                          {denuncia.denunciado?.nombre} {denuncia.denunciado?.primerApellido}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTipoDenunciadoBadge(denuncia.tipoDenunciado)}`}>
                        {TIPOS_DENUNCIADO.find(t => t.value === denuncia.tipoDenunciado)?.label || denuncia.tipoDenunciado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoBadge(denuncia.estado)}`}>
                        {ESTADOS.find(e => e.value === denuncia.estado)?.label || denuncia.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {fmtFecha(denuncia.fechaDenuncia)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/denuncias/${denuncia.id}`)}
                          disabled={saving}
                          className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-40"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirEditar(denuncia)}
                          disabled={saving}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEstadoModal({ open: true, denuncia, nuevoEstado: denuncia.estado })}
                          disabled={updatingEstado === denuncia.id}
                          className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-40"
                          title="Cambiar estado"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminar(denuncia.id, denuncia.numeroDenuncia)}
                          disabled={deletingId === denuncia.id}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, denunciasFiltradas.length)} de {denunciasFiltradas.length}
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

      {/* MODAL CREAR/EDITAR */}
      {modalAbierto && (
        <Modal onClose={cerrarModal} title={editando ? "Editar denuncia" : "Nueva denuncia"}>
          <div className="space-y-4">
            {/* Número de denuncia - en edición es solo lectura */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Número de denuncia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.numeroDenuncia}
                onChange={e => f("numeroDenuncia")(e.target.value)}
                disabled={saving || !!editando}
                placeholder="Ej: DEN-001/2025"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Denunciante - en edición es solo lectura */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Denunciante <span className="text-red-500">*</span>
              </label>
              {denuncianteSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{denuncianteSeleccionado}</span>
                  {!editando && (
                    <button
                      onClick={() => {
                        setForm(prev => ({ ...prev, idDenunciante: 0 }));
                        setDenuncianteSeleccionado("");
                      }}
                      disabled={saving}
                      className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorDenuncianteAbierto(true)}
                  disabled={saving || !!editando}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                  Buscar denunciante
                </button>
              )}
            </div>

            {/* Denunciado - en edición es solo lectura */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Denunciado <span className="text-red-500">*</span>
              </label>
              {denunciadoSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{denunciadoSeleccionado}</span>
                  {!editando && (
                    <button
                      onClick={() => {
                        setForm(prev => ({ ...prev, idDenunciado: 0 }));
                        setDenunciadoSeleccionado("");
                      }}
                      disabled={saving}
                      className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorDenunciadoAbierto(true)}
                  disabled={saving || !!editando}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                  Buscar denunciado
                </button>
              )}
            </div>

            {/* Tipo de denunciado - DESHABILITADO en edición (porque backend no lo acepta) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Tipo de denunciado <span className="text-red-500">*</span>
              </label>
              <select
                value={form.tipoDenunciado}
                onChange={e => f("tipoDenunciado")(e.target.value)}
                disabled={saving || !!editando}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {TIPOS_DENUNCIADO.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Descripción - DESHABILITADA en edición (porque backend no lo acepta) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Descripción de los hechos <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.descripcion}
                onChange={e => f("descripcion")(e.target.value)}
                disabled={saving || !!editando}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Describa los hechos denunciados..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={cerrarModal} disabled={saving} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button onClick={guardar} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50">
                {saving ? "Guardando..." : (editando ? "Guardar cambios" : "Crear denuncia")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL CREAR PERSONA */}
      {modalPersonaAbierto && (
        <Modal onClose={() => setModalPersonaAbierto(false)} title="Nueva persona">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nombre"
                value={formPersona.nombre}
                onChange={(v) => setFormPersona(prev => ({ ...prev, nombre: v }))}
                required
                placeholder="Nombre"
                disabled={saving}
              />
              <Field
                label="Primer apellido"
                value={formPersona.primerApellido}
                onChange={(v) => setFormPersona(prev => ({ ...prev, primerApellido: v }))}
                required
                placeholder="Primer apellido"
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Segundo apellido"
                value={formPersona.segundoApellido}
                onChange={(v) => setFormPersona(prev => ({ ...prev, segundoApellido: v }))}
                placeholder="Segundo apellido"
                disabled={saving}
              />
              <Field
                label="N° Registro"
                value={formPersona.registroUniversitario}
                onChange={(v) => setFormPersona(prev => ({ ...prev, registroUniversitario: v }))}
                required
                placeholder="N° Registro"
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="C.I."
                value={formPersona.numeroDocumento}
                onChange={(v) => setFormPersona(prev => ({ ...prev, numeroDocumento: v }))}
                placeholder="Cédula de Identidad"
                disabled={saving}
              />
              <Field
                label="Estamento"
                value={formPersona.estamento}
                onChange={(v) => setFormPersona(prev => ({ ...prev, estamento: v }))}
                placeholder="Ej: Docente, Estudiante"
                disabled={saving}
              />
            </div>
            <Field
              label="Titular A"
              value={formPersona.titularA}
              onChange={(v) => setFormPersona(prev => ({ ...prev, titularA: v }))}
              placeholder="Cargo o representación"
              disabled={saving}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esAbogado"
                checked={formPersona.esAbogado}
                onChange={(e) => setFormPersona(prev => ({ ...prev, esAbogado: e.target.checked }))}
                disabled={saving}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="esAbogado" className="text-sm text-gray-700 dark:text-gray-300">
                Es abogado
              </label>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setModalPersonaAbierto(false)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearPersona}
                disabled={saving || !formPersona.nombre || !formPersona.primerApellido || !formPersona.registroUniversitario}
                className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Crear y seleccionar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL CAMBIO DE ESTADO */}
      {estadoModal.open && estadoModal.denuncia && (
        <Modal onClose={() => setEstadoModal({ open: false, denuncia: null, nuevoEstado: "" })} title="Cambiar estado">
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Denuncia:</span> {estadoModal.denuncia.numeroDenuncia}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                <span className="font-semibold">Denunciado:</span> {estadoModal.denuncia.denunciado?.nombre} {estadoModal.denuncia.denunciado?.primerApellido}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nuevo estado</label>
              <select
                value={estadoModal.nuevoEstado}
                onChange={e => setEstadoModal(prev => ({ ...prev, nuevoEstado: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              >
                {ESTADOS.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            {estadoModal.nuevoEstado === "RESUELTA" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Resolución</label>
                <textarea
                  rows={3}
                  placeholder="Describa la resolución..."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                  onChange={e => setEstadoModal(prev => ({ ...prev, denuncia: prev.denuncia ? { ...prev.denuncia, resolucion: e.target.value } : null }))}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={() => setEstadoModal({ open: false, denuncia: null, nuevoEstado: "" })} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={() => actualizarEstado(estadoModal.denuncia!, estadoModal.nuevoEstado, estadoModal.denuncia?.resolucion)}
                disabled={updatingEstado === estadoModal.denuncia?.id}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50"
              >
                {updatingEstado === estadoModal.denuncia?.id ? "Guardando..." : "Cambiar estado"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODALES DE BUSCADORES */}
      {buscadorDenuncianteAbierto && (
        <BuscadorPersona
          onSelect={seleccionarDenunciante}
          onClose={() => setBuscadorDenuncianteAbierto(false)}
          title="Seleccionar Denunciante"
          onCrearPersona={() => abrirModalCrearPersona("denunciante")}
        />
      )}
      {buscadorDenunciadoAbierto && (
        <BuscadorPersona
          onSelect={seleccionarDenunciado}
          onClose={() => setBuscadorDenunciadoAbierto(false)}
          title="Seleccionar Denunciado"
          onCrearPersona={() => abrirModalCrearPersona("denunciado")}
        />
      )}
    </div>
  );
}