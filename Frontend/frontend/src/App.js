import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login2 from "./Authentification/Login2";
import Login from "./Authentification/login";
import Register from "./Authentification/register";
import Coproprietaires from "./Component/Coproprietaires";
import Appartements from "./Component/Appartements";
import Paiements from "./Component/Paiements";
import Documents from "./Component/Documents";
import Charges from "./Component/Charges";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login2 />} />
        <Route path="/login1" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/copropriteire" element={<Coproprietaires />} />
        <Route path="/Appartement" element={<Appartements />} />
        <Route path="/Piement" element={<Paiements />} />
        <Route path="/Documents" element={<Documents />} />
        <Route path="/Charges" element={<Charges />} />
        
      </Routes>
    </Router>
  );
}

export default App;
