import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (results) => {
  if (!results?.conflicts || results.conflicts.length === 0) return;

  try {
    const data = results.conflicts.map((item) => {
      const type = item.conflictType || 'Unknown';
      const details = item.details || {};
      let affectedText = '';

      switch (type) {
        case 'missing_client_table':
        case 'extra_client_table':
          affectedText = Object.keys(details).join(', ') || 'None';
          break;

        case 'missing_client_column':
        case 'extra_client_column':
          affectedText = Object.entries(details)
            .map(([table, columns]) => `${table}: ${Object.keys(columns).join(', ')}`)
            .join(' | ') || 'None';
          break;

        case 'type_mismatch':
          affectedText = Object.entries(details)
            .map(([table, columns]) =>
              Object.entries(columns)
                .map(
                  ([col, types]) =>
                    `${table}.${col} (${types.master} vs ${types.client})`
                )
                .join(', ')
            )
            .join(' | ') || 'None';
          break;

        case 'length_mismatch':
          affectedText = Object.entries(details)
            .map(([table, columns]) =>
              Object.entries(columns)
                .map(
                  ([col, len]) =>
                    `${table}.${col} (${len.master || 'N/A'} vs ${len.client})`
                )
                .join(', ')
            )
            .join(' | ') || 'None';
          break;

        default:
          affectedText = 'None';
      }

      return [type, affectedText]; 
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    //const logoBase64 = 'data:image/png;base64,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';
    //doc.addImage(logoBase64, 'PNG', 14, 10, 10, 9); 
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