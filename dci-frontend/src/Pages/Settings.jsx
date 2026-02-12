import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import axios from 'axios';
import swal from 'sweetalert2';
import Header from '../assets/header.jsx';

const SettingsPage = () => {
    return (
    <div className='settings-root'>
        <Header/> 
        <div className="settings-container">
             
            <div className='settings-left'>
                <div className='left-container'>
                    <div className='settings-label'>Change Database Type</div>
                    <div className="line"></div>
                    <div className='radio-group'>
                        <label className='radio-button-label'>
                            <input type='radio' value={'mysql'} name='database-type'/>MySQL
                        </label>
                        <label className='radio-button-label'>
                            <input type='radio' value={'postgres'} name='database-type'/>Postgres
                        </label>
                        <label className='radio-button-label'>
                            <input type='radio' value={'mssql'} name='database-type'/>MSSQL
                        </label>
                    </div>
                    <button className='settings-btn'>Change</button>
                </div>
                <div className='left-container'>
                    <div className='settings-label'>Change server</div>
                    <div className="line"></div>
                    <select className='settings-select'>
                        <option value=''>Select Server</option>
                        <option value=''>Hi kween</option>
                    </select>
                    <button className='settings-btn'>Change</button>
                </div>
            </div>

            <div className='settings-right'>
                <div className='activity-log-container'>
                    <div className='card-header'>
                        <p className='settings-label'>Users</p>
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
                                {/* 
                                {activityLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4">No activity logs available.</td>
                                    </tr>
                                ) : (
                                    activityLogs.map((log, index) => (
                                        <tr key={index}>
                                        <td>{log.user_id}</td>
                                        <td>{log.action}</td>
                                        <td>{log.entity}</td>
                                        <td>{new Date(log.created_at).toLocaleString('en-PH', { hour12: true })}</td>
                                        </tr>
                                    ))
                                )}*/}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <div className="settings-pagination">
                            <button className="pagination-btn" 
                                //disabled={pagination.current_page === 1}
                                //onClick={() => fetchActivityLogs(pagination.current_page - 1)}
                            >
                                Prev
                            </button>
                            <span>
                                {/*pagination.current_page} / {pagination.last_page*/}
                            </span>
                            <button className="pagination-btn" 
                                //disabled={pagination.current_page === pagination.last_page}
                                //onClick={() => fetchActivityLogs(pagination.current_page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
                <div className='activity-log-container'>
                    <div className='card-header'>
                        <p className='settings-label'>Activity log</p>
                    </div>
                    <div className="activity-log-table-wrapper">
                        <table id="activity-log-table" className="activity-logs">
                            <thead>
                                <tr>
                                <th>User ID</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* 
                                {activityLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4">No activity logs available.</td>
                                    </tr>
                                ) : (
                                    activityLogs.map((log, index) => (
                                        <tr key={index}>
                                        <td>{log.user_id}</td>
                                        <td>{log.action}</td>
                                        <td>{log.entity}</td>
                                        <td>{new Date(log.created_at).toLocaleString('en-PH', { hour12: true })}</td>
                                        </tr>
                                    ))
                                )}*/}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-footer">
                        <div className="settings-pagination">
                            <button className="pagination-btn" 
                                //disabled={pagination.current_page === 1}
                                //onClick={() => fetchActivityLogs(pagination.current_page - 1)}
                            >
                                Prev
                            </button>
                            <span>
                                {/*pagination.current_page} / {pagination.last_page*/}
                            </span>
                            <button className="pagination-btn" 
                                //disabled={pagination.current_page === pagination.last_page}
                                //onClick={() => fetchActivityLogs(pagination.current_page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}

export default SettingsPage;