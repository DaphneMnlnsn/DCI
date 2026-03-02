import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MainPageDCI.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import HeaderDCI from '../assets/headerDCI.jsx';
import PropTypes from 'prop-types';
import Row from '../components/Row.jsx';
import exportToExcel from '../Pages/ExcelExport.jsx';
import exportToPDF from '../Pages/PDFExport.jsx';
import {fetchConfigs, fetchConflicts, fetchSchema, fetchUserConfig, fixAllConflicts, setDatabaseConnection} from '../components/DatabaseAPIs.jsx';
import { CollapsibleTable, CollapsibleTable2, CollapsibleTableScanned } from '../components/DCINew/CollapsibleTables2.jsx';
import { use } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase } from "@fortawesome/free-solid-svg-icons";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import mysqlLogo from '../assets/mysql.png';
import postgresLogo from '../assets/postgres.png';
import sqlserverLogo from '../assets/ssms.png';
import SyncAltSharpIcon from '@mui/icons-material/SyncAltSharp';
import DocumentScannerSharpIcon from '@mui/icons-material/DocumentScannerSharp';
import ConstructionSharpIcon from '@mui/icons-material/ConstructionSharp';
import FileDownloadSharpIcon from '@mui/icons-material/FileDownloadSharp';

const MainPageDCI = () => {
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
    const [searchText, setSearchText] = useState('');
    const [conflictFilter, setConflictFilter] = useState('unignored');
    const [masterSearch, setMasterSearch] = useState('');
    const [masterSuggestions, setMasterSuggestions] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [clientSuggestions, setClientSuggestions] = useState([]);
    const [filteredMasterTables, setFilteredMasterTables] = useState(null);
    const [filteredClientTables, setFilteredClientTables] = useState(null);

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
                const result = await fetchConflicts(dbA, dbB, conflictFilter);
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

        const typedConfigs = configs.map(c => ({
        ...c,
        type: 'table'
        }));
        setClientConfigs(typedConfigs);

        if (savedConfigId && typedConfigs.some(c => c.id === savedConfigId)) {
            setSelectedClientConfig(savedConfigId);
        } else if (!typedConfigs.some(c => c.id === selectedClientConfig)) {
            setSelectedClientConfig(null);
        }
    };

    const fetchMasterConfigs = async (dbDriver, savedConfigId = null) => {
        if (!dbDriver) return;

        const configs = await fetchConfigs(dbDriver);
        console.log("Fetched configs:", configs);

        const typedConfigs = configs.map(c => ({
        ...c,
        type: 'table'
        }));
        setMasterConfigs(typedConfigs);

        if (savedConfigId && typedConfigs.some(c => c.id === savedConfigId)) {
            setSelectedMasterConfig(savedConfigId);
        } else if (!typedConfigs.some(c => c.id === selectedMasterConfig)) {
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
        setConflictFilter('unignored')
        const result = await fetchConflicts(dbA, dbB, conflictFilter);
        if (result) {
            setConflictMap(result.conflictMap);
            setResults(result);
            setFixConflicts(true);
            setHasScanned(true);
        }
        await fetchDatabase2(dbB);
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

    const getDbLogo = (type) => {
        switch (type) {
            case "mysql":
                return mysqlLogo;
            case "pgsql":
                return postgresLogo;
            case "sqlsrv":
                return sqlserverLogo;
            default:
                return null;
        }
    };

    return (
        <div className='scanner-root'> 
            <HeaderDCI />
            <div className='scanner-container'>
                <div className='scanner2-grid-container'>
                    <div className='scanner2-container'>
                        <div className='scanner2-select'>
                            <h3 className="scanner2-card-title">
                                <span><FontAwesomeIcon icon={faDatabase} className='db-icon'/>Master Database</span>
                            </h3>
                            
                            <div className='driver-label-group'>
                                <div className='driver-label'>Database</div>
                                <div className='driver-label'>Configuration</div>
                            </div>
                            
                            <div className="dropdown-group db-type-wrapper2">
                                {masterDbDriver && (
                                    <img
                                        src={getDbLogo(masterDbDriver)}
                                        alt="db-logo"
                                        className="db-logo"
                                    />
                                )}

                                <select
                                    value={masterDbDriver || ""}
                                    onChange={(e) => setMasterDbDriver(e.target.value)}
                                >
                                    <option value="">Select DB Type</option>
                                    <option value="mysql">MySQL</option>
                                    <option value="pgsql">PostgreSQL</option>
                                    <option value="sqlsrv">MS SQL</option>
                                </select>

                                <select
                                    value={selectedMasterConfig || ""}
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

                        <div className='scanner2-select'>
                            <div className="card2">
                                {show ? (
                                    <>
                                        <div className='table-label-group'>
                                            <p className='db-label'>Database: {dbA}</p>
                                            <p className='db-table-count'>{Array.isArray(database?.tables) ? database.tables.length : 0} tables</p>
                                        </div>

                                        <div className="search-container">
                                            <div className='input-wrapper'>
                                                <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
                                                <input
                                                type="text"
                                                placeholder="Search tables..."
                                                value={masterSearch}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setMasterSearch(val);

                                                    if (!val) {
                                                        setFilteredMasterTables(null);
                                                        setMasterSuggestions([]);
                                                        setExpandedTables({});
                                                        return;
                                                    }

                                                    const filtered = database?.tables?.filter(table =>
                                                    table.tableName.toLowerCase().includes(val.toLowerCase())
                                                    ) || [];
                                                    setMasterSuggestions(filtered);
                                                }}
                                                className="table-search-master"
                                                />
                                            </div>

                                            {masterSuggestions.length > 0 && masterSearch && (
                                                <div className="suggestion-list">
                                                {masterSuggestions.map((table, index) => (
                                                    <div
                                                    key={index}
                                                    className="suggestion-item"
                                                    onClick={() => {
                                                        setMasterSearch(table.tableName);
                                                        setMasterSuggestions([]);
                                                        setFilteredMasterTables([table]);

                                                        setExpandedTables(prev => ({
                                                        ...prev,
                                                        [table.tableName]: true
                                                        }));

                                                        const el = document.getElementById(`table-${table.tableName}`);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                    >
                                                    {table.tableName}
                                                    </div>
                                                ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className='table-header-group'>
                                            <p className='db-label'>Tables</p>
                                            <p className='db-label'>Conflicts</p>
                                        </div>

                                        <CollapsibleTable database={database} conflictMap={conflictMap} expandedTables={expandedTables} toggleTable={toggleTable} dbA={dbA} dbB={dbB} results={results} filteredTables={filteredMasterTables} />
                                        <div className='master-button-group'>
                                            <button
                                                className='select-btn' disabled={!selectedMasterConfig} onClick={ ()=> openDatabaseSelect("Select Master Database", setDbA, fetchDatabase, "master")}><SyncAltSharpIcon className='btn-icon'/>{" "}Reselect
                                            </button>

                                            <button className='export-btn' 
                                                style={{ backgroundColor: hasScanned ? '#D4EBFF' : '#ccc', color: '#000000'}}
                                                disabled={!hasScanned}
                                                onClick={() => handleExport(results?.conflictsArray)}><FileDownloadSharpIcon className='btn-icon'/>Export Results
                                            </button>
                                        </div>
                                    </>
                                    
                                ) : (
                                    <>
                                    <div className="scanner2-card-header">
                                        <p className="label">Please select a database to Compare</p>
                                    </div>
                                    <div className="scanner2-line"></div>
                                            <button
                                                className='select-btn' disabled={!selectedMasterConfig} onClick={ ()=> openDatabaseSelect("Select Master Database", setDbA, fetchDatabase, "master")}>Select</button> </>
                                        )}
                                    </div>
                            </div>
                        </div>
                    </div>

                <div className='scanner2-container'>
                    <div className='scanner2-select'>
                        <h3 className="scanner2-card-title">
                            <span><FontAwesomeIcon icon={faDatabase} className='db-icon'/>Client Database</span>
                        </h3>

                        <div className='driver-label-group'>
                            <div className='driver-label'>Database</div>
                            <div className='driver-label'>Configuration</div>
                        </div>
                    
                        <div className="dropdown-group db-type-wrapper2">
                            {clientDbDriver && (
                                <img
                                    src={getDbLogo(clientDbDriver)}
                                    alt="db-logo"
                                    className="db-logo"
                                />
                            )}

                            <select
                                value={clientDbDriver || ""}
                                onChange={(e) => setClientDbDriver(e.target.value)}
                            >
                                <option value="">Select DB Type</option>
                                <option value="mysql">MySQL</option>
                                <option value="pgsql">PostgreSQL</option>
                                <option value="sqlsrv">MS SQL</option>
                            </select>

                            <select
                                value={selectedClientConfig || ""}
                                onChange={(e) => setSelectedClientConfig(parseInt(e.target.value, 10))}
                                disabled={!clientConfigs.length || !clientDbDriver}
                            >
                                <option value="">Select Configuration</option>
                                {clientConfigs.map((conf) => (
                                    <option key={conf.id} value={conf.id}>
                                        {conf.config_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className='scanner2-select'>
                        <div className="card2">
                            {show2 ? (
                                <>
                                    <div className='table-label-group'>
                                        <p className='db-label'>Database: {dbB}</p>
                                        <p className='db-table-count'>{Array.isArray(database2?.tables2) ? database2.tables2.length : 0} tables</p>
                                    </div>

                                    <div className="search-container">
                                        <div className='input-wrapper'>
                                            <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
                                            <input
                                                type="text"
                                                placeholder="Search tables..."
                                                value={clientSearch}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setClientSearch(val);

                                                    if (!val) {
                                                        setFilteredClientTables(null);
                                                        setClientSuggestions([]);
                                                        setExpandedTables({});
                                                        return;
                                                    }

                                                    const filtered = database2?.tables2?.filter(table2 =>
                                                    table2.tableName.toLowerCase().includes(val.toLowerCase())
                                                    ) || [];
                                                    setClientSuggestions(filtered);
                                                }}
                                                className="table-search-client"
                                                />
                                            </div>

                                            {clientSuggestions.length > 0 && clientSearch && (
                                                <div className="suggestion-list">
                                                {clientSuggestions.map((table, index) => (
                                                    <div
                                                    key={index}
                                                    className="suggestion-item"
                                                    onClick={() => {
                                                        setClientSearch(table.tableName);
                                                        setClientSuggestions([]);
                                                        setFilteredClientTables([table]);

                                                        setExpandedTables(prev => ({
                                                        ...prev,
                                                        [table.tableName]: true
                                                        }));

                                                        const el = document.getElementById(`table-${table.tableName}`);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                    >
                                                    {table.tableName}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className='table-header-group'>
                                        <p className='db-label'>Tables</p>
                                        <select 
                                            className='conflict-type-select'
                                            value={conflictFilter}
                                            onChange={(e) => setConflictFilter(e.target.value)}
                                        >
                                            <option value='unignored'>Unignored Conflicts</option>
                                            <option value='all'>All Conflicts</option>
                                            <option value='ignored'>Ignored Conflicts</option>
                                        </select>
                                    </div>

                                    <CollapsibleTable2 database2={database2} conflictMap={conflictMap} expandedTables={expandedTables} toggleTable={toggleTable} dbA={dbA} dbB={dbB} results={results} filteredTables={filteredClientTables} />
                                    <div className='client-button-group'>
                              
                                        <button
                                            className='client-btn-select' disabled={!selectedClientConfig} onClick={ ()=> openDatabaseSelect("Select Client Database", setDbB, fetchDatabase2, "client")}><SyncAltSharpIcon className='btn-icon'/>{" "}Reselect
                                        </button>

                                        <button
                                            className='scan-btn'
                                            disabled={!dbA || !dbB} 
                                            onClick={async() => {
                                                const result = await fetchConflicts(dbA, dbB, conflictFilter);
                                                if (result) {
                                                    setConflictMap(result.conflictMap);
                                                    setResults(result);
                                                    setFixConflicts(true);
                                                    setHasScanned(true);
                                                }
                                                await fetchDatabase2(dbB);
                                            }}
                                        >
                                            <DocumentScannerSharpIcon className='btn-icon'/>
                                            {hasScanned ? "Rescan" : "Scan"}
                                        </button>

                                        <button className='fix-btn' style={{ backgroundColor: (fixConflicts && hasScanned) ? '#FBD6D6' : '#ccc', 
                                            color: (fixConflicts && hasScanned) ? '#8B1A10' : '#888888',
                                            cursor: (fixConflicts && hasScanned) ? 'pointer' : 'not-allowed' }}
                                            
                                            disabled={!(fixConflicts && hasScanned)}
                                            onClick={() => {
                                                handleConflicts();
                                                setFixMode('all');
                                                setFixTable(null);
                                                setFixColumn(null);
                                                }}><ConstructionSharpIcon className='btn-icon'/>Fix All Conflicts
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                <div className="scanner-card-header">
                                        <p className="label">Please select a database to Compare</p></div>
                                <div className="scanner2-line"></div>
                                    <button
                                        className='select-btn' disabled={!dbA || !selectedClientConfig} onClick={ ()=> openDatabaseSelect("Select Client Database", setDbB, fetchDatabase2, "client")}>Select</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>      
    </div>
    );
};

export default MainPageDCI;