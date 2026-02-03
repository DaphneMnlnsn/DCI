import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from 'axios';
import Swal from 'sweetalert2';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
    const handleLogin = async (e) => {   
        e.preventDefault();

        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/login`, {
                username,
                password,
            });
            
            if (response.status === 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful',
                    text: 'You have been logged in successfully.',
                }).then(() => {
                    // Redirect to main page after alert
                    navigate('/main');
                });
            }
        }
        catch (error){
            if (error.response.status === 500) {
                Swal.fire({
                    icon: 'error',
                    title: 'Wrong Credentials',
                    text: 'Please check your username and password.',
                });
                setError('Invalid credentials');
            }           
            else {
                alert('Login failed. Please try again later.');
                setError('Something went wrong');
            }
            console.log('Login error: ', error)

        }

    }

    return (
        <div className='login-root'> 
            <div className='login-left'>
                <div className='logo'>
                    <img className='login-logo' src='IDA-RTL-Logo.png'></img>
                </div>
                <h1 className='app-name'>DCI</h1>
                <h2 className='app-subname'>Database Conflict Identifier</h2>
            </div>

            <div className='login-right'>
                <div className='login-form-container'>
                    <h2 className='title'>Welcome Back!</h2>
                    <p className='subtitle'>Please login to your account to continue.</p> 
                    <div className='line'></div>

                    <form className='login-form' onSubmit={handleLogin}>
                        <div className='input-label'>Username</div>
                        <input className='login-email' 
                            type='text' 
                            placeholder='Enter your username' 
                            value={username}
                            onChange={e => setUsername(e.target.value)}/>
                        
                        <div className='input-label'>Password</div>
                        <input className='login-password' 
                            type='password' 
                            placeholder='Enter your password' 
                            value={password}
                            onChange={e => setPassword(e.target.value)}/>
                        
                        <div><button className='login-btn' type='submit'>Login</button></div>

                    </form>
                </div>
            </div>
            
        </div>
    );     
};

export default LoginPage;

