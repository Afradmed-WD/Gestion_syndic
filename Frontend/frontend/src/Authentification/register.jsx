import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

function Register() {
  const [nom, setnom] = useState("");
  const [email, setemail] = useState("");
  const [passwd, setpasswd] = useState("");
  const [showPasswd, setShowPasswd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handelsubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/register", {
        nom,
        email,
        passwd,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        {/* Panneau de marque */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-b from-indigo-800 to-indigo-600 text-white p-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <img src={logo} className="h-6" alt="" />
            </div>
            <div>
              <p className="font-extrabold leading-tight text-lg">SyndicPro</p>
              <p className="text-[11px] text-indigo-200 leading-tight">Gestion de copropriété</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold leading-snug mb-3">
              Créez votre compte <br /> en quelques secondes.
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Rejoignez SyndicPro pour piloter vos résidences, suivre les charges et communiquer avec les
              copropriétaires depuis un seul espace.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: "fa-bolt", label: "Mise en route rapide" },
              { icon: "fa-shield-halved", label: "Données sécurisées" },
              { icon: "fa-headset", label: "Support dédié" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 text-sm text-indigo-100">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <i className={`fas ${f.icon}`}></i>
                </span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center">
              <img src={logo} className="h-6" alt="" />
            </div>
            <div>
              <p className="font-extrabold leading-tight text-slate-700">SyndicPro</p>
              <p className="text-[11px] text-slate-400 leading-tight">Gestion de copropriété</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-700 mb-1">Inscription</h2>
          <p className="text-slate-400 text-sm mb-8">Créez votre compte administrateur.</p>

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
              <i className="fas fa-circle-exclamation"></i>
              {error}
            </p>
          )}

          <form onSubmit={handelsubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nom</label>
              <div className="relative">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                <input
                  type="text"
                  placeholder="Votre nom complet"
                  value={nom}
                  onChange={(e) => setnom(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                <input
                  type="email"
                  placeholder="vous@syndicpro.com"
                  value={email}
                  onChange={(e) => setemail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mot de passe</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                <input
                  type={showPasswd ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwd}
                  onChange={(e) => setpasswd(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswd((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-sm"
                >
                  <i className={`fas ${showPasswd ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Minimum 6 caractères.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white py-3 rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  Inscription...
                </>
              ) : (
                <>
                  S'inscrire
                  <i className="fas fa-arrow-right text-sm"></i>
                </>
              )}
            </button>
          </form>

          <a href="/login">
            <p className="text-center text-slate-400 mt-8 text-sm">
              Vous avez déjà un compte ?{" "}
              <span className="text-indigo-600 font-semibold hover:underline">Se connecter</span>
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Register;