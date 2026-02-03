import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Scanner.css';
import axios from 'axios';
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

const MainPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const fileInput = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');
    const [database, setDatabase] = useState(null);
    const [database2, setDatabase2] = useState(null);
    const [results, setResults] = useState(null);
    const [show, setShow] = useState(false);
    const [show2, setShow2] = useState(false);
    const [scan, setScan] = useState(false);
    
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
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/read/master`, {
                responseType: 'json',
            });
            if (response.status === 200){
                const raw = response.data || {};
                const schema = raw.schema || raw;
                const tableArray = Object.entries(schema).map(([tableName, tableData]) => ({
                    tableName,
                    columns: Object.entries((tableData && tableData.columns) || {}).map(([columnName, columnData]) => ({
                        columnName,
                        dataType: columnData.data_type,
                        maxCharacters: columnData.maximum_characters,
                    })),
                }));
                setDatabase({ raw, tables: tableArray });
                setShow(true);
            }

        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

    const fetchDatabase2 = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/read/client`, {
                responseType: 'json',
            });
            if (response.status === 200){
                const raw = response.data || {};
                const schema = raw.schema || raw;
                const tableArray = Object.entries(schema).map(([tableName, tableData]) => ({
                    tableName,
                    columns: Object.entries((tableData && tableData.columns) || {}).map(([columnName, columnData]) => ({
                        columnName,
                        dataType: columnData.data_type,
                        maxCharacters: columnData.maximum_characters,
                    })),
                }));
                setDatabase2({ raw, tables2: tableArray });
                setShow2(true);
            }
        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

    const fetchResults = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/scan`, {
                responseType: 'json',
            });
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
                    text: `${totalCount} conflicts found`,
                    icon: "info",
                    confirmButtonText: "OK"
                });
            }
        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

    function Row(props) {
        const { row } = props;
        const [open, setOpen] = React.useState(false);

        return (
            <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {typeof row === 'string' ? row : `${row.tableName} (${(row.columns && row.columns.length) || 0})`}
                </TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right"></TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1 }}>
                    <Table size="small" aria-label="purchases">
                        <TableHead>
                        <TableRow>
                            <TableCell style={{ fontWeight: 'bold' }}>Column Name</TableCell>
                            <TableCell style={{ fontWeight: 'bold' }}>Variable Type</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {row.columns && row.columns.map((column, index) => (
                            <TableRow key={column.columnName || index}>
                            <TableCell component="th" scope="row">
                                {column.columnName}
                            </TableCell>
                            <TableCell>
                                {column.dataType}
                                {column.maxCharacters ? ` (${column.maxCharacters} characters)` : ' (N/A)'}
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
            <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                <TableRow>
                    <TableCell style={{ fontWeight: 'bold' }}>Table Names ({tables.length})</TableCell>
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
            <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                <TableRow>
                    <TableCell style={{ fontWeight: 'bold' }}>Table Names ({tables2.length})</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {tables2.map((table) => (
                    <Row key={table.tableName} row={table} />
                ))}
                </TableBody>
            </Table>
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
            <TableContainer component={Paper}>
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
                        <h3 className="card-title">Customize Results</h3>
                    </div>
                    
                    <div className='scanner-select'>
                        <div className="card">
                            {show ? (
                                <CollapsibleTable /> 
                            ) : (
                                <>
                                    <p className="label">
                                            Please select a database to Compare
                                        </p>

                                        <div className="line"></div>

                                        <button className='select-btn' onClick={() => {fetchDatabase();}}>Show</button>
                                        
                                        {/*
                                        <input type="file" ref={fileInput} style={{display: 'none'}} onChange={(e) => setSelectedFile(e.target.files[0])} />
                                        {selectedFile && (
                                            <img src={URL.createObjectURL(selectedFile)} alt='preview'
                                            style={{
                                                    width: 90,
                                                    height: 90,
                                                    borderRadius: 6,
                                                    objectFit: "cover",
                                                }}/>
                                        )}*/}
                                </>    
                            )}
                                    
                        </div>
                    </div>

                    <div className='scanner-select'>
                        <div className="card">
                            {show2 ? (
                                <CollapsibleTable2 /> 
                            ) : (
                                <>
                                    <p className="label">
                                            Please select a database to Compare
                                        </p>

                                        <div className="line"></div>

                                        <button className='select-btn' onClick={() => {fetchDatabase2(); }}>Show</button>
                                        
                                        {/*
                                        <input type="file" ref={fileInput} style={{display: 'none'}} onChange={(e) => setSelectedFile(e.target.files[0])} />
                                        {selectedFile && (
                                            <img src={URL.createObjectURL(selectedFile)} alt='preview'
                                            style={{
                                                    width: 90,
                                                    height: 90,
                                                    borderRadius: 6,
                                                    objectFit: "cover",
                                                }}/>
                                        )}*/}
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
                                    <p className="label">
                                            Press Scan to compare the databases
                                        </p>

                                        <div className="line"></div>

                                        <button className='select-btn' onClick={() => fetchResults()}>Scan</button>
                                        
                                        {/*
                                        <input type="file" ref={fileInput} style={{display: 'none'}} onChange={(e) => setSelectedFile(e.target.files[0])} />
                                        {selectedFile && (
                                            <img src={URL.createObjectURL(selectedFile)} alt='preview'
                                            style={{
                                                    width: 90,
                                                    height: 90,
                                                    borderRadius: 6,
                                                    objectFit: "cover",
                                                }}/>
                                        )}*/}
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


