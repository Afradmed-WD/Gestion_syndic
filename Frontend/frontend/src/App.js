import { Routes, Route, BrowserRouter } from "react-router-dom";
import Login2 from "./Authentification/Login";
import Login from "./Component/Dashboard";
import Register from "./Authentification/register";
import Coproprietaires from "./coproprietaires/Coproprietaires";
import Layout from "./Layout/layout";
import Appartements from "./Appartement/Appartements";
import Charges from "./Charges/Charges";
import Paiements from "./Piements/Paiements";
import Reclamations from "./Réclamations/Reclamations";
import Documents from "./Documents/Documents";
import Annonces from "./Annonces/Annonces";
import Depenses from "./Depences/Depences";
import Factures from "./Factures/Factures";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login2 />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/coproprietaires" element={<Coproprietaires />} />
          <Route path="/Appartements" element={<Appartements />} />
          <Route path="/Charges" element={<Charges />} />
          <Route path="/Paiements" element={<Paiements />} />
          <Route path="/Réclamations" element={<Reclamations />} />
          <Route path="/Documents" element={<Documents />} />
          <Route path="/Annonces" element={<Annonces />} />
          <Route path="/Dépenses" element={<Depenses />} />
          <Route path="/Factures" element={<Factures />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;