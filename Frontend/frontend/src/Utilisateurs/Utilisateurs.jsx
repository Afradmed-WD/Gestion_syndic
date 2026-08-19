import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/utilisateurs";

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

// Échappe une valeur pour l'export CSV
function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportToCSV(rows) {
  const headers = ["Nom", "Email"];
  const lines = [headers.join(";"), ...rows.map((u) => [u.nom, u.email].map(csvEscape).join(";"))];
  // BOM pour un affichage correct des accents dans Excel
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
  { icon: "fa-user-friends", label: "Utilisateurs", active: true },
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
        <p className="text-2xl font-bold text-slate-700 leading-tight">{value}</p>
        {note && <p className={`text-xs font-semibold ${tone}`}>{note}</p>}
      </div>
    </div>
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

/* ------------------------------------------------------------------ */
/*  MODALS                                                              */
/* ------------------------------------------------------------------ */

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-700">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function UtilisateurForm({ initial, onCancel, onSubmit, submitting, error }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    nom: initial?.nom || "",
    email: initial?.email || "",
    passwd: "",
  });
  const [showPasswd, setShowPasswd] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Nom *</label>
        <input type="text" name="nom" value={form.nom} onChange={handleChange} required className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          {isEdit ? "Nouveau mot de passe" : "Mot de passe *"}
        </label>
        <div className="relative">
          <input
            type={showPasswd ? "text" : "password"}
            name="passwd"
            value={form.passwd}
            onChange={handleChange}
            required={!isEdit}
            placeholder={isEdit ? "Laisser vide pour ne pas changer" : ""}
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPasswd((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            <i className={`fas ${showPasswd ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({ utilisateur, onCancel, onConfirm, submitting, error }) {
  return (
    <div>
      {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <p className="text-sm text-slate-600">
        Voulez-vous vraiment supprimer l'utilisateur <span className="font-semibold">{utilisateur.nom}</span> (
        {utilisateur.email}) ? Cette action est irréversible.
      </p>
      <div className="flex items-center justify-end gap-3 pt-6">
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-60"
        >
          {submitting ? "Suppression..." : "Supprimer"}
        </button>
      </div>
    </div>
  );
}

function ViewDetails({ utilisateur, onClose }) {
  return (
    <div>
      <dl className="divide-y divide-slate-100">
        <div className="flex items-center justify-between py-2.5 text-sm">
          <dt className="text-slate-400">Nom</dt>
          <dd className="font-semibold text-slate-700">{utilisateur.nom}</dd>
        </div>
        <div className="flex items-center justify-between py-2.5 text-sm">
          <dt className="text-slate-400">Email</dt>
          <dd className="font-semibold text-slate-700">{utilisateur.email}</dd>
        </div>
      </dl>
      <div className="flex justify-end pt-6">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700">
          Fermer
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE PRINCIPALE                                                     */
/* ------------------------------------------------------------------ */

function Utilisateurs() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  // popup state: { mode: "add" | "edit" | "delete" | "view", utilisateur?: object }
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadUtilisateurs = () => {
    setLoading(true);
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json?.utilisateurs)) {
          setUtilisateurs(json.utilisateurs);
          setStats(json.stats);
          setError(null);
        } else {
          setError(json?.error || "Réponse API invalide");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    loadUtilisateurs();
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

  const openAdd = () => {
    setFormError(null);
    setModal({ mode: "add" });
  };

  const openEdit = async (u) => {
    setFormError(null);
    setModal({ mode: "edit", utilisateur: null });
    try {
      const res = await fetch(`${API_URL}/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors du chargement de l'utilisateur");
      setModal({ mode: "edit", utilisateur: json });
    } catch (err) {
      setModal(null);
      setError(err.message);
    }
  };

  const openView = (u) => setModal({ mode: "view", utilisateur: u });
  const openDelete = (u) => {
    setFormError(null);
    setModal({ mode: "delete", utilisateur: u });
  };
  const closeModal = () => {
    setModal(null);
    setFormError(null);
  };

  const handleCreate = async (form) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la création");
      closeModal();
      loadUtilisateurs();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (form) => {
    setSubmitting(true);
    setFormError(null);
    try {
      // n'envoie le mot de passe que s'il a été saisi
      const payload = { nom: form.nom, email: form.email };
      if (form.passwd) payload.passwd = form.passwd;

      const res = await fetch(`${API_URL}/${modal.utilisateur.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la mise à jour");
      closeModal();
      loadUtilisateurs();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_URL}/${modal.utilisateur.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la suppression");
      closeModal();
      loadUtilisateurs();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = utilisateurs.filter(
    (u) => u.nom?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const total = stats?.total ?? 0;

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
              <h1 className="text-3xl font-bold text-slate-700">Utilisateurs</h1>
              <p className="text-slate-400 mt-1">Gestion des comptes utilisateurs de la plateforme.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportToCSV(filtered)}
                disabled={!filtered.length}
                className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-file-export"></i>
                Exporter
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
              >
                <i className="fas fa-plus"></i>
                Nouvel utilisateur
              </button>
            </div>
          </div>

          {!loading && !error && (
            <div className="grid grid-cols-2 gap-5 mb-6 max-w-xl">
              <StatCard icon="fa-users" bg="bg-indigo-500" label="Total utilisateurs" value={total} />
              <StatCard icon="fa-filter" bg="bg-slate-400" label="Résultats affichés" value={filtered.length} />
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                type="text"
                placeholder="Rechercher un utilisateur..."
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
                      <th className="font-medium">Nom</th>
                      <th className="font-medium">Email</th>
                      <th className="font-medium text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((u, i) => {
                      const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                      return (
                        <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 text-slate-400">{(page - 1) * perPage + i + 1}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <span className={`w-9 h-9 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-bold shrink-0`}>
                                {initialsOf(u.nom)}
                              </span>
                              <span className="font-semibold text-slate-700 whitespace-nowrap">{u.nom}</span>
                            </div>
                          </td>
                          <td className="text-slate-500 whitespace-nowrap">{u.email}</td>
                          <td className="pr-6">
                            <div className="flex items-center justify-end gap-3 text-slate-400">
                              <button onClick={() => openView(u)} className="hover:text-indigo-500 transition-colors"><i className="fas fa-eye"></i></button>
                              <button onClick={() => openEdit(u)} className="hover:text-indigo-500 transition-colors"><i className="fas fa-pen"></i></button>
                              <button onClick={() => openDelete(u)} className="hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
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

      {modal?.mode === "add" && (
        <Modal title="Nouvel utilisateur" onClose={closeModal}>
          <UtilisateurForm onCancel={closeModal} onSubmit={handleCreate} submitting={submitting} error={formError} />
        </Modal>
      )}

      {modal?.mode === "edit" && (
        <Modal title="Modifier l'utilisateur" onClose={closeModal}>
          {modal.utilisateur ? (
            <UtilisateurForm initial={modal.utilisateur} onCancel={closeModal} onSubmit={handleUpdate} submitting={submitting} error={formError} />
          ) : (
            <p className="text-slate-400 text-sm">Chargement...</p>
          )}
        </Modal>
      )}

      {modal?.mode === "view" && (
        <Modal title="Détails de l'utilisateur" onClose={closeModal}>
          <ViewDetails utilisateur={modal.utilisateur} onClose={closeModal} />
        </Modal>
      )}

      {modal?.mode === "delete" && (
        <Modal title="Supprimer l'utilisateur" onClose={closeModal}>
          <DeleteConfirm utilisateur={modal.utilisateur} onCancel={closeModal} onConfirm={handleDelete} submitting={submitting} error={formError} />
        </Modal>
      )}
    </div>
  );
}

export default Utilisateurs;