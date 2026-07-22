import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login2 from "./Authentification/Login";
import Login from "./Authentification/Dashboard";
import Register from "./Authentification/register";
import Coproprietaires from "./Component/Coproprietaires";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login2 />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/copropriteire" element={<Coproprietaires />} />
        
        
      </Routes>
    </Router>
  );
}

export default App;
