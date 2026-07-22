import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

function Login1() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (!token) {
    return <h2>Accès refusé 🚫</h2>;
  }

  try {
    const decoded = jwtDecode(token);

    const handleLogout = () => {
      localStorage.removeItem("token");
      navigate("/login");
    };

    return (
      <div className="flex justify-end items-center gap-4 p-5 bg-white shadow">
        <h2 className="text-lg font-semibold">
          Bonjour, {decoded.nom}
        </h2>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Déconnexion
        </button>
      </div>
    );
  } catch (error) {
    return <h2>Token invalide</h2>;
  }
}

export default Login1;