// ─── src/pages/resoluciones/TiposResolucionPage.tsx ──────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_RESOLUCION,
  CREAR_TIPO_RESOLUCION,
  ACTUALIZAR_TIPO_RESOLUCION,
  ELIMINAR_TIPO_RESOLUCION,
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
  nivelStars,
  TipoResolucion,
} from "./shared";

export default function TiposResolucionPage() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_RESOLUCION);
  const [crear]      = useMutation(CREAR_TIPO_RESOLUCION);
  const [actualizar] = useMutation(ACTUALIZAR_TIPO_RESOLUCION);
  const [eliminar_m] = useMutation(ELIMINAR_TIPO_RESOLUCION);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoResolucion | null>(null);
  const [err, setErr]       = useState("");

  const initForm = { codigo: "", nombre: "", nivelJerarquico: "1", descripcion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const tipos: TipoResolucion[] = data?.allTiposResolucion ?? [];

  const abrirCrear = () => {
    setEdit(null);
    setForm(initForm);
    setErr("");
    setModal(true);
  };

  const abrirEditar = (t: TipoResolucion) => {
    setEdit(t);
    setForm({
      codigo: t.codigo,
      nombre: t.nombre,
      nivelJerarquico: String(t.nivelJerarquico),
      descripcion: t.descripcion ?? "",
    });
    setErr("");
    setModal(true);
  };

  const guardar = async () => {
    if (!form.codigo || !form.nombre) {
      setErr("Código y nombre son obligatorios.");
      return;
    }
    try {
      if (editando) {
        await actualizar({
          variables: {
            id: Number(editando.idTipoRes),
            input: {
              codigo: form.codigo,
              nombre: form.nombre,
              nivelJerarquico: Number(form.nivelJerarquico),
              descripcion: form.descripcion || undefined,
            },
          },
        });
      } else {
        await crear({
          variables: {
            codigo: form.codigo,
            nombre: form.nombre,
            nivelJerarquico: Number(form.nivelJerarquico),
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
    if (!data?.eliminarTipoResolucion?.ok) {
      alert(
        data?.eliminarTipoResolucion?.mensaje ?? "No se pudo eliminar el tipo de resolución."
      );
      return;
    }
    refetch();
  };

  return (
    <PageShell
      title="Tipos de resolución"
      subtitle="Clasificación y jerarquía de resoluciones judiciales"
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
        headers={["Código", "Nombre", "Nivel jerárquico", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de resolución"
      >
        {tipos.map((t, i) => (
          <tr
            key={t.idTipoRes}
            style={{
              borderBottom:
                i < tipos.length - 1 ? `1px solid ${C.borderLight}` : "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  color: C.purple,
                  backgroundColor: "#2a1f3d",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                {t.codigo}
              </span>
            </td>
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>{t.nombre}</td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ color: C.yellow, letterSpacing: 2 }}>
                {nivelStars(t.nivelJerarquico)}
              </span>
              <span style={{ color: C.muted, fontSize: 11, marginLeft: 6 }}>
                Nivel {t.nivelJerarquico}
              </span>
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
              {t.descripcion ?? "—"}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(t)} color={C.blue} label="Editar" />
                <ActionBtn
                  onClick={() => eliminar(Number(t.idTipoRes))}
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
        <Modal onClose={() => setModal(false)} width={440}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar tipo de resolución" : "Nuevo tipo de resolución"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field
              label="Código *"
              value={form.codigo}
              onChange={f("codigo")}
              placeholder="Ej: SENT"
            />
            <Field
              label="Nivel jerárquico"
              value={form.nivelJerarquico}
              onChange={f("nivelJerarquico")}
              type="number"
            />
          </div>
          <Field
            label="Nombre *"
            value={form.nombre}
            onChange={f("nombre")}
            placeholder="Ej: Sentencia"
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
