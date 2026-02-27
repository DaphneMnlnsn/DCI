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
import Tooltip from '@mui/material/Tooltip';
import WarningIcon from '@mui/icons-material/Warning';
import '../../Pages/Settings.css';
import './Row2.css';

export default function Row({ row, tableConflictMap = {}, columnConflictMap = {}, expandedTables={}, toggleTable, isMaster }) {

    const tableConflictTypes = [
        'missing_client_table',
        'extra_client_table',
        'missing_client_column',
        'extra_client_column',
        'type_mismatch',
        'length_mismatch',
    ];

    const tableName = row.tableName?.trim();
    const open = !!expandedTables[tableName];
    const tableConflicts = tableConflictMap?.[tableName] || {};
    
    //TABLE-RELATED-CONFLICTS
    const isMissingClientTable = !!tableConflicts.missing_client_table;
    const isExtraClientTable = !!tableConflicts.extra_client_table;

    //HIGHLIGHT
    const highlightWholeTable = isMissingClientTable || isExtraClientTable;

    return (
        <React.Fragment>

        <TableRow className="table-row"
            style={{
                backgroundColor: highlightWholeTable ? '#ffe6e6' : 'transparent',
                boxShadow: highlightWholeTable ? "inset 4px 0 0 #d32f2f" : "none",
            }}
        >
            <TableCell className="icon-cell">
                <IconButton
                    aria-label="expand row"
                    size="small"
                    onClick={() => toggleTable(tableName)}
                >
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
            </TableCell>

            <TableCell className="table-name-cell">
            {typeof row === "string"
                ? row
                : `${row.tableName} (${row.columns?.length || 0})`}
            </TableCell>
            <TableCell align="right">
                {(() => {
                    if (highlightWholeTable) {
                    const tooltipText = isMissingClientTable
                        ? "Missing client table"
                        : isExtraClientTable
                        ? "Extra client table"
                        : "";

                    return (
                        <Tooltip
                            title={tooltipText}
                            arrow
                            placement="top"
                            slotProps={{
                                tooltip: {
                                    sx: {
                                        bgcolor: "#e36666",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        fontFamily: "Poppins",
                                        borderRadius: 3,
                                        paddingRight: 2,
                                        paddingLeft: 2,
                                        boxShadow: 3
                                    },
                                },
                                arrow: {
                                    sx: { color: "#e36666" },
                                },
                            }}
                        >
                            <Box display="inline-flex" alignItems="center" justifyContent="center">
                                <WarningIcon style={{ color: '#d32f2f', cursor: 'pointer', fontSize: 20 }} />
                            </Box>
                        </Tooltip>
                    );
                    }

                    let conflictCount = 0;
                    const conflictTypesSet = new Set();
                    row.columns?.forEach((col) => {
                    const colName = col.columnName.trim();

                    if (columnConflictMap?.missing_client_column?.[colName]) {
                        conflictCount += 1;
                        conflictTypesSet.add("Missing client column");
                    }
                    if (columnConflictMap?.extra_client_column?.[colName]) {
                        conflictCount += 1;
                        conflictTypesSet.add("Extra client column");
                    }
                    if (columnConflictMap?.type_mismatch?.[colName]) {
                        conflictCount += 1;
                        conflictTypesSet.add("Type mismatch");
                    }
                    if (columnConflictMap?.length_mismatch?.[colName]) {
                        conflictCount += 1;
                        conflictTypesSet.add("Length mismatch");
                    }
                    });

                    if (conflictCount > 0) {
                    return (
                        <Tooltip 
                            title={`Expand table to see error`} 
                            arrow placement="top"
                            slotProps={{
                                tooltip: {
                                    sx: {
                                        bgcolor: "#e36666",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        fontFamily: "Poppins",
                                        borderRadius: 3,
                                        paddingRight: 2,
                                        paddingLeft: 2,
                                        boxShadow: 3
                                    },
                                },
                                arrow: {
                                    sx: { color: "#e36666" },
                                },
                            }}
                        
                        >
                            <Box display="inline-flex" alignItems="center" justifyContent="center" gap={0.5}>
                                <WarningIcon style={{ color: '#d32f2f', fontSize: 20, cursor: 'pointer' }} />
                                <span style={{ color: '#d32f2f', fontWeight: 600 }}>{conflictCount}</span>
                            </Box>
                        </Tooltip>
                    );
                    }

                    return null;
                })()}
            </TableCell>
        </TableRow>
    
        <TableRow className="expanded-row">
            <TableCell colSpan={3} className="expanded-cell">
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box className="expanded-box">
                <Table size="small" className="inner-table">
                    <TableHead>
                    <TableRow className="inner-header2">
                        {isMaster ? (
                            <>
                                <TableCell>Column Name</TableCell>
                                <TableCell>Data Type</TableCell>
                            </>
                            )
                                :
                            (
                            <>
                                <TableCell>Column Name</TableCell>
                                <TableCell>Data Type</TableCell>
                                <TableCell>Action</TableCell>
                            </>
                            )
                        }
                    </TableRow>
                    </TableHead>

                    <TableBody>
                        {row.columns?.map((column, index) => {
                            const colName = column.columnName.trim();

                            //COLUMN-RELATED-CONFLICTS
                            const isMissingClientColumn = !!columnConflictMap?.missing_client_column?.[colName];
                            const isExtraClientColumn = !!columnConflictMap?.extra_client_column?.[colName];
                            const isTypeMismatch = !!columnConflictMap?.type_mismatch?.[colName];
                            const isLengthMismatch = !!columnConflictMap?.length_mismatch?.[colName];

                            //HIGHLIGHT
                            const highlightColumnName = isMissingClientColumn || isTypeMismatch || isLengthMismatch;
                            const highlightVariableType = isMissingClientColumn || isExtraClientColumn || isTypeMismatch || isLengthMismatch;
                            
                            const hasColumnConflict =
                                isMissingClientColumn ||
                                isExtraClientColumn ||
                                isTypeMismatch ||
                                isLengthMismatch;

                            const conflictTypes = [];
                            if (isMissingClientColumn) conflictTypes.push("Missing client column");
                            if (isExtraClientColumn) conflictTypes.push("Extra client column");
                            if (isTypeMismatch) conflictTypes.push("Type mismatch");
                            if (isLengthMismatch) conflictTypes.push("Length mismatch");
                            const tooltipText = hasColumnConflict ? conflictTypes.join(" / ") : "";

                            return (
                                <Tooltip 
                                    key={index} 
                                    title={tooltipText} 
                                    arrow placement="top" 
                                    disableHoverListener={!hasColumnConflict}
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                bgcolor: "#e36666",
                                                fontSize: 12,
                                                fontWeight: 500,
                                                fontFamily: "Poppins",
                                                borderRadius: 3,
                                                paddingRight: 2,
                                                paddingLeft: 2,
                                                boxShadow: 3
                                            },
                                        },
                                        arrow: {
                                            sx: { color: "#e36666" },
                                        },
                                    }}
                                >
                                    <TableRow
                                    style={{
                                        backgroundColor: hasColumnConflict ? "#ffe6e6" : "transparent",
                                        boxShadow: hasColumnConflict ? "inset 4px 0 0 #d32f2f" : "none",
                                        cursor: hasColumnConflict ? "pointer" : "default",
                                    }}
                                    >
                                        {isMaster ? (
                                            <>
                                            <TableCell>{column.columnName}</TableCell>
                                            <TableCell>
                                                {column.dataType} {column.maxCharacters ? `(${column.maxCharacters})` : "(N/A)"}
                                            </TableCell>
                                            </>

                                        ) : (
                                            <>
                                            <TableCell>{column.columnName}</TableCell>
                                            <TableCell>
                                                {column.dataType} {column.maxCharacters ? `(${column.maxCharacters})` : "(N/A)"}
                                            </TableCell>
                                            <TableCell>
                                                {column.dataType} {column.maxCharacters ? `(${column.maxCharacters})` : "(N/A)"}
                                            </TableCell>
                                            </>
                                        )

                                        }
                                    </TableRow>
                                </Tooltip>
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