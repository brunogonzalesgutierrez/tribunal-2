import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PERSONAS,
  CREAR_PERSONA,
  ACTUALIZAR_PERSONA,
  ELIMINAR_PERSONA,
} from "../../graphql/personas";

import { User, Plus, Edit, Trash2, Scale, GraduationCap, ChevronLeft, ChevronRight, Award, Send, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import {
  Persona, nombreCompleto,
  AbogadoBadge,
  Modal, Field, CheckboxField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { VERIFICAR_CERTIFICADO, ENVIAR_CERTIFICADO_NO_HALLADO } from "../../graphql/personas";
import { generarCertificadoNoHallado } from "../../utils/generarCertificadoNoHallado";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';


const initForm = {
  nombre: "", primerApellido: "", segundoApellido: "",
  numeroDocumento: "", estamento: "", registroUniversitario: "",
  titularA: "", esAbogado: false,
};


function ModalCertificado({ persona, onClose }: { persona: Persona; onClose: () => void }) {
  const { data, loading } = useQuery(VERIFICAR_CERTIFICADO, {
    variables: { idPersona: Number(persona.idPersona) },
    fetchPolicy: "network-only",
  });
  const [enviarMutation] = useMutation(ENVIAR_CERTIFICADO_NO_HALLADO);
  const toast = useToast();

  const [paso, setPaso] = useState<"verificando" | "resultado" | "enviando" | "enviado">("verificando");
  const [enviando, setEnviando] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<{ ok: boolean; mensaje: string; email?: string } | null>(null);

  const verificacion = data?.verificarCertificadoPersona;
  const puedeEmitir  = verificacion?.puedeEmitir ?? false;
  const nombre = `${persona.nombre} ${persona.primerApellido} ${persona.segundoApellido ?? ""}`.trim();

  useEffect(() => {
    if (!loading && verificacion) setPaso("resultado");
  }, [loading, verificacion]);

  const descargarPdf = async () => {
    try {
      await generarCertificadoNoHallado({
        persona: {
          nombre:                persona.nombre,
          primerApellido:        persona.primerApellido,
          segundoApellido:       persona.segundoApellido,
          numeroDocumento:       persona.numeroDocumento,
          registroUniversitario: persona.registroUniversitario ?? "",
          estamento:             persona.estamento,
          titularA:              persona.titularA,
        },
        tribunal: {
          nombreTribunal: "Tribunal Departamental de Justicia de Santa Cruz",
          instancia:      "DEPARTAMENTAL",
        },
      });
      toast.success("PDF generado correctamente.");
    } catch {
      toast.error("Error al generar el PDF.");
    }
  };

  const enviarEmail = async () => {
    setEnviando(true);
    try {
      const { data: res } = await enviarMutation({
        variables: { idPersona: Number(persona.idPersona) },
      });
      const r = res?.enviarCertificadoNoHallado;
      setResultadoEnvio({ ok: r?.ok, mensaje: r?.mensaje, email: r?.emailEnviado });
      setPaso("enviado");
    } catch (e: any) {
      setResultadoEnvio({ ok: false, mensaje: e.message ?? "Error al enviar." });
      setPaso("enviado");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Certificado de Proceso No Hallado</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">{nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 space-y-4">

          {/* Verificando */}
          {(loading || paso === "verificando") && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Verificando procesos judiciales...</p>
            </div>
          )}

          {/* Resultado de verificación */}
          {paso === "resultado" && verificacion && (
            <>
              {puedeEmitir ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Sin procesos activos</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{verificacion.mensaje}</p>
                    {verificacion.emailPersona && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Email: {verificacion.emailPersona}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800 dark:text-red-300">Tiene procesos activos</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">No se puede emitir el certificado.</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procesos encontrados:</p>
                    {verificacion.procesosActivos.map((proc: string, i: number) => (
                      <div key={i} className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-slate-700">
                        {proc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Resultado del envío */}
          {paso === "enviado" && resultadoEnvio && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${
              resultadoEnvio.ok
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"
            }`}>
              {resultadoEnvio.ok
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              }
              <div>
                <p className={`text-sm font-semibold ${resultadoEnvio.ok ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
                  {resultadoEnvio.ok ? "Certificado enviado" : "Error al enviar"}
                </p>
                <p className={`text-xs mt-0.5 ${resultadoEnvio.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {resultadoEnvio.mensaje}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          {paso === "resultado" && puedeEmitir && (
            <>
              <button
                onClick={descargarPdf}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-semibold transition-colors"
              >
                <Award className="w-4 h-4" /> Descargar PDF
              </button>
              {verificacion?.emailPersona && (
                <button
                  onClick={enviarEmail}
                  disabled={enviando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {enviando ? "Enviando..." : "Enviar al email"}
                </button>
              )}
            </>
          )}
          {(paso === "enviado" || (paso === "resultado" && !puedeEmitir)) && (
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-slate-600">
              Cerrar
            </button>
          )}
          {paso === "verificando" && (
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [modalCert, setModalCert] = useState<Persona | null>(null);
  

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Persona | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const personas: Persona[] = data?.allPersonas ?? [];
  
  // ✅ Filtrar personas por búsqueda
  const personasFiltradas = personas.filter(p => {
    if (!busqueda.trim()) return true;
    const haystack = [
      p.nombre,
      p.primerApellido,
      p.segundoApellido,
      p.numeroDocumento,
      p.registroUniversitario,
      p.estamento,
      p.titularA,
      // nombre completo junto para buscar "Ana Rodriguez"
      `${p.nombre} ${p.primerApellido}`,
      `${p.nombre} ${p.primerApellido} ${p.segundoApellido ?? ""}`,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // quita tildes

    // cada palabra del buscador debe aparecer en algún lugar
    return busqueda
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .split(/\s+/)
      .every(palabra => haystack.includes(palabra));
  });

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
    if (!form.nombre || !form.primerApellido || !form.registroUniversitario) {
      toast.error("Nombre, primer apellido y N° Registro son obligatorios.");
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
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => setModalCert(p)}
                  className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                  title="Certificado de proceso no hallado"
                >
                  <Award className="w-4 h-4" />
                </button>
                <ActionBtns onEdit={() => abrirEditar(p)} onDelete={() => eliminar(p)} disabled={saving} />
              </div>
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
                  onClick={() => setModalCert(p)}
                  className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  title="Certificado PNH"
                >
                  <Award className="w-4 h-4" />
                </button>


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

      {/* Modal Certificado */}
      {modalCert && (
        <ModalCertificado
          persona={modalCert}
          onClose={() => setModalCert(null)}
        />
      )}

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
              label="N° Registro" 
              value={form.registroUniversitario} 
              onChange={f("registroUniversitario")} 
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
              label="C.I." 
              value={form.numeroDocumento} 
              onChange={f("numeroDocumento")} 
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