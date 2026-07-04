import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

/* ------------------------------------------------------------------ */
/*  Données de démonstration                                          */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = [
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-sky-100", text: "text-sky-600" },
];

function initialsOf(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const OWNERS = [
  { name: "Ahmed Benali", email: "ahmed.benali@email.com", phone: "06 12 34 56 78", residence: "Résidence Al Baraka", apt: "A12", status: "Actif", date: "12 Mai 2024" },
  { name: "Fatima Zahra", email: "fatima.zahra@email.com", phone: "06 98 76 54 32", residence: "Résidence Al Baraka", apt: "B05", status: "Actif", date: "11 Mai 2024" },
  { name: "Youssef Omar", email: "youssef.omar@email.com", phone: "06 22 31 44 55", residence: "Résidence Al Kawtar", apt: "C03", status: "Actif", date: "10 Mai 2024" },
  { name: "Maria Amine", email: "maria.amine@email.com", phone: "06 55 44 33 22", residence: "Résidence Al Kawtar", apt: "D15", status: "Actif", date: "09 Mai 2024" },
  { name: "Sami Ali", email: "sami.ali@email.com", phone: "06 77 88 99 00", residence: "Résidence Al Nour", apt: "E07", status: "Inactif", date: "08 Mai 2024" },
  { name: "Khadija Hamid", email: "khadija.hamid@email.com", phone: "06 66 77 88 99", residence: "Résidence Al Nour", apt: "F02", status: "Actif", date: "07 Mai 2024" },
  { name: "Mohamed Ilyas", email: "mohamed.ilyas@email.com", phone: "06 11 22 33 44", residence: "Résidence Al Wafa", apt: "G11", status: "Actif", date: "06 Mai 2024" },
  { name: "Amina Zaher", email: "amina.zaher@email.com", phone: "06 44 55 66 77", residence: "Résidence Al Wafa", apt: "A01", status: "Actif", date: "05 Mai 2024" },
  { name: "Yassine Lahlou", email: "yassine.lahlou@email.com", phone: "06 33 22 11 00", residence: "Résidence Al Salam", apt: "B02", status: "Actif", date: "04 Mai 2024" },
  { name: "Nadia Laarabi", email: "nadia.laarabi@email.com", phone: "06 99 88 77 66", residence: "Résidence Al Salam", apt: "C08", status: "Actif", date: "03 Mai 2024" },
].map((o, i) => ({ ...o, initials: initialsOf(o.name), color: AVATAR_COLORS[i % AVATAR_COLORS.length] }));

const NAV_GESTION = [
  { icon: "fa-users", label: "Copropriétaires", active: true },
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

function StatusBadge({ status }) {
  const isActive = status === "Actif";
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${
        isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
      }`}
    >
      {status}
    </span>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const pages = [1, 2, 3, 4, 5];
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

function Coproprietaires() {
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

    const filtered = OWNERS.filter((o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase())
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
                <h1 className="text-3xl font-bold text-slate-700">Copropriétaires</h1>
                <p className="text-slate-400 mt-1">Liste de tous les copropriétaires enregistrés.</p>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <i className="fas fa-file-export"></i>
                  Exporter
                </button>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                  <i className="fas fa-plus"></i>
                  Ajouter un copropriétaire
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Rechercher un copropriétaire..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                Statut: Tous
                <i className="fas fa-chevron-down text-[10px] text-slate-300"></i>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                Résidence: Toutes
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
                    <th className="font-medium">Nom complet</th>
                    <th className="font-medium">Email</th>
                    <th className="font-medium">Téléphone</th>
                    <th className="font-medium">Résidence</th>
                    <th className="font-medium">Appartement</th>
                    <th className="font-medium">Statut</th>
                    <th className="font-medium">Date d'ajout</th>
                    <th className="font-medium text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => (
                    <tr key={o.email} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 text-slate-400">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-full ${o.color.bg} ${o.color.text} flex items-center justify-center text-xs font-bold shrink-0`}>
                            {o.initials}
                          </span>
                          <span className="font-semibold text-slate-700 whitespace-nowrap">{o.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-500">{o.email}</td>
                      <td className="text-slate-500 whitespace-nowrap">{o.phone}</td>
                      <td className="text-slate-500 whitespace-nowrap">{o.residence}</td>
                      <td className="text-slate-500">{o.apt}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="text-slate-500 whitespace-nowrap">{o.date}</td>
                      <td className="pr-6">
                        <div className="flex items-center justify-end gap-3 text-slate-400">
                          <button className="hover:text-indigo-500 transition-colors">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="hover:text-indigo-500 transition-colors">
                            <i className="fas fa-pen"></i>
                          </button>
                          <button className="hover:text-rose-500 transition-colors">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer / pagination */}
            <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
              <p className="text-sm text-slate-400">
                Affichage de 1 à {filtered.length} sur 248 résultats
              </p>
              <Pagination page={page} totalPages={25} onChange={setPage} />
            </div>

          </div>

        </main>

      </div>
    );
  } catch (error) {
    return <h2>Token invalide</h2>;
  }
}

export default Coproprietaires;
