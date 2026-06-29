import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
function Login1() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  if (!token) {
    return <h2>Accès refusé 🚫 — veuillez vous connecter</h2>;
  }
  try {
    const decoded = jwtDecode(token);
    const handleLogout = () => {
      localStorage.removeItem("token");
      navigate("/");
    };
    return (
      <div className="h-screen w-32 bg-white shadow-lg flex flex-col justify-between">
        {/* Logo en haut */}
        <div className="p-0 m-0">
          <img src={logo} alt="Logo" className="h-20" />
        </div>
        {/* Profil utilisateur en bas */}
        <div className="p-2 border-t flex flex-col items-center space-y-2">
          <img
            src="https://i.pravatar.cc/60"
            alt="avatar"
            className="w-8 h-8 rounded-full border-2 border-blue-500"
          />
          <span className="font-semibold text-gray-700 text-[10px]">{decoded.nom}</span>
         <button
  onClick={handleLogout}
  className="text-blue-500 hover:text-red-700 text-xl"
>
  <i className="fas fa-sign-out-alt"></i>
</button>
        </div>
      </div>
    );
  } catch (error) {
    return <h2>Token invalide ou expiré</h2>;
  }
}
export default Login1;
