import React, { useState, useRef, useEffect } from "react";
import "./header.css";
import logo from "../assets/IDA-Logo.png";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  const handleLogout = () => {
    navigate("/");
  };

  const handleSettings = () => {
    const currentUserId = parseInt(localStorage.getItem('currentUserId'));

    if (currentUserId === 1) {
      alert('hi admin!');
      navigate("/settings");
    } else {
      alert('hi normal person!');
      setOpen(prev => !prev);
    } 
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        {open && (
          <div className="settings-popup" ref={popupRef}>
            <p>hi kween</p>
          </div>
        )}

        <LogOut className='header-icon' onClick={handleLogout}/>
      </div>
    </header>
  );
};

export default Header;
