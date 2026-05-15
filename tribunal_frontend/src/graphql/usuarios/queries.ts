import { gql } from "@apollo/client";

// ─── USUARIOS ───────────────────────────────────────────
export const GET_USUARIOS = gql`
  query {
    allUsuarios {
      idUsuario
      nombres
      paterno
      materno
      email
      username
      documentoIdentidad
      cargoOficial
      activo
      fechaCreacion
      ultimoAcceso
      rol { idRol nombre }
    }
  }
`;

export const CREAR_USUARIO = gql`
  mutation CrearUsuario($input: CrearUsuarioInput!) {
    crearUsuario(input: $input) {
      usuario {
        idUsuario
        nombres
        paterno
        email
        username
        activo
        rol { idRol nombre }
      }
    }
  }
`;

export const ACTUALIZAR_USUARIO = gql`
  mutation ActualizarUsuario($id: Int!, $input: ActualizarUsuarioInput!) {
    actualizarUsuario(id: $id, input: $input) {
      usuario {
        idUsuario
        nombres
        paterno
        email
        cargoOficial
        activo
        rol { idRol nombre }
      }
    }
  }
`;

export const ELIMINAR_USUARIO = gql`
  mutation EliminarUsuario($id: Int!) {
    eliminarUsuario(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── ROLES ──────────────────────────────────────────────
export const GET_ROLES = gql`
  query {
    allRoles {
      idRol
      nombre
      descripcion
      activo
      fechaCreacion
      permisosAsignados {
        idRolPermiso
        permiso {
          idPermiso
          nombre
          codigo
          modulo
        }
      }
    }
  }
`;

export const CREAR_ROL = gql`
  mutation CrearRol($nombre: String!, $descripcion: String) {
    crearRol(nombre: $nombre, descripcion: $descripcion) {
      rol {
        idRol
        nombre
        descripcion
        activo
      }
    }
  }
`;

export const ACTUALIZAR_ROL = gql`
  mutation ActualizarRol($id: Int!, $input: ActualizarRolInput!) {
    actualizarRol(id: $id, input: $input) {
      rol {
        idRol
        nombre
        descripcion
        activo
      }
    }
  }
`;

export const ELIMINAR_ROL = gql`
  mutation EliminarRol($id: Int!) {
    eliminarRol(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── PERMISOS ────────────────────────────────────────────
export const GET_PERMISOS = gql`
  query {
    allPermisos {
      idPermiso
      nombre
      codigo
      modulo
      descripcion
    }
  }
`;

export const CREAR_PERMISO = gql`
  mutation CrearPermiso(
    $nombre: String!
    $codigo: String!
    $modulo: String!
    $descripcion: String
  ) {
    crearPermiso(
      nombre: $nombre
      codigo: $codigo
      modulo: $modulo
      descripcion: $descripcion
    ) {
      permiso {
        idPermiso
        nombre
        codigo
        modulo
        descripcion
      }
    }
  }
`;

export const ACTUALIZAR_PERMISO = gql`
  mutation ActualizarPermiso($id: Int!, $input: ActualizarPermisoInput!) {
    actualizarPermiso(id: $id, input: $input) {
      permiso {
        idPermiso
        nombre
        codigo
        modulo
        descripcion
      }
    }
  }
`;

export const ELIMINAR_PERMISO = gql`
  mutation EliminarPermiso($id: Int!) {
    eliminarPermiso(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── ASIGNAR / REMOVER PERMISO DE ROL ───────────────────
export const ASIGNAR_PERMISO_ROL = gql`
  mutation AsignarPermisoARol($idRol: Int!, $idPermiso: Int!) {
    asignarPermisoARol(idRol: $idRol, idPermiso: $idPermiso) {
      rolPermiso {
        idRolPermiso
      }
    }
  }
`;

export const REMOVER_PERMISO_ROL = gql`
  mutation RemoverPermisoDeRol($idRol: Int!, $idPermiso: Int!) {
    removerPermisoDeRol(idRol: $idRol, idPermiso: $idPermiso) {
      ok
    }
  }
`;