import React, { useState, useRef, useEffect } from "react";
import "./header.css";
import logo from "../assets/IDA-Logo.png";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { Eye, EyeOff, Plus, Trash, Pencil } from "lucide-react";
import axios from 'axios';
import swal from 'sweetalert2';

const Header = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const popupRef = useRef(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [port, setPort] = useState('');
    const [tempHost, setTempHost] = useState([]);
    const [host, setHost] = useState('');
    const [tempDb, setTempDb] = useState('');
    const [dbType, setDbType] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogout = async () => {
      try{
        const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/logout`, { 
            responseType: 'json',
            withCredentials: true
        });
        navigate("/");
      } catch (error) {
        console.log('Logout error: ', error);
      }
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

    const handleSave = async () => {
        const driver = tempDb;
        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/set-database`, {
                driver: driver,
                host: host,
                port: port,
                username: username,
                password: password,
                responseType: 'json'
            }, {
                withCredentials: true,
            });

            if (response.status === 200) {
                swal.fire({
                    icon: 'success',
                    title: 'Configuration Successful',
                    text: 'Settings configured successfully.',
                    confirmButtonColor: '#003566',
                });
            }
        } catch (error) {
            console.log('Saving configurations error: ', error);
            swal.fire({
                title: "Connection Failed",
                text: "Please check your inputs.",
                icon: "error",
                confirmButtonColor: "#003566"
            });
        }
    }

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
              <div className='popup-container'>
                <div className='settings-label'>Configure</div>
                <div className="line"></div>
                <div className='popup-subLabel'>Database Type</div>
                <div className='popup-radio-group'>
                  <label className='popup-radio-button-label'>
                    <input type='radio' value={'mysql'} name='database-type' checked={tempDb === 'mysql'} onChange={() => setTempDb('mysql')}/>MySQL
                  </label>
                  <label className='popup-radio-button-label'>
                    <input type='radio' value={'pgsql'} name='database-type' checked={tempDb === 'postgres'} onChange={() => setTempDb('postgres')}/>Postgres
                  </label>
                  <label className='popup-radio-button-label'>
                    <input type='radio' value={'sqlsrv'} name='database-type' checked={tempDb === 'mssql'} onChange={() => setTempDb('mssql')}/>MSSQL
                  </label>
                </div>

                <form className='popup-form'>
                  <div className='popup-subLabel'>Host/Server</div>
                    <input className='popup-login-email' 
                      type='text' 
                      placeholder='Enter server' 
                      value={host}
                      onChange={e => setHost(e.target.value)}/>

                  <div className='popup-subLabel'>Port</div>
                    <input className='popup-login-email' 
                      type='text' 
                      placeholder='Enter port' 
                      value={port}
                      onChange={e => setPort(e.target.value)}/>
                            
                  <div className='popup-subLabel'>Username</div>
                    <input className='popup-login-email' 
                      type='text' 
                      placeholder='Enter username' 
                      value={username}
                      onChange={e => setUsername(e.target.value)}/>

                  <div className='popup-subLabel'>Password</div>
                  <div className="popup-password-wrapper">
                    <input
                      className='popup-login-password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter password'
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="popup-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </form>

                  <button className='popup-btn' onClick={handleSave}>Save</button>
                </div>
              </div>
            )}

          <LogOut className='logout-icon' onClick={handleLogout}/>
        </div>
      </header>
  );
};

export default Header;
