import React, { useState, useRef } from 'react';
import axios from 'axios';
import swal from 'sweetalert2';
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
import { faCancel, faCircleCheck as faCircleCheckFilled, faCircleMinus, faUndo } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fixAllConflicts, ignoreMultiple } from '../DatabaseAPIs';

export default function Row({ row, tableConflictMap = {}, columnConflictMap = {}, expandedTables={}, toggleTable, isMaster, dbA, dbB, results }) {

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

    const tableHasMissingColumn = row.columns?.some((col) => {
        const colName = col.columnName.trim();
        return !!columnConflictMap?.missing_client_column?.[colName];
    });

    const tableHasConflict = row.columns?.some((col) => {
        const colName = col.columnName.trim();
        return !!columnConflictMap?.missing_client_column?.[colName] ||
        !!columnConflictMap?.extra_client_column?.[colName] ||
        !!columnConflictMap?.type_mismatch?.[colName] ||
        !!columnConflictMap?.length_mismatch?.[colName];
    });

    const handleIgnoreOne = async (tableName, columnName) => {
        if (!results?.raw?.conflicts) return;

        const conflicts = results.raw.conflicts;
        let singleConflict = null;
        let conflictType = null;

        Object.entries(conflicts).forEach(([type, tables]) => {
            if (['missing_client_column','extra_client_column','type_mismatch','length_mismatch'].includes(type)) {
                if (tables?.[tableName]?.[columnName]) {
                    singleConflict = {
                        master_database_name: dbA,
                        client_database_name: dbB,
                        table_name: tableName,
                        column_name: columnName,
                        conflict_type: type
                    };
                    conflictType = type;
                }
            }
        });

        if (!singleConflict) return;

        const ignoredConflict = results?.raw?.ignored?.find(c =>
            c.table_name === tableName &&
            (c.column_name || null) === (columnName || null) &&
            c.conflict_type === conflictType
        );

        try {
            if (ignoredConflict) {
                console.log("Unignoring conflict:", ignoredConflict.id);
                await axios.delete(
                    `${import.meta.env.VITE_APP_BASE_URL}/api/conflicts/unignore`,
                    {
                        data: { id: ignoredConflict.id },
                        withCredentials: true
                    }
                );

                swal.fire({
                    title: "Unignored",
                    text: `Conflict on ${tableName}.${columnName} is now unignored.`,
                    icon: "success",
                    confirmButtonColor: "#003566"
                });
            } else {
                await axios.post(
                    `${import.meta.env.VITE_APP_BASE_URL}/api/conflicts/create`,
                    singleConflict,
                    { withCredentials: true }
                );

                swal.fire({
                    title: "Ignored",
                    text: `Conflict on ${tableName}.${columnName} ignored.`,
                    icon: "success",
                    confirmButtonColor: "#003566"
                });
            }

        } catch (error) {
            console.error(error);
            swal.fire("Error", "Could not update conflict status", "error");
        }
    };

    const handleIgnoreTable = async (tableName) => {
        await ignoreMultiple(results, dbA, dbB, tableName);
    }

    const handleUnignoreTable = async (tableName) => {
        const ignoredList = results?.raw?.ignored || [];
        if (!ignoredList.length) return;

        const ids = ignoredList
            .filter(c => !tableName || c.table_name === tableName)
            .map(c => c.id);

        if (!ids.length) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_APP_BASE_URL}/api/conflicts/unignore-multiple`,
                {
                    data: { ignored: ids },
                    withCredentials: true
                }
            );

            swal.fire({
                title: "Unignored",
                text: tableName
                    ? `All ignored conflicts in table "${tableName}" have been unignored.`
                    : "All ignored conflicts have been unignored.",
                icon: "success",
                confirmButtonColor: "#003566"
            });
        } catch (error) {
            console.error(error);
            swal.fire("Error unignoring conflicts", "", "error");
        }
    };

    const fixConflicts = async (mode, table, column) => {
        await fixAllConflicts(dbA, dbB, null, results, mode, table, column);
    }

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

                    const tableConflictTypes = [];
                    if (isMissingClientTable) tableConflictTypes.push('missing_client_table');
                    if (isExtraClientTable) tableConflictTypes.push('extra_client_table');
                    
                    const isIgnored = tableConflictTypes.some(type =>
                        results?.raw?.ignored?.some(c =>
                            c.table_name === tableName &&
                            c.conflict_type === type
                        )
                    );

                    return (
                        <>
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
                        <>
                            {!isIgnored ? (
                            <Tooltip 
                                title="Ignore table" 
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
                                }}>
                                <FontAwesomeIcon icon={faCircleMinus} className='btn-icon-table'  onClick={() => handleIgnoreTable(tableName)}/>
                            </Tooltip>
                            ) : (
                            <Tooltip 
                            title="Unignore table" 
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
                            }}>
                            <FontAwesomeIcon icon={faUndo} className='btn-icon-table'  onClick={() => handleUnignoreTable(tableName)}/>
                            </Tooltip>
                            )}

                            {isMissingClientTable && (
                                <Tooltip
                                    title="Fix table"
                                    arrow placement="top"
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                bgcolor: "#004483",
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
                                            sx: { color: "#004483" },
                                        },
                                    }}>
                                <FontAwesomeIcon icon={faCircleCheckFilled} className='btn-icon-table-fix' onClick={() => fixConflicts("table", tableName, null)}/>
                                </Tooltip>
                            )}
                        </>
                        </>
                    );
                    }

                    let conflictCount = 0;
                    const conflictTypesSet = new Set();
                    const columnConflictTypes = [];
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
                    const isMissingClientColumn = !!columnConflictMap?.missing_client_column?.[colName];
                    const isExtraClientColumn = !!columnConflictMap?.extra_client_column?.[colName];
                    const isTypeMismatch = !!columnConflictMap?.type_mismatch?.[colName];
                    const isLengthMismatch = !!columnConflictMap?.length_mismatch?.[colName];

                    if (isMissingClientColumn) columnConflictTypes.push('missing_client_column');
                    if (isExtraClientColumn) columnConflictTypes.push('extra_client_column');
                    if (isTypeMismatch) columnConflictTypes.push('type_mismatch');
                    if (isLengthMismatch) columnConflictTypes.push('length_mismatch');
                    });
                    
                    const isIgnored =
                    columnConflictTypes.length > 0 &&
                    columnConflictTypes.every(type =>
                        results?.raw?.ignored?.some(c =>
                            c.table_name === tableName &&
                            c.conflict_type === type
                        )
                    );

                    if (conflictCount > 0) {
                    return (
                        <>
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
                            
                            {tableHasMissingColumn && (
                                <>
                                {!isIgnored ? (
                                <Tooltip 
                                    title="Ignore all conflicts in this table" 
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
                                    }}>
                                    <FontAwesomeIcon icon={faCircleMinus} className='btn-icon-table'  onClick={() => handleIgnoreTable(tableName)}/>
                                </Tooltip>
                                ) : (
                                <Tooltip 
                                title="Unignore all conflicts in this table" 
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
                                }}>
                                <FontAwesomeIcon icon={faUndo} className='btn-icon-table'  onClick={() => handleUnignoreTable(tableName)}/>
                                </Tooltip>
                                )}
                                <Tooltip
                                    title="Fix all conflicts in this table"
                                    arrow placement="top"
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                bgcolor: "#004483",
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
                                            sx: { color: "#004483" },
                                        },
                                    }}>
                                <FontAwesomeIcon icon={faCircleCheckFilled} className='btn-icon-table-fix' onClick={() => fixConflicts("table", tableName, null)}/>
                                </Tooltip>
                                </>
                            )}
                        </>
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
                                {tableHasMissingColumn && <TableCell>Action</TableCell>}
                            </>
                            )
                                :
                            (
                            <>
                                <TableCell>Column Name</TableCell>
                                <TableCell>Data Type</TableCell>
                                {tableHasConflict && <TableCell>Action</TableCell>}
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

                            const columnConflictTypes = [];
                            if (isMissingClientColumn) columnConflictTypes.push('missing_client_column');
                            if (isExtraClientColumn) columnConflictTypes.push('extra_client_column');
                            if (isTypeMismatch) columnConflictTypes.push('type_mismatch');
                            if (isLengthMismatch) columnConflictTypes.push('length_mismatch');
                            
                            const isIgnored = columnConflictTypes.some(type =>
                                results?.raw?.ignored?.some(c =>
                                    c.table_name === tableName &&
                                    (c.column_name || null) === (column.columnName || null) &&
                                    c.conflict_type === type
                                )
                            );

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
                                            {tableHasMissingColumn && (
                                                <TableCell className='last'>
                                                    {isMissingClientColumn && (
                                                        <>
                                                            <button className='row-ignore-btn' onClick={() => handleIgnoreOne(tableName, column.columnName)}><FontAwesomeIcon icon={faCircleMinus} className='btn-icon-ignore'/>{isIgnored ? 'Unignore' : 'Ignore'}</button>
                                                            <button className='row-fix-btn' onClick={() => fixConflicts("column", tableName, column.columnName)}><FontAwesomeIcon icon={faCircleCheck} className='btn-icon-fix'/>Fix</button>
                                                        </>
                                                    )}
                                                </TableCell>
                                            )}
                                            </>

                                        ) : (
                                            <>
                                            <TableCell>{column.columnName}</TableCell>
                                            <TableCell>
                                                {column.dataType} {column.maxCharacters ? `(${column.maxCharacters})` : "(N/A)"}
                                            </TableCell>
                                            {tableHasConflict && (
                                                <TableCell className='last'>
                                                    {hasColumnConflict && (                                                            
                                                        <>
                                                            <center><button className='row-ignore-btn' onClick={() => handleIgnoreOne(tableName, column.columnName)}><FontAwesomeIcon icon={faCircleMinus} className='btn-icon-ignore'/>{isIgnored ? 'Unignore' : 'Ignore'}</button></center>
                                                        </>
                                                    )}
                                                </TableCell>
                                            )}
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