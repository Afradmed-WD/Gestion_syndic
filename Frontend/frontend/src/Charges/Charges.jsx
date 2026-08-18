import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/charges";
const RESIDENCES_URL = "http://localhost:3000/residences";

const STATUS_STYLES = {
  "Payée": "bg-emerald-50 text-emerald-600",
  "En attente": "bg-amber-50 text-amber-600",
  "En retard": "bg-rose-50 text-rose-500",
};

// Traduction FR (affiché) <-> valeurs enum réelles envoyées au backend
const STATUT_OPTIONS = [
  { value: "payee", label: "Payée" },
  { value: "partielle", label: "En attente" },
  { value: "impayee", label: "En retard" },
];

// Icône cosmétique dérivée du libellé (aucune colonne "catégorie" en base)
function iconFor(libelle = "") {
  const l = libelle.toLowerCase();
  if (l.includes("eau")) return { icon: "fa-tint", bg: "bg-sky-50", color: "text-sky-500" };
  if (l.includes("électric") || l.includes("electric")) return { icon: "fa-bolt", bg: "bg-blue-50", color: "text-blue-500" };
  if (l.includes("ascenseur")) return { icon: "fa-wrench", bg: "bg-orange-50", color: "text-orange-500" };
  if (l.includes("sécurité") || l.includes("securite") || l.includes("gardien")) return { icon: "fa-shield-alt", bg: "bg-rose-50", color: "text-rose-500" };
  if (l.includes("nettoy")) return { icon: "fa-broom", bg: "bg-violet-50", color: "text-violet-500" };
  if (l.includes("assurance")) return { icon: "fa-file-contract", bg: "bg-indigo-50", color: "text-indigo-500" };
  if (l.includes("jardin")) return { icon: "fa-leaf", bg: "bg-emerald-50", color: "text-emerald-500" };
  return { icon: "fa-coins", bg: "bg-slate-100", color: "text-slate-500" };
}

function formatDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("fr-FR");
}

// Formate une date pour un <input type="date"> (YYYY-MM-DD)
function toInputDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return "";
  return date.toISOString().slice(0, 10);
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
  const headers = ["Libellé", "Résidence", "Appartement", "Montant (MAD)", "Périodicité", "Date d'échéance", "Statut"];
  const lines = [
    headers.join(";"),
    ...rows.map((c) =>
      [c.libelle, c.residence, c.appartement, c.montant, c.periode, formatDate(c.date_echeance), c.statut]
        .map(csvEscape)
        .join(";")
    ),
  ];
  // BOM pour un affichage correct des accents dans Excel
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `charges_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const NAV_GESTION = [
  { icon: "fa-users", label: "coproprietaires" },
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

function ChargeForm({ initial, residences, onCancel, onSubmit, submitting, error }) {
  const [form, setForm] = useState({
    libelle: initial?.libelle || "",
    montant: initial?.montant || "",
    periode: initial?.periode || "",
    date_echeance: toInputDate(initial?.date_echeance),
    statut: initial?.statut || "impayee",
    residence_id: initial?.residence_id || "",
    appartement_id: initial?.appartement_id || "",
  });

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
        <label className="block text-xs font-semibold text-slate-500 mb-1">Libellé *</label>
        <input
          type="text"
          name="libelle"
          placeholder="Eau, Électricité, Ascenseur..."
          value={form.libelle}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Montant (MAD) *</label>
          <input type="number" step="0.01" min="0" name="montant" value={form.montant} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Périodicité</label>
          <input type="text" name="periode" placeholder="Mensuelle, Trimestrielle..." value={form.periode} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Date d'échéance</label>
          <input type="date" name="date_echeance" value={form.date_echeance} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Statut</label>
          <select name="statut" value={form.statut} onChange={handleChange} className={inputClass}>
            {STATUT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Résidence</label>
        <select name="residence_id" value={form.residence_id} onChange={handleChange} className={inputClass}>
          <option value="">-- Aucune --</option>
          {residences.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nom}
            </option>
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
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({ charge, onCancel, onConfirm, submitting, error }) {
  return (
    <div>
      {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <p className="text-sm text-slate-600">
        Voulez-vous vraiment supprimer la charge <span className="font-semibold">{charge.libelle}</span> d'un montant de{" "}
        <span className="font-semibold">{charge.montant} MAD</span> ? Cette action est irréversible.
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

function ViewDetails({ charge, onClose }) {
  const rows = [
    ["Libellé", charge.libelle],
    ["Résidence", charge.residence || "–"],
    ["Appartement", charge.appartement || "–"],
    ["Montant", `${charge.montant} MAD`],
    ["Périodicité", charge.periode || "–"],
    ["Date d'échéance", formatDate(charge.date_echeance)],
    ["Statut", charge.statut],
  ];
  return (
    <div>
      <dl className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-2.5 text-sm">
            <dt className="text-slate-400">{label}</dt>
            <dd className="font-semibold text-slate-700">{value}</dd>
          </div>
        ))}
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

function Charges() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [charges, setCharges] = useState([]);
  const [stats, setStats] = useState(null);
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  // popup state: { mode: "add" | "edit" | "delete" | "view", charge?: object }
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadCharges = () => {
    setLoading(true);
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json?.charges)) {
          setCharges(json.charges);
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
    loadCharges();
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
    navigate("/login");
  };

  const openAdd = () => {
    setFormError(null);
    setModal({ mode: "add" });
  };

  const openEdit = async (c) => {
    setFormError(null);
    setModal({ mode: "edit", charge: null });
    try {
      const res = await fetch(`${API_URL}/${c.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors du chargement de la charge");
      setModal({ mode: "edit", charge: json });
    } catch (err) {
      setModal(null);
      setError(err.message);
    }
  };

  const openView = (c) => setModal({ mode: "view", charge: c });
  const openDelete = (c) => {
    setFormError(null);
    setModal({ mode: "delete", charge: c });
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
      loadCharges();
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
      const res = await fetch(`${API_URL}/${modal.charge.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la mise à jour");
      closeModal();
      loadCharges();
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
      const res = await fetch(`${API_URL}/${modal.charge.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la suppression");
      closeModal();
      loadCharges();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = charges.filter((c) => c.libelle?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const total = stats?.total ?? 0;
  const payees = stats?.payees ?? 0;
  const attente = stats?.attente ?? 0;
  const retard = stats?.retard ?? 0;
  const pct = (n) => (total ? `${((n / total) * 100).toFixed(1)}% du total` : "–");

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
              <h1 className="text-3xl font-bold text-slate-700">Charges</h1>
              <p className="text-slate-400 mt-1">Gestion des charges de copropriété.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportToCSV(filtered)}
                disabled={!filtered.length}
                className="flex items-center gap-2 border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-download"></i>
                Exporter
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
              >
                <i className="fas fa-plus"></i>
                Nouvelle charge
              </button>
            </div>
          </div>

          {!loading && !error && (
            <div className="grid grid-cols-4 gap-5 mb-6">
              <StatCard icon="fa-file-invoice" bg="bg-indigo-500" label="Total charges (mois)" value={total} note="Ce mois" tone="text-slate-400" />
              <StatCard icon="fa-arrow-trend-up" bg="bg-emerald-500" label="Charges payées" value={payees} note={pct(payees)} tone="text-emerald-500" />
              <StatCard icon="fa-clock" bg="bg-amber-500" label="Charges en attente" value={attente} note={pct(attente)} tone="text-amber-500" />
              <StatCard icon="fa-times-circle" bg="bg-rose-500" label="Charges en retard" value={retard} note={pct(retard)} tone="text-rose-500" />
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                type="text"
                placeholder="Rechercher une charge..."
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
                      <th className="font-medium">Libellé</th>
                      <th className="font-medium">Résidence / Appt</th>
                      <th className="font-medium">Montant (MAD)</th>
                      <th className="font-medium">Périodicité</th>
                      <th className="font-medium">Date d'échéance</th>
                      <th className="font-medium">Statut</th>
                      <th className="font-medium text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c, i) => {
                      const ic = iconFor(c.libelle);
                      return (
                        <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 text-slate-400">{(page - 1) * perPage + i + 1}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <span className={`w-10 h-10 rounded-lg ${ic.bg} flex items-center justify-center shrink-0`}>
                                <i className={`fas ${ic.icon} ${ic.color}`}></i>
                              </span>
                              <span className="font-semibold text-slate-700 whitespace-nowrap">{c.libelle}</span>
                            </div>
                          </td>
                          <td className="text-slate-500 whitespace-nowrap">
                            {c.residence || "–"}{c.appartement ? ` · ${c.appartement}` : ""}
                          </td>
                          <td className="text-slate-700 font-semibold">{c.montant}</td>
                          <td className="text-slate-500">{c.periode || "–"}</td>
                          <td className="text-slate-500 whitespace-nowrap">{formatDate(c.date_echeance)}</td>
                          <td><StatusBadge statut={c.statut} /></td>
                          <td className="pr-6">
                            <div className="flex items-center justify-end gap-3 text-slate-400">
                              <button onClick={() => openView(c)} className="hover:text-indigo-500 transition-colors"><i className="fas fa-eye"></i></button>
                              <button onClick={() => openEdit(c)} className="hover:text-indigo-500 transition-colors"><i className="fas fa-pen"></i></button>
                              <button onClick={() => openDelete(c)} className="hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
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
        <Modal title="Nouvelle charge" onClose={closeModal}>
          <ChargeForm residences={residences} onCancel={closeModal} onSubmit={handleCreate} submitting={submitting} error={formError} />
        </Modal>
      )}

      {modal?.mode === "edit" && (
        <Modal title="Modifier la charge" onClose={closeModal}>
          {modal.charge ? (
            <ChargeForm
              initial={modal.charge}
              residences={residences}
              onCancel={closeModal}
              onSubmit={handleUpdate}
              submitting={submitting}
              error={formError}
            />
          ) : (
            <p className="text-slate-400 text-sm">Chargement...</p>
          )}
        </Modal>
      )}

      {modal?.mode === "view" && (
        <Modal title="Détails de la charge" onClose={closeModal}>
          <ViewDetails charge={modal.charge} onClose={closeModal} />
        </Modal>
      )}

      {modal?.mode === "delete" && (
        <Modal title="Supprimer la charge" onClose={closeModal}>
          <DeleteConfirm charge={modal.charge} onCancel={closeModal} onConfirm={handleDelete} submitting={submitting} error={formError} />
        </Modal>
      )}
    </div>
  );
}

export default Charges;