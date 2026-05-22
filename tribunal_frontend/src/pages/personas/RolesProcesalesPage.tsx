import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ROLES_PROCESAL,
  CREAR_ROL_PROCESAL,
  ACTUALIZAR_ROL_PROCESAL,
  ELIMINAR_ROL_PROCESAL,
} from "../../graphql/personas";
import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import {
  RolProcesal,
  RolBadge,
  Modal, Field, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

export default function RolesProcesalesPage() {
  const { data, loading, refetch } = useQuery(GET_ROLES_PROCESAL);
  const [crearRolProcesal]      = useMutation(CREAR_ROL_PROCESAL);
  const [actualizarRolProcesal] = useMutation(ACTUALIZAR_ROL_PROCESAL);
  const [eliminarRolProcesal]   = useMutation(ELIMINAR_ROL_PROCESAL);

  const [modal, setModal]    = useState(false);
  const [editando, setEdit]  = useState<RolProcesal | null>(null);
  const [nombreRol, setNombre] = useState("");
  const [busqueda, setBusq]  = useState("");
  const [err, setErr]        = useState("");

  const roles: RolProcesal[] = data?.allRolesProcesal ?? [];
  const filtrados = roles.filter(r =>
    r.nombreRol.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEdit(null); setNombre(""); setErr(""); setModal(true); };
  const abrirEditar = (r: RolProcesal) => { setEdit(r); setNombre(r.nombreRol); setErr(""); setModal(true); };

  const guardar = async () => {
    if (!nombreRol.trim()) { setErr("El nombre del rol es obligatorio."); return; }
    try {
      if (editando) {
        await actualizarRolProcesal({ variables: { id: Number(editando.idRol), input: { nombreRol } } });
      } else {
        await crearRolProcesal({ variables: { nombreRol } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (r: RolProcesal) => {
    if (!window.confirm(`¿Eliminar el rol "${r.nombreRol}"?`)) return;
    const { data } = await eliminarRolProcesal({ variables: { id: Number(r.idRol) } });
    if (!data?.eliminarRolProcesal?.ok) {
      alert(data?.eliminarRolProcesal?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-500" />
            Roles Procesales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Roles de partes en procesos judiciales • {roles.length} roles registrados
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo rol
        </button>
      </div>

      {/* Stat único */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total roles" value={roles.length} color="text-purple-600 dark:text-purple-400"
          icon={<Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          sub="Roles procesales definidos" />
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar rol procesal..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["ID", "Nombre del rol", "Acciones"]}
        loading={loading}
        emptyMsg="No hay roles procesales"
        emptyIcon={<Shield className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtrados.map(r => (
          <tr key={r.idRol} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-mono text-gray-400 text-xs">#{r.idRol}</span>
            </td>
            <td className="px-6 py-4">
              <RolBadge rol={r.nombreRol} />
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(r)} onDelete={() => eliminar(r)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtrados.map(r => (
          <div key={r.idRol} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-mono text-gray-400 text-xs">#{r.idRol}</span>
                <RolBadge rol={r.nombreRol} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(r)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar rol procesal" : "Nuevo rol procesal"}
          icon={<Shield className="w-5 h-5 text-purple-500" />}
        >
          <Field
            label="Nombre del rol" value={nombreRol} onChange={setNombre} required
            placeholder="ej: Demandante, Demandado, Abogado defensor..."
          />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear rol"}
          />
        </Modal>
      )}
    </div>
  );
}
