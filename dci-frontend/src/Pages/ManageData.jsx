import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../assets/header.jsx";
import "./ManageData.css";

export default function ManageData() {
  const location = useLocation();
  const navigate = useNavigate();
  const conflictedTables = location.state?.conflictedTables || [];
  const [tables, setTables] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (conflictedTables.length) {
      setTables(conflictedTables);
      setCurrentIndex(0);
    }
  }, [conflictedTables]);

  const currentTable = tables[currentIndex];

  const next = () => {
    if (currentIndex < tables.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const rows = currentTable?.preview || [];

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
                  {rows.length > 0 ? Object.keys(rows[0]).map((col) => (
                      <th key={col}>{col}</th>
                    )) 
                    : null 
                  }
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state">
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
              className="btn btn-delete" onClick={() =>
                console.log("Delete All for:", currentTable?.table)
              }
            >
              Delete All and Fix
            </button>

            <button
              className="btn btn-delete" onClick={() =>
                console.log("Delete Incompatible for:", currentTable?.table)
              }
            >
              Delete Incompatible
            </button>
          </div>

          <button 
            className="btn btn-cancel" onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </section>
      </main>
    </div>
  );
};