import { Bell, Menu, Moon, X } from "lucide-react";
import React from "react";

const Header = ({ isOpen, setIsOpen }) => {
  return (
    <header
      className="fixed top-0 left-0 w-full h-16
                 grid grid-cols-3 items-center
                 bg-white shadow-md px-6 z-[999]"
    >
      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="flex items-center gap-2">
          <img
            src="https://www.aru.ac.tz/site/images/logo.jpg"
            alt="Ardhi University Logo"
            className="w-10 h-10 object-cover rounded-full border border-gray-300"
          />

          <span className="hidden sm:inline text-sm font-semibold text-gray-800">
            Ardhi University
          </span>
        </div>
      </div>

      {/* CENTER SECTION  */}
      <div className="text-center px-2">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500 truncate">
          Air Quality Monitoring System
        </h1>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center justify-end gap-5">
        <Moon size={20} className="cursor-pointer" />

        <div className="relative cursor-pointer">
          <Bell size={20} />
          <span
            className="absolute -top-2 -right-2 bg-black text-white text-[10px]
                       w-5 h-5 flex items-center justify-center rounded-full"
          >
            1
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
