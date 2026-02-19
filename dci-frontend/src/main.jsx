import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './Pages/Login.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from './components/ProtectedRoute.jsx';

import LoginPage from './Pages/Login.jsx';
import MainPage from './Pages/Scanner.jsx';
import SettingsPage from './Pages/Settings.jsx';
import ManageData from './Pages/ManageData.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/main' element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
        <Route path='/settings' element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path='/manage-data' element={<ProtectedRoute><ManageData /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
