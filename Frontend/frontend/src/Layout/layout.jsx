import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function Layout() {
    return ( 
        <div className="flex">
            <Navbar/>
            <div className="ml-64 flex-1 p-6">
                <Outlet/>
            </div>
        </div>
     );
}

export default Layout;