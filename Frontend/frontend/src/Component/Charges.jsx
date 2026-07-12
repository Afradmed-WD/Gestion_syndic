import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

/* ------------------------------------------------------------------ */
/*  Données de démonstration                                          */
/* ------------------------------------------------------------------ */

const STATS = [
  { icon: "fa-folder-open", bg: "bg-indigo-500", label: "Total charges", value: "85 620", suffix: "MAD", note: "Ce mois", tone: "text-slate-400" },
  { icon: "fa-arrow-down", bg: "bg-emerald-500", label: "Payées", value: "62 450", suffix: "MAD", note: "72.9% du total", tone: "text-emerald-500" },
  { icon: "fa-clock", bg: "bg-amber-500", label: "En attente", value: "15 870", suffix: "MAD", note: "18.5% du total", tone: "text-amber-500" },
  { icon: "fa-times-circle", bg: "bg-rose-500", label: "Impayées", value: "7 300", suffix: "MAD", note: "8.5% du total", tone: "text-rose-500" },
];

const CATEGORY_STYLES = {
  "Électricité": "bg-blue-50 text-blue-600",
  "Eau": "bg-sky-50 text-sky-600",
  "Entretien": "bg-violet-50 text-violet-600",
  "Sécurité": "bg-rose-50 text-rose-600",
  "Maintenance": "bg-orange-50 text-orange-600",
  "Divers": "bg-slate-100 text-slate-500",
};

const CATEGORY_ICONS = {
  "Électricité": { icon: "fa-bolt", bg: "bg-blue-50", color: "text-blue-500" },
  "Eau": { icon: "fa-tint", bg: "bg-sky-50", color: "text-sky-500" },
  "Entretien": { icon: "fa-broom", bg: "bg-violet-50", color: "text-violet-500" },
  "Sécurité": { icon: "fa-shield-alt", bg: "bg-rose-50", color: "text-rose-500" },
  "Maintenance": { icon: "fa-wrench", bg: "bg-orange-50", color: "text-orange-500" },
  "Divers-trash": { icon: "fa-trash-alt", bg: "bg-emerald-50", color: "text-emerald-500" },
  "Divers-leaf": { icon: "fa-leaf", bg: "bg-emerald-50", color: "text-emerald-500" },
  "Divers-box": { icon: "fa-box", bg: "bg-slate-100", color: "text-slate-500" },
};

const STATUS_STYLES = {
  "Payée": "bg-emerald-50 text-emerald-600",
  "En attente": "bg-amber-50 text-amber-600",
  "Impayée": "bg-rose-50 text-rose-500",
};

const CHARGES = [
  { label: "Facture d'électricité", sub: "Consommation parties communes", category: "Électricité", iconKey: "Électricité", supplier: "ONEE", amount: "4 850", date: "31/05/2024", due: "15/06/2024", status: "Payée" },
  { label: "Facture d'eau", sub: "Consommation eau", category: "Eau", iconKey: "Eau", supplier: "RADEEMA", amount: "2 750", date: "30/05/2024", due: "14/06/2024", status: "Payée" },
  { label: "Nettoyage", sub: "Prestation de nettoyage", category: "Entretien", iconKey: "Entretien", supplier: "Clean Services", amount: "6 000", date: "28/05/2024", due: "12/06/2024", status: "Payée" },
  { label: "Sécurité", sub: "Service de gardiennage", category: "Sécurité", iconKey: "Sécurité", supplier: "Guard Plus", amount: "5 500", date: "27/05/2024", due: "10/06/2024", status: "En attente" },
  { label: "Maintenance ascenseur", sub: "Contrat de maintenance", category: "Maintenance", iconKey: "Maintenance", supplier: "Elevator Pro", amount: "3 800", date: "26/05/2024", due: "09/06/2024", status: "En attente" },
  { label: "Collecte des déchets", sub: "Enlèvement des ordures", category: "Divers", iconKey: "Divers-trash", supplier: "Eco Déchets", amount: "1 650", date: "25/05/2024", due: "08/06/2024", status: "Payée" },
  { label: "Jardinage", sub: "Entretien des espaces verts", category: "Entretien", iconKey: "Divers-leaf", supplier: "Green Space", amount: "2 400", date: "24/05/2024", due: "07/06/2024", status: "Impayée" },
  { label: "Fournitures", sub: "Produits et petits équipements", category: "Divers", iconKey: "Divers-box", supplier: "Bricomax", amount: "1 270", date: "23/05/2024", due: "06/06/2024", status: "Impayée" },
];

const NAV_GESTION = [
  { icon: "fa-users", label: "Copropriétaires" },
  { icon: "fa-building", label: "Appartements" },
  { icon: "fa-wallet", label: "Paiements" },
  { icon: "fa-coins", label: "Charges", active: true },
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

function StatCard({ icon, bg, label, value, suffix, note, tone }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-white shrink-0`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-700 leading-tight">
          {value} {suffix && <span className="text-sm font-semibold text-slate-400">{suffix}</span>}
        </p>
        <p className={`text-xs font-semibold ${tone}`}>{note}</p>
      </div>
    </div>
  );
}

function CategoryTag({ category }) {
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${CATEGORY_STYLES[category]}`}>
      {category}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const pages = [1, 2, 3, 4];
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        className="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center"
      >
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

      <span className="text-slate-400 px-1">...</span>

      <button
        onClick={() => onChange(totalPages)}
        className={`w-9 h-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${
          page === totalPages ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50 border border-slate-200"
        }`}
      >
        {totalPages}
      </button>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center"
      >
        <i className="fas fa-chevron-right text-xs"></i>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page principale                                                    */
/* ------------------------------------------------------------------ */

function Charges() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  if (!token) {
    return <h2 className="text-center mt-10">Accès refusé 🚫</h2>;
  }

  try {
    const decoded = jwtDecode(token);

    const handleLogout = () => {
      localStorage.removeItem("token");
      navigate("/");
    };

    const filtered = CHARGES.filter(
      (c) => c.label.toLowerCase().includes(search.toLowerCase()) || c.supplier.toLowerCase().includes(search.toLowerCase())
    );

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
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-700">Charges</h1>
                <p className="text-slate-400 mt-1">Gérez les charges et dépenses de la copropriété.</p>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <i className="fas fa-download"></i>
                  Exporter
                </button>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                  <i className="fas fa-plus"></i>
                  Nouvelle charge
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-5 mb-6">
              {STATS.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Rechercher une charge..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                Catégorie: Toutes
                <i className="fas fa-chevron-down text-[10px] text-slate-300"></i>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                Statut: Tous
                <i className="fas fa-chevron-down text-[10px] text-slate-300"></i>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                Période: Ce mois
                <i className="fas fa-chevron-down text-[10px] text-slate-300"></i>
              </div>

              <button className="ml-auto flex items-center gap-2 border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <i className="fas fa-sliders-h"></i>
                Filtres
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-left">
                    <th className="py-4 px-6 font-medium">#</th>
                    <th className="font-medium">Libellé</th>
                    <th className="font-medium">Catégorie</th>
                    <th className="font-medium">Fournisseur</th>
                    <th className="font-medium">Montant (MAD)</th>
                    <th className="font-medium">Date</th>
                    <th className="font-medium">Échéance</th>
                    <th className="font-medium">Statut</th>
                    <th className="font-medium text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const ci = CATEGORY_ICONS[c.iconKey];
                    return (
                      <tr key={c.label} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 text-slate-400">{i + 1}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className={`w-10 h-10 rounded-lg ${ci.bg} flex items-center justify-center shrink-0`}>
                              <i className={`fas ${ci.icon} ${ci.color}`}></i>
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-700 whitespace-nowrap">{c.label}</p>
                              <p className="text-xs text-slate-400">{c.sub}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <CategoryTag category={c.category} />
                        </td>
                        <td className="text-slate-500 whitespace-nowrap">{c.supplier}</td>
                        <td className="text-slate-700 font-semibold">{c.amount}</td>
                        <td className="text-slate-500 whitespace-nowrap">{c.date}</td>
                        <td className="text-slate-500 whitespace-nowrap">{c.due}</td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="pr-6">
                          <div className="flex items-center justify-end gap-3 text-slate-400">
                            <button className="hover:text-indigo-500 transition-colors">
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="hover:text-indigo-500 transition-colors">
                              <i className="fas fa-pen"></i>
                            </button>
                            <button className="hover:text-slate-600 transition-colors">
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer / pagination */}
            <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
              <p className="text-sm text-slate-400">
                Affichage de 1 à {filtered.length} sur 32 résultats
              </p>
              <Pagination page={page} totalPages={5} onChange={setPage} />
            </div>

          </div>

        </main>

      </div>
    );
  } catch (error) {
    return <h2>Token invalide</h2>;
  }
}

export default Charges;
