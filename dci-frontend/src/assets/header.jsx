import React from "react";
import "./header.css";
import logo from "../assets/IDA-Logo.png";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <img src={logo} alt="IDA Logo" className="logo-img" onClick={() => navigate('/main')}/>
      </div>

      <div className="header-center">
        <h1 className="header-title">Database Conflict Identifier</h1>
      </div>

      <div className="header-right">
        <Settings className='header-icon' onClick={handleSettings}/>
        <LogOut className='header-icon' onClick={handleLogout}/>
      </div>
    </header>
  );
};

export default Header;
