import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [nom, setnom] = useState("");
  const [email, setemail] = useState("");
  const [passwd, setpasswd] = useState("");
  const navigate = useNavigate();

  const handelsubmit = async () => {
    try {
      const res = await axios.post("http://localhost:3000/register", {
        nom,
        email,
        passwd,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/"); 
    } catch (err) {
      alert("Erreur de l'inscription");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Inscription
        </h2>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handelsubmit();
          }}
        >
         
          <div>
            <label className="block text-gray-700 font-medium mb-2">Nom</label>
            <input
              type="text"
              placeholder="Donner votre nom"
              value={nom}
              onChange={(e) => setnom(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

         
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="Donner votre email"
              value={email}
              onChange={(e) => setemail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

         
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="********"
              value={passwd}
              onChange={(e) => setpasswd(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

         
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            S'inscrire
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
