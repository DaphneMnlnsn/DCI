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
        <img src={logo} alt="IDA Logo" className="logo-img" />
      </div>

      <div className="header-center">
        <h1 className="header-title">Database Conflict Identifier</h1>
      </div>

      <div className="header-right">
        <button className="icon-button" onClick={handleSettings}>
          <Settings size={22} />
        </button>

        <button className="icon-button" onClick={handleLogout}>
          <LogOut size={22} />
        </button>

      </div>
    </header>
  );
};

export default Header;
