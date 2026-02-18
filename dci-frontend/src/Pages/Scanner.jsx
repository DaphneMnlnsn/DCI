import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Scanner.css';
import axios from 'axios';
import swal from 'sweetalert2';
import Header from '../assets/header.jsx';
import PropTypes from 'prop-types';
import Row from '../components/Row.jsx';
import exportToExcel from '../Pages/ExcelExport.jsx';
import exportToPDF from '../Pages/PDFExport.jsx';
import {fetchConflicts, fetchSchema, fixAllConflicts} from '../components/DatabaseAPIs.jsx';
import { CollapsibleTable, CollapsibleTable2, CollapsibleTableScanned } from '../components/CollapsibleTables.jsx';

const MainPage = () => {
    const navigate = useNavigate();
    const fileInput = useRef(null);
    const [error, setError] = useState('');
    const [database, setDatabase] = useState(null);
    const [database2, setDatabase2] = useState(null);
    const [results, setResults] = useState(null);
    const [show, setShow] = useState(false);
    const [show2, setShow2] = useState(false);
    const [scan, setScan] = useState(false);
    const [rescan, setRescan] = useState(false);
    const [fixConflicts, setFixConflicts] = useState(false);
    const [noConflicts, setNoConflicts] = useState(false);
    const [warnings, setWarnings] = useState([]);
    const [fixed, setFixed] = useState([]);
    const [dbA, setDbA] = useState(null);
    const [dbB, setDbB] = useState(null);

    const fetchDatabase = async (dbName) => {
        if (!dbName) return;

        const data = await fetchSchema(dbName);
        setDatabase({ raw: data.raw, database: data.database, tables: data.tables });
        setShow(true);
    }

    const fetchDatabase2 = async (dbName) => {
        if (!dbName) return;

        const data = await fetchSchema(dbName);
        setDatabase2({ raw: data.raw, database2: data.database, tables2: data.tables });
        setShow2(true);
    }

    const fetchResults = async () => {
        const results = await fetchConflicts(dbA, dbB);

        setResults({ raw: results.raw, conflicts: results.conflictsArray });
        setNoConflicts(results.hasConflicts);
        setScan(true);
        setRescan(true);
        setFixConflicts(true);
    }

    const openDatabaseSelect = async (title, setDb, fetchFn) => {
        const response = await axios.get(
            `${import.meta.env.VITE_APP_BASE_URL}/api/read/all`,
            { responseType: 'json' }
        );

        const allDatabases = response.data.databases || [];

        const result = await swal.fire({
            title: title,
            html: `
                <input 
                    id="swal-text"
                    class="swal2-input select-input"
                    placeholder="Search database..."
                    autocomplete="off"
                />
                <div id="swal-suggestion-list" class="swal-suggestion-list"></div>
                <select id="swal-select" class="swal2-select select-input">
                    <option value="">Select database</option>
                    ${allDatabases.map(db => `<option value="${db}">${db}</option>`).join("")}
                </select>
                `,
                showCancelButton: true,
                confirmButtonText: "Select",
                confirmButtonColor: "#003566",
                width: 600,
                heightAuto: true,

                customClass: { popup: "swal-big swal-poppins" },

                didOpen: () => {
                    const search = document.getElementById("swal-text");
                    const list = document.getElementById("swal-suggestion-list");
                    const select = document.getElementById("swal-select");

                    const originalOptions = allDatabases.map(db => ({ value: db, label: db }));

                    search.parentElement.style.position = "relative";

                    list.style.position = "absolute";
                    //list.style.top = "40px";
                    list.style.left = "0";
                    list.style.right = "0";
                    list.style.maxHeight = "150px";
                    list.style.overflowY = "auto";
                    list.style.border = "1px solid #ccc";
                    list.style.borderRadius = "4px";
                    list.style.background = "#fff";
                    list.style.zIndex = "1000";
                    list.style.display = "none";

                    const renderSuggestions = (value) => {
                        const filtered = allDatabases.filter(db =>
                            db.toLowerCase().includes(value.toLowerCase())
                        );

                        list.innerHTML = "";

                        if (!value || filtered.length === 0) {
                            list.style.display = "none";
                            select.innerHTML = `<option value="">Select database</option>` +
                                originalOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("");
                            return;
                        }

                        filtered.forEach(db => {
                                const item = document.createElement("div");
                                item.textContent = db;
                                item.className = "swal-suggestion-item";
                                item.style.padding = "6px 10px";
                                item.style.cursor = "pointer";

                                item.addEventListener("mouseenter", () => {
                                    item.style.background = "#f0f0f0";
                                });

                                item.addEventListener("mouseleave", () => {
                                item.style.background = "#fff";
                                });

                            item.onclick = () => {
                                search.value = db;
                                select.innerHTML = `<option value="${db}">${db}</option>`;
                                select.value = db;
                                list.style.display = "none";
                            };

                            list.appendChild(item);
                        });

                        list.style.display = "block";
                    };

                    search.addEventListener("input", (e) => renderSuggestions(e.target.value));
                },

                preConfirm: () => {
                const textValue = document.getElementById("swal-text").value;
                const selectedDb = document.getElementById("swal-select").value;

                if (!selectedDb) {
                    swal.showValidationMessage("Please select a database");
                    return false;
                }

                return {
                    label: textValue,
                    database: selectedDb
                };
            }
        });

        if (result.isConfirmed) {
            setDb(result.value.database);
            fetchFn(result.value.database);
        }
    };

    const handleConflicts = async () => {
        setWarnings(await fixAllConflicts(dbA, dbB, navigate, results));
        await fetchDatabase2(dbB);
    }

    const handleExport = async(results) => {
        const { isConfirmed } = await swal.fire({
            title: "Export Results",
            html: `
            <div style="text-align:left; margin-left:20px;">
                <label>
                <input type="checkbox" id="exportExcel" />
                Excel (.xlsx)
                </label><br/><br/>

                <label>
                <input type="checkbox" id="exportPDF" />
                PDF (.pdf)
                </label>
            </div>
            `,
            confirmButtonText: "Download",
            confirmButtonColor: '#003566',
            showCancelButton: true,

            preConfirm: () => {
                const excel = document.getElementById("exportExcel").checked;
                const pdf = document.getElementById("exportPDF").checked;

                if (!excel && !pdf) {
                    swal.showValidationMessage("Please select at least one format");
                    return false;
                }

                return { excel, pdf };
            }
        });

        if (!isConfirmed) return;

        const excel = document.getElementById("exportExcel").checked;
        const pdf = document.getElementById("exportPDF").checked;

        if (excel) exportToExcel(results);
        if (pdf) exportToPDF(results);
    };

    Row.propTypes = {
        row: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                tableName: PropTypes.string,
                tables: PropTypes.array,
                columns: PropTypes.arrayOf(
                    PropTypes.shape({
                        columnName: PropTypes.string,
                        dataType: PropTypes.string,
                        maxCharacters: PropTypes.number,
                })),
            }),
        ]).isRequired,
    };

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
                        <h3 className="card-title">Results</h3>
                    </div>
                 
                    <div className='scanner-select'>
                        <div className="card">
                            {show ? (
                                <>
                                    <CollapsibleTable database={database}/>
                                    <button
                                        className='select-btn' onClick={ ()=> openDatabaseSelect("Select Master Database", setDbA, fetchDatabase)}>Reselect</button>
                                </>
                            ) : (
                                <>
                    <div className="card-header">
                        <p className="label">Please select a database to Compare</p>
                    </div>
                        <div className="line"></div>
                                <button
                                    className='select-btn'onClick={ ()=> openDatabaseSelect("Select Master Database", setDbA, fetchDatabase)}>Select</button> </>
                            )}
                        </div>
                    </div>

                    <div className='scanner-select'>
                        <div className="card">
                            {show2 ? (
                                <>
                                    <CollapsibleTable2 database2={database2}/> 
                                    {fixConflicts && (
                                        <button className='fix-btn' style={{ backgroundColor: '#FACC1566', color: '#000000' }} 
                                            onClick={() => handleConflicts()}>Fix Conflicts
                                        </button>
                                    )}
                                    <button
                                        className='select-btn'onClick={ ()=> openDatabaseSelect("Select Client Database", setDbB, fetchDatabase2)}> Reselect</button>
                                </>
                            ) : (
                                <>
                                <div className="card-header-client">
                                        <p className="label">Please select a database to Compare</p></div>
                                <div className="line"></div>
                                    <button
                                        className='select-btn' disabled={!dbA} onClick={ ()=> openDatabaseSelect("Select Client Database", setDbB, fetchDatabase2)}>Select</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className='scanner-select'>
                        <div className="card">
                            {scan ? (
                            noConflicts ? (
                                <>
                                <div className="no-conflict-box">
                                    No Conflicts found
                                </div>
                                
                             <div className='btn-group'>
                                
                                {rescan && (
                                    <button className='rescan-btn' onClick={() => fetchResults()}>Rescan</button>
                                )}
                                
                            </div></>
    
                            ) : (
                                <CollapsibleTableScanned results={results} rescan={rescan} handleExport={handleExport} fetchResults={fetchResults}/>
                            )
                            
                        ) : (
                                <>
                    <div className="card-scanner-header">
                        <p className="label">Press Scan to compare the databases</p> </div>
                        <div className="line"></div>
                                    <button
                                        className='select-btn'
                                        disabled={!dbA || !dbB} 
                                        onClick={async() => {await fetchResults();   
                                        }}
                                    >
                                        Scan
                                    </button>
                                </>    
                            )}
                        </div>
                    </div>
                </div>
            </div>      
        </div>
    );
};

export default MainPage;