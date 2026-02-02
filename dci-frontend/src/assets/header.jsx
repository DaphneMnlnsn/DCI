import React from "react";
import "./header.css";
import logo from '../assets/IDA-Logo.png';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-left">
        <img src={logo} alt="IDA Logo" className="logo-img" />
      </div>

      <div className="header-center">
        <h1 className="header-title">Database Conflict Identifier</h1>
      </div>

      <div className="header-right">
        Logout
      </div>

    </header>
  );
};

export default Header;