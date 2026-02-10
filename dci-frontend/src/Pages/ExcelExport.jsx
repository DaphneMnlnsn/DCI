import React from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export const exportToExcel = (results) => {
  if (!results?.conflicts) return;

  try {
    const data = [];
    const merges = [];

    let currentRow = 1; // Row 0 = header

    results.conflicts.forEach((item) => {
      const type = item.conflictType;
      const details = item.details || {};

      let affectedList = [];

      switch (type) {
        case 'missing_client_table':
        case 'extra_client_table':
          affectedList = Object.keys(details);
          break;

        case 'missing_client_column':
        case 'extra_client_column':
          Object.entries(details).forEach(([table, columns]) => {
            Object.keys(columns).forEach((col) => {
              affectedList.push(`${table}.${col}`);
            });
          });
          break;

        case 'type_mismatch':
          Object.entries(details).forEach(([table, columns]) => {
            Object.entries(columns).forEach(([col, types]) => {
              affectedList.push(
                `${table}.${col} (${types.master} vs ${types.client})`
              );
            });
          });
          break;

        case 'length_mismatch':
          Object.entries(details).forEach(([table, columns]) => {
            Object.entries(columns).forEach(([col, len]) => {
              affectedList.push(
                `${table}.${col} (${len.master || 'N/A'} vs ${len.client})`
              );
            });
          });
          break;

        default:
          affectedList.push('None');
      }

      const startRow = currentRow;

      affectedList.forEach((affected, index) => {
        data.push({
          Conflicts: index === 0 ? type : '',
          Affected: affected,
        });

        currentRow++;
      });

      if (affectedList.length > 1) {
        merges.push({
          s: { r: startRow, c: 0 },
          e: { r: currentRow - 1, c: 0 },
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!merges'] = merges
    
    //EXPANDED COLUMN
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: 1, c: C })];
      if (headerCell) {
        headerCell.s = {
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }
    const maxColWidths = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLength = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          maxLength = Math.max(maxLength, cell.v.toString().length + 2);
        }
      }
      maxColWidths.push({ wch: maxLength });
    }
    worksheet['!cols'] = maxColWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(blob, 'scan_results.xlsx');
  } 
  catch (error) {
    console.error('Excel export error:', error);
  }
};

export default exportToExcel;
