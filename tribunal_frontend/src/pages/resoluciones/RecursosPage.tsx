// ─── src/pages/resoluciones/RecursosPage.tsx ─────────────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RECURSOS,
  GET_RESOLUCIONES,
  GET_TIPOS_RECURSO,
  GET_PARTES_PROCESALES_SIMPLE,
  CREAR_RECURSO,
  ACTUALIZAR_RECURSO,
  ELIMINAR_RECURSO,
} from "../../graphql/resoluciones";
import {
  C,
  ESTADO_REC_COLORS,
  EstadoBadge,
  Modal,
  SelectField,
  TextareaField,
  Tabla,
  ActionBtn,
  ErrorBox,
  ModalFooter,
  PageShell,
  fmt,
  Resolucion,
  TipoRecurso,
  ParteProcesal,
  Recurso,
} from "./shared";

export default function RecursosPage() {
  const { data, loading, refetch } = useQuery(GET_RECURSOS);
  const { data: dRes }    = useQuery(GET_RESOLUCIONES);
  const { data: dTipo }   = useQuery(GET_TIPOS_RECURSO);
  const { data: dPartes } = useQuery(GET_PARTES_PROCESALES_SIMPLE);

  const [crear]      = useMutation(CREAR_RECURSO);
  const [actualizar] = useMutation(ACTUALIZAR_RECURSO);
  const [eliminar_m] = useMutation(ELIMINAR_RECURSO);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Recurso | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  const initForm = {
    idResolucionImpugnada: 0,
    idTipoRecurso: 0,
    idRecurrente: 0,
    fundamentos: "",
    estadoRecurso: "PENDIENTE",
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const recursos: Recurso[]     = data?.allRecursos ?? [];
  const resoluciones            = dRes?.allResoluciones ?? [];
  const tipos: TipoRecurso[]    = dTipo?.allTiposRecurso ?? [];
  const partes: ParteProcesal[] = dPartes?.allPartesProcesales ?? [];

  const filtrados = recursos.filter((r) =>
    `${r.idResolucionImpugnada.numeroResolucion} ${r.idTipoRecurso.nombre} ${r.estadoRecurso} ${r.idRecurrente.idPersona.nombre}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => {
    setEdit(null);
    setForm(initForm);
    setErr("");
    setModal(true);
  };

  const abrirEditar = (r: Recurso) => {
    setEdit(r);
    setForm({ ...initForm, estadoRecurso: r.estadoRecurso, fundamentos: r.fundamentos });
    setErr("");
    setModal(true);
  };

  const guardar = async () => {
    try {
      if (editando) {
        await actualizar({
          variables: {
            id: Number(editando.idRecurso),
            input: {
              estadoRecurso: form.estadoRecurso,
              fundamentos: form.fundamentos || undefined,
            },
          },
        });
      } else {
        if (!form.idResolucionImpugnada || !form.idTipoRecurso || !form.idRecurrente) {
          setErr("Resolución, tipo de recurso y parte recurrente son obligatorios.");
          return;
        }
        await crear({
          variables: {
            idResolucionImpugnada: Number(form.idResolucionImpugnada),
            idTipoRecurso: Number(form.idTipoRecurso),
            idRecurrente: Number(form.idRecurrente),
            fundamentos: form.fundamentos || undefined,
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
    if (!window.confirm("¿Eliminar este recurso?")) return;
    const { data } = await eliminar_m({ variables: { id: Number(id) } });
    if (!data?.eliminarRecurso?.ok) {
      alert(data?.eliminarRecurso?.mensaje ?? "No se pudo eliminar el recurso.");
      return;
    }
    refetch();
  };

  return (
    <PageShell title="Recursos" subtitle="Interposición y seguimiento de recursos legales">

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
          placeholder="Buscar por resolución, tipo, estado o recurrente..."
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
          + Nuevo recurso
        </button>
      </div>

      {/* Tabla */}
      <Tabla
        headers={[
          "Resolución impugnada",
          "Tipo de recurso",
          "Recurrente",
          "Rol procesal",
          "Fecha",
          "Estado",
          "Exp. alzada",
          "Acciones",
        ]}
        loading={loading}
        emptyMsg="No hay recursos registrados"
      >
        {filtrados.map((r, i) => (
          <tr
            key={r.idRecurso}
            style={{
              borderBottom:
                i < filtrados.length - 1 ? `1px solid ${C.borderLight}` : "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px" }}>
              <span
                style={{ fontFamily: "monospace", color: C.text, fontWeight: 500 }}
              >
                {r.idResolucionImpugnada.numeroResolucion}
              </span>
              <div style={{ fontSize: 11, color: C.muted }}>
                #{r.idResolucionImpugnada.idExpediente.numeroExpediente}
              </div>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <span
                style={{
                  backgroundColor: "#1c2d3a",
                  color: C.blue,
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                {r.idTipoRecurso.nombre}
              </span>
            </td>
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>
              {r.idRecurrente.idPersona.nombre} {r.idRecurrente.idPersona.primerApellido}
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
              {r.idRecurrente.idRol.nombreRol}
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
              {fmt(r.fechaInterposicion)}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <EstadoBadge estado={r.estadoRecurso} mapa={ESTADO_REC_COLORS} />
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
              {r.idExpedienteAlzada ? (
                <span style={{ color: C.blue }}>
                  #{r.idExpedienteAlzada.numeroExpediente}
                </span>
              ) : (
                "—"
              )}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(r)} color={C.blue} label="Editar" />
                <ActionBtn
                  onClick={() => eliminar(Number(r.idRecurso))}
                  color={C.red}
                  label="Eliminar"
                />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
        {filtrados.length} recurso{filtrados.length !== 1 ? "s" : ""}
      </div>

      {/* Modal */}
      {modal && (
        <Modal onClose={() => setModal(false)} width={560}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar recurso" : "Nuevo recurso"}
          </h2>

          {!editando && (
            <>
              <SelectField
                label="Resolución impugnada *"
                value={form.idResolucionImpugnada}
                onChange={f("idResolucionImpugnada")}
              >
                <option value={0}>— Seleccionar resolución —</option>
                {resoluciones
                  .filter((r: Resolucion) => r.esRecurrible)
                  .map((r: Resolucion) => (
                    <option key={r.idResolucion} value={r.idResolucion}>
                      {r.numeroResolucion} — #{r.idExpediente.numeroExpediente}
                    </option>
                  ))}
              </SelectField>
              <SelectField
                label="Tipo de recurso *"
                value={form.idTipoRecurso}
                onChange={f("idTipoRecurso")}
              >
                <option value={0}>— Seleccionar tipo —</option>
                {tipos.map((t) => (
                  <option key={t.idTipoRecurso} value={t.idTipoRecurso}>
                    {t.nombre}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Parte recurrente *"
                value={form.idRecurrente}
                onChange={f("idRecurrente")}
              >
                <option value={0}>— Seleccionar parte procesal —</option>
                {partes
                  .filter((p) => p.activo)
                  .map((p) => (
                    <option key={p.idParte} value={p.idParte}>
                      {p.idPersona.nombre} {p.idPersona.primerApellido} ({p.idRol.nombreRol}
                      ) — Exp. #{p.idExpediente.numeroExpediente}
                    </option>
                  ))}
              </SelectField>
            </>
          )}

          {editando && (
            <SelectField
              label="Estado del recurso"
              value={form.estadoRecurso}
              onChange={f("estadoRecurso")}
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="ADMITIDO">Admitido</option>
              <option value="RECHAZADO">Rechazado</option>
              <option value="RESUELTO">Resuelto</option>
            </SelectField>
          )}

          <TextareaField
            label="Fundamentos"
            value={form.fundamentos}
            onChange={f("fundamentos")}
            rows={5}
          />

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Interponer recurso"}
          />
        </Modal>
      )}
    </PageShell>
  );
}
