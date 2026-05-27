import { useState, FormEvent } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { VALIDATE_USER } from "../../graphql/mutations";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const LOGO_URL = "https://i.postimg.cc/BbmCyymq/justicia.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validateUser, { loading }] = useMutation(VALIDATE_USER);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const { data } = await validateUser({ 
        variables: { email, password }
      });
      
      console.log("Respuesta:", data);
      
      if (data?.validateUser?.success) {
        // ✅ Usar camelCase (como devuelve el backend)
        const userData = {
          idUsuario: data.validateUser.idUsuario,
          email: data.validateUser.emailReal,
          nombre: data.validateUser.nombres,
          paterno: data.validateUser.paterno,
          rol: data.validateUser.rol,
          username: data.validateUser.username,
          permisos: data.validateUser.permisos || [],
        };
        
        const token = data.validateUser.token;
        
        console.log("👤 Usuario guardado:", userData);
        
        login(userData, token);
        
        toast.success(`Bienvenido ${userData.nombre} ${userData.paterno}`);
        navigate("/otp", { state: { email: userData.email } });
      } else {
        toast.error(data?.validateUser?.message || "Credenciales incorrectas");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al validar usuario");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl border border-gray-200">
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

        <h1 className="text-3xl font-bold text-center mb-1 text-gray-800">
          Tribunal Digital
        </h1>
        <p className="text-center text-sm mb-8 text-gray-500">
          Ingresa tus credenciales
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Usuario (Correo)
            </label>
            <input
              type="text"
              placeholder="usuario o correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-sm border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-sm border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? "Validando..." : "Ingresar al Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}