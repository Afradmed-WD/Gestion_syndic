import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login2 from "./Authentification/Login2";
import Login from "./Authentification/login";
import Register from "./Authentification/register";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login2 />} />
        <Route path="/login1" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
      </Routes>
    </Router>
  );
}

export default App;
