import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { VALIDATE_USER } from "../../graphql/mutations";
import toast from "react-hot-toast";

// 👇 Reemplaza esta URL con el link de tu logo
const LOGO_URL = "https://i.postimg.cc/BbmCyymq/justicia.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validateUser, { loading }] = useMutation(VALIDATE_USER);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // ✅ CORREGIDO: Ahora envía email Y password
      const { data } = await validateUser({ 
        variables: { email, password }  // ← Aquí está el cambio
      });
      
      if (data?.validateUser?.success) {
        const emailReal = data.validateUser.emailReal;
        toast.success("Usuario validado correctamente");
        navigate("/otp", { state: { email: emailReal } });
      } else {
        toast.error(data?.validateUser?.message || "Credenciales incorrectas");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al validar usuario");
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
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src={LOGO_URL}
            alt="Logo Tribunal Digital"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        <h1
          className="text-3xl font-bold text-center mb-1"
          style={{ color: "#1c2536" }}
        >
          Tribunal Digital
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: "#6b7280" }}>
          Ingresa tus credenciales
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium"
              style={{ color: "#1c2536" }}
            >
              Usuario (Correo)
            </label>
            <input
              id="email"
              type="text"
              placeholder="usuario o correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                color: "#1c2536",
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "#1c2536" }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                color: "#1c2536",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-colors duration-150 mt-2"
            style={{
              backgroundColor: loading ? "#2563eb99" : "#2563eb",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Validando..." : "Ingresar al Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}