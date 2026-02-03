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
                setDatabase(response.data);
                setShow(true);
            }
        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

    function createData(name, calories, fat, carbs, protein, price) {
        return {
            name,
            calories,
            fat,
            carbs,
            protein,
            price,
            history: [
            {
                date: '2020-01-05',
                customerId: '11091700',
                amount: 3,
            },
            {
                date: '2020-01-02',
                customerId: 'Anonymous',
                amount: 1,
            },
            ],
        };
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
                    {typeof row === 'string' ? row : (row.tableName + ' (' + row.tableName.columns.length + ')')}
                </TableCell>
                <TableCell align="right">{row.calories}</TableCell>
                <TableCell align="right">{row.fat}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1 }}>
                    <Table size="small" aria-label="purchases">
                        <TableHead>
                        <TableRow>
                            <TableCell>Column Name</TableCell>
                            <TableCell>Variable Type</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {row.columns && row.columns.map((column, index) => (
                            <TableRow key={typeof column === 'string' ? column : column.columnName || index}>
                            <TableCell component="th" scope="row">
                                {typeof column === 'string' ? column : column.columnName}
                            </TableCell>
                            <TableCell>{typeof column === 'string' ? 'N/A' : column.dataType}</TableCell>
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
                columns: PropTypes.array,
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
        const tables = Array.isArray(database) ? database : Object.keys(database.master || database);
        return (
            <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                <TableRow>
                    <TableCell>Table Names ({tables.length})</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {tables.map((table) => (
                    <Row key={table} row={table} />
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        );
    }

    function CollapsibleTableScanned() {
        return (
            <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                <TableRow>
                    <TableCell>Conflicts ({rows.length})</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {rows.map((row) => (
                    <Row key={row.name} row={row} />
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

                                        <button className='select-btn' onClick={fetchDatabase}>Show</button>
                                        
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
                                <CollapsibleTable /> 
                            ) : (
                                <>
                                    <p className="label">
                                            Please select a database to Compare
                                        </p>

                                        <div className="line"></div>

                                        <button className='select-btn' onClick={() => setShow2(true)}>Show</button>
                                        
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

                                        <button className='select-btn' onClick={() => setScan(true)}>Scan</button>
                                        
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


