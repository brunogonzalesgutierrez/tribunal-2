// ─── src/pages/resoluciones/TiposRecursoPage.tsx ─────────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_RECURSO,
  CREAR_TIPO_RECURSO,
  ACTUALIZAR_TIPO_RECURSO,
  ELIMINAR_TIPO_RECURSO,
} from "../../graphql/resoluciones";
import {
  C,
  Modal,
  Field,
  TextareaField,
  Tabla,
  ActionBtn,
  ErrorBox,
  ModalFooter,
  PageShell,
  TipoRecurso,
} from "./shared";

export default function TiposRecursoPage() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_RECURSO);
  const [crear]      = useMutation(CREAR_TIPO_RECURSO);
  const [actualizar] = useMutation(ACTUALIZAR_TIPO_RECURSO);
  const [eliminar_m] = useMutation(ELIMINAR_TIPO_RECURSO);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoRecurso | null>(null);
  const [err, setErr]       = useState("");

  const initForm = { nombre: "", descripcion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const tipos: TipoRecurso[] = data?.allTiposRecurso ?? [];

  const abrirCrear = () => {
    setEdit(null);
    setForm(initForm);
    setErr("");
    setModal(true);
  };

  const abrirEditar = (t: TipoRecurso) => {
    setEdit(t);
    setForm({ nombre: t.nombre, descripcion: t.descripcion ?? "" });
    setErr("");
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre) {
      setErr("El nombre es obligatorio.");
      return;
    }
    try {
      if (editando) {
        await actualizar({
          variables: {
            id: Number(editando.idTipoRecurso),
            input: {
              nombre: form.nombre,
              descripcion: form.descripcion || undefined,
            },
          },
        });
      } else {
        await crear({
          variables: {
            nombre: form.nombre,
            descripcion: form.descripcion || undefined,
          },
        });
      }
      await refetch();
      setModal(false);
    } catch (e: any) {
      setErr(e.message ?? "Error.");
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este tipo?")) return;
    const { data } = await eliminar_m({ variables: { id: Number(id) } });
    if (!data?.eliminarTipoRecurso?.ok) {
      alert(
        data?.eliminarTipoRecurso?.mensaje ?? "No se pudo eliminar el tipo de recurso."
      );
      return;
    }
    refetch();
  };

  return (
    <PageShell
      title="Tipos de recurso"
      subtitle="Clasificación de los recursos legales disponibles"
    >
      {/* Botón nuevo */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={abrirCrear}
          style={{
            backgroundColor: "#238636",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          + Nuevo tipo
        </button>
      </div>

      {/* Tabla */}
      <Tabla
        headers={["Nombre", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de recurso"
      >
        {tipos.map((t, i) => (
          <tr
            key={t.idTipoRecurso}
            style={{
              borderBottom:
                i < tipos.length - 1 ? `1px solid ${C.borderLight}` : "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>{t.nombre}</td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
              {t.descripcion || "—"}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(t)} color={C.blue} label="Editar" />
                <ActionBtn
                  onClick={() => eliminar(Number(t.idTipoRecurso))}
                  color={C.red}
                  label="Eliminar"
                />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      {/* Modal */}
      {modal && (
        <Modal onClose={() => setModal(false)} width={420}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar tipo de recurso" : "Nuevo tipo de recurso"}
          </h2>
          <Field
            label="Nombre *"
            value={form.nombre}
            onChange={f("nombre")}
            placeholder="Ej: Apelación, Casación..."
          />
          <TextareaField
            label="Descripción"
            value={form.descripcion}
            onChange={f("descripcion")}
          />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar" : "Crear tipo"}
          />
        </Modal>
      )}
    </PageShell>
  );
}
