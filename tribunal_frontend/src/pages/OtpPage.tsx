import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate, useLocation } from "react-router-dom";
import { VERIFY_OTP, OBTENER_QR, REGENERAR_QR } from "../graphql/mutations";
import { useAuth } from "../context/AuthContext";

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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0d1117" }}>
      <div className="p-8 rounded-xl w-full max-w-md" style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}>
        <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#e6edf3" }}>Verificación 2FA</h1>
        <p className="text-center text-sm mb-1" style={{ color: "#8b949e" }}>
          {esNuevo ? "Primera vez: escanea el QR y luego ingresa el código" : "Ingresa el código de tu aplicación autenticadora"}
        </p>
        <p className="text-center text-xs mb-6" style={{ color: "#58a6ff" }}>{email}</p>

        {qrImage && esNuevo && (
          <div className="flex flex-col items-center mb-6">
            <img src={`data:image/png;base64,${qrImage}`} alt="QR" className="w-48 h-48 rounded-lg" style={{ border: "1px solid #30363d" }} />
            <p className="text-xs mt-2" style={{ color: "#8b949e" }}>Escanea con Google Authenticator</p>
          </div>
        )}

        {mensajeQr && (
          <div className="text-sm rounded-lg p-3 mb-4 text-center" style={{ backgroundColor: "#1f3a5f", border: "1px solid #388bfd", color: "#79c0ff" }}>
            {mensajeQr}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="000000" value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6} required
            className="w-full px-4 py-3 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none"
            style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", letterSpacing: "0.4em" }}
          />
          {error && <p className="text-sm" style={{ color: "#f85149" }}>{error.message}</p>}
          <button type="submit" disabled={loading || code.length !== 6}
            className="w-full py-2 rounded-lg text-sm font-medium transition"
            style={{ backgroundColor: code.length === 6 ? "#238636" : "#21262d", color: "#ffffff" }}>
            {loading ? "Verificando..." : "Verificar código"}
          </button>
        </form>

        <div className="mt-4 pt-4" style={{ borderTop: "1px solid #30363d" }}>
          <p className="text-xs text-center mb-2" style={{ color: "#8b949e" }}>¿Borraste Google Authenticator?</p>
          <button onClick={handleRegenerarQr} disabled={loadingRegen}
            className="w-full py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#1f3a5f", color: "#79c0ff" }}>
            {loadingRegen ? "Regenerando..." : "Regenerar mi QR"}
          </button>
        </div>
      </div>
    </div>
  );
}