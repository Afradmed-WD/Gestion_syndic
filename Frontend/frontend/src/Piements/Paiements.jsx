import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/paiements";

const STATUS_STYLES = {
  "Payé": "bg-emerald-50 text-emerald-600",
  "En attente": "bg-amber-50 text-amber-600",
  "Annulé": "bg-rose-50 text-rose-500",
};

const AVATAR_COLORS = [
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-sky-100", text: "text-sky-600" },
];

function initialsOf(nom) {
  if (!nom) return "–";
  return nom.split(" ").map((w) => w[0]).join("").toUpperCase();
}

function formatDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("fr-FR");
}

const NAV_GESTION = [
  { icon: "fa-users", label: "Copropriétaires" },
  { icon: "fa-building", label: "Appartements" },
  { icon: "fa-wallet", label: "Paiements", active: true },
  { icon: "fa-coins", label: "Charges" },
  { icon: "fa-exclamation-circle", label: "Réclamations" },
  { icon: "fa-bullhorn", label: "Annonces" },
  { icon: "fa-file-alt", label: "Documents" },
];
const NAV_COMPTA = [
  { icon: "fa-file-invoice", label: "Factures" },
  { icon: "fa-hand-holding-usd", label: "Dépenses" },
  { icon: "fa-chart-bar", label: "Rapports" },
];
const NAV_PARAMS = [
  { icon: "fa-user-friends", label: "Utilisateurs" },
  { icon: "fa-cog", label: "Paramètres" },
];

function NavSection({ title, items }) {
  return (
    <div className="mt-6">
      <p className="px-6 text-[11px] font-bold tracking-widest text-indigo-300 mb-2">{title}</p>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.label}
          className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
            item.active ? "bg-white text-indigo-700 font-semibold shadow-sm" : "text-indigo-100 hover:bg-white/10"
          }`}
        >
          <i className={`fas ${item.icon} w-4 text-center ${item.active ? "text-indigo-600" : "text-indigo-200"}`}></i>
          {item.label}
        </a>
      ))}
    </div>
  );
}

function StatCard({ icon, bg, label, value, note, tone }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-white shrink-0`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-700 leading-tight">
          {value} <span className="text-sm font-semibold text-slate-400">MAD</span>
        </p>
        <p className={`text-xs font-semibold ${tone}`}>{note}</p>
      </div>
    </div>
  );
}

function StatusBadge({ statut }) {
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[statut] || "bg-slate-100 text-slate-500"}`}>
      {statut}
    </span>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(1, page - 1))} className="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center">
        <i className="fas fa-chevron-left text-xs"></i>
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${
            p === page ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} className="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center">
        <i className="fas fa-chevron-right text-xs"></i>
      </button>
    </div>
  );
}

function Paiements() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [paiements, setPaiements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    if (!token) return;
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json?.paiements)) {
          setPaiements(json.paiements);
          setStats(json.stats);
        } else {
          setError(json?.error || "Réponse API invalide");
        }
      })
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
    navigate("/");
  };

  const filtered = paiements.filter(
    (p) => p.resident?.toLowerCase().includes(search.toLowerCase()) || p.appartement?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const total = stats?.total ?? 0;
  const payes = stats?.payes ?? 0;
  const attente = stats?.attente ?? 0;
  const annules = stats?.annules ?? 0;
  const pct = (n) => (payes + attente + annules ? `${((n / (payes + attente + annules)) * 100).toFixed(1)}% du total` : "–");

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

        <NavSection title="TABLEAU DE BORD" items={[{ icon: "fa-th-large", label: "Tableau de bord" }]} />
        <NavSection title="GESTION" items={NAV_GESTION} />
        <NavSection title="COMPTABILITÉ" items={NAV_COMPTA} />
        <NavSection title="PARAMÈTRES" items={NAV_PARAMS} />

        <div className="flex-1"></div>

        <div className="m-4">
          <button className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl p-3 mb-2 transition-colors">
            <img src="https://i.pravatar.cc/80" className="w-9 h-9 rounded-full" alt="" />
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{decoded.nom}</p>
              <p className="text-[11px] text-indigo-200 leading-tight">Administrateur</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-indigo-500/40 hover:bg-rose-500 transition-colors text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            Déconnexion
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

          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-700">Paiements</h1>
              <p className="text-slate-400 mt-1">Suivi des paiements des charges de copropriété.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <i className="fas fa-file-export"></i>
                Exporter
              </button>
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                <i className="fas fa-plus"></i>
                Enregistrer un paiement
              </button>
            </div>
          </div>

          {!loading && !error && (
            <div className="grid grid-cols-4 gap-5 mb-6">
              <StatCard icon="fa-dollar-sign" bg="bg-emerald-500" label="Payés ce mois" value={total} note="Ce mois" tone="text-emerald-500" />
              <StatCard icon="fa-credit-card" bg="bg-blue-500" label="Total payés" value={payes} note={pct(payes)} tone="text-blue-500" />
              <StatCard icon="fa-clock" bg="bg-amber-500" label="En attente" value={attente} note={pct(attente)} tone="text-amber-500" />
              <StatCard icon="fa-times-circle" bg="bg-rose-500" label="Annulés" value={annules} note={pct(annules)} tone="text-rose-500" />
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                type="text"
                placeholder="Rechercher un paiement..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {loading && <p className="text-slate-400">Chargement...</p>}
          {error && <p className="text-rose-500">Erreur : {error}</p>}

          {!loading && !error && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-left">
                      <th className="py-4 px-6 font-medium">#</th>
                      <th className="font-medium">Date</th>
                      <th className="font-medium">Résident</th>
                      <th className="font-medium">Appartement</th>
                      <th className="font-medium">Montant (MAD)</th>
                      <th className="font-medium">Mode de paiement</th>
                      <th className="font-medium">Statut</th>
                      <th className="font-medium text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((p, i) => {
                      const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                      return (
                        <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 text-slate-400">{(page - 1) * perPage + i + 1}</td>
                          <td className="text-slate-500 whitespace-nowrap">{formatDate(p.date)}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <span className={`w-9 h-9 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-bold shrink-0`}>
                                {initialsOf(p.resident)}
                              </span>
                              <span className="font-semibold text-slate-700 whitespace-nowrap">{p.resident || "–"}</span>
                            </div>
                          </td>
                          <td className="text-slate-500">{p.appartement || "–"}</td>
                          <td className="text-slate-700 font-semibold">{p.montant}</td>
                          <td className="text-slate-500">{p.mode}</td>
                          <td><StatusBadge statut={p.statut} /></td>
                          <td className="pr-6">
                            <div className="flex items-center justify-end gap-3 text-slate-400">
                              <button className="hover:text-indigo-500 transition-colors"><i className="fas fa-eye"></i></button>
                              <button className="hover:text-indigo-500 transition-colors"><i className="fas fa-pen"></i></button>
                              <button className="hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
                <p className="text-sm text-slate-400">
                  Affichage de {paged.length ? (page - 1) * perPage + 1 : 0} à {(page - 1) * perPage + paged.length} sur {filtered.length} résultats
                </p>
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default Paiements;
