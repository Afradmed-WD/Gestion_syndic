function Login() {
    return (

        <>
            <div className="flex justify-center ">
                <div className="bg-blue-500 text-white w-[50%] h-[100vh] py-48 rounded-r-[170px]">
                    <h1 className="text-2xl font-bold">Hello , Welcome</h1>
                    <p>
                        Don't Have an Acount ? </p>
                    <button className="border text-white rounded-lg px-4 p-1">Register</button>
                </div>
                <div className="w-[50%] py-20 h-[300vh]">
                    <div class=" p-10 rounded-r-lg ">
                        <h2 class="text-3xl font-bold mb-6 text-center">Login</h2>

                        <input type="text" placeholder="Username" class="w-full border rounded px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="password" placeholder="Password" class="w-full border rounded px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />


                        <button class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition">Login</button>

                      
                    </div>

                </div>
            </div>

        </>

    );
}

export default Login;