import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate, useLocation } from "react-router-dom";
import { VERIFY_OTP, OBTENER_QR, REGENERAR_QR } from "../../graphql/mutations";
import { useAuth } from "../../context/AuthContext";

export default function OtpPage() {
  const [code, setCode] = useState("");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [mensajeQr, setMensajeQr] = useState<string | null>(null);

  const [verifyOtp, { loading, error }] = useMutation(VERIFY_OTP);
  const [obtenerQr] = useMutation(OBTENER_QR);
  const [regenerarQr, { loading: loadingRegen }] = useMutation(REGENERAR_QR);

  const navigate = useNavigate();
  const location = useLocation();
  const { setUsuario } = useAuth();

  const email = (location.state as { email?: string })?.email ?? "";

  const cargarQr = () => {
    if (!email) return;
    obtenerQr({ variables: { email } }).then(({ data }) => {
      if (data?.obtenerQr?.success) {
        setQrImage(data.obtenerQr.qrBase64);
        setEsNuevo(data.obtenerQr.esNuevo);
      }
    });
  };

  useEffect(() => { cargarQr(); }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const { data } = await verifyOtp({ variables: { email, code } });

    if (data?.verifyOtp?.success) {
      localStorage.setItem("userEmail", email);
      localStorage.setItem("token", data.verifyOtp.token);
      setUsuario({
        email,
        nombre: email.split("@")[0],
        paterno: "",
        rol: "usuario",
        idUsuario: null,
      });
      navigate("/dashboard");
    }
  };

  const handleRegenerarQr = async () => {
    const { data } = await regenerarQr({ variables: { email } });
    if (data?.regenerarQr?.success) {
      obtenerQr({ variables: { email } }).then(({ data }) => {
        if (data?.obtenerQr?.success) {
          setQrImage(data.obtenerQr.qrBase64);
          setEsNuevo(true);
        }
      });
      setMensajeQr("QR regenerado. Escanea el nuevo código con Google Authenticator.");
      setCode("");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#f0f2f5" }}
    >
      <div
        className="p-8 rounded-2xl w-full max-w-md shadow-xl"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e1e4e8" }}
      >
        <h1
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: "#1c2536" }}
        >
          Verificación 2FA
        </h1>
        <p className="text-center text-sm mb-1" style={{ color: "#6b7280" }}>
          {esNuevo
            ? "Primera vez: escanea el QR y luego ingresa el código"
            : "Ingresa el código de tu aplicación autenticadora"}
        </p>
        <p className="text-center text-xs mb-6" style={{ color: "#2563eb" }}>
          {email}
        </p>

        {qrImage && esNuevo && (
          <div className="flex flex-col items-center mb-6">
            <img
              src={`data:image/png;base64,${qrImage}`}
              alt="QR"
              className="w-48 h-48 rounded-lg"
              style={{ border: "1px solid #d1d5db" }}
            />
            <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
              Escanea con Google Authenticator
            </p>
          </div>
        )}

        {mensajeQr && (
          <div
            className="text-sm rounded-lg p-3 mb-4 text-center"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #93c5fd",
              color: "#1d4ed8",
            }}
          >
            {mensajeQr}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
            className="w-full px-4 py-3 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              color: "#1c2536",
              letterSpacing: "0.4em",
            }}
          />
          {error && (
            <p className="text-sm" style={{ color: "#dc2626" }}>
              {error.message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-colors duration-150"
            style={{
              backgroundColor: code.length === 6 ? "#2563eb" : "#e5e7eb",
              color: code.length === 6 ? "#ffffff" : "#9ca3af",
              cursor: code.length === 6 ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Verificando..." : "Verificar código"}
          </button>
        </form>

        <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e1e4e8" }}>
          <p className="text-xs text-center mb-2" style={{ color: "#6b7280" }}>
            ¿Borraste Google Authenticator?
          </p>
          <button
            onClick={handleRegenerarQr}
            disabled={loadingRegen}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #93c5fd",
              color: "#1d4ed8",
              cursor: loadingRegen ? "not-allowed" : "pointer",
            }}
          >
            {loadingRegen ? "Regenerando..." : "Regenerar mi QR"}
          </button>
        </div>
      </div>
    </div>
  );
}