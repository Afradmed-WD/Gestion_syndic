import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login2 from "./Authentification/Login2";
import Login from "./Authentification/login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login2 />} />
        <Route path="/login1" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
