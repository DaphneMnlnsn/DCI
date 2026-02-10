import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Scanner.css';
import axios from 'axios';
import swal from 'sweetalert2';
import Header from '../assets/header.jsx';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import exportToExcel from './ExcelExport.jsx';

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
    const [warnings, setWarnings] = useState([]);
    const [fixed, setFixed] = useState([]);
    const [dbA, setDbA] = useState(null);
    const [dbB, setDbB] = useState(null);

    const fetchDatabase = async (dbName) => {
        if (!dbName) return;

        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/read/schema`, {
                params: { database: dbName},
                responseType: 'json',
            });
            if (response.status === 200){
                const raw = response.data || {};
                const schema = raw.schema || raw;
                const database = raw.database || raw;
                const tableArray = Object.entries(schema).map(([tableName, tableData]) => ({
                    tableName,
                    columns: Object.entries((tableData && tableData.columns) || {}).map(([columnName, columnData]) => ({
                        columnName,
                        dataType: columnData.data_type,
                        maxCharacters: columnData.maximum_characters,
                    })),
                }));
                setDatabase({ raw, database: database, tables: tableArray });
                setShow(true);
            }

        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

    const fetchDatabase2 = async (dbName) => {
        if (!dbName) return;

        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/read/schema`, {
                params: { database: dbName},
                responseType: 'json',
            });
            if (response.status === 200){
                const raw = response.data || {};
                const schema = raw.schema || raw;
                const database2 = raw.database || raw;
                const tableArray = Object.entries(schema).map(([tableName, tableData]) => ({
                    tableName,
                    columns: Object.entries((tableData && tableData.columns) || {}).map(([columnName, columnData]) => ({
                        columnName,
                        dataType: columnData.data_type,
                        maxCharacters: columnData.maximum_characters,
                    })),
                }));
                setDatabase2({ raw, database2: database2, tables2: tableArray });
                setShow2(true);
            }
        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

    const openDatabaseSelect = async () => {
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/read/all`, {
            responseType: 'json',
        })
        const allDatabases = response.data.databases || [];

        const value = await swal.fire({
            title: "Select database",
            input: "select",
            inputOptions: allDatabases.reduce((acc, db) => {
                acc[db] = db;
                return acc;
            }, {}),
            inputPlaceholder: "Select database",
            showCancelButton: true,
            confirmButtonText: "Select",
            confirmButtonColor: '#003566',
            width: 600,
            heightAuto: true,
            padding: '10px',
            customClass: {popup: 'swal-big swal-poppins'},

            preConfirm: (value) => {
                if (!value) {
                    swal.showValidationMessage("Please select a database");
                    return false;
                }
                return value;
            }
        });

        if (value.isConfirmed){
            setDbA(value.value);
            fetchDatabase(value.value);
        }  
    }
     
    const openDatabaseSelect2 = async () => {
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/read/all`, {
            responseType: 'json',
        })
        const allDatabases = response.data.databases || [];

        const value = await swal.fire({
            title: "Select database",
            input: "select",
            inputOptions: allDatabases.reduce((acc, db) => {
                acc[db] = db;
                return acc;
            }, {}),
            inputPlaceholder: "Select database",
            showCancelButton: true,
            confirmButtonText: "Select",
            confirmButtonColor: '#003566',
            width: 600,
            heightAuto: true,
            padding: '10px',
            customClass: {
                popup: 'swal-big swal-poppins'}
        });

        if (value.isConfirmed){
            setDbB(value.value);
            fetchDatabase2(value.value);
        }  
    }

    const fetchResults = async () => {
        if (!dbA || !dbB) {
            swal.fire("Select two databases first", "", "warning");
            return;
        }

        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/scan`, {
                    params: {
                        source: dbA,
                        target: dbB,
                    },
                    responseType: 'json',
                }
            );
            if (response.status === 200){
                const conflicts = response.data.conflicts || {};
                const conflictArray = Object.entries(conflicts).map(([conflictType, details]) => ({
                    conflictType,
                    details: details || {}
                }));
                setResults({ raw: response.data, conflicts: conflictArray });
                setScan(true);

                // Calculate total conflict count
                let totalCount = 0;
                conflictArray.forEach(({ conflictType, details }) => {
                    switch (conflictType) {
                        case 'missing_client_table':
                        case 'extra_client_table':
                            totalCount += Object.keys(details).length;
                            break;
                        case 'missing_client_column':
                        case 'extra_client_column':
                        case 'type_mismatch':
                        case 'length_mismatch':
                            Object.values(details).forEach(columns => {
                                totalCount += Object.keys(columns).length;
                            });
                            break;
                    }
                });
                swal.fire({
                    title: "Scan Complete",
                    html: `<span class="conflict-count">${totalCount} conflicts found</span>`,
                    icon: "info",
                    iconColor: '#FF0000',
                    confirmButtonText: "OK",
                    confirmButtonColor: '#003566'
                });
                setRescan(true);
                setFixConflicts(true);
            }
        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

    const handleConflicts = async () => {
        const decision = await swal.fire({
            title: 'Fix Conflicts',
            footer: "<span style='font-size:12px;color:#777;'>*extra tables and columns are not included to prevent data loss.</span>",
            text: 'Are you sure you want to fix the conflicts automatically? This will only modify the structure.',
            icon: 'warning',
            confirmButtonColor: '#003566',
            showCancelButton: true,
            confirmButtonText: 'Proceed'
        });

        if (decision.isConfirmed){
            try{
                const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/fix`, null, {
                    params: {
                        source: dbA,
                        target: dbB,
                    },
                    responseType: 'json',
                });

                if(response.status === 200){
                    const statements = response.data.statements || [];
                    const localWarnings = [];
                    const localFixed = [];
                    
                    statements.forEach(stmt => {
                        if (stmt.startsWith('-- WARNING:')) {
                            const warning = stmt.replace('-- WARNING: ', '');
                            console.warn('Warning: ', warning);
                            localWarnings.push(warning);
                        } else if (!stmt.startsWith('-- WARNING:')) {
                            const fixed = stmt;
                            localFixed.push(fixed);
                        }
                        else {
                            console.log('Executed:', stmt);
                        }
                    });

                    setWarnings(localWarnings);

                    if(localWarnings.length > 0){
                        swal.fire({
                            title: 'Completed with warnings',
                            html: `<span class="conflict-count">${localFixed.length} conflict(s) fixed with ${localWarnings.length} warning(s)</span>
                                <br/><br/>
                                <div style="text-align:left; max-height:200px; overflow-y:auto;">
                                    <strong>Warnings:</strong>
                                    <ul>${localWarnings.map(w => `<li>${w}</li>`).join('')}</ul>
                                </div>`,
                            icon: 'warning',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#003566'
                        })
                    } else {
                        swal.fire({
                            title: 'Success',
                            text: `${statements.length} conflict(s) fixed`,
                            icon: 'success',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#003566'
                        });
                    }
                    
                }
            } catch (error){
                console.log('Error fixing conflicts: ', error);
                    swal.fire({
                        title: 'Error',
                        text: 'Something went wrong while fixing conflicts.',
                        icon: 'error'
                })
            }
        }         
    }

    const handleExport = async() => {
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
        if (pdf) exportToPDF();
    };

    function Row(props) {
    const { row } = props;
    const [open, setOpen] = React.useState(false);

    return (
        <React.Fragment>

        <TableRow className="table-row">
            <TableCell className="icon-cell">
            <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => setOpen(!open)}
            >
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            </TableCell>

            <TableCell className="table-name-cell">
            {typeof row === "string"
                ? row
                : `${row.tableName} (${row.columns?.length || 0})`}
            </TableCell>
        </TableRow>
    
        <TableRow className="expanded-row">
            <TableCell colSpan={2} className="expanded-cell">
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box className="expanded-box">
                <Table size="small" className="inner-table">
                    <TableHead>
                    <TableRow className="inner-header">
                        <TableCell>Column Name</TableCell>
                        <TableCell>Variable Type</TableCell>
                    </TableRow>
                    </TableHead>

                    <TableBody>
                    {row.columns?.map((column, index) => (
                        <TableRow key={index} className="inner-row">
                        <TableCell>{column.columnName}</TableCell>
                        <TableCell>
                            {column.dataType}
                            {column.maxCharacters
                            ? ` (${column.maxCharacters})`
                            : " (N/A)"}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </Box>
            </Collapse>
            </TableCell>
        </TableRow>
        </React.Fragment>
    );
    }

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
                calories: PropTypes.number,
                carbs: PropTypes.number,
                fat: PropTypes.number,
                history: PropTypes.arrayOf(
                PropTypes.shape({
                    amount: PropTypes.number.isRequired,
                    customerId: PropTypes.string.isRequired,
                    date: PropTypes.string.isRequired,
                }),
                ),
                name: PropTypes.string,
                price: PropTypes.number,
                protein: PropTypes.number,
            }),
        ]).isRequired,
    };

    function CollapsibleTable() {
        if (!database) return <div>No data</div>;
        const tables = Array.isArray(database.tables) ? database.tables : [];
        return (
            <TableContainer component={Paper} elevation={0}>
            <Table aria-label="collapsible table">
                <TableHead>
                <TableRow>
                    <TableCell colSpan={4} style={{ fontWeight: 'bold' }}>Table Names ({tables.length}) - {database.database}</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {tables.map((table) => (
                    <Row key={table.tableName} row={table} />
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        );
    }

    function CollapsibleTable2() {
        if (!database2) return <div>No data</div>;
        const tables2 = Array.isArray(database2.tables2) ? database2.tables2 : [];
        return (
            <TableContainer component={Paper} elevation={0}>
            <Table aria-label="collapsible table">
                <TableHead>
                <TableRow>
                    <TableCell colSpan={4} style={{ fontWeight: 'bold' }}>Table Names ({tables2.length}) - {database2.database2}</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {tables2.map((table) => (
                    <Row key={table.tableName} row={table} />
                ))}
                </TableBody>
            </Table>
            {fixConflicts && (
                <button className='fix-btn' style={{ backgroundColor: '#FACC1566', color: '#000000' }} onClick={() => handleConflicts()}>Fix Conflicts</button>
            )}
            </TableContainer>
        );
    }

    const renderDetails = (conflictType, row) => {
        switch (conflictType) {
            case 'missing_client_table':
            case 'extra_client_table':
                return (
                    <div>
                        {Object.keys(row.details).map(table => (
                            <Typography key={table} variant="body2">- {table}</Typography>
                        ))}
                    </div>
                );
            case 'missing_client_column':
                return (
                    <div>
                        {Object.entries(row.details).map(([table, columns]) => (
                            <div key={table}>
                                <Typography variant="body2" style={{ fontWeight: 'bold' }}>{table} table:</Typography>
                                <Typography variant="body2">{Object.keys(columns).join(', ')}</Typography>
                            </div>
                        ))}
                    </div>
                );
            case 'extra_client_column':
                return (
                    <div>
                        {Object.entries(row.details).map(([table, columns]) => (
                            <div key={table}>
                                <Typography variant="body2" style={{ fontWeight: 'bold' }}>{table} table:</Typography>
                                <Typography variant="body2">{Object.keys(columns).join(', ')}</Typography>
                            </div>
                        ))}
                    </div>
                );
            case 'type_mismatch':
                return (
                    <div>
                        {Object.entries(row.details).map(([table, columns]) => (
                            <div key={table}>
                                <Typography variant="body2" style={{ fontWeight: 'bold' }}>{table} table:</Typography>
                                {Object.entries(columns).map(([col, types]) => (
                                    <Typography key={col} variant="body2">{col}: Master ({types.master}) vs Client ({types.client})</Typography>
                                ))}
                            </div>
                        ))}
                    </div>
                );
            case 'length_mismatch':
                return (
                    <div>
                        {Object.entries(row.details).map(([table, columns]) => (
                            <div key={table}>
                                <Typography variant="body2" style={{ fontWeight: 'bold' }}>{table} table:</Typography>
                                {Object.entries(columns).map(([col, lengths]) => (
                                    <Typography key={col} variant="body2">{col}: Master ({lengths.master || 'N/A'}) vs Client ({lengths.client})</Typography>
                                ))}
                            </div>
                        ))}
                    </div>
                );
            default:
                return <Typography variant="body2">No conflicts found.</Typography>;
        }
    };

    function CollapsibleTableScanned() {
        if (!results) return <div>No data</div>;
        const conflicts = Array.isArray(results.conflicts) ? results.conflicts : [];
        const conflictMap = {};
        conflicts.forEach(({ conflictType, details }) => {
            conflictMap[conflictType] = details;
        });

        const conflictTypes = [
            { key: 'missing_client_table', label: 'Missing Client Tables' },
            { key: 'extra_client_table', label: 'Extra Client Tables' },
            { key: 'missing_client_column', label: 'Missing Client Column' },
            { key: 'extra_client_column', label: 'Extra Client Column' },
            { key: 'type_mismatch', label: 'Type Mismatch' },
            { key: 'length_mismatch', label: 'Length Mismatch' },
        ];

        return (
            <TableContainer component={Paper} elevation={0}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell style={{ fontWeight: 'bold' }}>Conflicts</TableCell>
                            <TableCell style={{ fontWeight: 'bold' }}>Affected</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {conflictTypes.map(({ key, label }) => (
                            conflictMap[key] && Object.keys(conflictMap[key]).length > 0 && (
                                <React.Fragment key={key}>
                                    <TableRow>
                                        <TableCell>
                                            {label}
                                        </TableCell>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
                                            <Box sx={{ margin: 1 }}>
                                                {renderDetails(key, { details: conflictMap[key] })}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            )
                        ))}
                    </TableBody>
                </Table>
                <div className='btn-group'>
                     <button className='export-btn' style={{ backgroundColor: '#FACC1566', color: '#000000'}} onClick={() => handleExport()}>Export Results</button>
                    {rescan && (
                        <button className='rescan-btn' onClick={() => fetchResults()}>Rescan</button>
                    )}
                </div>
                
            </TableContainer>
        );
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
                        <h3 className="card-title">Results</h3>
                    </div>
                    
                    <div className='scanner-select'>
                        <div className="card">
                            {show ? (
                                <>
                                    <CollapsibleTable />
                                    <button className='select-btn' onClick= {() => {openDatabaseSelect(); }}>Reselect</button>
                                </>
                            ) : (
                                <>
                                    <div className="card-header">
                                        <p className="label">
                                            Please select a database to Compare
                                        </p>
                                        </div>

                                        <div className="line"></div>
                                        <button className='select-btn' onClick= {() => {openDatabaseSelect(); }}>Select</button>
                                </>    
                            )}
                                    
                        </div>
                    </div>

                    <div className='scanner-select'>
                        <div className="card">
                            {show2 ? (
                                <>
                                    <CollapsibleTable2 /> 
                                    <button className='select-btn' onClick= {() => {openDatabaseSelect2(); }}>Reselect</button>
                                </>
                            ) : (
                                <>
                                <div className="card-header-client">
                                    <p className="label">
                                            Please select a database to Compare
                                    </p>
                                    </div>

                                        <div className="line"></div>
                                        <button className='select-btn' onClick= {() => {openDatabaseSelect2(); }}>Select</button>
                                       
                                </>    
                            )}
                                    
                        </div>
                    </div>

                    <div className='scanner-select'>
                        <div className="card">
                            {scan ? (
                                <CollapsibleTableScanned /> 
                            ) : (
                                <>
                                <div className="card-scanner-header">
                                    <p className="label">
                                            Press Scan to compare the databases
                                        </p>
                                </div>
                                        <div className="line"></div>

                                        <button className='select-btn' onClick={() => fetchResults()}>Scan</button>
                                        
                                    
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


