import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

/* ------------------------------------------------------------------ */
/*  Configuration de la navigation                                     */
/* ------------------------------------------------------------------ */

const NAV_DASHBOARD = [{ icon: "fa-th-large", label: "Tableau de bord" }];

const NAV_GESTION = [
  { icon: "fa-users", label: "Copropriétaires" },
  { icon: "fa-building", label: "Appartements" },
  { icon: "fa-wallet", label: "Paiements" },
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

/* ------------------------------------------------------------------ */
/*  Sous-composant : section de navigation                             */
/* ------------------------------------------------------------------ */

function NavSection({ title, items, active, onNavigate }) {
  return (
    <div className="mt-6">
      <p className="px-6 text-[11px] font-bold tracking-widest text-indigo-300 mb-2">{title}</p>
      {items.map((item) => {
        const isActive = item.label === active;
        return (
          <a
            key={item.label}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate && onNavigate(item.label);
            }}
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
              isActive ? "bg-white text-indigo-700 font-semibold shadow-sm" : "text-indigo-100 hover:bg-white/10"
            }`}
          >
            <i className={`fas ${item.icon} w-4 text-center ${isActive ? "text-indigo-600" : "text-indigo-200"}`}></i>
            {item.label}
          </a>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar / Navbar principale                                        */
/* ------------------------------------------------------------------ */

/**
 * @param {string} active - Libellé de l'élément de navigation actif
 *   (ex: "Tableau de bord", "Copropriétaires", "Appartements", "Paiements",
 *   "Charges", "Réclamations", "Annonces", "Documents", "Factures",
 *   "Dépenses", "Rapports", "Utilisateurs", "Paramètres")
 * @param {function} onNavigate - Callback appelé avec le libellé cliqué
 *   (à brancher sur ton router, ex: onNavigate={(label) => navigate(ROUTES[label])})
 */
function Navbar({ active = "Tableau de bord", onNavigate }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (!token) return null;

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch (error) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
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

      <NavSection title="TABLEAU DE BORD" items={NAV_DASHBOARD} active={active} onNavigate={onNavigate} />
      <NavSection title="GESTION" items={NAV_GESTION} active={active} onNavigate={onNavigate} />
      <NavSection title="COMPTABILITÉ" items={NAV_COMPTA} active={active} onNavigate={onNavigate} />
      <NavSection title="PARAMÈTRES" items={NAV_PARAMS} active={active} onNavigate={onNavigate} />

      <div className="flex-1"></div>

      <div className="m-4">
        <button className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl p-3 mb-2 transition-colors">
          <img src="https://i.pravatar.cc/80" className="w-9 h-9 rounded-full" alt="" />
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{decoded.nom}</p>
            <p className="text-[11px] text-indigo-200 leading-tight">Administrateur</p>
          </div>
          <i className="fas fa-chevron-down text-xs text-indigo-200"></i>
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
  );
}

export default Navbar;
