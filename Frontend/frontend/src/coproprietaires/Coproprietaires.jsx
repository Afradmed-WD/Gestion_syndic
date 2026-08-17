import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/coproprietaires";
const RESIDENCES_URL = "http://localhost:3000/residences";

const AVATAR_COLORS = [
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-sky-100", text: "text-sky-600" },
];

function initialsOf(nom, prenom) {
  return `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
}

function formatDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("fr-FR");
}

// Pour un <input type="date">, il faut le format YYYY-MM-DD
function toInputDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

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

// ---------- Popup Ajouter / Modifier / Voir ----------
function OwnerModal({ mode, owner, residences, onClose, onSaved, token }) {
  const readOnly = mode === "view";
  const [form, setForm] = useState({
    nom: owner?.nom || "",
    email: owner?.email || "",
    passwd: "",
    cin: owner?.cin || "",
    profession: owner?.profession || "",
    date_naissance: toInputDate(owner?.date_naissance),
    date_adhesion: toInputDate(owner?.date_adhesion) || toInputDate(new Date()),
    residence_id: owner?.residence_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const isEdit = mode === "edit";
      const url = isEdit ? `${API_URL}/${owner.id}` : API_URL;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "add" ? "Ajouter un copropriétaire" : mode === "edit" ? "Modifier le copropriétaire" : "Détails du copropriétaire";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-700">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-rose-500 text-sm bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nom complet</label>
              <input
                name="nom" value={form.nom} onChange={handleChange} required disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange} required disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>

          {mode === "add" && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Mot de passe initial</label>
              <input
                type="password" name="passwd" value={form.passwd} onChange={handleChange}
                placeholder="Laisser vide pour un mot de passe par défaut"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">CIN</label>
              <input
                name="cin" value={form.cin} onChange={handleChange} disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Profession</label>
              <input
                name="profession" value={form.profession} onChange={handleChange} disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date de naissance</label>
              <input
                type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date d'adhésion</label>
              <input
                type="date" name="date_adhesion" value={form.date_adhesion} onChange={handleChange} disabled={readOnly}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Résidence</label>
            <select
              name="residence_id" value={form.residence_id} onChange={handleChange} disabled={readOnly}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50"
            >
              <option value="">— Sélectionner —</option>
              {residences.map((r) => (
                <option key={r.id} value={r.id}>{r.nom}</option>
              ))}
            </select>
          </div>

          {!readOnly && (
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">
                Annuler
              </button>
              <button
                type="submit" disabled={saving}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ---------- Popup de confirmation de suppression ----------
function ConfirmDeleteModal({ owner, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-slate-700 mb-2">Supprimer le copropriétaire</h2>
        <p className="text-sm text-slate-500 mb-6">
          Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{owner.prenom} {owner.nom}</span> ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">
            Annuler
          </button>
          <button
            onClick={onConfirm} disabled={deleting}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Coproprietaires() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [owners, setOwners] = useState([]);
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [modal, setModal] = useState(null); // { mode: "add" | "edit" | "view", owner }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadOwners = () => {
    setLoading(true);
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then(setOwners)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    loadOwners();
    fetch(RESIDENCES_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then(setResidences)
      .catch(() => setResidences([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setDeleteTarget(null);
      loadOwners();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = owners.filter(
    (o) =>
      `${o.prenom} ${o.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

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
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/80" className="w-10 h-10 rounded-full" alt="" />
            <div>
              <p className="font-bold text-sm leading-tight">{decoded.nom}</p>
              <p className="text-xs text-slate-400 leading-tight">Administrateur</p>
            </div>
          </div>
        </div>

        <div className="p-8">

          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-700">Copropriétaires</h1>
              <p className="text-slate-400 mt-1">Liste de tous les copropriétaires enregistrés.</p>
            </div>
            <button
              onClick={() => setModal({ mode: "add", owner: null })}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
            >
              <i className="fas fa-plus"></i>
              Ajouter un copropriétaire
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                type="text"
                placeholder="Rechercher un copropriétaire..."
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
                      <th className="font-medium">Nom complet</th>
                      <th className="font-medium">Email</th>
                      <th className="font-medium">CIN</th>
                      <th className="font-medium">Profession</th>
                      <th className="font-medium">Résidence</th>
                      <th className="font-medium">Date d'adhésion</th>
                      <th className="font-medium text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((o, i) => {
                      const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                      return (
                        <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 text-slate-400">{(page - 1) * perPage + i + 1}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <span className={`w-9 h-9 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-xs font-bold shrink-0`}>
                                {initialsOf(o.nom, o.prenom)}
                              </span>
                              <span className="font-semibold text-slate-700 whitespace-nowrap">{o.prenom} {o.nom}</span>
                            </div>
                          </td>
                          <td className="text-slate-500">{o.email}</td>
                          <td className="text-slate-500">{o.cin || "–"}</td>
                          <td className="text-slate-500">{o.profession || "–"}</td>
                          <td className="text-slate-500 whitespace-nowrap">{o.residence || "–"}</td>
                          <td className="text-slate-500 whitespace-nowrap">{formatDate(o.date_adhesion)}</td>
                          <td className="pr-6">
                            <div className="flex items-center justify-end gap-3 text-slate-400">
                              <button onClick={() => setModal({ mode: "view", owner: o })} className="hover:text-indigo-500 transition-colors">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button onClick={() => setModal({ mode: "edit", owner: o })} className="hover:text-indigo-500 transition-colors">
                                <i className="fas fa-pen"></i>
                              </button>
                              <button onClick={() => setDeleteTarget(o)} className="hover:text-rose-500 transition-colors">
                                <i className="fas fa-trash-alt"></i>
                              </button>
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

      {modal && (
        <OwnerModal
          mode={modal.mode}
          owner={modal.owner}
          residences={residences}
          token={token}
          onClose={() => setModal(null)}
          onSaved={loadOwners}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          owner={deleteTarget}
          deleting={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export default Coproprietaires;
