import React, { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export default function Row(props) {
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