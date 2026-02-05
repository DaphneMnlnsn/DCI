import React from "react";
import "./header.css";
import logo from '../assets/IDA-Logo.png';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async (e) => {   
    navigate('/');
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <img src={logo} alt="IDA Logo" className="logo-img" />
      </div>

      <div className="header-center">
        <h1 className="header-title">Database Conflict Identifier</h1>
      </div>

      <div className="header-right">
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

    </header>
  );
};

export default Header;