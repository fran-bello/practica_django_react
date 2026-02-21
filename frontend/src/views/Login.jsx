import { useState } from "react";
import logo from "../assets/logo.png";

function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <div className="w-1/2 max-w-md bg-neutral-100 rounded-xl p-8 shadow-lg filter:blur-lg flex flex-col items-center">
        <img src={logo} alt="logo" className="logo w-2/3" />

        <form className="flex flex-col items-center justify-center w-full">
          <input
            type="email"
            placeholder="Email"
            className="w-full text-sm p-3 rounded-sm border border-gray-300 mb-2 outline-blue-200 outline-1"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full text-sm p-3 rounded-sm border border-gray-300 mb-2 outline-blue-200 outline-1"
          />

          <button
            type="submit"
            className="text-sm w-full p-3 rounded-sm bg-zinc-700 hover:bg-zinc-900 text-white outline-red-200"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
