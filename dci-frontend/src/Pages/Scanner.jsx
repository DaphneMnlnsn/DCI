import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from 'axios';

const MainPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    
    const handleLogin = async (e) => {
        alert('hello')
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/login`, {
            email,
            password,
        });

        alert(response);

        if (response.ok){
            navigate('/main');
        }
        else {
            alert('mali :(');
        }
    }
    return (
        <div className='root'> 
            <div className='login-left'>
                <div className='logo'>
                    <img className='login-logo' src='IDA-RTL-Logo.png'></img>
                </div>
                <h1 className='app-name'>DCI</h1>
                <h2 className='app-subname'>Database Conflict Identifier</h2>
            </div>
            
        </div>
    );
};

export default MainPage;

