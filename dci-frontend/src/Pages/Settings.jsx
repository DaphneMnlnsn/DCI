import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import axios from 'axios';
import swal from 'sweetalert2';
import Header from '../assets/header.jsx';
import { Eye, EyeOff, Plus, Trash, Pencil } from "lucide-react";

const SettingsPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [port, setPort] = useState('');
    const [tempHost, setTempHost] = useState([]);
    const [host, setHost] = useState('');
    const [tempDb, setTempDb] = useState('');
    const [dbType, setDbType] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [users, setUsers] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [page2, setPage2] = useState(1);
    const [perPage2, setPerPage2] = useState(10);
    const [pagination2, setPagination2] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    useEffect(() => {
        //getServers();
        getUsers();
        getActivityLogs();
    }, []);

    const getServers = async () => {
        const response = await axios.get(
            `${import.meta.env.VITE_APP_BASE_URL}/api/servers`,
            { responseType: 'json' }
        );

        const allServers = response.data.databases || [];
        setTempHost(allServers);
    }

    const getUsers = async () => {
        try{
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users`, { 
                responseType: 'json' 
            });

            const allUsers = response.data.users || [];
            setUsers(allUsers);
        } catch (error) {
            console.log('Fetch users error: ', error);
        }
        
    }

    const getActivityLogs = async () => {
        try{
            const response = await axios.get(
                `${import.meta.env.VITE_APP_BASE_URL}/api/activity-logs`,
                { responseType: 'json' }
            );

            const allLogs = response.data.activity_logs || [];
            setActivityLogs(allLogs);
        } catch (error) {
            console.log('Fetch activity logs error: ', error);
        }
    }

    const handleSave = () => {
        setDbType(tempDb);
        setHost(host);
        setPort(port);
        setUsername(username);
        setPassword(password);
        alert(tempDb + host + port + username + password);
    }

    const handleAdd = async () => {
        try {
            const { value: formValues, isConfirmed }  = await swal.fire({
                title: 'Add User',
                html:`
                    <label>Name</label>
                    <br>
                    <input
                        id="name" class="swal2-input" placeholder="Enter name"
                    /> 
                    <label>Username</label>
                    <br>
                    <input
                        id="username" class="swal2-input" placeholder="Enter username"
                    />
                    <br>
                    <label>Password</label>
                    <br>
                    <input
                        type="password" id="password" class="swal2-input" placeholder="Enter password"
                    /> 
                    <br>
                    <label>Confirm Password</label>
                    <br>
                    <input
                        type="password" id="confirm-password" class="swal2-input" placeholder="Confirm password"
                    /> 
                `,
                showCancelButton: true,
                confirmButtonText: "Add",
                confirmButtonColor: "#003566",
                customClass: { popup: 'swal-big swal-poppins swal-align'},
                
                preConfirm: () => {
                    const name = document.getElementById('name').value;
                    const username = document.getElementById('username').value;
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirm-password').value;
                    
                    if (!name || !username || !password || !confirmPassword) {
                        swal.showValidationMessage("All fields are required");
                        return false;
                    }

                    if (password !== confirmPassword) {
                        swal.showValidationMessage("Passwords do not match");
                        return false;
                    }

                    return { name, username, password };
                }
            });

            if(isConfirmed){
                const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/users/create`, 
                    formValues,
                );
                if(response.status === 201){
                    swal.fire({
                        icon: 'success',
                        title: 'Add User Successful',
                        text: 'User created successfully.',
                        confirmButtonColor: '#003566',
                    });
                    getUsers();
                }
            }
        } catch (error) {
            console.log('Add user error: ', error);
        }
    }

    const handleEdit = async (user) => {
        try {
            const { value: formValues, isConfirmed } = await swal.fire({
                title: 'Edit User',
                html:`
                    <label>Username</label>
                    <br>
                    <input
                        id="username" class="swal2-input" value="${user.username}"
                    />
                    <br>
                    <label>Name</label>
                    <br>
                    <input
                        id="name" class="swal2-input" value="${user.name}"
                    /> 
                `,
                showCancelButton: true,
                confirmButtonText: "Save",
                confirmButtonColor: "#003566",
                customClass: { popup: 'swal-big swal-poppins swal-align'},
                
                preConfirm: () => {
                    return {
                        username: document.getElementById('username').value,
                        name: document.getElementById('name').value
                    };
                }
            });

            if(isConfirmed){
                const response = await axios.put(`${import.meta.env.VITE_APP_BASE_URL}/api/users/update/${user.id}`, 
                    formValues,
                );
                if(response.status === 200){
                    swal.fire({
                        icon: 'success',
                        title: 'Edit Successful',
                        text: 'User edited successfully.',
                        confirmButtonColor: '#003566',
                    });
                    getUsers();
                }
            }
            
        } catch (error) {
            console.log('Edit user error: ', error);
        }
    }

    const handleDelete = async (id) => {
        try {
            const decision = await swal.fire({
                title: "Warning",
                text: "Are you sure you want to delete this user?",
                icon: "warning",
                confirmButtonColor: "#003566",
                showCancelButton: true,
            });

            if(decision.isConfirmed){
                const response = await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/users/delete/${id}`, {
                    responseType: 'json',
                });

                if(response.status === 200){
                    swal.fire({
                        icon: 'success',
                        title: 'Delete Successful',
                        text: 'User deleted successfully.',
                        confirmButtonColor: '#003566',
                    });
                }
            }
        } catch (error) {
            console.log('Delete user error: ', error);
        }
    }

    const renderPageButtons = () => {
        const pages = [];
        const current = pagination.current_page || page;
        const last = pagination.last_page || 1;
        const start = Math.max(1, current - 3);
        const end = Math.min(last, current + 3);

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('gap-start');
        }
        for (let p = start; p <= end; p++) pages.push(p);
        if (end < last) {
            if (end < last - 1) pages.push('gap-end');
            pages.push(last);
        }

        return pages.map((p, i) => {
        if (p === 'gap-start' || p === 'gap-end') {
            return <button key={`gap-${i}`} className="page-gap" disabled>...</button>;
        }
        return (
            <button
                key={p}
                className={`pagination-btn ${p === current ? 'active' : ''}`}
                onClick={() => setPage(p)}
                disabled={p === current || loading}
            >
            {p}
            </button>
        );
        });
    };

    return (
    <div className='settings-root'>
        <Header/> 
        <div className="settings-container">
             
            <div className='settings-left'>
                <div className='left-container'>
                    <div className='settings-configure-label'>Configure</div>
                    <div className="line"></div>
                    <div className='settings-subLabel'>Database Type</div>
                    <div className='radio-group'>
                        <label className='radio-button-label'>
                            <input type='radio' value={'mysql'} name='database-type' checked={tempDb === 'mysql'} onChange={() => setTempDb('mysql')}/>MySQL
                        </label>
                        <label className='radio-button-label'>
                            <input type='radio' value={'postgres'} name='database-type' checked={tempDb === 'postgres'} onChange={() => setTempDb('postgres')}/>Postgres
                        </label>
                        <label className='radio-button-label'>
                            <input type='radio' value={'mssql'} name='database-type' checked={tempDb === 'mssql'} onChange={() => setTempDb('mssql')}/>MSSQL
                        </label>
                    </div>
                    <form className='settings-form'>
                        <div className='settings-subLabel'>Host/Server</div>
                        <input className='login-email' 
                            type='text' 
                            placeholder='Enter server' 
                            value={port}
                            onChange={e => setPort(e.target.value)}/>

                        <div className='settings-subLabel'>Port</div>
                        <input className='login-email' 
                            type='text' 
                            placeholder='Enter port' 
                            value={port}
                            onChange={e => setPort(e.target.value)}/>
                        
                        <div className='settings-subLabel'>Username</div>
                        <input className='login-email' 
                            type='text' 
                            placeholder='Enter username' 
                            value={username}
                            onChange={e => setUsername(e.target.value)}/>
                        <div className='settings-subLabel'>Password</div>
                        <div className="password-wrapper">
                            <input
                                className='login-password'
                                type={showPassword ? 'text' : 'password'}
                                placeholder='Enter password'
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="settings-toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                    </form>

                    
                    <button className='settings-btn' onClick={handleSave}>Save</button>
                </div>
            </div>

            <div className='settings-right'>
                <div className='activity-log-container'>
                    <div className='settings-card-header'>
                        <p className='settings-user-label'>Users</p>
                        <Plus className='settings-icon' onClick={handleAdd}/>
                    </div>
                    <div className="activity-log-table-wrapper">
                        <table id="activity-log-table" className="activity-logs">
                            <thead>
                                <tr>
                                <th>User ID</th>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td className='empty-label' colSpan="4">No users available.</td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <tr key={index}>
                                            <td>{user.id}</td>
                                            <td>{user.username}</td>
                                            <td>{user.name}</td>
                                            <td>
                                                <Pencil className="settings-icon" onClick={() => handleEdit(user)}/>
                                                <Trash className="settings-icon delete-icon" onClick={() => handleDelete(user)}/>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <div className="settings-pagination" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                            <button
                                className="pagination-btn"
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page <= 1 || loading}
                            >
                            Prev
                            </button>

                            {renderPageButtons()}

                            <button
                                className="pagination-btn"
                                onClick={() => setPage(prev => Math.min(pagination.last_page || prev + 1, (pagination.last_page || prev + 1)))}
                                disabled={page >= (pagination.last_page || 1) || loading}
                            >
                            Next
                            </button>

                            <div style={{ marginLeft: 'auto' }}>
                            <small>Page {pagination.current_page} of {pagination.last_page} — {pagination.total} total</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='activity-log-container'>
                    <div className='settings-card-header'>
                        <p className='settings-label'>Activity Log</p>
                    </div>
                    <div className="activity-log-table-wrapper">
                        <table id="activity-log-table" className="activity-logs">
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Action</th>
                                    <th>Description</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityLogs.length === 0 ? (
                                    <tr>
                                        <td className='empty-label' colSpan="4">No activity logs available.</td>
                                    </tr>
                                ) : (
                                    activityLogs.map((log, index) => (
                                        <tr key={index}>
                                            <td>{log.user_id}</td>
                                            <td>{log.action}</td>
                                            <td>{log.description}</td>
                                            <td>{new Date(log.created_at).toLocaleString('en-PH', { hour12: true })}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <div className="settings-pagination" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                            <button
                                className="pagination-btn"
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page <= 1 || loading}
                            >
                            Prev
                            </button>

                            {renderPageButtons()}

                            <button
                                className="pagination-btn"
                                onClick={() => setPage(prev => Math.min(pagination.last_page || prev + 1, (pagination.last_page || prev + 1)))}
                                disabled={page >= (pagination.last_page || 1) || loading}
                            >
                            Next
                            </button>

                            <div style={{ marginLeft: 'auto' }}>
                            <small>Page {pagination.current_page} of {pagination.last_page} — {pagination.total} total</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}

export default SettingsPage;