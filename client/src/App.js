import React, { useState, useEffect, useCallback } from 'react';
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
  const [settings, setSettings] = useState({ sessionTimeout: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isXlsxReady, setIsXlsxReady] = useState(false);

  const fetchAdminData = useCallback(async () => {
      try {
        setLoading(true);
        const dataResponse = await fetch('/api/data');
        if (!dataResponse.ok) {
            throw new Error(`HTTP error! status: ${dataResponse.status}`);
        }
        const data = await dataResponse.json();
        
        setDb(data);

        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
            const appSettings = await settingsResponse.json();
            setSettings(appSettings);
        }

      } catch (e) {
        console.error("Failed to fetch admin data:", e);
        setError("Không thể tải dữ liệu quản trị từ server.");
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    let savedUser = null;
    try {
        const savedUserJSON = localStorage.getItem('drillAppUser');
        if (savedUserJSON) {
            savedUser = JSON.parse(savedUserJSON);
            setUser(savedUser);
            fetchAdminData();
        } else {
            setLoading(false); // If no user, no data to load initially here
        }

        const savedScreen = localStorage.getItem('drillAppScreen');
        if(savedScreen) setActiveScreen(savedScreen);

        const savedDrill = localStorage.getItem('drillAppDrill');
        if(savedDrill) setActiveDrill(JSON.parse(savedDrill));
    } catch(e) {
        console.error("Failed to restore session from localStorage", e);
        localStorage.clear();
    }
    
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    const xlsxScript = document.createElement('script');
    xlsxScript.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
    xlsxScript.async = true;
    xlsxScript.onload = () => setIsXlsxReady(true);
    xlsxScript.onerror = () => console.error("Failed to load SheetJS library.");
    document.head.appendChild(xlsxScript);

    return () => {
        if(document.head.contains(link)) document.head.removeChild(link);
        if(document.head.contains(xlsxScript)) document.head.removeChild(xlsxScript);
    };
  }, [fetchAdminData]);

  useEffect(() => {
    try {
        if (user) {
            localStorage.setItem('drillAppScreen', activeScreen);
            if (activeDrill) {
                localStorage.setItem('drillAppDrillId', activeDrill.id);
            } else {
                localStorage.removeItem('drillAppDrillId');
            }
        }
    } catch (e) {
        console.error("Failed to save session to localStorage", e);
    }
  }, [activeScreen, activeDrill, user]);


  useEffect(() => {
    if (activeDrill) {
        const freshDrill = db.drills.find(d => d.id === activeDrill.id);
        if (freshDrill) {
            setActiveDrill(freshDrill);
        }
    }
  }, [db.drills, activeDrill]);

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
        if (!response.ok) return false;
        
        const foundUser = await response.json();
        localStorage.setItem('drillAppUser', JSON.stringify(foundUser));
        setUser(foundUser);
        setShowLogin(false);
        await fetchAdminData();
        return true;
    } catch (e) {
        console.error("Login error:", e);
        return false;
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('drillAppUser');
    localStorage.removeItem('drillAppScreen');
    localStorage.removeItem('drillAppDrillId');
    setUser(null);
    setActiveScreen('dashboard');
    setActiveDrill(null);
    setDb({ users: [], drills: [], scenarios: {}, steps: {}, executionData: {} });
  }, []);

  useEffect(() => {
      if (!user || !settings.sessionTimeout) return;
      let inactivityTimer;
      const resetTimer = () => {
          clearTimeout(inactivityTimer);
          inactivityTimer = setTimeout(() => {
              alert("Bạn đã không hoạt động trong một khoảng thời gian. Phiên làm việc sẽ tự động kết thúc.");
              handleLogout();
          }, settings.sessionTimeout * 60 * 1000);
      };
      const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
      activityEvents.forEach(event => window.addEventListener(event, resetTimer));
      resetTimer();
      return () => {
          clearTimeout(inactivityTimer);
          activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
      };
  }, [user, settings.sessionTimeout, handleLogout]);
  
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
        return { ...prevDb, executionData: newExecutionData };
    });
  };

  const handleDrillCompletion = (updatedDrillData) => {
    const fullDrill = db.drills.find(d => d.id === updatedDrillData.id);
    if (fullDrill) {
        const newlyCompletedDrill = { ...fullDrill, ...updatedDrillData };
        setActiveDrill(newlyCompletedDrill);
        setActiveScreen('report');
        setDb(prevDb => ({
            ...prevDb,
            drills: prevDb.drills.map(d => d.id === newlyCompletedDrill.id ? newlyCompletedDrill : d)
        }));
    } else {
        fetchAdminData().then(() => {
            setActiveDrill(updatedDrillData);
            setActiveScreen('report');
        });
    }
  };


  if (loading && user) {
    return <div className="flex items-center justify-center h-screen bg-[#1D2A2E] text-white">Đang tải dữ liệu...</div>;
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-screen bg-[#1D2A2E] text-yellow-400 p-8 text-center">{error}</div>;
  }

  if (!user) {
    return (
        <LanguageProvider>
            <PublicDashboard onLoginRequest={() => setShowLogin(true)} />
            {showLogin && <LoginPage onLogin={handleLogin} onCancel={() => setShowLogin(false)} />}
        </LanguageProvider>
    );
  }

  const renderScreen = () => {
    const onDataRefresh = fetchAdminData;
    switch(activeScreen) {
        case 'dashboard':
            return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={onDataRefresh} />;
        case 'execution':
            if (!activeDrill) return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={onDataRefresh} />;
            return <ExecutionScreen 
                user={user} 
                drill={activeDrill} 
                onBack={handleBackToDashboard} 
                scenarios={db.scenarios} 
                steps={db.steps}
                users={db.users}
                executionData={db.executionData}
                onExecutionUpdate={handleExecutionUpdate}
                onDataRefresh={onDataRefresh}
                setActiveDrill={setActiveDrill}
                setActiveScreen={setActiveScreen}
                onDrillEnded={handleDrillCompletion}
              />;
        case 'report':
            if (!activeDrill) return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={onDataRefresh} />;
            
            const fullDrillForReport = db.drills.find(d => d.id === activeDrill.id) || activeDrill;
            const drillToRender = { ...fullDrillForReport, ...activeDrill };

            return <ReportScreen 
                drill={drillToRender}
                onBack={handleBackToDashboard} 
                scenarios={db.scenarios} 
                steps={db.steps}
                users={db.users}
                executionData={db.executionData}
              />;
        case 'user-management':
             if (user.role !== 'ADMIN') return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={onDataRefresh} />;
            return <UserManagementScreen users={db.users} setUsers={(newUsers) => setDb({...db, users: newUsers})} onDataRefresh={onDataRefresh} />;
        case 'scenarios':
            return <ScenarioManagementScreen db={db} setDb={setDb} user={user} onDataRefresh={onDataRefresh} isXlsxReady={isXlsxReady} />;
        case 'create-drill':
             if (user.role !== 'ADMIN') return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={onDataRefresh} />;
            return <CreateDrillScreen setActiveScreen={setActiveScreen} setDb={setDb} db={db} user={user} drillToEdit={editingDrill} onDoneEditing={() => setActiveScreen('dashboard')} onDataRefresh={onDataRefresh} />;
        case 'admin':
            if (user.role !== 'ADMIN') return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} onDataRefresh={onDataRefresh} />;
            return <AdminScreen onDataRefresh={onDataRefresh} />;
        default:
            return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onDataRefresh={onDataRefresh}/>;
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

