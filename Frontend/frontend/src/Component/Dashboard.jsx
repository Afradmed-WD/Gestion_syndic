import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/dashboard";

const NAV_GESTION = [
  { icon: "fa-users", label: "coproprietaires" },
  { icon: "fa-building", label: "Appartements" },
  { icon: "fa-wallet", label: "Paiements" },
  { icon: "fa-exclamation-circle", label: "Réclamations" },
  { icon: "fa-bullhorn", label: "Annonces" },
  { icon: "fa-file-alt", label: "Documents" },
];
const NAV_COMPTA = [
  { icon: "fa-coins", label: "Charges" },
  { icon: "fa-file-invoice", label: "Factures" },
  { icon: "fa-hand-holding-usd", label: "Dépenses" },
];
const NAV_PARAMS = [
  { icon: "fa-city", label: "Résidences" },
  { icon: "fa-user-friends", label: "Utilisateurs" },
  { icon: "fa-cog", label: "Paramètres" },
];

const CHARGE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#94a3b8"];

function NavSection({ title, items }) {
  return (
    <div className="mt-6">
      <p className="px-6 text-[11px] font-bold tracking-widest text-indigo-300 mb-2">{title}</p>
      {items.map((item) => (
        <a  key={item.label} href={item.label} className="flex items-center gap-3 px-4 py-2.5 text-indigo-100 hover:bg-white/10 rounded-lg mx-2 transition-colors text-sm">
          <i className={`fas ${item.icon} w-4 text-center text-indigo-200`}></i>
          {item.label}
        </a>
      ))}
    </div>
  );
}

function StatCard({ icon, bg, label, value, suffix, trend, up }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-white shrink-0`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-700 mt-0.5">
            {value ?? "–"} {suffix && <span className="text-sm font-semibold text-slate-400">{suffix}</span>}
          </p>
        </div>
      </div>
      <p className={`text-xs font-semibold mt-3 flex items-center gap-1 ${up ? "text-emerald-500" : "text-rose-500"}`}>
        <i className={`fas ${up ? "fa-arrow-up" : "fa-arrow-down"}`}></i>
        {trend}
      </p>
    </div>
  );
}

function LineChart({ evolution }) {
  if (!evolution?.length) return <p className="text-sm text-slate-400 py-10 text-center">Aucune donnée</p>;
  const max = Math.max(...evolution.flatMap((e) => [e.payes, e.impayes]), 1);
  const step = 490 / (evolution.length - 1 || 1);
  const toY = (v) => 220 - (v / max) * 200;
  const xs = evolution.map((_, i) => 40 + i * step);
  const purplePts = xs.map((x, i) => `${x},${toY(evolution[i].payes)}`).join(" ");
  const pinkPts = xs.map((x, i) => `${x},${toY(evolution[i].impayes)}`).join(" ");
  const areaPts = `${xs[0]},220 ${purplePts} ${xs[xs.length - 1]},220`;

  return (
    <svg viewBox="0 0 570 250" className="w-full h-64">
      <defs>
        <linearGradient id="paidArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {xs.map((x, i) => (
        <text key={i} x={x} y="238" fontSize="11" fill="#94a3b8" textAnchor="middle">{evolution[i].mois}</text>
      ))}
      <polygon points={areaPts} fill="url(#paidArea)" />
      <polyline points={pinkPts} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5,5" strokeLinecap="round" />
      <polyline points={purplePts} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={`p${i}`} cx={x} cy={toY(evolution[i].payes)} r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />)}
      {xs.map((x, i) => <circle key={`u${i}`} cx={x} cy={toY(evolution[i].impayes)} r="3" fill="#f43f5e" stroke="white" strokeWidth="1.5" />)}
    </svg>
  );
}

function Donut({ charges, total }) {
  const r = 62;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;
  if (!charges?.length) return <p className="text-sm text-slate-400 py-10 text-center">Aucune donnée</p>;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 160 160" className="w-40 h-40 -rotate-90">
          {charges.map((c, i) => {
            const dash = (c.pct / 100) * circumference;
            const seg = (
              <circle key={c.label} cx="80" cy="80" r={r} fill="none" stroke={CHARGE_COLORS[i % CHARGE_COLORS.length]}
                strokeWidth="18" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offsetAcc} />
            );
            offsetAcc += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-lg font-bold text-slate-700 leading-tight">{total ?? "–"}</p>
          <p className="text-[11px] text-slate-400">MAD</p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {charges.map((c, i) => (
          <div key={c.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHARGE_COLORS[i % CHARGE_COLORS.length] }}></span>
            <span className="text-slate-500 w-20">{c.label}</span>
            <span className="font-semibold text-slate-700">{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Login1() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <h2 className="text-center mt-10">Accès refusé 🚫</h2>;

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch {
    return <h2>Token invalide</h2>;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const stats = data?.stats;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-700">

      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-indigo-800 to-indigo-600 text-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <img src={logo} className="h-6" alt="" />
          </div>
          <div>
            <p className="font-extrabold leading-tight">SyndicPro</p>
            <p className="text-[11px] text-indigo-200 leading-tight">Gestion de copropriété</p>
          </div>
        </div>

        <div className="px-4 mt-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white text-indigo-700 rounded-xl font-semibold text-sm shadow-sm">
            <i className="fas fa-th-large w-4 text-center"></i>
            Tableau de bord
          </a>
        </div>

        <NavSection title="GESTION" items={NAV_GESTION} />
        <NavSection title="COMPTABILITÉ" items={NAV_COMPTA} />
        <NavSection title="PARAMÈTRES" items={NAV_PARAMS} />

        <div className="flex-1"></div>

        <div className="m-4 bg-white/10 rounded-2xl p-4">
          <p className="font-bold text-sm">Besoin d'aide ?</p>
          <p className="text-xs text-indigo-200 mt-1 mb-3">Notre support est disponible 7j/7.</p>
          <button className="w-full bg-white text-indigo-700 text-sm font-semibold py-2 rounded-lg hover:bg-indigo-50 transition-colors">
            Contacter le support
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 overflow-auto">

        <div className="flex items-center justify-between gap-4 px-8 py-4 bg-white border-b border-slate-100">
          <div className="relative w-full max-w-md">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
            <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <button className="relative w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
              <i className="fas fa-bell text-slate-400"></i>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">3</span>
            </button>
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/80" className="w-10 h-10 rounded-full" alt="" />
              <div>
                <p className="font-bold text-sm leading-tight">{decoded.nom}</p>
                <p className="text-xs text-slate-400 leading-tight">Administrateur</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-700">Tableau de bord</h1>
            <p className="text-slate-400 mt-1">Bienvenue de retour ! Voici un aperçu de votre gestion.</p>
          </div>

          {loading && <p className="text-slate-400">Chargement des données...</p>}
          {error && <p className="text-rose-500">Erreur : {error}</p>}

          {!loading && !error && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-5 mb-6">
                <StatCard icon="fa-users" bg="bg-violet-500" label="Copropriétaires" value={stats?.coproprietaires?.value} trend={stats?.coproprietaires?.trend} up />
                <StatCard icon="fa-building" bg="bg-blue-500" label="Appartements" value={stats?.appartements?.value} trend={stats?.appartements?.trend} up />
                <StatCard icon="fa-money-bill-wave" bg="bg-emerald-500" label="Paiements reçus" value={stats?.paiements?.value} suffix="MAD" trend={stats?.paiements?.trend} up />
                <StatCard icon="fa-exclamation-triangle" bg="bg-orange-500" label="Réclamations" value={stats?.reclamations?.value} trend={stats?.reclamations?.trend} up={false} />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-3 gap-5 mb-6">
                <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="font-bold text-slate-700 mb-2">Évolution des paiements</h2>
                  <LineChart evolution={data?.evolution} />
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="font-bold text-slate-700 mb-4">Répartition des charges</h2>
                  <Donut charges={data?.charges} total={data?.totalCharges} />
                </div>
              </div>

              {/* Lists */}
              <div className="grid grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="font-bold text-slate-700 mb-4">Dernières réclamations</h2>
                  <div className="flex flex-col gap-4">
                    {data?.reclamations?.length ? data.reclamations.map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{c.titre}</p>
                          <p className="text-xs text-slate-400">{c.appartement} · {c.date}</p>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">{c.statut}</span>
                      </div>
                    )) : <p className="text-sm text-slate-400">Aucune réclamation</p>}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="font-bold text-slate-700 mb-4">Derniers paiements</h2>
                  <div className="flex flex-col gap-4">
                    {data?.paiements?.length ? data.paiements.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{p.appartement}</p>
                          <p className="text-xs text-slate-400">{p.resident}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-700">{p.montant} MAD</p>
                          <p className="text-xs text-slate-400">{p.date}</p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-slate-400">Aucun paiement</p>}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="font-bold text-slate-700 mb-4">Documents récents</h2>
                  <div className="flex flex-col gap-4">
                    {data?.documents?.length ? data.documents.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                          <i className="fas fa-file-pdf text-rose-400"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{d.nom}</p>
                          <p className="text-xs text-slate-400">{d.date}</p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-slate-400">Aucun document</p>}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default Login1;
