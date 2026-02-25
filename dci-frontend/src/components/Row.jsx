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

export default function Row({ row, conflictMap }) {
    const [open, setOpen] = React.useState(false);

    // const hasConflict = conflictMap?.[row.tableName] &&
    //     Object.keys(conflictMap[row.tableName]).length > 0;

    const tableConflictTypes = [
    'missing_client_table',
    'extra_client_table',
    'missing_client_column',
    'extra_client_column',
    'type_mismatch',
    'length_mismatch',
    ];

    const hasConflict = tableConflictTypes.some(type => {
        const typeGroup = conflictMap?.[type];
        if (!typeGroup) return false;

        const tableConflicts = typeGroup[row.tableName];
        if (!tableConflicts) return false;

        if (typeof tableConflicts === "object") {
            return Object.keys(tableConflicts).length > 0;
        }

        return true;
    });

    console.log("Row component:", row.tableName);
    console.log("Conflict map received for this row:", conflictMap?.[row.tableName]);

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
                        {row.columns?.map((column, index) => {
                            const colName = column.columnName.trim();

                            if (index === 0) {
                                console.log("Full conflictMap:", conflictMap);
                                console.log("type_mismatch object:", conflictMap?.type_mismatch);
                            }

                            const isMissingClientColumn = !!conflictMap?.missing_client_column?.[colName];
                            const isExtraClientColumn = !!conflictMap?.extra_client_column?.[colName];
                            const isTypeMismatch = !!conflictMap?.type_mismatch?.[colName];
                            const isLengthMismatch = !!conflictMap?.length_mismatch?.[colName];

                            const highlightColumnName = isMissingClientColumn || isTypeMismatch || isLengthMismatch;
                            const highlightVariableType = isExtraClientColumn || isTypeMismatch || isLengthMismatch;

                            console.log("column:", colName);
                            console.log("isMissingClientColumn:", isMissingClientColumn, "isTypeMismatch:", isTypeMismatch, "isLengthMismatch:", isLengthMismatch);
                            console.log("highlightColumnName:", highlightColumnName, "highlightVariableType:", highlightVariableType);
                            console.log(
                                "type mismatch columns:",
                                Object.keys(conflictMap?.type_mismatch || {})
                            );

                            return (
                                <TableRow key={index}>
                                <TableCell style={{ backgroundColor: highlightColumnName ? '#ffe6e6' : 'transparent' }}>
                                    {column.columnName}
                                </TableCell>
                                <TableCell style={{ backgroundColor: highlightVariableType ? '#ffe6e6' : 'transparent' }}>
                                    {column.dataType} {column.maxCharacters ? `(${column.maxCharacters})` : '(N/A)'}
                                </TableCell>
                                </TableRow>
                            );
                            })}
                    </TableBody>
                </Table>
                </Box>
            </Collapse>
            </TableCell>
        </TableRow>
        </React.Fragment>
    );
}