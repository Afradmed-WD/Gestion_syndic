import { Outlet } from "react-router-dom";

function Layout() {
    return ( 
        <div className="">
            <div className="">
                <Outlet/>
            </div>
        </div>
     );
}

export default Layout;