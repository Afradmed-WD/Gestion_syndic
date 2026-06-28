import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login1() {
  const [email, setEmail] = useState("");
  const [passwd, setPasswd] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:3000/login", { email, passwd });
      alert("Connexion réussie !");
      navigate("/login1"); // 🔁 Redirection vers le composant Login1
    } catch (err) {
      alert("Erreur de connexion");
    }
  };

  return (
    <div className="flex flex-col w-80 mx-auto mt-20">
      <input
        type="email"
        placeholder="Email"
        className="border p-2 mb-2 rounded"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 mb-4 rounded"
        onChange={(e) => setPasswd(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Login
      </button>
    </div>
  );
}

export default Login1;
