import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (conflicts) => {
  if (!conflicts || conflicts.length === 0) return;

  try {
    const data = conflicts.map((item) => {
      const type = item.conflictType || 'Unknown';
      const details = item.details || {};
      let affectedText = '';

      switch (type) {
        case 'missing_client_table':
        case 'extra_client_table':
          affectedText = Object.keys(details).join('\n') || 'None';
          break;

        case 'missing_client_column':
        case 'extra_client_column':
          affectedText = Object.entries(details)
            .map(([table, columns]) => `${table}: ${Object.keys(columns).join('\n')}`)
            .join('\n') || 'None';
          break;

        case 'type_mismatch':
          affectedText = Object.entries(details)
            .map(([table, columns]) =>
              Object.entries(columns)
                .map(
                  ([col, types]) =>
                    `${table}.${col} (${types.master} vs ${types.client})`
                )
                .join('\n')
            )
            .join('\n') || 'None';
          break;

        case 'length_mismatch':
          affectedText = Object.entries(details)
            .map(([table, columns]) =>
              Object.entries(columns)
                .map(
                  ([col, len]) =>
                    `${table}.${col} (${len.master || 'N/A'} vs ${len.client})`
                )
                .join('\n')
            )
            .join('\n') || 'None';
          break;

        default:
          affectedText = 'None';
      }

      return [type, affectedText]; 
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(23);
    doc.setFont('times', 'bold');
    doc.text('DCI Results', pageWidth / 2, 20, {align: 'center'});

    doc.setFontSize(10);
    doc.text('Generated on: ' + new Date().toLocaleString(), 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Conflicts', 'Affected']],
      body: data,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        valign: 'top'
      },
      columnStyles: {
        1: { cellWidth: 120 },
      },
      pageBreak: 'auto',
    });

    doc.save('scan_results.pdf');
  } 
  catch (error) {
    console.error('PDF export error:', error);
  }
};

export default exportToPDF;