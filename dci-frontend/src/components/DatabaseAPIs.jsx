import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import swal from 'sweetalert2';

export const fetchSchema = async (dbName) => {

    if (!dbName) return null;

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

            return { raw, database: database, tables: tableArray };
        }

        return null;

    }
    catch (error) {
        console.log('Fetch database error: ', error);
        return null;
    }
}

export const fetchConflicts = async (dbA, dbB) => {

    if (!dbA || !dbB) {
        swal.fire("Select two databases first", "", "warning");
        return;
    }

    if (dbA === dbB) {
        swal.fire({
            title: "Invalid Selection",
            text: "Please select two different databases",
            icon: "warning",
            confirmButtonColor: "#003566"
        });
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
            const raw = response.data;
            const conflictsArray = conflictArray;
            let hasConflicts = true;

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
            if (totalCount === 0) {
                hasConflicts = true;
            } else {
                hasConflicts = false;
            }

            swal.fire({
                title: "Scan Complete",
                html: `<span class="conflict-count">${totalCount} conflicts found</span>`,
                icon: "info",
                iconColor: '#FF0000',
                confirmButtonText: "OK",
                confirmButtonColor: '#003566'
            });

            return {raw, conflictsArray, hasConflicts};
        }

        return null;
    }
    catch (error) {
        console.log('Fetch database error: ', error);
        return null;
    }
}

export const fixAllConflicts = async (dbA, dbB, navigate, results) => {

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
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/fix`, {
                params: {
                    source: dbA,
                    target: dbB,
                },
                responseType: 'json',
            });

            if(response.status === 200){
                const statements = response.data.statements || [];
                const localWarnings = [];
                const executed = response.data.executed || 0;
                
                statements.forEach(stmt => {
                    if (stmt.startsWith('-- WARNING:')) {
                        const warning = stmt.replace('-- WARNING: ', '');
                        console.warn('Warning: ', warning);
                        localWarnings.push(warning);
                    } 
                    else {
                        console.log('Executed:', stmt);
                    }
                });
                
                if(localWarnings.length > 0){
                    const result = await swal.fire({
                        title: 'Completed with warnings',
                        html: `<span class="conflict-count">${executed} conflict(s) fixed with ${localWarnings.length} warning(s)</span>
                            <br/><br/>
                            <div style="text-align:left; max-height:200px; overflow-y:auto;">
                                <strong>Warnings:</strong>
                                <ul>${localWarnings.map(w => `<li>${w}</li>`).join('')}</ul>    
                            </div>`, 
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'View & Manage Data',
                        confirmButtonColor: '#003566',
                        cancelButtonColor: '#6E7881'
                    });

                    if (result.isConfirmed){
                        navigate('/manage-data', {state: {conflictedTables: results.conflicts}});
                    }
                }
                else {
                    swal.fire({
                        title: 'Success',
                        text: `${executed} conflict(s) fixed`,
                        icon: 'success',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#003566'
                    });
                }

                return localWarnings;
              
            }
        } catch (error){
            console.log('Error fixing conflicts: ', error);
            swal.fire({
                title: 'Error',
                text: 'Something went wrong while fixing conflicts.',
                icon: 'error'
            });
            return null;
        }
    }         
}