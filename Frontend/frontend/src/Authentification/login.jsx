import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

/* ------------------------------------------------------------------ */
/*  Données de démonstration                                          */
/* ------------------------------------------------------------------ */

const STATS = [
  { icon: "fa-users", bg: "bg-violet-500", label: "Copropriétaires", value: "248", trend: "+12 ce mois", up: true },
  { icon: "fa-building", bg: "bg-blue-500", label: "Appartements", value: "156", trend: "+5 ce mois", up: true },
  { icon: "fa-money-bill-wave", bg: "bg-emerald-500", label: "Paiements reçus", value: "125 680", suffix: "MAD", trend: "+18% ce mois", up: true },
  { icon: "fa-exclamation-triangle", bg: "bg-orange-500", label: "Réclamations", value: "18", trend: "-4 ce mois", up: false },
];

const MONTHS = ["Nov", "Déc", "Jan", "Fév", "Mar", "Avr"];
const PAID = [30000, 45000, 40000, 60000, 90000, 70000];
const UNPAID = [20000, 15000, 25000, 20000, 25000, 22000];

const CHARGES = [
  { label: "Entretien", pct: 40, color: "#8b5cf6" },
  { label: "Eau", pct: 25, color: "#3b82f6" },
  { label: "Électricité", pct: 20, color: "#10b981" },
  { label: "Ascenseur", pct: 10, color: "#f59e0b" },
  { label: "Autres", pct: 5, color: "#ec4899" },
];

const UPCOMING = [
  { day: "15", month: "MAI", title: "Réunion du conseil syndical", when: "15 Mai 2024 à 10:00" },
  { day: "20", month: "MAI", title: "Entretien ascenseur", when: "20 Mai 2024 à 09:00" },
];

const CLAIMS = [
  { icon: "fa-tint", color: "text-sky-500", bg: "bg-sky-50", title: "Fuite d'eau dans le sous-sol", sub: "Appartement A12 · 12 Mai 2024", status: "En cours", tone: "amber" },
  { icon: "fa-lightbulb", color: "text-rose-500", bg: "bg-rose-50", title: "Problème d'éclairage commun", sub: "Appartement B24 · 11 Mai 2024", status: "En attente", tone: "sky" },
  { icon: "fa-warehouse", color: "text-emerald-500", bg: "bg-emerald-50", title: "Porte de garage défectueuse", sub: "Appartement C03 · 10 Mai 2024", status: "Résolue", tone: "emerald" },
  { icon: "fa-phone-volume", color: "text-orange-500", bg: "bg-orange-50", title: "Interphone en panne", sub: "Appartement A07 · 09 Mai 2024", status: "En cours", tone: "amber" },
];

const PAYMENTS = [
  { initials: "MA", name: "Maria Amine", apt: "Appartement A12", amount: "2 450", date: "12 Mai 2024" },
  { initials: "YO", name: "Youssef Omar", apt: "Appartement B24", amount: "2 450", date: "11 Mai 2024" },
  { initials: "SA", name: "Sami Ali", apt: "Appartement C03", amount: "2 450", date: "10 Mai 2024" },
  { initials: "KH", name: "Khadija Hamid", apt: "Appartement D15", amount: "2 450", date: "09 Mai 2024" },
];

const DOCUMENTS = [
  { name: "PV_AG_2024.pdf", date: "12 Mai 2024" },
  { name: "Facture_04_2024.pdf", date: "10 Mai 2024" },
  { name: "Reglement_interieur.pdf", date: "05 Mai 2024" },
];

const STATUS_STYLES = {
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

const NAV_GESTION = [
  { icon: "fa-users", label: "Copropriétaires" },
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

/* ------------------------------------------------------------------ */
/*  Sous-composants                                                    */
/* ------------------------------------------------------------------ */

function NavSection({ title, items }) {
  return (
    <div className="mt-6">
      <p className="px-6 text-[11px] font-bold tracking-widest text-indigo-300 mb-2">{title}</p>
      {items.map((item) => (
        <a
          key={item.label}
          href="#"
          className="flex items-center gap-3 px-4 py-2.5 text-indigo-100 hover:bg-white/10 rounded-lg mx-2 transition-colors text-sm"
        >
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
            {value} {suffix && <span className="text-sm font-semibold text-slate-400">{suffix}</span>}
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

function LineChart() {
  const xs = [40, 138, 236, 334, 432, 530];
  const toY = (v) => 220 - (v / 100000) * 200;
  const purplePts = xs.map((x, i) => `${x},${toY(PAID[i])}`).join(" ");
  const pinkPts = xs.map((x, i) => `${x},${toY(UNPAID[i])}`).join(" ");
  const areaPts = `${xs[0]},220 ${purplePts} ${xs[xs.length - 1]},220`;

  return (
    <svg viewBox="0 0 570 250" className="w-full h-64">
      <defs>
        <linearGradient id="paidArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid + Y labels */}
      {[0, 20000, 40000, 60000, 80000, 100000].map((v) => (
        <g key={v}>
          <line x1="40" x2="550" y1={toY(v)} y2={toY(v)} stroke="#eef1f6" strokeWidth="1" />
          <text x="0" y={toY(v) + 4} fontSize="10" fill="#94a3b8">
            {v === 0 ? "0" : `${v / 1000}K`}
          </text>
        </g>
      ))}

      {/* X labels */}
      {xs.map((x, i) => (
        <text key={i} x={x} y="238" fontSize="11" fill="#94a3b8" textAnchor="middle">
          {MONTHS[i]}
        </text>
      ))}

      <polygon points={areaPts} fill="url(#paidArea)" />
      <polyline points={pinkPts} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5,5" strokeLinecap="round" />
      <polyline points={purplePts} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {xs.map((x, i) => (
        <circle key={`p${i}`} cx={x} cy={toY(PAID[i])} r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
      ))}
      {xs.map((x, i) => (
        <circle key={`u${i}`} cx={x} cy={toY(UNPAID[i])} r="3" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function Donut() {
  const r = 62;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 160 160" className="w-40 h-40 -rotate-90">
          {CHARGES.map((c) => {
            const dash = (c.pct / 100) * circumference;
            const seg = (
              <circle
                key={c.label}
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke={c.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offsetAcc}
                strokeLinecap="butt"
              />
            );
            offsetAcc += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-lg font-bold text-slate-700 leading-tight">98 450</p>
          <p className="text-[11px] text-slate-400">MAD</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {CHARGES.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }}></span>
            <span className="text-slate-500 w-20">{c.label}</span>
            <span className="font-semibold text-slate-700">{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard principal                                                */
/* ------------------------------------------------------------------ */

function Login1() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (!token) {
    return <h2 className="text-center mt-10">Accès refusé 🚫</h2>;
  }

  try {
    const decoded = jwtDecode(token);

    const handleLogout = () => {
      localStorage.removeItem("token");
      navigate("/");
    };

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
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center mb-3">
              <i className="fas fa-comment-dots text-sm"></i>
            </div>
            <p className="font-bold text-sm">Besoin d'aide ?</p>
            <p className="text-xs text-indigo-200 mt-1 mb-3 leading-relaxed">
              Notre support est disponible 7j/7 pour vous aider.
            </p>
            <button className="w-full bg-white text-indigo-700 text-sm font-semibold py-2 rounded-lg hover:bg-indigo-50 transition-colors">
              Contacter le support
            </button>
          </div>

        </aside>

        {/* Contenu */}
        <main className="flex-1 overflow-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 px-8 py-4 bg-white border-b border-slate-100">
            <div className="relative w-full max-w-md">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="flex items-center gap-5 shrink-0">
              <button className="relative w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                <i className="fas fa-bell text-slate-400"></i>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  3
                </span>
              </button>

              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/80" className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <p className="font-bold text-sm leading-tight">{decoded.nom}</p>
                  <p className="text-xs text-slate-400 leading-tight">Administrateur</p>
                </div>
                <i className="fas fa-chevron-down text-xs text-slate-300"></i>
              </div>
            </div>
          </div>

          <div className="p-8">

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-700">Tableau de bord</h1>
              <p className="text-slate-400 mt-1">Bienvenue de retour ! Voici un aperçu de votre gestion.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-5 mb-6">
              {STATS.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-3 gap-5 mb-6">

              <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="font-bold text-slate-700">Évolution des paiements</h2>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                        Paiements reçus
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        Impayés
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500">
                    6 derniers mois
                    <i className="fas fa-chevron-down text-[10px] text-slate-300"></i>
                  </div>
                </div>
                <LineChart />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-bold text-slate-700 mb-4">Répartition des charges</h2>
                <Donut />
              </div>

            </div>

            {/* Upcoming + banner + balance */}
            <div className="grid grid-cols-3 gap-5 mb-6">

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-bold text-slate-700 mb-4">À venir</h2>
                <div className="flex flex-col gap-3">
                  {UPCOMING.map((e) => (
                    <div key={e.title} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-indigo-600 leading-none">{e.day}</span>
                        <span className="text-[9px] font-semibold text-indigo-400">{e.month}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-700">{e.title}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <i className="far fa-calendar"></i>
                          {e.when}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
                <i className="fas fa-bullhorn text-6xl absolute -bottom-3 -right-3 text-white/10"></i>
                <p className="font-bold text-lg">Publier une annonce</p>
                <p className="text-sm text-indigo-100 mt-1 mb-4 relative z-10">
                  Informez rapidement tous les résidents de votre copropriété.
                </p>
                <button className="bg-white text-indigo-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors relative z-10">
                  Créer une annonce
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-bold text-slate-700 mb-4">Solde global</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                    <i className="fas fa-wallet text-indigo-500"></i>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Solde des charges</p>
                    <p className="text-xl font-bold text-slate-700">32 780 <span className="text-sm font-semibold text-slate-400">MAD</span></p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Impayés : <span className="font-semibold text-rose-500">18 950 MAD</span>
                </p>
              </div>

            </div>

            {/* Lists row */}
            <div className="grid grid-cols-3 gap-5">

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-700">Dernières réclamations</h2>
                  <a href="#" className="text-xs font-semibold text-indigo-500">Voir tout</a>
                </div>
                <div className="flex flex-col gap-4">
                  {CLAIMS.map((c) => (
                    <div key={c.title} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center shrink-0`}>
                        <i className={`fas ${c.icon} ${c.color} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.sub}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[c.tone]}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-700">Derniers paiements</h2>
                  <a href="#" className="text-xs font-semibold text-indigo-500">Voir tout</a>
                </div>
                <div className="flex flex-col gap-4">
                  {PAYMENTS.map((p) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {p.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{p.apt}</p>
                        <p className="text-xs text-slate-400">{p.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{p.amount} MAD</p>
                        <p className="text-xs text-slate-400">{p.date}</p>
                      </div>
                      <i className="fas fa-check-circle text-emerald-500"></i>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-700">Documents récents</h2>
                  <a href="#" className="text-xs font-semibold text-indigo-500">Voir tout</a>
                </div>
                <div className="flex flex-col gap-4">
                  {DOCUMENTS.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                        <i className="fas fa-file-pdf text-rose-400"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.date}</p>
                      </div>
                      <button className="text-slate-300 hover:text-indigo-500 transition-colors">
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 mt-8">
              <p>© 2026 SyndicPro. Tous droits réservés.</p>
              <p>Version 1.0.0</p>
            </div>

          </div>

        </main>

      </div>
    );
  } catch (error) {
    return <h2>Token invalide</h2>;
  }
}

export default Login1;
