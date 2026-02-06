import React from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export const exportToExcel = (results) => {
  if (!results?.conflicts) return;

  try {
    const data = results.conflicts.map((item) => {
      const type = item.conflictType;
      const details = item.details || {};
      let affectedText = '';

      switch (type) {
        case 'missing_client_table':
        case 'extra_client_table':
          affectedText = Object.keys(details).join(', ');
          break;

        case 'missing_client_column':
        case 'extra_client_column':
          affectedText = Object.entries(details)
            .map(([table, columns]) => `${table}: ${Object.keys(columns).join(', ')}`)
            .join(' | ');
          break;

        case 'type_mismatch':
          affectedText = Object.entries(details)
            .map(([table, columns]) =>
              Object.entries(columns)
                .map(([col, types]) => `${table}.${col} (${types.master} vs ${types.client})`)
                .join(', ')
            )
            .join(' | ');
          break;

        case 'length_mismatch':
          affectedText = Object.entries(details)
            .map(([table, columns]) =>
              Object.entries(columns)
                .map(([col, len]) => `${table}.${col} (${len.master || 'N/A'} vs ${len.client})`)
                .join(', ')
            )
            .join(' | ');
          break;

        default:
          affectedText = 'None';
      }

      return { Conflicts: type, Affected: affectedText };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(blob, 'scan_results.xlsx');
  } catch (error) {
    console.error('Excel export error:', error);
  }
};

export default exportToExcel;
