import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

/* ------------------------------------------------------------------ */
/*  Données de démonstration                                          */
/* ------------------------------------------------------------------ */

const STATS = [
  { icon: "fa-folder-open", bg: "bg-indigo-500", label: "Total documents", value: "78", note: "Ce mois", tone: "text-slate-400" },
  { icon: "fa-file-alt", bg: "bg-emerald-500", label: "Fichiers", value: "54", note: "69.2% du total", tone: "text-emerald-500" },
  { icon: "fa-folder", bg: "bg-amber-500", label: "Dossiers", value: "20", note: "25.6% du total", tone: "text-amber-500" },
  { icon: "fa-trash-alt", bg: "bg-rose-500", label: "Archives", value: "4", note: "5.1% du total", tone: "text-rose-500" },
];

const FILE_ICONS = {
  pdf: { icon: "fa-file-pdf", bg: "bg-rose-50", color: "text-rose-500" },
  docx: { icon: "fa-file-word", bg: "bg-blue-50", color: "text-blue-500" },
  xlsx: { icon: "fa-file-excel", bg: "bg-emerald-50", color: "text-emerald-500" },
  png: { icon: "fa-file-image", bg: "bg-sky-50", color: "text-sky-500" },
  dossier: { icon: "fa-folder", bg: "bg-amber-50", color: "text-amber-500" },
  dossierGris: { icon: "fa-folder", bg: "bg-slate-100", color: "text-slate-400" },
};

const CATEGORY_STYLES = {
  "Juridique": "bg-violet-50 text-violet-600",
  "Assemblée": "bg-blue-50 text-blue-600",
  "Finances": "bg-emerald-50 text-emerald-600",
  "Contrats": "bg-orange-50 text-orange-600",
  "Maintenance": "bg-sky-50 text-sky-600",
  "Technique": "bg-teal-50 text-teal-600",
  "Assurances": "bg-pink-50 text-pink-600",
};

const DOCUMENTS = [
  {
    name: "Règlement de copropriété",
    sub: "Version 2024",
    category: "Juridique",
    type: "PDF",
    fileType: "pdf",
    date: "15/05/2024 10:30",
    size: "2.4 Mo",
    downloadable: true,
  },
  {
    name: "Procès-verbal AG 2024",
    sub: "Assemblée générale annuelle",
    category: "Assemblée",
    type: "DOCX",
    fileType: "docx",
    date: "10/05/2024 14:20",
    size: "1.8 Mo",
    downloadable: true,
  },
  {
    name: "Budget prévisionnel 2024",
    sub: "Budget de l'année en cours",
    category: "Finances",
    type: "XLSX",
    fileType: "xlsx",
    date: "05/05/2024 09:15",
    size: "950 Ko",
    downloadable: true,
  },
  {
    name: "Contrats fournisseurs",
    sub: "Dossier",
    category: "Contrats",
    type: "Dossier",
    fileType: "dossier",
    date: "02/05/2024 11:00",
    size: "–",
    downloadable: false,
  },
  {
    name: "Rapport d'entretien 2024",
    sub: "Rapport annuel d'entretien",
    category: "Maintenance",
    type: "PDF",
    fileType: "pdf",
    date: "30/04/2024 16:45",
    size: "3.2 Mo",
    downloadable: true,
  },
  {
    name: "Plan de l'immeuble",
    sub: "Plans et schémas",
    category: "Technique",
    type: "PNG",
    fileType: "png",
    date: "28/04/2024 13:10",
    size: "1.2 Mo",
    downloadable: true,
  },
  {
    name: "Assurances",
    sub: "Dossier",
    category: "Assurances",
    type: "Dossier",
    fileType: "dossierGris",
    date: "20/04/2024 10:05",
    size: "–",
    downloadable: false,
  },
  {
    name: "Appel de fonds 2024",
    sub: "Premier trimestre",
    category: "Finances",
    type: "PDF",
    fileType: "pdf",
    date: "15/04/2024 08:30",
    size: "1.1 Mo",
    downloadable: true,
  },
];

const NAV_GESTION = [
  { icon: "fa-users", label: "Copropriétaires" },
  { icon: "fa-building", label: "Appartements" },
  { icon: "fa-wallet", label: "Paiements" },
  { icon: "fa-coins", label: "Charges" },
  { icon: "fa-exclamation-circle", label: "Réclamations" },
  { icon: "fa-bullhorn", label: "Annonces" },
  { icon: "fa-file-alt", label: "Documents", active: true },
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

function StatCard({ icon, bg, label, value, note, tone }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-white shrink-0`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-700 leading-tight">{value}</p>
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

function Documents() {
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

    const filtered = DOCUMENTS.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

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
                <h1 className="text-3xl font-bold text-slate-700">Documents</h1>
                <p className="text-slate-400 mt-1">Centralisez et gérez tous les documents de la copropriété.</p>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <i className="fas fa-download"></i>
                  Exporter
                </button>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                  <i className="fas fa-plus"></i>
                  Nouveau document
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
                  placeholder="Rechercher un document..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                Catégorie: Toutes
                <i className="fas fa-chevron-down text-[10px] text-slate-300"></i>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                Type: Tous
                <i className="fas fa-chevron-down text-[10px] text-slate-300"></i>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                Publié par: Tous
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
                    <th className="font-medium">Nom du document</th>
                    <th className="font-medium">Catégorie</th>
                    <th className="font-medium">Type</th>
                    <th className="font-medium">Publié par</th>
                    <th className="font-medium">Date d'ajout</th>
                    <th className="font-medium">Taille</th>
                    <th className="font-medium text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const fi = FILE_ICONS[d.fileType];
                    return (
                      <tr key={d.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 text-slate-400">{i + 1}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className={`w-10 h-10 rounded-lg ${fi.bg} flex items-center justify-center shrink-0`}>
                              <i className={`fas ${fi.icon} ${fi.color}`}></i>
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-700 whitespace-nowrap">{d.name}</p>
                              <p className="text-xs text-slate-400">{d.sub}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <CategoryTag category={d.category} />
                        </td>
                        <td className="text-slate-500">{d.type}</td>
                        <td>
                          <p className="font-medium text-slate-700">Saeed Khan</p>
                          <p className="text-xs text-slate-400">Administrateur</p>
                        </td>
                        <td className="text-slate-500 whitespace-nowrap">{d.date}</td>
                        <td className="text-slate-500">{d.size}</td>
                        <td className="pr-6">
                          <div className="flex items-center justify-end gap-3 text-slate-400">
                            <button className="hover:text-indigo-500 transition-colors">
                              <i className="fas fa-eye"></i>
                            </button>
                            {d.downloadable && (
                              <button className="hover:text-indigo-500 transition-colors">
                                <i className="fas fa-download"></i>
                              </button>
                            )}
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
                Affichage de 1 à {filtered.length} sur 78 résultats
              </p>
              <Pagination page={page} totalPages={10} onChange={setPage} />
            </div>

          </div>

        </main>

      </div>
    );
  } catch (error) {
    return <h2>Token invalide</h2>;
  }
}

export default Documents;
