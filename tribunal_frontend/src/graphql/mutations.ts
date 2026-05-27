import { gql } from "@apollo/client";

export const VALIDATE_USER = gql`
  mutation ValidateUser($email: String!, $password: String!) {
    validateUser(email: $email, password: $password) {
      success
      message
      emailReal
      idUsuario
      nombres
      paterno
      rol
      username
      permisos
      token
    }
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOtp($email: String!, $code: String!) {
    verifyOtp(email: $email, code: $code) {
      success
      message
      token
      idUsuario
      emailReal
      nombres
      paterno
      rol
      username
      permisos
    }
  }
`;

export const OBTENER_QR = gql`
  mutation ObtenerQr($email: String!) {
    obtenerQr(email: $email) {
      success
      message
      qrBase64
      esNuevo
    }
  }
`;

export const REGENERAR_QR = gql`
  mutation RegenerarQr($email: String!) {
    regenerarQr(email: $email) {
      success
      message
    }
  }
`;