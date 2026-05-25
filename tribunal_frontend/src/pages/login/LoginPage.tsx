import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { VALIDATE_USER } from "../../graphql/mutations";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [validateUser, { loading, error }] = useMutation(VALIDATE_USER);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await validateUser({ variables: { email } });
    if (data?.validateUser?.success) {
      navigate("/otp", { state: { email } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0d1117" }}>
      <div className="p-8 rounded-xl w-full max-w-md" style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}>
        <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#e6edf3" }}>Iniciar sesión</h1>
        <p className="text-center text-sm mb-6" style={{ color: "#8b949e" }}>Ingresa tu correo para continuar</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", color: "#e6edf3" }}
          />
          {error && <p className="text-sm" style={{ color: "#f85149" }}>{error.message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-medium transition"
            style={{ backgroundColor: "#238636", color: "#ffffff" }}
          >
            {loading ? "Validando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}