import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { API_URL } from "../config";

const CARDS = [
  { key: "residences", label: "Résidences", icon: "fa-city", color: "bg-indigo-100 text-indigo-600" },
  { key: "appartements", label: "Appartements", icon: "fa-building", color: "bg-sky-100 text-sky-600" },
  { key: "coproprietaires", label: "Copropriétaires", icon: "fa-users", color: "bg-emerald-100 text-emerald-600" },
  { key: "reclamationsOuvertes", label: "Réclamations ouvertes", icon: "fa-exclamation-circle", color: "bg-rose-100 text-rose-600" },
  { key: "chargesImpayees", label: "Charges impayées (MAD)", icon: "fa-coins", color: "bg-amber-100 text-amber-600" },
  { key: "paiementsDuMois", label: "Paiements du mois (MAD)", icon: "fa-wallet", color: "bg-violet-100 text-violet-600" },
];

function StatCard({ label, icon, color, value, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <i className={`fas ${icon}`}></i>
      </span>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-700">
          {loading ? <span className="inline-block w-14 h-6 bg-slate-100 rounded animate-pulse" /> : value}
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, paiementsRes, reclamationsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/dashboard/paiements-recents`),
        axios.get(`${API_URL}/dashboard/reclamations-recentes`),
      ]);
      setStats(statsRes.data);
      setPaiements(paiementsRes.data);
      setReclamations(reclamationsRes.data);
    } catch (err) {
      const serverMessage = err.response?.data?.error;
      setError(
        serverMessage ||
          `Impossible de contacter le serveur (${API_URL}). Vérifiez que le backend est démarré : cd backend && npm start.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadData();
  }, [token, loadData]);

  if (!token) {
    return <h2 className="text-center mt-10">Accès refusé 🚫</h2>;
  }

  let nom = "";
  try {
    nom = jwtDecode(token).nom;
  } catch (err) {
    localStorage.removeItem("token");
    navigate("/login");
    return <h2 className="text-center mt-10">Session expirée, veuillez vous reconnecter.</h2>;
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-700">Tableau de bord</h1>
          <p className="text-slate-400 mt-1">Bienvenue {nom} ! Voici un aperçu de votre gestion.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <i className="fas fa-rotate-right"></i>
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4">
          <i className="fas fa-triangle-exclamation mt-0.5"></i>
          <div>
            <p className="font-semibold">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            color={card.color}
            loading={loading}
            value={stats ? stats[card.key] : "—"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-bold text-slate-700 mb-4">Derniers paiements</h2>
          {paiements.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun paiement à afficher.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {paiements.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-slate-700">{p.charge || "Charge"} — Apt {p.appartement || "?"}</p>
                    <p className="text-slate-400">
                      {p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : ""} · {p.mode_paiement}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600">{p.montant_paye} MAD</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-bold text-slate-700 mb-4">Dernières réclamations</h2>
          {reclamations.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune réclamation à afficher.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reclamations.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-slate-700">{r.sujet}</p>
                    <p className="text-slate-400">
                      Apt {r.appartement || "?"} ·{" "}
                      {r.date_reclamation ? new Date(r.date_reclamation).toLocaleDateString("fr-FR") : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                    {r.statut}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
