import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import axios from 'axios';
import swal from 'sweetalert2';
import Header from '../assets/header.jsx';

const SettingsPage = () => {
    return (
        <div className="settings-root">
            <Header/>  
            <div className='settings-container'>
                
            </div>
        </div>
    );
}

export default SettingsPage;