import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login1() {
  const [email, setEmail] = useState("");
  const [passwd, setPasswd] = useState("");
  const [nom, setnom] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
  try {
    const res = await axios.post("http://localhost:3000/login", { email, passwd });
    localStorage.setItem("token", res.data.token);
    navigate("/");
  } catch (err) {
    alert("Erreur de connexion");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Connexion
        </h2>

        {/* Email */}
        <div className="mb-5">
          <label className="block mb-2 text-gray-700 font-medium">
            Email
          </label>
          <input
            type="email"
            placeholder="Entrer votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Mot de passe */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-700 font-medium">
            Mot de passe
          </label>
          <input
            type="password"
            placeholder="Entrer votre mot de passe"
            value={passwd}
            onChange={(e) => setPasswd(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bouton */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition duration-300"
        >
          Se connecter
        </button>

        {/* Lien */}
       <a href="/register">
         <p className="text-center text-gray-500 mt-6">
          Vous n'avez pas de compte ?{" "}
          <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
            S'inscrire
          </span>
        </p>
       </a>
      </div>
    </div>
  );
}

export default Login1;