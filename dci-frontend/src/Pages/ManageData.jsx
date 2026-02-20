import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../assets/header.jsx";
import "./ManageData.css";
import axios from 'axios';
import Swal from "sweetalert2";

export default function ManageData() {
  const location = useLocation();
  const navigate = useNavigate();
  const conflictedTables = location.state?.conflictedTables || [];
  const [tables, setTables] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchDatabase = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/conflicted-tables`, {
                    params: {
                        source: 'dci_master',
                        target: 'dci_sample1',
                    },
                    responseType: 'json',
                    withCredentials: true
            });
            if (response.status === 200){
                const raw = response.data || {};
                const conflicted = raw.conflicted_tables || {};
                const tableArray = Object.entries(conflicted).map(([tableName, tableData]) => ({
                    table: tableName,
                    issues: tableData.issues || [],
                    preview: tableData.preview || []
                }));

                setTables(tableArray);
            }

        }
        catch (error) {
            console.log('Fetch database error: ', error);
        }
    }

      useEffect(() => {

      fetchDatabase();
    }, [conflictedTables]);

  const currentTable = tables[currentIndex];
  const rows = currentTable?.preview || [];

  const issues = currentTable?.issues || [];

  const hasExtraConflict = issues.some(
    issue =>
      issue.type === "extra_client_table" ||
      issue.type === "extra_client_column"
  );

  const hasMismatchConflict = issues.some(
    issue =>
      issue.type === "type_mismatch" ||
      issue.type === "length_mismatch"
  );

  const hasAnyIssue = issues.length > 0;

  const next = () => {
    if (currentIndex < tables.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  return (
    <div className="manage-page">
      <Header />

      <main className="manage-content">
        <section className="manage-card">
          <header className="card-header">
            <div className="header-center">
              <button className="nav-btn" onClick={prev} disabled={currentIndex === 0}>
              ◀ Prev
              </button>

              <h2 className="manage-header-title">
                Table Preview: 

                {currentTable && (
                  <>
                  <span className="table-name">
                    {currentTable.table}
                  </span>

                    {tables.length > 1 && (
                      <span className="page-count">
                        {currentIndex + 1} / {tables.length}
                      </span>
                    )}
                  </>
                )}
              </h2>

              <button className="nav-btn" onClick={next} disabled={currentIndex === tables.length - 1}>
                Next ▶
              </button>
            </div>
          </header>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {rows.length > 0 && Object.keys(rows[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="empty-state">
                      No data to display
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i}>{value}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

       <section className="action-bar">
          <div className="delete-group">
            <button
              className="btn btn-delete" 
              disabled={!hasAnyIssue} onClick={async() => {
                const result = await Swal.fire({
                  title: "Are you sure?",
                  text: "This will delete all data for this table.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#ba2f2f",
                  confirmButtonText: "Yes, Delete All",
                  cancelButtonText: "Cancel",
                  cancelButtonColor: "#003566",
                });

                if (result.isConfirmed && currentTable?.table) {
                  try {
                    const response = await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/conflicted-tables/delete-all`, {
                      params: {
                        source: "dci_master",
                        target: "dci_sample1",
                        table: currentTable.table
                      }, 
                      withCredentials: true
                    });
                    
                    if(response.status == 200) {

                      Swal.fire({
                        title: 'Success',
                        text: 'Conflicted data fixed!',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#003566'
                      })

                      console.log("Delete All for: ", currentTable.table);
                      setTables(prev => prev.map(t =>
                      t.table === response.data.table
                        ? {
                            ...t,
                            issues: response.data.issues || [],
                            preview: response.data.preview || [],
                            resolved: (response.data.issues || []).length === 0
                          }
                        : t
                    ));
                    }
                    else {
                      console.warn("Unexpected response: ", response);
                    }    

                  }
                  catch (error) {
                    console.error(error);
                    Swal.fire({
                      title: 'Failed',
                      text: 'Failed to delete all and fix data.',
                      icon: 'error',
                      confirmButtonText: 'OK',
                      confirmButtonColor: '#003566'
                    })
                  }
                }                   
              }
            }
            > Delete All and Fix
            </button>

            <button
              className="btn btn-delete" 
              disabled={!hasMismatchConflict} onClick={async() => {
                const result = await Swal.fire({
                  title: "Are you sure?",
                  text: "This will delete all incompatible data for this table.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#ba2f2f",
                  cancelButtonColor: "#003566",
                  confirmButtonText: "Yes, Delete All",
                  cancelButtonText: "Cancel"
                });

                if (result.isConfirmed && currentTable?.table) {
                  try {
                    const response = await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/conflicted-tables/delete-some`, {
                      params: {
                        source: "dci_master",
                        target: "dci_sample1",
                        table: currentTable.table
                      },
                      withCredentials: true
                    });
                    
                    if(response.status == 200) {

                      Swal.fire({ //SWAL ALERT DELETE SOME
                        title: 'Success',
                        text: 'Conflicted data fixed!',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#003566'
                      })

                      /*alert("Conflicted incompatible data fixed!");*/
                      console.log("Delete Incompatible for: ", currentTable.table);
                      setTables(prev => prev.map(t =>
                      t.table === response.data.table
                        ? {
                            ...t,
                            issues: response.data.issues || [],
                            preview: response.data.preview || [],
                            resolved: (response.data.issues || []).length === 0
                          }
                        : t
                    ));
                    }
                    else {
                      console.warn("Unexpected response: ", response);
                    }    

                  }
                  catch (error) {
                    console.error(error);
                      Swal.fire({
                      title: 'Failed',
                      text: 'Failed to delete all and fix data.',
                      icon: 'error',
                      confirmButtonText: 'OK',
                      confirmButtonColor: '#003566'
                    })
                    
                    /*alert("Failed to delete all and fix incompatible data.");*/
                  }
                }                   
              }
            }
            > Delete Incompatible and Fix
            </button>
          </div>

          <button 
            className="btn btn-cancel" onClick={() => 
              navigate('/main', {
                state: {
                  master: location.state?.master,
                  client: location.state?.client
                }
              })
            }
          >
            Cancel
          </button>
        </section>      
	    </main>
    </div>
  );
};