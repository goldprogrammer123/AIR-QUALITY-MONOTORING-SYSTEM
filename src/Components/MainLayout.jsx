import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  const [isOpen,setIsOpen]= useState(false)
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
     
        <Sidebar isOpen={isOpen}  setIsOpen={setIsOpen}/>
      
      {/* header */}
      <div className="flex-1 md:ml-64">
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />

        {/* CONTENT RENDERS HERE */}
        <div className="pt-[90px] p-6">
          <Outlet />
        </div>
      </div>
    </div>
  
  );
};

export default MainLayout;
