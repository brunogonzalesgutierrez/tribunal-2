// src/hooks/useNotificaciones.ts
// Hook centralizado — úsalo en el Header Y en el Sidebar
// para que ambos compartan los mismos datos sin doble fetch.

import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";

// ─── Fragmento reutilizable ──────────────────────────────
const NOTIF_FIELDS = gql`
  fragment NotifFields on NotificacionType {
    idNotificacion
    tipoNotificacion
    estadoNotificacion
    fechaEmision
    fechaDiligencia
    idExpediente {
      idExpediente
      numeroExpediente
    }
    idDocumento {
      idDocumento
      titulo
    }
    idParte {
      idParte
      idPersona {
        nombre
        primerApellido
      }
      idRol { nombreRol }
    }
    usuario {
      idUsuario
      nombres
      paterno
    }
  }
`;

export const GET_NOTIFICACIONES_PANEL = gql`
  query GetNotificacionesPanel {
    allNotificaciones {
      ...NotifFields
    }
  }
  ${NOTIF_FIELDS}
`;

export const MARCAR_NOTIFICACION_LEIDA = gql`
  mutation MarcarLeida($id: Int!) {
    actualizarNotificacion(id: $id, input: { estadoNotificacion: "DILIGENCIADA" }) {
      notificacion {
        idNotificacion
        estadoNotificacion
      }
    }
  }
`;

export const MARCAR_TODAS_LEIDAS = gql`
  mutation MarcarTodasLeidas($ids: [Int]!) {
    # Se llama en loop desde el componente — ver helper abajo
    actualizarNotificacion(id: 0, input: { estadoNotificacion: "DILIGENCIADA" }) {
      notificacion { idNotificacion }
    }
  }
`;

// ─── Tipos ───────────────────────────────────────────────
export interface NotifItem {
  idNotificacion: number;
  tipoNotificacion: string;
  estadoNotificacion: "PENDIENTE" | "DILIGENCIADA" | "FALLIDA";
  fechaEmision: string | null;
  fechaDiligencia: string | null;
  idExpediente?: { idExpediente: number; numeroExpediente: string };
  idDocumento?: { idDocumento: number; titulo: string };
  idParte?: {
    idParte: number;
    idPersona: { nombre: string; primerApellido: string };
    idRol?: { nombreRol: string };
  };
  usuario?: { idUsuario: number; nombres: string; paterno: string };
}

// ─── Hook principal ──────────────────────────────────────
export function useNotificaciones(pollInterval = 30_000) {
  const { data, loading, refetch } = useQuery(GET_NOTIFICACIONES_PANEL, {
    fetchPolicy: "cache-and-network",
    pollInterval, // refresca automáticamente cada 30 s
  });

  const [marcarLeida] = useMutation(MARCAR_NOTIFICACION_LEIDA, {
    refetchQueries: [{ query: GET_NOTIFICACIONES_PANEL }],
  });

  const todas: NotifItem[] = data?.allNotificaciones ?? [];
  const pendientes  = todas.filter(n => n.estadoNotificacion === "PENDIENTE");
  const recientes   = [...todas]
    .sort((a, b) => (b.fechaEmision ?? "").localeCompare(a.fechaEmision ?? ""))
    .slice(0, 10); // últimas 10 para el panel

  const marcarTodas = async () => {
    // Marca todas las PENDIENTES como DILIGENCIADAS en paralelo
    await Promise.all(
      pendientes.map(n =>
        marcarLeida({ variables: { id: Number(n.idNotificacion) } })
      )
    );
    refetch();
  };

  const marcarUna = (id: number) =>
    marcarLeida({ variables: { id } });

  return {
    todas,
    pendientes,
    recientes,
    totalPendientes: pendientes.length,
    loading,
    marcarUna,
    marcarTodas,
    refetch,
  };
}
