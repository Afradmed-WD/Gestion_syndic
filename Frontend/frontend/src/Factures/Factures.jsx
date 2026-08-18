import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/factures";
const FORM_DATA_URL = "http://localhost:3000/factures/form-data";
const PER_PAGE = 8;

const fmtDate = (v) => v ? new Date(v).toLocaleDateString("fr-FR") : "–";
const inputDate = (v) => v ? String(v).slice(0, 10) : "";
const fmtMoney = (v) => Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const initials = (v) => (v || "?").split(" ").filter(Boolean).slice(0, 2).map(x => x[0]?.toUpperCase()).join("");

function Badge({ statut }) {
  const c = {
    payee: ["Payée", "bg-emerald-50 text-emerald-600"],
    en_attente: ["En attente", "bg-orange-50 text-orange-500"],
    impayee: ["Impayée", "bg-rose-50 text-rose-500"],
  }[statut] || [statut || "–", "bg-slate-100 text-slate-500"];
  return <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${c[1]}`}>{c[0]}</span>;
}

function Card({ icon, label, value, note, color }) {
  return <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl ${color}`}><i className={`fas ${icon}`} /></div>
    <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-indigo-950">{value}</p><p className="text-xs text-slate-400 mt-1">{note}</p></div>
  </div>

}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="px-6 py-4 border-b flex justify-between"><h3 className="font-bold text-lg">{title}</h3><button onClick={onClose}><i className="fas fa-times" /></button></div>
      <div className="p-6">{children}</div>
    </div>
  </div>

}

function Form({ initial, data, onSubmit, onCancel, busy, error }) {
  const [f, setF] = useState({
    numero: initial?.numero || "",
    coproprietaire_id: initial?.coproprietaire_id || "",
    appartement_id: initial?.appartement_id || "",
    residence_id: initial?.residence_id || "",
    date_emission: inputDate(initial?.date_emission) || new Date().toISOString().slice(0, 10),
    date_echeance: inputDate(initial?.date_echeance),
    montant: initial?.montant || "",
    statut: initial?.statut || "en_attente",
    description: initial?.description || "",
  });
  const change = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));
  const cls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none";
  return <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSubmit(f); }}>
    {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-xl">{error}</div>}
    <div><label className="text-xs font-semibold text-slate-500">Numéro</label><input name="numero" value={f.numero} onChange={change} placeholder="Automatique si vide" className={cls} /></div>
    <div><label className="text-xs font-semibold text-slate-500">Résident *</label><select required name="coproprietaire_id" value={f.coproprietaire_id} onChange={change} className={cls}><option value="">Sélectionner</option>{data.coproprietaires.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></div>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-xs font-semibold text-slate-500">Appartement</label><select name="appartement_id" value={f.appartement_id} onChange={change} className={cls}><option value="">Aucun</option>{data.appartements.map(x => <option key={x.id} value={x.id}>{x.numero}{x.residence ? ` - ${x.residence}` : ""}</option>)}</select></div>
      <div><label className="text-xs font-semibold text-slate-500">Résidence</label><select name="residence_id" value={f.residence_id} onChange={change} className={cls}><option value="">Aucune</option>{data.residences.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-xs font-semibold text-slate-500">Date d'émission *</label><input required type="date" name="date_emission" value={f.date_emission} onChange={change} className={cls} /></div>
      <div><label className="text-xs font-semibold text-slate-500">Échéance</label><input type="date" name="date_echeance" value={f.date_echeance} onChange={change} className={cls} /></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-xs font-semibold text-slate-500">Montant (MAD) *</label><input required type="number" min="0.01" step="0.01" name="montant" value={f.montant} onChange={change} className={cls} /></div>
      <div><label className="text-xs font-semibold text-slate-500">Statut</label><select name="statut" value={f.statut} onChange={change} className={cls}><option value="payee">Payée</option><option value="en_attente">En attente</option><option value="impayee">Impayée</option></select></div>
    </div>
    <div><label className="text-xs font-semibold text-slate-500">Description</label><textarea name="description" value={f.description} onChange={change} rows="3" className={cls} /></div>
    <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="px-5 py-3">Annuler</button><button disabled={busy} className="px-5 py-3 bg-indigo-600 text-white rounded-xl">{busy ? "Enregistrement..." : "Enregistrer"}</button></div>
  </form>;
}


const NAV_GESTION = [
  { icon: "fa-users", label: "Copropriétaires", href: "/coproprietaires" },
  { icon: "fa-building", label: "Appartements", href: "/appartements" },
  { icon: "fa-wallet", label: "Paiements", href: "/paiements" },
  { icon: "fa-coins", label: "Charges", href: "/charges" },
  { icon: "fa-exclamation-circle", label: "Réclamations", href: "/reclamations" },
  { icon: "fa-bullhorn", label: "Annonces", href: "/annonces" },
  { icon: "fa-file-alt", label: "Documents", href: "/documents" },
];
const NAV_COMPTA = [
  { icon: "fa-file-invoice", label: "Factures", href: "/factures", active: true },
  { icon: "fa-hand-holding-usd", label: "Dépenses", href: "/depenses" },
  { icon: "fa-chart-bar", label: "Rapports", href: "/rapports" },
];
const NAV_PARAMS = [
  { icon: "fa-user-friends", label: "Utilisateurs", href: "/utilisateurs" },
  { icon: "fa-cog", label: "Paramètres", href: "/parametres" },
];

function NavSection({ title, items }) {
  return <div className="mt-6">
    <p className="px-6 text-[11px] font-bold tracking-widest text-indigo-300 mb-2">{title}</p>
    {items.map(item => <a key={item.label} href={item.href}
      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${item.active ? "bg-white text-indigo-700 font-semibold shadow-sm" : "text-indigo-100 hover:bg-white/10"}`}>
      <i className={`fas ${item.icon} w-4 text-center ${item.active ? "text-indigo-600" : "text-indigo-200"}`}></i>{item.label}
    </a>)}
  </div>
}

export default function Factures() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [factures, setFactures] = useState([]);
  const [stats, setStats] = useState({ total: 0, montantTotal: 0, payees: 0, impayees: 0 });
  const [data, setData] = useState({ coproprietaires: [], appartements: [], residences: [] });
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [status, setStatus] = useState(""), [resident, setResident] = useState("");
  const [page, setPage] = useState(1), [modal, setModal] = useState(null), [busy, setBusy] = useState(false), [formError, setFormError] = useState("");

  let user = {}; try { if (token) user = jwtDecode(token); } catch { }

  async function load() {
    try {
      setLoading(true);
      const r = await fetch(API_URL, { headers }); const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erreur serveur");
      setFactures(j.factures || []); setStats(j.stats || {}); setError("");
    } catch (e) { setError(e.message || "Failed to fetch"); } finally { setLoading(false); }
  }
  async function loadData() {
    try { const r = await fetch(FORM_DATA_URL, { headers }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setData({ coproprietaires: j.coproprietaires || [], appartements: j.appartements || [], residences: j.residences || [] }); } catch (e) { console.error(e); }
  }
  useEffect(() => { if (token) { load(); loadData(); } else setLoading(false); }, [token]);

  async function save(payload, edit = false) {
    try {
      setBusy(true); setFormError("");
      const url = edit ? `${API_URL}/${modal.facture.id}` : API_URL;
      const r = await fetch(url, { method: edit ? "PUT" : "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Erreur");
      setModal(null); await load();
    } catch (e) { setFormError(e.message); } finally { setBusy(false); }
  }
  async function remove(f) {
    if (!window.confirm(`Supprimer ${f.numero} ?`)) return;
    try { const r = await fetch(`${API_URL}/${f.id}`, { method: "DELETE", headers }); const j = await r.json(); if (!r.ok) throw new Error(j.error); await load(); } catch (e) { setError(e.message); }
  }

  const filtered = useMemo(() => factures.filter(f => {
    const q = search.toLowerCase();
    return (!q || `${f.numero} ${f.resident} ${f.appartement} ${f.residence}`.toLowerCase().includes(q))
      && (!status || f.statut === status)
      && (!resident || String(f.coproprietaire_id) === String(resident));
  }), [factures, search, status, resident]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE)), current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  function exportCSV() {
    const body = filtered.map(f => [f.numero, f.resident, f.appartement, fmtDate(f.date_emission), fmtDate(f.date_echeance), f.montant, f.statut].join(";")).join("\n");
    const blob = new Blob(["\uFEFFNumero;Resident;Appartement;Emission;Echeance;Montant;Statut\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = "factures.csv"; a.click(); URL.revokeObjectURL(url);
  }

  if (!token) return <div className="text-center mt-10">Accès refusé 🚫</div>;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return <div className="flex h-screen bg-slate-50 font-sans text-slate-700">
    <aside className="w-72 bg-gradient-to-b from-indigo-800 to-indigo-600 text-white flex flex-col shrink-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
          <img src={logo} className="h-6" alt="" />
        </div>
        <div><p className="font-extrabold leading-tight">SyndicPro</p><p className="text-[11px] text-indigo-200 leading-tight">Gestion de copropriété</p></div>
      </div>
      <NavSection title="TABLEAU DE BORD" items={[{ icon: "fa-th-large", label: "Tableau de bord", href: "/dashboard" }]} />
      <NavSection title="GESTION" items={NAV_GESTION} />
      <NavSection title="COMPTABILITÉ" items={NAV_COMPTA} />
      <NavSection title="PARAMÈTRES" items={NAV_PARAMS} />
      <div className="flex-1"></div>
      <div className="m-4">
        <button className="w-full flex items-center gap-3 bg-white/10 rounded-xl p-3 mb-2">
          <img src="https://i.pravatar.cc/80" className="w-9 h-9 rounded-full" alt="" />
          <div className="text-left flex-1 min-w-0"><p className="text-sm font-semibold truncate">{user.nom || "Administrateur"}</p><p className="text-[11px] text-indigo-200">Administrateur</p></div>
        </button>
        <button onClick={handleLogout} className="w-full bg-indigo-500/40 hover:bg-rose-500 text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2">
          <i className="fas fa-sign-out-alt"></i>Déconnexion
        </button>
      </div>
    </aside>
    <div className="flex-1 overflow-auto">
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center">
        <div className="relative w-[430px]"><input placeholder="Rechercher..." className="w-full rounded-full bg-slate-50 border px-6 py-3" /><i className="fas fa-search absolute right-5 top-4 text-indigo-400" /></div>
        <div className="flex items-center gap-4"><i className="fas fa-bell text-indigo-500" /><div><p className="font-bold">{user.nom || "Administrateur"}</p><p className="text-xs text-slate-400">Administrateur</p></div></div>
      </header>

      <main className="p-8">
        <div className="flex justify-between items-center mb-7"><div><h1 className="text-3xl font-bold">Factures</h1><p className="text-indigo-400">Gestion des factures émises aux copropriétaires.</p></div>
          <div className="flex gap-3"><button onClick={exportCSV} className="bg-white border px-5 py-3 rounded-xl"><i className="fas fa-file-export mr-2" />Exporter</button><button onClick={() => { setFormError(""); setModal({ mode: "add" }); }} className="bg-indigo-600 text-white px-5 py-3 rounded-xl"><i className="fas fa-plus mr-2" />Nouvelle facture</button></div>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-6">
          <Card icon="fa-file-invoice" color="bg-indigo-600" label="Total factures" value={stats.total || 0} note="Ce mois" />
          <Card icon="fa-file-invoice-dollar" color="bg-emerald-500" label="Montant total" value={`${fmtMoney(stats.montantTotal)} MAD`} note="Ce mois" />
          <Card icon="fa-receipt" color="bg-orange-400" label="Payées" value={stats.payees || 0} note="Factures réglées" />
          <Card icon="fa-file-circle-xmark" color="bg-rose-500" label="Impayées" value={stats.impayees || 0} note="À relancer" />
        </div>

        <div className="bg-white rounded-t-2xl border p-4 flex gap-4">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher une facture..." className="flex-1 px-4 py-3 rounded-xl border" />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="px-5 rounded-xl border"><option value="">Statut : Tous</option><option value="payee">Payée</option><option value="en_attente">En attente</option><option value="impayee">Impayée</option></select>
          <select value={resident} onChange={e => { setResident(e.target.value); setPage(1) }} className="px-5 rounded-xl border"><option value="">Résident : Tous</option>{data.coproprietaires.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select>
        </div>

        {error && <div className="my-5 text-rose-500">Erreur : {error}</div>}
        {loading ? <div className="bg-white p-12 text-center">Chargement...</div> :
          !error && <div className="bg-white rounded-b-2xl overflow-x-auto border"><table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-50"><tr><th className="p-4">#</th><th>Numéro</th><th>Résident</th><th>Appartement</th><th>Date d'émission</th><th>Échéance</th><th>Montant (MAD)</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>{rows.map((f, i) => <tr key={f.id} className="border-t hover:bg-slate-50">
              <td className="p-4">{(current - 1) * PER_PAGE + i + 1}</td><td className="font-semibold">{f.numero}</td>
              <td><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs">{initials(f.resident)}</span><b>{f.resident || "–"}</b></div></td>
              <td>{f.appartement || "–"}</td><td>{fmtDate(f.date_emission)}</td><td>{fmtDate(f.date_echeance)}</td><td>{fmtMoney(f.montant)}</td><td><Badge statut={f.statut} /></td>
              <td><div className="flex gap-4 text-indigo-600"><button onClick={() => setModal({ mode: "view", facture: f })}><i className="fas fa-eye" /></button><button onClick={() => { setFormError(""); setModal({ mode: "edit", facture: f }) }}><i className="fas fa-pen" /></button><button onClick={() => remove(f)} className="text-rose-500"><i className="fas fa-trash" /></button></div></td>
            </tr>)}</tbody>
          </table>{!rows.length && <div className="p-12 text-center text-slate-400">Aucune facture trouvée.</div>}</div>}

        <div className="flex justify-between mt-5"><p className="text-sm text-indigo-400">{filtered.length} résultat(s)</p><div className="flex gap-2"><button disabled={current === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="w-10 h-10 border rounded-xl">‹</button>{Array.from({ length: pages }, (_, i) => i + 1).slice(0, 6).map(p => <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl ${p === current ? "bg-indigo-600 text-white" : "bg-white border"}`}>{p}</button>)}<button disabled={current === pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="w-10 h-10 border rounded-xl">›</button></div></div>
      </main>

      {modal?.mode === "add" && <Modal title="Nouvelle facture" onClose={() => setModal(null)}><Form data={data} onSubmit={x => save(x, false)} onCancel={() => setModal(null)} busy={busy} error={formError} /></Modal>}
      {modal?.mode === "edit" && <Modal title="Modifier la facture" onClose={() => setModal(null)}><Form initial={modal.facture} data={data} onSubmit={x => save(x, true)} onCancel={() => setModal(null)} busy={busy} error={formError} /></Modal>}
      {modal?.mode === "view" && <Modal title={`Facture ${modal.facture.numero}`} onClose={() => setModal(null)}><div className="space-y-3"><p><b>Résident :</b> {modal.facture.resident || "–"}</p><p><b>Appartement :</b> {modal.facture.appartement || "–"}</p><p><b>Résidence :</b> {modal.facture.residence || "–"}</p><p><b>Émission :</b> {fmtDate(modal.facture.date_emission)}</p><p><b>Échéance :</b> {fmtDate(modal.facture.date_echeance)}</p><p><b>Montant :</b> {fmtMoney(modal.facture.montant)} MAD</p><p><b>Statut :</b> <Badge statut={modal.facture.statut} /></p><p><b>Description :</b> {modal.facture.description || "–"}</p></div></Modal>}
    </div>
  </div>;
}
