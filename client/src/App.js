import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './components/auth/LoginPage';
import PublicDashboard from './screens/PublicDashboard';
import DashboardScreen from './screens/DashboardScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import ScenarioManagementScreen from './screens/ScenarioManagementScreen';
import CreateDrillScreen from './screens/CreateDrillScreen';
import ExecutionScreen from './screens/ExecutionScreen';
import ReportScreen from './screens/ReportScreen';
import AdminScreen from './screens/AdminScreen';
import './assets/styles.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [activeDrill, setActiveDrill] = useState(null);
  const [editingDrill, setEditingDrill] = useState(null);
  
  const [db, setDb] = useState({
    users: [],
    drills: [],
    scenarios: {},
    steps: {},
    executionData: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isXlsxReady, setIsXlsxReady] = useState(false);

  const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDb(data);
      } catch (e) {
        console.error("Failed to fetch data:", e);
        setError("Không thể tải dữ liệu từ server. Vui lòng kiểm tra lại backend.");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    const xlsxScript = document.createElement('script');
    xlsxScript.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
    xlsxScript.async = true;
    xlsxScript.onload = () => {
        console.log("SheetJS library loaded.");
        setIsXlsxReady(true);
    };
    xlsxScript.onerror = () => {
        console.error("Failed to load SheetJS library.");
    };
    document.head.appendChild(xlsxScript);

    fetchData();

    return () => {
        if(document.head.contains(link)) document.head.removeChild(link);
        if(document.head.contains(xlsxScript)) document.head.removeChild(xlsxScript);
    };
  }, []);

  useEffect(() => {
    if (activeScreen !== 'create-drill') {
        setEditingDrill(null);
    }
  }, [activeScreen]);

  const handleLogin = async (username, password) => {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            return false;
        }
        const foundUser = await response.json();
        setUser(foundUser);
        setShowLogin(false);
        return true;
    } catch (e) {
        console.error("Login error:", e);
        return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveScreen('dashboard');
    setActiveDrill(null);
  };
  
  const handleExecuteDrill = (drill) => {
    setActiveDrill(drill);
    setActiveScreen('execution');
  };
  
  const handleViewReport = (drill) => {
    setActiveDrill(drill);
    setActiveScreen('report');
  };
  
  const handleEditDrill = (drill) => {
      setEditingDrill(drill);
      setActiveScreen('create-drill');
  };

  const handleCloneDrill = (drillToClone) => {
      const clonedDrill = {
          ...drillToClone,
          name: `${drillToClone.name} (Copy)`,
          execution_status: 'Scheduled',
          opened_at: null,
          closed_at: null,
          status: 'Draft',
      };
      delete clonedDrill.id;
      setEditingDrill(clonedDrill);
      setActiveScreen('create-drill');
  };

  const handleBackToDashboard = () => {
      setActiveDrill(null);
      setActiveScreen('dashboard');
  }

  const handleExecutionUpdate = (drillId, entityId, newData) => {
    setDb(prevDb => {
        const newExecutionData = JSON.parse(JSON.stringify(prevDb.executionData));
        if (!newExecutionData[drillId]) {
            newExecutionData[drillId] = {};
        }
        newExecutionData[drillId][entityId] = newData;

        return {
            ...prevDb,
            executionData: newExecutionData
        };
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-[#1D2A2E] text-white">Đang tải dữ liệu...</div>;
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-screen bg-[#1D2A2E] text-yellow-400 p-8 text-center">{error}</div>;
  }

  if (!user) {
    return (
        <LanguageProvider>
            <PublicDashboard 
                drills={db.drills}
                scenarios={db.scenarios}
                steps={db.steps}
                executionData={db.executionData}
                onLoginRequest={() => setShowLogin(true)}
            />
            {showLogin && <LoginPage onLogin={handleLogin} onCancel={() => setShowLogin(false)} />}
        </LanguageProvider>
    );
  }

  const renderScreen = () => {
    switch(activeScreen) {
        case 'dashboard':
            return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={fetchData} />;
        case 'execution':
            if (!activeDrill) return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={fetchData} />;
            return <ExecutionScreen 
                user={user} 
                drill={activeDrill} 
                onBack={handleBackToDashboard} 
                scenarios={db.scenarios} 
                steps={db.steps}
                executionData={db.executionData}
                onExecutionUpdate={handleExecutionUpdate}
                onDataRefresh={fetchData}
              />;
        case 'report':
            if (!activeDrill) return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={fetchData} />;
            return <ReportScreen 
                drill={activeDrill} 
                onBack={handleBackToDashboard} 
                scenarios={db.scenarios} 
                steps={db.steps}
                executionData={db.executionData}
              />;
        case 'user-management':
             if (user.role !== 'ADMIN') return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={fetchData} />;
            return <UserManagementScreen users={db.users} setUsers={(newUsers) => setDb({...db, users: newUsers})} onDataRefresh={fetchData} />;
        case 'scenarios':
            return <ScenarioManagementScreen db={db} setDb={setDb} user={user} onDataRefresh={fetchData} isXlsxReady={isXlsxReady} />;
        case 'create-drill':
             if (user.role !== 'ADMIN') return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={fetchData} />;
            return <CreateDrillScreen setActiveScreen={setActiveScreen} setDb={setDb} db={db} user={user} drillToEdit={editingDrill} onDoneEditing={() => setActiveScreen('dashboard')} onDataRefresh={fetchData} />;
        case 'admin':
            if (user.role !== 'ADMIN') return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={fetchData} />;
            return <AdminScreen onDataRefresh={fetchData} />;
        default:
            return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onDataRefresh={fetchData}/>;
    }
  }

  return (
    <LanguageProvider>
        <AppLayout user={user} onLogout={handleLogout} activeScreen={activeScreen} setActiveScreen={setActiveScreen} isXlsxReady={isXlsxReady}>
        {renderScreen()}
        </AppLayout>
    </LanguageProvider>
  );
}
