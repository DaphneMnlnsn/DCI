import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './Pages/Login.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from './Pages/Login.jsx';
import MainPage from './Pages/Scanner.jsx';
import SettingsPage from './Pages/Settings.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/main' element={<MainPage />} />
        <Route path='/settings' element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
