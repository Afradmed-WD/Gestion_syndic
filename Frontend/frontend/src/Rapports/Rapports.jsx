import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/rapports";
const RESIDENCES_URL = "http://localhost:3000/residences";

const TYPE_OPTIONS = [
  { value: "financier", label: "Financier", icon: "fa-sack-dollar", bg: "bg-indigo-100", color: "text-indigo-600" },
  { value: "charges", label: "Charges", icon: "fa-coins", bg: "bg-amber-100", color: "text-amber-600" },
  { value: "paiements", label: "Paiements", icon: "fa-wallet", bg: "bg-emerald-100", color: "text-emerald-600" },
  { value: "depenses", label: "Dépenses", icon: "fa-hand-holding-usd", bg: "bg-rose-100", color: "text-rose-500" },
  { value: "activite", label: "Activité", icon: "fa-chart-line", bg: "bg-sky-100", color: "text-sky-600" },
];

function typeInfo(type) {
  return TYPE_OPTIONS.find((t) => t.value === type) || TYPE_OPTIONS[0];
}

function formatDate(d) {
  if (!d) return "–";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleDateString("fr-FR");
}

function formatMontant(m) {
  const n = Number(m || 0);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "MAD" });
}

// Message d'erreur plus parlant : "Failed to fetch" ne veut rien dire pour l'utilisateur,
// on le traduit en un message qui pointe vers la vraie cause probable.
function friendlyError(err) {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Impossible de joindre le serveur (vérifiez qu'il est bien démarré sur http://localhost:3000).";
  }
  return err.message || "Une erreur est survenue.";
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
  { icon: "fa-chart-bar", label: "Rapports", active: true },
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
        <p className="text-2xl font-bold text-slate-700 leading-tight">{value}</p>
        <p className={`text-xs font-semibold ${tone}`}>{note}</p>
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

function GenerateForm({ residences, onCancel, onSubmit, submitting, error }) {
  const today = new Date().toISOString().slice(0, 10);
  const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    titre: "",
    type: "financier",
    periode_debut: debutMois,
    periode_fin: today,
    residence_id: "",
  });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2 flex items-start gap-2">
          <i className="fas fa-circle-exclamation mt-0.5"></i>
          <span>{error}</span>
        </p>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Titre du rapport *</label>
        <input
          type="text"
          name="titre"
          value={form.titre}
          onChange={handleChange}
          placeholder="Ex : Rapport financier - Août 2026"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Type de rapport</label>
        <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Période - début *</label>
          <input type="date" name="periode_debut" value={form.periode_debut} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Période - fin *</label>
          <input type="date" name="periode_fin" value={form.periode_fin} onChange={handleChange} required className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Résidence (optionnel)</label>
        <select name="residence_id" value={form.residence_id} onChange={handleChange} className={inputClass}>
          <option value="">Toutes les résidences</option>
          {residences.map((r) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              Génération...
            </>
          ) : (
            <>
              <i className="fas fa-file-pdf"></i>
              Générer le rapport
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({ rapport, onCancel, onConfirm, submitting, error }) {
  return (
    <div>
      {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <p className="text-sm text-slate-600">
        Voulez-vous vraiment supprimer <span className="font-semibold">{rapport.titre}</span> ? Cette action est irréversible.
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

/* ------------------------------------------------------------------ */
/*  PAGE PRINCIPALE                                                     */
/* ------------------------------------------------------------------ */

function Rapports() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [rapports, setRapports] = useState([]);
  const [stats, setStats] = useState(null);
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadRapports = () => {
    setLoading(true);
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json?.rapports)) {
          setRapports(json.rapports);
          setStats(json.stats);
          setError(null);
        } else {
          setError(json?.error || "Réponse API invalide");
        }
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    loadRapports();
    fetch(RESIDENCES_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => setResidences(Array.isArray(json) ? json : []))
      .catch(() => setResidences([]));
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

  const openGenerate = () => {
    setFormError(null);
    setModal({ mode: "generate" });
  };
  const openDelete = (r) => {
    setFormError(null);
    setModal({ mode: "delete", rapport: r });
  };
  const closeModal = () => {
    setModal(null);
    setFormError(null);
  };

  const handleGenerate = async (form) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(API_URL, { method: "POST", headers: authHeaders, body: JSON.stringify(form) });

      // La réponse peut ne pas être du JSON valide si le serveur a planté en cours de route
      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error(`Réponse invalide du serveur (code ${res.status}). Vérifiez le terminal backend.`);
      }

      if (!res.ok) throw new Error(json.error || "Erreur lors de la génération");
      closeModal();
      loadRapports();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_URL}/${modal.rapport.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la suppression");
      closeModal();
      loadRapports();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (r) => {
    fetch(`${API_URL}/${r.id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Téléchargement impossible");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${r.titre}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((err) => setError(friendlyError(err)));
  };

  const filtered = rapports.filter((r) => r.titre?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const total = stats?.total ?? 0;
  const ceMois = stats?.ceMois ?? 0;
  const paiementsMois = stats?.paiementsMois ?? 0;
  const solde = stats?.solde ?? 0;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-700">
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
              <h1 className="text-3xl font-bold text-slate-700">Rapports</h1>
              <p className="text-slate-400 mt-1">Générez et consultez les rapports de la copropriété.</p>
            </div>
            <button
              onClick={openGenerate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
            >
              <i className="fas fa-file-circle-plus"></i>
              Générer un rapport
            </button>
          </div>

          {!loading && !error && (
            <div className="grid grid-cols-4 gap-5 mb-6">
              <StatCard icon="fa-folder" bg="bg-indigo-500" label="Rapports générés" value={total} note="Toutes périodes" tone="text-slate-400" />
              <StatCard icon="fa-calendar-plus" bg="bg-sky-500" label="Générés ce mois" value={ceMois} note="Nouveaux rapports" tone="text-sky-500" />
              <StatCard icon="fa-wallet" bg="bg-emerald-500" label="Paiements ce mois" value={formatMontant(paiementsMois)} note="Encaissés" tone="text-emerald-500" />
              <StatCard
                icon="fa-scale-balanced"
                bg={solde >= 0 ? "bg-emerald-500" : "bg-rose-500"}
                label="Solde ce mois"
                value={formatMontant(solde)}
                note="Paiements - dépenses"
                tone={solde >= 0 ? "text-emerald-500" : "text-rose-500"}
              />
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                type="text"
                placeholder="Rechercher un rapport..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {loading && <p className="text-slate-400">Chargement...</p>}
          {error && (
            <p className="text-rose-500 bg-rose-50 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <i className="fas fa-circle-exclamation"></i>
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              {paged.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-chart-bar text-xl"></i>
                  </div>
                  <p className="font-semibold text-slate-600">Aucun rapport généré</p>
                  <p className="text-sm text-slate-400 mt-1">Cliquez sur "Générer un rapport" pour créer votre premier rapport.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {paged.map((r) => {
                    const t = typeInfo(r.type);
                    return (
                      <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-11 h-11 rounded-xl ${t.bg} ${t.color} flex items-center justify-center`}>
                            <i className={`fas ${t.icon}`}></i>
                          </div>
                          <button onClick={() => openDelete(r)} className="text-slate-300 hover:text-rose-500 transition-colors" title="Supprimer">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                        <p className="font-semibold text-slate-700 leading-snug">{r.titre}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(r.periode_debut)} → {formatDate(r.periode_fin)}
                        </p>
                        {r.residence && (
                          <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                            {r.residence}
                          </span>
                        )}
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
                          <p className="text-xs text-slate-400">
                            Par {r.publie_par || "–"} · {formatDate(r.created_at)}
                          </p>
                          <button
                            onClick={() => handleDownload(r)}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
                          >
                            <i className="fas fa-download"></i>
                            PDF
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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

      {modal?.mode === "generate" && (
        <Modal title="Générer un rapport" onClose={closeModal}>
          <GenerateForm residences={residences} onCancel={closeModal} onSubmit={handleGenerate} submitting={submitting} error={formError} />
        </Modal>
      )}

      {modal?.mode === "delete" && (
        <Modal title="Supprimer le rapport" onClose={closeModal}>
          <DeleteConfirm rapport={modal.rapport} onCancel={closeModal} onConfirm={handleDelete} submitting={submitting} error={formError} />
        </Modal>
      )}
    </div>
  );
}

export default Rapports;