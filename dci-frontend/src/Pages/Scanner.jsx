import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Scanner.css';
import axios from 'axios';
import Header from '../assets/header.jsx';

const MainPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const fileInput = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');
    const [database, setDatabase] = useState(null);
    
    const handleLogout = async (e) => {   
        e.preventDefault();
        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/logout`, {
                username,
                password,
            });
            
            if (response.status === 200){
                alert('Logged out successfully.')
                navigate('/main');
            }
            else {
                alert('Logout failed.')
                setError('Invalid credentials');
            }
        }
        catch (error){
            console.log('Logout error: ', error)
            setError('Something went wrong');
        }
    }

    const handleDBSelect = () => {
        fileInput.current.click();
    }

    const fetchDatabase = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/read`, {
                responseType: 'json',
            });
            if (response.status === 200){
                setDatabase(response.data);
            }
        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

    return (
        <div className='scanner-root'> 
            <Header />
            <div className='scanner-container'>
                <div className='scanner-grid-container'>
                    <div className='scanner-select'>
                        <h3 className="card-title">Master Database</h3>
                    </div>
                    <div className='scanner-select'>
                        <h3 className="card-title">Client Database</h3>
                    </div>
                    <div className='scanner-select'>
                        <h3 className="card-title">Customize</h3>
                    </div>
                    
                    <div className='scanner-select'>
                        
                        <div className="card">
                            <p className="label">
                                Please select a database to Compare
                            </p>

                            <div className="line"></div>

                            <button className='select-btn' onClick={fetchDatabase}>Select</button>
                            <input type="file" ref={fileInput} style={{display: 'none'}} onChange={(e) => setSelectedFile(e.target.files[0])} />
                            {selectedFile && (
                                <img src={URL.createObjectURL(selectedFile)} alt='preview'
                                style={{
                                        width: 90,
                                        height: 90,
                                        borderRadius: 6,
                                        objectFit: "cover",
                                    }}/>
                            )}
                        </div>
                    </div>

                    <div className='scanner-select'>
                        
                        <div className="card">
                            <p className="label">
                                Please select a database to Compare
                            </p>

                            <div className="line"></div>

                            <button className='select-btn' onClick={fetchDatabase}>Select</button>
                            <input type="file" className='custom-checkbox' ref={fileInput} style={{display: 'none'}} onChange={(e) => setSelectedFile(e.target.files[0])} />
                            {selectedFile && (
                                <img src={URL.createObjectURL(selectedFile)} alt='preview'
                                style={{
                                        width: 90,
                                        height: 90,
                                        borderRadius: 6,
                                        objectFit: "cover",
                                    }}/>
                            )}
                        </div>
                    </div>

                    <div className='scanner-select'>
                        
                        <div className="card">
                            <p className="label">
                                Choose the requirement you want to compare
                            </p>

                            <div className="line"></div>

                            <div className="checkbox-group">
                                <label>
                                    <input type="checkbox" /> Select All
                                </label>

                                <label>
                                    <input type="checkbox" /> Missing Table
                                </label>

                                <label>
                                    <input type="checkbox" /> Missing Column
                                </label>

                                <label>
                                    <input type="checkbox" /> Missing Datatype
                                </label>
                            </div>

                            <button className='select-btn' onClick={fetchDatabase}>Scan</button>
                            <input type="file" ref={fileInput} style={{display: 'none'}} onChange={(e) => setSelectedFile(e.target.files[0])} />
                            {selectedFile && (
                                <img src={URL.createObjectURL(selectedFile)} alt='preview'
                                style={{
                                        width: 90,
                                        height: 90,
                                        borderRadius: 6,
                                        objectFit: "cover",
                                    }}/>
                            )}
                        </div>
                    </div>
                </div>
            </div>      
        </div>
    );
};

export default MainPage;

