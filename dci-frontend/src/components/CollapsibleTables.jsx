import React, { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Row from './Row.jsx';
    
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
    
export function CollapsibleTable({ database }) {
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

export function CollapsibleTable2({ database2 }) {
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
        
        </TableContainer>
    );
}

export function CollapsibleTableScanned({ results, rescan, handleExport, fetchResults }) {
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
                    <button className='export-btn' style={{ backgroundColor: '#FACC1566', color: '#000000'}} onClick={() => handleExport(results)}>Export Results</button>
                {rescan && (
                    <button className='rescan-btn' onClick={() => fetchResults()}>Rescan</button>
                )}
            </div>
            
        </TableContainer>
    );
}