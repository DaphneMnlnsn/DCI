                        {/*<table className='database-table'>
                            <thead>
                                {database.map((data, index) => (
                                    <tr key={index}>
                                        <th>{data.masters}</th>
                                    </tr>
                                ))}
                            </thead>
                            <tbody className='database-body'>
                                {database.map((data, index) => (
                                    <tr key={index}>
                                        <td>{data.columns}</td>
                                    </tr>
                                ))}  
                            </tbody> 
                        </table>*/}

    function CollapsibleTable() {
        if (!database) return <div>No data</div>;
        const tables = Array.isArray(database) ? database : Object.keys(database.master || database);
        return (
            <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                <TableRow>
                    <TableCell>Table Names ({tables.length})</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {tables.map((table) => (
                    <TableRow key={table}>
                        <TableCell>{table}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        );
    }