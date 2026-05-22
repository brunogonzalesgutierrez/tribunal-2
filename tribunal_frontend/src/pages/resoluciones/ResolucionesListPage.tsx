// ─── src/pages/resoluciones/ResolucionesListPage.tsx ─────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RESOLUCIONES,
  GET_TIPOS_RESOLUCION,
  GET_EXPEDIENTES_SIMPLE,
  CREAR_RESOLUCION,
  ACTUALIZAR_RESOLUCION,
  ELIMINAR_RESOLUCION,
} from "../../graphql/resoluciones";
import {
  C,
  ESTADO_RES_COLORS,
  EstadoBadge,
  Modal,
  Field,
  SelectField,
  TextareaField,
  Tabla,
  ActionBtn,
  ErrorBox,
  ModalFooter,
  PageShell,
  fmt,
  nivelLabel,
  Expediente,
  TipoResolucion,
  Resolucion,
} from "./shared";

export default function ResolucionesListPage() {
  const { data, loading, refetch } = useQuery(GET_RESOLUCIONES);
  const { data: dExp }  = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dTipo } = useQuery(GET_TIPOS_RESOLUCION);

  const [crear]      = useMutation(CREAR_RESOLUCION);
  const [actualizar] = useMutation(ACTUALIZAR_RESOLUCION);
  const [eliminar_m] = useMutation(ELIMINAR_RESOLUCION);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Resolucion | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  const initForm = {
    idExpediente: 0,
    idTipoRes: 0,
    numeroResolucion: "",
    fechaResolucion: "",
    parteDispositiva: "",
    fundamentacion: "",
    estado: "ACTIVA",
    esRecurrible: false,
    plazoRecursoDias: "0",
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const resoluciones: Resolucion[] = data?.allResoluciones ?? [];
  const expedientes: Expediente[]  = dExp?.allExpedientes ?? [];
  const tipos: TipoResolucion[]    = dTipo?.allTiposResolucion ?? [];

  const filtradas = resoluciones.filter((r) =>
    `${r.numeroResolucion} ${r.idExpediente.numeroExpediente} ${r.idTipoRes.nombre} ${r.estado}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => {
    setEdit(null);
    setForm(initForm);
    setErr("");
    setModal(true);
  };

  const abrirEditar = (r: Resolucion) => {
    setEdit(r);
    setForm({
      idExpediente: r.idExpediente.idExpediente,
      idTipoRes: r.idTipoRes.idTipoRes,
      numeroResolucion: r.numeroResolucion,
      fechaResolucion: r.fechaResolucion,
      parteDispositiva: r.parteDispositiva,
      fundamentacion: r.fundamentacion,
      estado: r.estado,
      esRecurrible: r.esRecurrible,
      plazoRecursoDias: String(r.plazoRecursoDias),
    });
    setErr("");
    setModal(true);
  };

  const guardar = async () => {
    if (!form.numeroResolucion || !form.fechaResolucion || !form.parteDispositiva) {
      setErr("Número, fecha y parte dispositiva son obligatorios.");
      return;
    }
    try {
      if (editando) {
        await actualizar({
          variables: {
            id: Number(editando.idResolucion),
            input: {
              idTipoRes: Number(form.idTipoRes) || undefined,
              numeroResolucion: form.numeroResolucion,
              fechaResolucion: form.fechaResolucion,
              parteDispositiva: form.parteDispositiva,
              fundamentacion: form.fundamentacion || undefined,
              estado: form.estado,
              esRecurrible: form.esRecurrible,
              plazoRecursoDias: Number(form.plazoRecursoDias),
            },
          },
        });
      } else {
        if (!form.idExpediente || !form.idTipoRes) {
          setErr("Expediente y tipo de resolución son obligatorios.");
          return;
        }
        await crear({
          variables: {
            input: {
              idExpediente: Number(form.idExpediente),
              idTipoRes: Number(form.idTipoRes),
              numeroResolucion: form.numeroResolucion,
              fechaResolucion: form.fechaResolucion,
              parteDispositiva: form.parteDispositiva,
              fundamentacion: form.fundamentacion || undefined,
            },
          },
        });
      }
      await refetch();
      setModal(false);
    } catch (e: any) {
      setErr(e.message ?? "Error al guardar.");
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta resolución?")) return;
    const { data } = await eliminar_m({ variables: { id: Number(id) } });
    if (!data?.eliminarResolucion?.ok) {
      alert(data?.eliminarResolucion?.mensaje ?? "No se pudo eliminar la resolución.");
      return;
    }
    refetch();
  };

  return (
    <PageShell title="Resoluciones" subtitle="Listado y gestión de resoluciones judiciales">

      {/* Barra superior */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          placeholder="Buscar por número, expediente, tipo o estado..."
          value={busqueda}
          onChange={(e) => setBusq(e.target.value)}
          style={{
            width: 320,
            padding: "8px 12px",
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            color: C.text,
            fontSize: 13,
            outline: "none",
          }}
        />
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
          + Nueva resolución
        </button>
      </div>

      {/* Tabla */}
      <Tabla
        headers={[
          "N° Resolución",
          "Expediente",
          "Tipo",
          "Fecha",
          "Estado",
          "Recurrible",
          "Parte dispositiva",
          "Acciones",
        ]}
        loading={loading}
        emptyMsg="No hay resoluciones registradas"
      >
        {filtradas.map((r, i) => (
          <tr
            key={r.idResolucion}
            style={{
              borderBottom:
                i < filtradas.length - 1 ? `1px solid ${C.borderLight}` : "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px" }}>
              <span style={{ fontFamily: "monospace", color: C.text, fontWeight: 600 }}>
                {r.numeroResolucion}
              </span>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ color: C.blue }}>#{r.idExpediente.numeroExpediente}</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 5 }}>
                {r.idExpediente.ano}
              </span>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: C.text }}>{r.idTipoRes.nombre}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                {nivelLabel(r.idTipoRes.nivelJerarquico)}
              </div>
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
              {fmt(r.fechaResolucion)}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <EstadoBadge estado={r.estado} mapa={ESTADO_RES_COLORS} />
            </td>
            <td style={{ padding: "12px 16px" }}>
              {r.esRecurrible ? (
                <span style={{ color: C.yellow, fontSize: 12 }}>
                  ⚠ Sí ({r.plazoRecursoDias}d)
                </span>
              ) : (
                <span style={{ color: C.muted, fontSize: 12 }}>No</span>
              )}
            </td>
            <td
              style={{
                padding: "12px 16px",
                color: C.muted,
                fontSize: 12,
                maxWidth: 200,
              }}
            >
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.parteDispositiva}
              </div>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(r)} color={C.blue} label="Editar" />
                <ActionBtn
                  onClick={() => eliminar(Number(r.idResolucion))}
                  color={C.red}
                  label="Eliminar"
                />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
        {filtradas.length} resolución{filtradas.length !== 1 ? "es" : ""}
      </div>

      {/* Modal */}
      {modal && (
        <Modal onClose={() => setModal(false)} width={600}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar resolución" : "Nueva resolución"}
          </h2>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              {!editando && (
                <SelectField
                  label="Expediente *"
                  value={form.idExpediente}
                  onChange={f("idExpediente")}
                >
                  <option value={0}>— Seleccionar expediente —</option>
                  {expedientes.map((e) => (
                    <option key={e.idExpediente} value={e.idExpediente}>
                      #{e.numeroExpediente} ({e.ano})
                    </option>
                  ))}
                </SelectField>
              )}
            </div>
            <SelectField
              label="Tipo de resolución *"
              value={form.idTipoRes}
              onChange={f("idTipoRes")}
            >
              <option value={0}>— Seleccionar tipo —</option>
              {tipos.map((t) => (
                <option key={t.idTipoRes} value={t.idTipoRes}>
                  {t.nombre} ({t.codigo})
                </option>
              ))}
            </SelectField>
            <Field
              label="N° de resolución *"
              value={form.numeroResolucion}
              onChange={f("numeroResolucion")}
              placeholder="Ej: RES-2024-001"
            />
            <Field
              label="Fecha de resolución *"
              value={form.fechaResolucion}
              onChange={f("fechaResolucion")}
              type="date"
            />
            {editando && (
              <SelectField label="Estado" value={form.estado} onChange={f("estado")}>
                <option value="ACTIVA">Activa</option>
                <option value="APELADA">Apelada</option>
                <option value="ANULADA">Anulada</option>
                <option value="FIRME">Firme</option>
              </SelectField>
            )}
          </div>

          <TextareaField
            label="Parte dispositiva *"
            value={form.parteDispositiva}
            onChange={f("parteDispositiva")}
            rows={3}
          />
          <TextareaField
            label="Fundamentación"
            value={form.fundamentacion}
            onChange={f("fundamentacion")}
            rows={4}
          />

          {editando && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 16px",
                alignItems: "end",
              }}
            >
              <Field
                label="Plazo de recurso (días)"
                value={form.plazoRecursoDias}
                onChange={f("plazoRecursoDias")}
                type="number"
              />
              <div style={{ marginBottom: 14, paddingBottom: 8 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: C.text,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.esRecurrible as unknown as boolean}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, esRecurrible: e.target.checked }))
                    }
                  />
                  Es recurrible
                </label>
              </div>
            </div>
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear resolución"}
          />
        </Modal>
      )}
    </PageShell>
  );
}
