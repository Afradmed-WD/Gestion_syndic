import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/documents";
const RESIDENCES_URL = "http://localhost:3000/residences";

const TYPE_ICON = {
  Pdf: { icon: "fa-file-pdf", bg: "bg-rose-100", color: "text-rose-500" },
  Docx: { icon: "fa-file-word", bg: "bg-sky-100", color: "text-sky-600" },
  Xlsx: { icon: "fa-file-excel", bg: "bg-emerald-100", color: "text-emerald-600" },
  Png: { icon: "fa-file-image", bg: "bg-indigo-100", color: "text-indigo-500" },
  Jpg: { icon: "fa-file-image", bg: "bg-indigo-100", color: "text-indigo-500" },
};

function formatDate(d) {
  if (!d) return "–";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "–";
  return {
    date: date.toLocaleDateString("fr-FR"),
    time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportToCSV(rows) {
  const headers = ["Titre", "Résidence", "Type", "Publié par", "Date document", "Date d'ajout"];
  const lines = [
    headers.join(";"),
    ...rows.map((r) => {
      const dDoc = formatDate(r.date_document);
      const dAjout = formatDate(r.created_at);
      return [
        r.titre,
        r.residence,
        r.type,
        r.publie_par,
        typeof dDoc === "object" ? dDoc.date : dDoc,
        typeof dAjout === "object" ? dAjout.date : dAjout,
      ]
        .map(csvEscape)
        .join(";");
    }),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `documents_${new Date().toISOString().slice(0, 10)}.csv`);
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

function TypeIcon({ type }) {
  const conf = TYPE_ICON[type] || { icon: "fa-file", bg: "bg-slate-100", color: "text-slate-400" };
  return (
    <span className={`w-9 h-9 rounded-lg ${conf.bg} ${conf.color} flex items-center justify-center shrink-0`}>
      <i className={`fas ${conf.icon}`}></i>
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

function DocumentForm({ initial, residences, onCancel, onSubmit, submitting, error }) {
  const [form, setForm] = useState({
    titre: initial?.titre || "",
    residence_id: initial?.residence_id || "",
    date_document: initial?.date_document ? initial.date_document.slice(0, 10) : "",
  });
  const [fichier, setFichier] = useState(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("titre", form.titre);
    fd.append("residence_id", form.residence_id);
    fd.append("date_document", form.date_document);
    if (fichier) fd.append("fichier", fichier);
    onSubmit(fd);
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Titre *</label>
        <input type="text" name="titre" value={form.titre} onChange={handleChange} required className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Résidence</label>
        <select name="residence_id" value={form.residence_id} onChange={handleChange} className={inputClass}>
          <option value="">-- Sélectionner --</option>
          {residences.map((r) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Date du document</label>
        <input type="date" name="date_document" value={form.date_document} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Fichier {initial ? "(laisser vide pour conserver le fichier actuel)" : "*"}
        </label>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-6 text-sm text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-colors">
          <i className="fas fa-cloud-upload-alt"></i>
          {fichier ? fichier.name : initial?.fichier || "Cliquer pour choisir un fichier"}
          <input type="file" className="hidden" required={!initial} onChange={(e) => setFichier(e.target.files?.[0] || null)} />
        </label>
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

function DeleteConfirm({ document, onCancel, onConfirm, submitting, error }) {
  return (
    <div>
      {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <p className="text-sm text-slate-600">
        Voulez-vous vraiment supprimer <span className="font-semibold">{document.titre}</span> ? Cette action est irréversible.
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

function ViewDetails({ document, onClose }) {
  const dDoc = formatDate(document.date_document);
  const dAjout = formatDate(document.created_at);
  const rows = [
    ["Titre", document.titre],
    ["Résidence", document.residence || "–"],
    ["Type", document.type || "–"],
    ["Fichier", document.fichier || "–"],
    ["Publié par", document.publie_par || "–"],
    ["Date du document", typeof dDoc === "object" ? dDoc.date : dDoc],
    ["Date d'ajout", typeof dAjout === "object" ? `${dAjout.date} ${dAjout.time}` : dAjout],
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

function Documents() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [documents, setDocuments] = useState([]);
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

  const loadDocuments = () => {
    setLoading(true);
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json?.documents)) {
          setDocuments(json.documents);
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
    loadDocuments();
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

  const openEdit = async (doc) => {
    setFormError(null);
    setModal({ mode: "edit", document: null });
    try {
      const res = await fetch(`${API_URL}/${doc.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors du chargement du document");
      setModal({ mode: "edit", document: json });
    } catch (err) {
      setModal(null);
      setError(err.message);
    }
  };

  const openView = (doc) => setModal({ mode: "view", document: doc });
  const openDelete = (doc) => {
    setFormError(null);
    setModal({ mode: "delete", document: doc });
  };
  const closeModal = () => {
    setModal(null);
    setFormError(null);
  };

  const handleCreate = async (formData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la création");
      closeModal();
      loadDocuments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_URL}/${modal.document.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la mise à jour");
      closeModal();
      loadDocuments();
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
      const res = await fetch(`${API_URL}/${modal.document.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la suppression");
      closeModal();
      loadDocuments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (doc) => {
    fetch(`${API_URL}/${doc.id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Téléchargement impossible");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.fichier || doc.titre;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((err) => setError(err.message));
  };

  const filtered = documents.filter(
    (d) =>
      d.titre?.toLowerCase().includes(search.toLowerCase()) ||
      d.residence?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const total = stats?.total ?? 0;
  const ceMois = stats?.ceMois ?? 0;
  const nbResidences = stats?.residences ?? 0;
  const nbTypes = stats?.typesDistincts ?? 0;

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
              <h1 className="text-3xl font-bold text-slate-700">Documents</h1>
              <p className="text-slate-400 mt-1">Centralisez et gérez tous les documents de la copropriété.</p>
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
                Nouveau document
              </button>
            </div>
          </div>

          {!loading && !error && (
            <div className="grid grid-cols-4 gap-5 mb-6">
              <StatCard icon="fa-folder" bg="bg-indigo-500" label="Total documents" value={total} note="Toutes résidences" tone="text-slate-400" />
              <StatCard icon="fa-calendar-plus" bg="bg-emerald-500" label="Ajoutés ce mois" value={ceMois} note="Nouveaux dépôts" tone="text-emerald-500" />
              <StatCard icon="fa-building" bg="bg-amber-500" label="Résidences" value={nbResidences} note="Résidences concernées" tone="text-amber-500" />
              <StatCard icon="fa-file-alt" bg="bg-sky-500" label="Types de fichiers" value={nbTypes} note="Formats différents" tone="text-sky-500" />
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                type="text"
                placeholder="Rechercher un document..."
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
                      <th className="font-medium">Titre</th>
                      <th className="font-medium">Résidence</th>
                      <th className="font-medium">Type</th>
                      <th className="font-medium">Publié par</th>
                      <th className="font-medium">Date document</th>
                      <th className="font-medium">Date d'ajout</th>
                      <th className="font-medium text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((doc, i) => {
                      const dDoc = formatDate(doc.date_document);
                      const dAjout = formatDate(doc.created_at);
                      return (
                        <tr key={doc.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 text-slate-400">{(page - 1) * perPage + i + 1}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <TypeIcon type={doc.type} />
                              <p className="font-semibold text-slate-700 whitespace-nowrap">{doc.titre}</p>
                            </div>
                          </td>
                          <td className="text-slate-500 whitespace-nowrap">{doc.residence || "–"}</td>
                          <td className="text-slate-500">{doc.type || "–"}</td>
                          <td className="text-slate-700">{doc.publie_par || "–"}</td>
                          <td className="text-slate-500 whitespace-nowrap">{typeof dDoc === "object" ? dDoc.date : dDoc}</td>
                          <td className="text-slate-500 whitespace-nowrap">
                            <p>{typeof dAjout === "object" ? dAjout.date : dAjout}</p>
                            {typeof dAjout === "object" && <p className="text-xs text-slate-400">{dAjout.time}</p>}
                          </td>
                          <td className="pr-6">
                            <div className="flex items-center justify-end gap-3 text-slate-400">
                              <button onClick={() => openView(doc)} className="hover:text-indigo-500 transition-colors" title="Voir">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button onClick={() => handleDownload(doc)} className="hover:text-indigo-500 transition-colors" title="Télécharger">
                                <i className="fas fa-download"></i>
                              </button>
                              <button onClick={() => openEdit(doc)} className="hover:text-indigo-500 transition-colors" title="Modifier">
                                <i className="fas fa-pen"></i>
                              </button>
                              <button onClick={() => openDelete(doc)} className="hover:text-rose-500 transition-colors" title="Supprimer">
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

      {modal?.mode === "add" && (
        <Modal title="Nouveau document" onClose={closeModal}>
          <DocumentForm residences={residences} onCancel={closeModal} onSubmit={handleCreate} submitting={submitting} error={formError} />
        </Modal>
      )}

      {modal?.mode === "edit" && (
        <Modal title="Modifier le document" onClose={closeModal}>
          {modal.document ? (
            <DocumentForm initial={modal.document} residences={residences} onCancel={closeModal} onSubmit={handleUpdate} submitting={submitting} error={formError} />
          ) : (
            <p className="text-slate-400 text-sm">Chargement...</p>
          )}
        </Modal>
      )}

      {modal?.mode === "view" && (
        <Modal title="Détails du document" onClose={closeModal}>
          <ViewDetails document={modal.document} onClose={closeModal} />
        </Modal>
      )}

      {modal?.mode === "delete" && (
        <Modal title="Supprimer le document" onClose={closeModal}>
          <DeleteConfirm document={modal.document} onCancel={closeModal} onConfirm={handleDelete} submitting={submitting} error={formError} />
        </Modal>
      )}
    </div>
  );
}

export default Documents;