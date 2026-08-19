import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API_URL = "http://localhost:3000/utilisateurs";

const NAV_GESTION = [
  { icon: "fa-users", label: "copropriétaires" },
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
  { icon: "fa-cog", label: "Paramètres", active: true },
];

const TABS = [
  { id: "profil", label: "Profil", icon: "fa-user" },
  { id: "securite", label: "Sécurité", icon: "fa-lock" },
  { id: "notifications", label: "Notifications", icon: "fa-bell" },
  { id: "apparence", label: "Apparence", icon: "fa-palette" },
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

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? "bg-indigo-600" : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? "left-5.5 translate-x-0" : "left-0.5"}`}
        style={{ left: checked ? "22px" : "2px" }}
      ></span>
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200";

function Reglages() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [tab, setTab] = useState("profil");

  // --- Profil ---
  const [profil, setProfil] = useState({ nom: "", email: "" });
  const [profilMsg, setProfilMsg] = useState(null);
  const [savingProfil, setSavingProfil] = useState(false);

  // --- Sécurité ---
  const [pwd, setPwd] = useState({ ancien: "", nouveau: "", confirmation: "" });
  const [pwdMsg, setPwdMsg] = useState(null);
  const [savingPwd, setSavingPwd] = useState(false);

  // --- Notifications & apparence (préférences locales, pas de table en base) ---
  const [notifs, setNotifs] = useState({ email: true, paiements: true, reclamations: true, annonces: false });
  const [theme, setTheme] = useState("clair");

  if (!token) return <h2 className="text-center mt-10">Accès refusé 🚫</h2>;

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch {
    return <h2>Token invalide</h2>;
  }

  // Initialise le formulaire profil une fois le token décodé (sans hook supplémentaire)
  if (profil.nom === "" && profil.email === "" && decoded.nom) {
    profil.nom = decoded.nom;
    profil.email = decoded.email || "";
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const saveProfil = async (e) => {
    e.preventDefault();
    setSavingProfil(true);
    setProfilMsg(null);
    try {
      const res = await fetch(`${API_URL}/${decoded.id || decoded.userId || ""}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profil),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de l'enregistrement");
      setProfilMsg({ type: "success", text: "Profil mis à jour avec succès." });
    } catch (err) {
      setProfilMsg({ type: "error", text: err.message });
    } finally {
      setSavingProfil(false);
    }
  };

  // --- Sécurité ---
  const savePwd = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwd.nouveau !== pwd.confirmation) {
      setPwdMsg({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch(`${API_URL}/${decoded.id || decoded.userId || ""}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ancien: pwd.ancien, nouveau: pwd.nouveau }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors du changement de mot de passe");
      setPwdMsg({ type: "success", text: "Mot de passe changé avec succès." });
      setPwd({ ancien: "", nouveau: "", confirmation: "" });
    } catch (err) {
      setPwdMsg({ type: "error", text: err.message });
    } finally {
      setSavingPwd(false);
    }
  };

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

        <div className="p-8 max-w-4xl">

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-700">Paramètres</h1>
            <p className="text-slate-400 mt-1">Gérez votre profil, votre sécurité et vos préférences.</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 mb-6 w-fit">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  tab === t.id ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <i className={`fas ${t.icon}`}></i>
                {t.label}
              </button>
            ))}
          </div>

          {/* Profil */}
          {tab === "profil" && (
            <form onSubmit={saveProfil} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-700 mb-1">Informations du profil</h2>
              <p className="text-sm text-slate-400 mb-6">Ces informations sont utilisées pour votre compte administrateur.</p>

              <div className="flex items-center gap-4 mb-6">
                <img src="https://i.pravatar.cc/80" className="w-16 h-16 rounded-full" alt="" />
                <button type="button" className="border border-slate-200 text-slate-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                  Changer la photo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom complet">
                  <input className={inputClass} value={profil.nom} onChange={(e) => setProfil({ ...profil, nom: e.target.value })} />
                </Field>
                <Field label="Email">
                  <input type="email" className={inputClass} value={profil.email} onChange={(e) => setProfil({ ...profil, email: e.target.value })} />
                </Field>
              </div>

              {profilMsg && (
                <p className={`text-sm mt-4 ${profilMsg.type === "success" ? "text-emerald-600" : "text-rose-500"}`}>{profilMsg.text}</p>
              )}

              <button
                type="submit"
                disabled={savingProfil}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
              >
                {savingProfil ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          )}

          {/* Sécurité */}
          {tab === "securite" && (
            <form onSubmit={savePwd} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-700 mb-1">Changer le mot de passe</h2>
              <p className="text-sm text-slate-400 mb-6">Utilisez un mot de passe unique que vous n'utilisez pour aucun autre site.</p>

              <div className="flex flex-col gap-4 max-w-sm">
                <Field label="Mot de passe actuel">
                  <input type="password" className={inputClass} value={pwd.ancien} onChange={(e) => setPwd({ ...pwd, ancien: e.target.value })} />
                </Field>
                <Field label="Nouveau mot de passe">
                  <input type="password" className={inputClass} value={pwd.nouveau} onChange={(e) => setPwd({ ...pwd, nouveau: e.target.value })} />
                </Field>
                <Field label="Confirmer le nouveau mot de passe">
                  <input type="password" className={inputClass} value={pwd.confirmation} onChange={(e) => setPwd({ ...pwd, confirmation: e.target.value })} />
                </Field>
              </div>

              {pwdMsg && (
                <p className={`text-sm mt-4 ${pwdMsg.type === "success" ? "text-emerald-600" : "text-rose-500"}`}>{pwdMsg.text}</p>
              )}

              <button
                type="submit"
                disabled={savingPwd}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
              >
                {savingPwd ? "Enregistrement..." : "Mettre à jour le mot de passe"}
              </button>
            </form>
          )}

          {/* Notifications */}
          {tab === "notifications" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-700 mb-1">Préférences de notification</h2>
              <p className="text-sm text-slate-400 mb-6">Choisissez les notifications que vous souhaitez recevoir par email.</p>

              <div className="flex flex-col divide-y divide-slate-100">
                {[
                  { key: "email", label: "Notifications par email", desc: "Recevoir un résumé quotidien par email" },
                  { key: "paiements", label: "Paiements", desc: "Être notifié des nouveaux paiements reçus" },
                  { key: "reclamations", label: "Réclamations", desc: "Être notifié des nouvelles réclamations" },
                  { key: "annonces", label: "Annonces", desc: "Être notifié quand une annonce est publiée" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-sm text-slate-700">{n.label}</p>
                      <p className="text-xs text-slate-400">{n.desc}</p>
                    </div>
                    <Toggle checked={notifs[n.key]} onChange={(v) => setNotifs({ ...notifs, [n.key]: v })} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apparence */}
          {tab === "apparence" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-700 mb-1">Apparence</h2>
              <p className="text-sm text-slate-400 mb-6">Choisissez le thème de l'interface.</p>

              <div className="flex gap-4">
                {[
                  { id: "clair", label: "Clair", icon: "fa-sun" },
                  { id: "sombre", label: "Sombre", icon: "fa-moon" },
                  { id: "systeme", label: "Système", icon: "fa-desktop" },
                ].map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setTheme(o.id)}
                    className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 transition-colors ${
                      theme === o.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <i className={`fas ${o.icon} text-xl ${theme === o.id ? "text-indigo-600" : "text-slate-400"}`}></i>
                    <span className={`text-sm font-medium ${theme === o.id ? "text-indigo-700" : "text-slate-600"}`}>{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Reglages;