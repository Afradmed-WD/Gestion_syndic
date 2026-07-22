import { Routes, Route, BrowserRouter } from "react-router-dom";
import Login2 from "./Authentification/Login";
import Login from "./Component/Dashboard";
import Register from "./Authentification/register";
import Coproprietaires from "./Component/Coproprietaires";
import Navbar from "./Layout/Navbar";
import Layout from "./Layout/layout";
import Test from "./Layout/test";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout/>}>
        <Route path="/login" element={<Login2 />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Navbar" element={<Navbar />} />
        <Route path="/test" element={<Test />} />
        
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
