import { useState, useEffect } from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    
    if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
    if (savedSidebarState !== null) setSidebarCollapsed(JSON.parse(savedSidebarState));
  }, []);

  // ✅ IMPORTANTE: Aplicar la clase 'dark' al elemento html
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Guardar preferencias
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="flex h-screen">
      <Sidebar collapsed={sidebarCollapsed} darkMode={darkMode} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        
        <main className={`flex-1 overflow-y-auto p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}