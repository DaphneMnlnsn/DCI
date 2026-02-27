import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Scanner.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../assets/header.jsx';
import PropTypes from 'prop-types';
import Row from '../components/Row.jsx';
import exportToExcel from '../Pages/ExcelExport.jsx';
import exportToPDF from '../Pages/PDFExport.jsx';
import {fetchConfigs, fetchConflicts, fetchSchema, fetchUserConfig, fixAllConflicts, setDatabaseConnection} from '../components/DatabaseAPIs.jsx';
import { CollapsibleTable, CollapsibleTable2, CollapsibleTableScanned } from '../components/DCINew/CollapsibleTables2.jsx';
import { use } from 'react';

const MainPage = () => {
    const navigate = useNavigate();
    const fileInput = useRef(null);
    const [error, setError] = useState('');
    const [database, setDatabase] = useState(null);
    const [database2, setDatabase2] = useState(null);
    const [results, setResults] = useState(null);
    const [masterDbDriver, setMasterDbDriver] = useState(null);
    const [masterConfigs, setMasterConfigs] = useState([]);
    const [selectedMasterConfig, setSelectedMasterConfig] = useState(null);
    const [clientDbDriver, setClientDbDriver] = useState(null);
    const [clientConfigs, setClientConfigs] = useState([]);
    const [selectedClientConfig, setSelectedClientConfig] = useState(null);
    const [show, setShow] = useState(false);
    const [show2, setShow2] = useState(false);
    //const [scan, setScan] = useState(false);
    //const [rescan, setRescan] = useState(false);
    const [fixConflicts, setFixConflicts] = useState(false);
    //const [noConflicts, setNoConflicts] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);
    const [warnings, setWarnings] = useState([]);
    const [fixed, setFixed] = useState([]);
    const [dbA, setDbA] = useState(null);
    const [dbB, setDbB] = useState(null);
    const location = useLocation();
    const [conflictMap, setConflictMap] = useState({});
    const [expandedTables, setExpandedTables] = useState({});
    const [scanConflictFirst, setScanConflictFirst] = useState(true);
    const [fixMode, setFixMode] = useState('');
    const [fixTable, setFixTable] = useState('');
    const [fixColumn, setFixColumn] = useState('');

    /*useEffect(() => {
        if (location.state?.master && location.state?.client) {
            setDbA(location.state.master);
            setDbB(location.state.client);
            //setScan

            fetchDatabase(location.state.master);
            fetchDatabase2(location.state.client);

            window.history.replaceState({}, document.title);
        }
    }, [location.state]);*/

    useEffect(() => {
        if (!location.state) return;

        if (location.state.master && !dbA) {
            setDbA(location.state.master);
            fetchDatabase(location.state.master);
        }

        if (location.state.client && !dbB) {
            setDbB(location.state.client);
            fetchDatabase2(location.state.client);
        }

    }, [location.state]);

    useEffect(() => {
        const loadUserConfig = async () => {
            const configs = await fetchUserConfig();
            if (!configs) return;

            if (configs.master) {
                setMasterDbDriver(configs.master.config_driver);
                await fetchMasterConfigs(configs.master.config_driver, parseInt(configs.master.id, 10));
            }

            if (configs.client) {
                setClientDbDriver(configs.client.config_driver);
                await fetchClientConfigs(configs.client.config_driver, parseInt(configs.client.id, 10));
            }
        };

        loadUserConfig();
    }, []);

    useEffect(() => {
        if (!masterDbDriver) {
            setMasterConfigs([]);
            setSelectedMasterConfig("");
            return;
        }

        fetchMasterConfigs(masterDbDriver);
        
    }, [masterDbDriver]);

    useEffect(() => {
        if (!clientDbDriver) {
            setClientConfigs([]);
            setSelectedClientConfig("");
            return;
        }

        fetchClientConfigs(clientDbDriver);
        
    }, [clientDbDriver]);

    useEffect(() => {
        if (!selectedMasterConfig || !masterDbDriver) return;

        configureMaster();
    }, [selectedMasterConfig, masterDbDriver]);

    useEffect(() => {
        if (!selectedClientConfig || !clientDbDriver) return;

        configureClient();
    }, [selectedClientConfig, clientDbDriver]);

    useEffect(() => {
        if (!dbA || !dbB) return;

        if(scanConflictFirst){
            const runScan = async () => {
                const result = await fetchConflicts(dbA, dbB);
                if (result) {
                    setConflictMap(result.conflictMap);
                    setResults(result);
                    setFixConflicts(true);
                    setHasScanned(true);
                }
                setScanConflictFirst(false);
            }
            runScan();
        }
    }, [dbA, dbB, setScanConflictFirst]);

    const fetchClientConfigs = async (dbDriver, savedConfigId = null) => {
        if(!dbDriver) return;

        const configs = await fetchConfigs(dbDriver);
        setClientConfigs(configs);

        if (savedConfigId && configs.some(c => c.id === savedConfigId)) {
            setSelectedClientConfig(savedConfigId);
        } else if (!configs.some(c => c.id === selectedClientConfig)) {
            setSelectedClientConfig(null);
        }
    };

    const fetchMasterConfigs = async (dbDriver, savedConfigId = null) => {
        if (!dbDriver) return;

        const configs = await fetchConfigs(dbDriver);
        setMasterConfigs(configs);

        if (savedConfigId && configs.some(c => c.id === savedConfigId)) {
            setSelectedMasterConfig(savedConfigId);
        } else if (!configs.some(c => c.id === selectedMasterConfig)) {
            setSelectedMasterConfig(null);
        }
    };

    const configureMaster = async () => {
        try {
            await setDatabaseConnection(selectedMasterConfig, "master");
            console.log("Master connection configured");
        } catch (error) {
            console.error(error);
        }
    }

    const configureClient = async () => {
        try {
            await setDatabaseConnection(selectedClientConfig, "client");
            console.log("Client connection configured");
        } catch (error) {
            console.error(error);
        }
    }

    const fetchDatabase = async (dbName) => {
        if (!dbName) return;

        const data = await fetchSchema(dbName, 'master');
        setDatabase({ raw: data.raw, database: data.database, tables: data.tables });
        setShow(true);
    }

    const fetchDatabase2 = async (dbName) => {
        if (!dbName) return;

        const data = await fetchSchema(dbName, 'client');
        setDatabase2({ raw: data.raw, database2: data.database, tables2: data.tables });
        setShow2(true);        
    }

    const openDatabaseSelect = async (title, setDb, fetchFn, role) => {
        const response = await axios.get(
            `${import.meta.env.VITE_APP_BASE_URL}/api/read/all`,
            { responseType: 'json', withCredentials: true,
                params: {
                    role: role
                },
            },
        );

        const allDatabases = response.data.databases || [];

        const result = await Swal.fire({
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
            setScanConflictFirst(true);
        }
    };

    const handleConflicts = async () => {
        setWarnings(await fixAllConflicts(dbA, dbB, navigate, results, fixMode, fixTable, fixColumn));
        await fetchDatabase2(dbB);
        const result = await fetchConflicts(dbA, dbB);
        if (result) {
            setConflictMap(result.conflictMap);
            setResults(result);
            setFixConflicts(true);
            setHasScanned(true);
        }
    }

    const handleExport = async(data) => {
        const result = await Swal.fire({
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

        if (!result.isConfirmed) return;

        const {excel, pdf} = result.value;

        //const excel = document.getElementById("exportExcel").checked;
        //const pdf = document.getElementById("exportPDF").checked;

        if (excel) exportToExcel(data);
        if (pdf) exportToPDF(data);
        
        console.log("Export data:", data);
    };

    const toggleTable = (tableName) => {
        setExpandedTables(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }));
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

                        <div className="dropdown-group">
                            <select
                                value={masterDbDriver}
                                onChange={(e) => setMasterDbDriver(e.target.value)}
                            >
                                <option value="">Select DB Type</option>
                                <option value="mysql">MySQL</option>
                                <option value="pgsql">PostgreSQL</option>
                                <option value="sqlsrv">MS SQL</option>
                            </select>

                            <select
                                value={selectedMasterConfig}
                                onChange={(e) => setSelectedMasterConfig(parseInt(e.target.value, 10))}
                                disabled={!masterConfigs.length || !masterDbDriver}
                            >
                            <option value="">Select Configuration</option>
                            {masterConfigs.map((conf) => (
                                <option key={conf.id} value={conf.id}>
                                    {conf.config_name} ({conf.host})
                                </option>
                            ))}
                            </select>
                        </div>

                    </div>
                    <div className='scanner-select'>
                        <h3 className="card-title">Client Database</h3>
                        <div className="dropdown-group">
                            <select
                                value={clientDbDriver}
                                onChange={(e) => setClientDbDriver(e.target.value)}
                            >
                                <option value="">Select DB Type</option>
                                <option value="mysql">MySQL</option>
                                <option value="pgsql">PostgreSQL</option>
                                <option value="sqlsrv">MS SQL</option>
                            </select>

                            <select
                                value={selectedClientConfig}
                                onChange={(e) => setSelectedClientConfig(parseInt(e.target.value, 10))}
                                disabled={!clientConfigs.length || !clientDbDriver}
                            >
                            <option value="">Select Configuration</option>
                            {clientConfigs.map((conf) => (
                                <option key={conf.id} value={conf.id}>
                                    {conf.config_name} ({conf.host})
                                </option>
                            ))}
                            </select>
                        </div>
                    </div>
                    {/*<div className='scanner-select'>
                        <h3 className="card-title">Results</h3>
                    </div>*/}
                 
                    <div className='scanner-select'>
                        <div className="card">
                            {show ? (
                                <>
                                    <CollapsibleTable database={database} conflictMap={conflictMap} expandedTables={expandedTables} toggleTable={toggleTable} />
                                    <div className='master-button-group'>
                                        <button
                                            className='select-btn' disabled={!selectedMasterConfig} onClick={ ()=> openDatabaseSelect("Select Master Database", setDbA, fetchDatabase, "master")}>Reselect
                                        </button>

                                        <button className='export-btn' 
                                            style={{ backgroundColor: hasScanned ? '#FACC1566' : '#ccc', color: '#000000'}}
                                            disabled={!hasScanned}
                                            onClick={() => handleExport(results?.conflictsArray)}>Export Results
                                        </button>
                                    </div>
                                </>
                                
                            ) : (
                                <>
                    <div className="card-header">
                        <p className="label">Please select a database to Compare</p>
                    </div>
                        <div className="line"></div>
                                <button
                                    className='select-btn' disabled={!selectedMasterConfig} onClick={ ()=> openDatabaseSelect("Select Master Database", setDbA, fetchDatabase, "master")}>Select</button> </>
                            )}
                        </div>
                    </div>

                    <div className='scanner-select'>
                        <div className="card">
                            {show2 ? (
                                <>
                                    <CollapsibleTable2 database2={database2} conflictMap={conflictMap} expandedTables={expandedTables} toggleTable={toggleTable} />
                                    <div className='client-button-group'>
                              
                                        <button
                                            className='client-btn-select' disabled={!selectedClientConfig} onClick={ ()=> openDatabaseSelect("Select Client Database", setDbB, fetchDatabase2, "client")}> Reselect
                                        </button>

                                        <button
                                            className='select-btn'
                                            disabled={!dbA || !dbB} 
                                            onClick={async() => {
                                                const result = await fetchConflicts(dbA, dbB);
                                                if (result) {
                                                    setConflictMap(result.conflictMap);
                                                    setResults(result);
                                                    setFixConflicts(true);
                                                    setHasScanned(true);
                                                }
                                            }}
                                        >
                                            {hasScanned ? "Rescan" : "Scan"}
                                        </button>

                                        <button className='fix-btn' style={{ backgroundColor: (fixConflicts && hasScanned) ? '#FACC1566' : '#ccc', 
                                            color: (fixConflicts && hasScanned) ? '#000000' : '#888888',
                                            cursor: (fixConflicts && hasScanned) ? 'pointer' : 'not-allowed' }}
                                            
                                            disabled={!(fixConflicts && hasScanned)}
                                            onClick={() => {
                                                handleConflicts();
                                                setFixMode('all');
                                                setFixTable(null);
                                                setFixColumn(null);
                                                }}>Fix All Conflicts
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                <div className="card-header-client">
                                        <p className="label">Please select a database to Compare</p></div>
                                <div className="line"></div>
                                    <button
                                        className='select-btn' disabled={!dbA || !selectedClientConfig} onClick={ ()=> openDatabaseSelect("Select Client Database", setDbB, fetchDatabase2, "client")}>Select</button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/*<div className='scanner-select'>
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
                    </div>*/}
                </div>
            </div>      
        </div>
    );
};

export default MainPage;