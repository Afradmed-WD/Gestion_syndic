import { Link } from "react-router-dom";
function Navbar() {

    return (
        <nav className="w-64 h-screen bg-indigo-700 text-white fixed left-0 top-0">
                <h2 className="text-xl font-bold p-5">SyndicPro</h2>

                <ul>
                    <li>
                        <Link to="/test">Dashboard</Link>
                    </li>
                    <li>
                        <Link to="/cop">Copropriétaires</Link>
                    </li>
                    <li>
                        <Link to="/app">Appartements</Link>
                    </li>
                    <li>
                        <Link to="/documents">Documents</Link>
                    </li>
                    <li>
                        <Link to="/piements">Piements</Link>
                    </li>
                </ul>
        </nav>
    );
}

export default Navbar;