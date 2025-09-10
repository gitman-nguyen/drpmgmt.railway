import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { LogoIcon, CheckpointIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../components/icons';

// --- NEW INFOGRAPHIC ICONS ---
// An arrow icon to visually connect workflow levels, now colored.
const WorkflowConnector = () => (
    <div className="my-4 text-amber-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
    </div>
);

// --- PIE CHART COMPONENT (Updated to support both light and dark themes) ---
const PieChart = ({ percentage, size = 80, strokeWidth = 8, colorClass = 'text-amber-500', textSizeClass = 'text-lg', textColorClass = 'text-slate-700', bgCircleClassProp }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const bgCircleClass = bgCircleClassProp || (textColorClass === 'text-white' ? 'text-gray-600/50' : 'text-slate-100');


    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                {/* Background circle */}
                <circle className={bgCircleClass} strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
                {/* Progress circle */}
                <circle className={colorClass} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center font-bold ${textColorClass} ${textSizeClass}`}>{`${Math.round(percentage)}%`}</span>
        </div>
    );
};


// Color palette for user tags (frosted glass theme)
const userColorClasses = [
    { bg: 'bg-amber-400/20', text: 'text-amber-200' }, 
    { bg: 'bg-emerald-400/20', text: 'text-emerald-200' },
    { bg: 'bg-rose-400/20', text: 'text-rose-200' }, 
    { bg: 'bg-sky-400/20', text: 'text-sky-200' },
    { bg: 'bg-teal-400/20', text: 'text-teal-200' },  
    { bg: 'bg-indigo-400/20', text: 'text-indigo-200' },
];

// --- NEW NEON COLOR PALETTE FOR WORKFLOW NODES ---
const neonScenarioColorPalette = [
    { text: 'text-sky-200', border: 'border-sky-400/60', shadow: 'shadow-sky-400/40', ring: 'ring-sky-400' },
    { text: 'text-emerald-200', border: 'border-emerald-400/60', shadow: 'shadow-emerald-400/40', ring: 'ring-emerald-400' },
    { text: 'text-rose-200', border: 'border-rose-400/60', shadow: 'shadow-rose-400/40', ring: 'ring-rose-400' },
    { text: 'text-indigo-200', border: 'border-indigo-400/60', shadow: 'shadow-indigo-400/40', ring: 'ring-indigo-400' },
    { text: 'text-teal-200', border: 'border-teal-400/60', shadow: 'shadow-teal-400/40', ring: 'ring-teal-400' },
];

const simpleHash = (str) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
    return Math.abs(hash);
};

// Helper function to format scenario name for display
const getShortScenarioName = (scenarioNode, t) => {
    if (!scenarioNode || !scenarioNode.name) return '';
    let displayRole = null;
    if (scenarioNode.role === 'TECHNICAL') {
        displayRole = t('roleTechnical', 'Kỹ thuật');
    } else if (scenarioNode.role === 'BUSINESS') {
        displayRole = t('roleBusiness', 'Nghiệp vụ');
    }
    if (displayRole && scenarioNode.application_name) {
        return `${scenarioNode.application_name} (${displayRole})`;
    }
    return scenarioNode.name;
};


const PublicDashboard = ({ onLoginRequest }) => {
    const { t, language, setLanguage } = useTranslation();
    const [selectedDrill, setSelectedDrill] = useState(null);
    const [activeNodeId, setActiveNodeId] = useState(null);
    const [now, setNow] = useState(Date.now());
    
    const [publicData, setPublicData] = useState({ drills: [], scenarios: {}, steps: {}, executionData: {}, users: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPublicData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/public/data');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setPublicData(data);
            } catch (err) {
                console.error("Failed to fetch public data:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPublicData();
        const intervalId = setInterval(fetchPublicData, 30000); // Auto-refresh every 30 seconds
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { drills, scenarios, steps, executionData, users } = publicData;

    const userColorMap = useMemo(() => {
        const map = {};
        if (users && users.length > 0) { users.forEach(u => { map[u.id] = userColorClasses[simpleHash(u.id) % userColorClasses.length]; }); }
        return map;
    }, [users]);
    
    const formatDuration = (ms) => {
        if (ms < 0) ms = 0;
        const s = Math.floor((ms / 1000) % 60), m = Math.floor((ms / (1000 * 60)) % 60), h = Math.floor((ms / (1000 * 60 * 60)) % 24), d = Math.floor(ms / (1000 * 60 * 60 * 24));
        const parts = [];
        if (d > 0) parts.push(`${d}${t('d', 'd')}`); 
        if (h > 0) parts.push(`${h}${t('h', 'h')}`); 
        if (m > 0) parts.push(`${m}${t('m', 'm')}`); 
        if (s >= 0) parts.push(`${s}${t('s', 's')}`);
        return parts.length > 0 ? parts.join(' ') : '0s';
    };
    
    const { workflowLevels, allNodes, allStats } = useMemo(() => {
        if (!selectedDrill) return { workflowLevels: [], allNodes: {}, allStats: {} };
    
        const drillExecData = executionData[selectedDrill.id] || {};
        const stats = {};

        Object.values(steps).forEach(step => {
            if (!step) return;
            const state = drillExecData[step.id];
            let elapsedTime = '—', executor = null, assigned = null, statusText = t('pending'), statusIcon = '🕒', statusColor = 'text-slate-400';
            
            if (state?.started_at) {
                elapsedTime = formatDuration((state.completed_at ? new Date(state.completed_at) : now) - new Date(state.started_at));
            }

            const assigneeId = state?.assignee || selectedDrill.step_assignments?.[step.id];
            if (assigneeId && users) {
                const user = users.find(u => u.id === assigneeId);
                if (user) {
                    const userName = user.last_name && user.first_name ? `${user.last_name} ${user.first_name}` : (user.fullname || user.username);
                    if (state?.assignee) executor = {name: userName, id: user.id}; else assigned = {name: userName, id: user.id};
                }
            }
            
            if (state?.status === 'InProgress') { statusText = t('inProgress'); statusIcon = '▶️'; statusColor = 'text-sky-400'; }
            else if (state?.status === 'Completed-Success') { statusText = t('success'); statusIcon = '✅'; statusColor = 'text-emerald-400'; }
            else if (state?.status?.startsWith('Completed-')) { statusText = t('failure'); statusIcon = '❌'; statusColor = 'text-rose-400'; }
            stats[step.id] = { elapsedTime, executor, assigned, statusText, statusIcon, statusColor };
        });

        const nodes = {};
        selectedDrill.scenarios.forEach(item => {
            const scenario = scenarios[item.id];
            if(scenario) nodes[item.id] = { ...scenario, type: 'scenario', dependsOn: item.dependsOn || [] };
        });
        Object.values(nodes).forEach(node => {
            node.checkpoint = Object.values(selectedDrill.checkpoints || {}).find(c => c.after_scenario_id === node.id) || null;
        });

        const adj = {}, inDegree = {};
        Object.keys(nodes).forEach(id => { adj[id] = []; inDegree[id] = 0; });
        Object.values(nodes).forEach(node => {
            (node.dependsOn || []).forEach(depId => {
                if (adj[depId]) { adj[depId].push(node.id); inDegree[node.id]++; }
            });
        });
        const queue = Object.keys(nodes).filter(id => inDegree[id] === 0);
        const levels = [];
        while (queue.length > 0) {
            const levelSize = queue.length;
            const currentLevel = [];
            for (let i = 0; i < levelSize; i++) {
                const u = queue.shift();
                currentLevel.push(nodes[u]);
                (adj[u] || []).forEach(v => { inDegree[v]--; if (inDegree[v] === 0) queue.push(v); });
            }
            levels.push(currentLevel);
        }
        
        const flatNodes = { ...nodes };
        Object.values(nodes).forEach(node => { if (node.checkpoint) flatNodes[node.checkpoint.id] = { ...node.checkpoint, type: 'checkpoint' }; });
        return { workflowLevels: levels, allNodes: flatNodes, allStats: stats };
    }, [selectedDrill, scenarios, steps, executionData, users, now, t]);

    const calculateOverallProgress = (drill) => {
        if (!drill || !drill.scenarios || !scenarios) return 0;
        const allScenariosInDrill = drill.scenarios.map(s => scenarios[s.id]).filter(Boolean);
        const allCheckpointsInDrill = Object.values(drill.checkpoints || {});
        
        const allStepIds = allScenariosInDrill.flatMap(s => s.steps.map(step => step.id));
        const allCriterionIds = allCheckpointsInDrill.flatMap(c => c.criteria?.map(crit => crit.id) || []);
        
        const allItems = [...allStepIds, ...allCriterionIds];
        if (allItems.length === 0) return 100;
        
        const drillExecData = executionData[drill.id] || {};
        const completedItems = allItems.filter(id => {
            const itemData = drillExecData[id];
            return itemData?.status?.startsWith('Completed') || itemData?.status === 'Pass' || itemData?.status === 'Fail';
        });

        return (completedItems.length / allItems.length) * 100;
    };


    const inProgressDrills = drills.filter(d => d.execution_status === 'InProgress');

    const renderDrillList = () => (
        <div className="w-full max-w-4xl mx-auto z-10 relative">
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">{t('publicDashboardTitle')}</h1>
            {isLoading && <div className="text-center text-white">{t('loading', 'Loading...')}</div>}
            {error && <div className="text-center text-red-400">{t('error', 'Error:')} {error}</div>}
            {!isLoading && !error && (
                inProgressDrills.length > 0 ? (
                    <div className="space-y-4">
                        {inProgressDrills.map(drill => {
                            const progress = calculateOverallProgress(drill);
                             let colorClass = 'text-gray-400';
                             if (progress === 100) colorClass = 'text-emerald-400';
                             else if (progress > 0) colorClass = 'text-sky-400';

                            return (
                                <div key={drill.id} className="bg-gradient-to-br from-[#2A3A3F]/80 to-[#1E292D]/80 p-6 rounded-2xl border border-[#3D4F56] hover:border-amber-400/50 transition-all duration-300 backdrop-blur-sm shadow-2xl shadow-black/30">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div className="flex-grow">
                                            <h2 className="text-xl font-bold text-white">{drill.name}</h2>
                                            <p className="text-gray-400 mt-1">{drill.description}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <PieChart percentage={progress} size={150} strokeWidth={15} colorClass={colorClass} textSizeClass="text-4xl" textColorClass="text-white" />
                                            <button onClick={() => { setSelectedDrill(drill); setActiveNodeId(null); }} className="flex-shrink-0 bg-amber-400 text-black font-bold py-2 px-5 rounded-lg hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/20">
                                                {t('viewProgress')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-[#2A3A3F]/60 rounded-2xl">
                        <p className="text-gray-400 text-lg">{t('noActiveDrills')}</p>
                    </div>
                )
            )}
        </div>
    );

    // --- REFACTORED DRILL DETAILS VIEW ---
    const renderDrillDetails = () => {
        const drillExecData = executionData[selectedDrill.id] || {};
        const overallProgress = calculateOverallProgress(selectedDrill);
        const activeNode = activeNodeId ? allNodes[activeNodeId] : null;
        const totalElapsedTime = selectedDrill.opened_at ? formatDuration(now - new Date(selectedDrill.opened_at).getTime()) : '—';
        
        let overallColorClass = 'text-slate-400';
        if (overallProgress === 100) overallColorClass = 'text-emerald-400';
        else if (overallProgress > 0) overallColorClass = 'text-sky-400';

        return (
             <div className="w-full max-w-7xl mx-auto z-10 relative">
                <button onClick={() => setSelectedDrill(null)} className="text-amber-300 hover:underline mb-6 text-lg font-medium">&larr; {t('backToList')}</button>
                
                {/* Header Card (Frosted Glass) */}
                <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-lg mb-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                        <PieChart percentage={overallProgress} size={120} strokeWidth={10} colorClass={overallColorClass} textSizeClass="text-2xl" textColorClass="text-white"/>
                    </div>
                    <div className="flex-grow text-center md:text-left">
                         <h1 className="text-3xl font-bold text-slate-200">{selectedDrill.name}</h1>
                         <p className="text-slate-300 mt-1">{selectedDrill.description}</p>
                         <div className="mt-2 flex items-center justify-center md:justify-start gap-2 text-slate-200">
                            <ClockIcon className="w-5 h-5" />
                            <span className="font-semibold">{t('totalTime')}:</span>
                            <span className="font-mono">{totalElapsedTime}</span>
                         </div>
                    </div>
                </div>

                {/* Frosted Glass Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Workflow Column (Frosted Glass) */}
                    <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
                        <h2 className="text-xl font-bold text-slate-200 mb-6 text-center">Tiến độ diễn tập</h2>
                        <div className="flex flex-col items-center gap-0 p-2">
                             {workflowLevels.map((level, levelIndex) => (
                                <React.Fragment key={levelIndex}>
                                    <div className="flex flex-row flex-wrap justify-center items-stretch gap-8">
                                        {level.map(node => {
                                            const isActive = activeNodeId === node.id;
                                            const stepObjects = node.steps || [];
                                            const progress = stepObjects.length > 0 ? (stepObjects.filter(step => drillExecData[step.id]?.status?.startsWith('Completed')).length / stepObjects.length) * 100 : 100;
                                            
                                            let pieColorClass = 'text-slate-400';
                                            if (progress === 100) pieColorClass = 'text-emerald-400';
                                            else if (progress > 0) pieColorClass = 'text-sky-400';
                                            
                                            const displayName = getShortScenarioName(node, t);
                                            const nodeColor = neonScenarioColorPalette[simpleHash(node.id) % neonScenarioColorPalette.length];

                                            return (
                                                <div key={node.id} className="relative group flex flex-col items-center">
                                                    <button 
                                                        onClick={() => setActiveNodeId(node.id)} 
                                                        className={`w-72 p-3 rounded-xl text-left transition-all duration-300 border flex items-center gap-4 bg-slate-900/20 backdrop-blur-md ${
                                                            isActive 
                                                            ? `shadow-lg ${nodeColor.shadow} ${nodeColor.border}`
                                                            : `${nodeColor.border} hover:shadow-lg hover:${nodeColor.shadow} hover:-translate-y-0.5`
                                                        }`}
                                                    >
                                                        <div className="flex-shrink-0 w-12 h-12">
                                                            <PieChart percentage={progress} size={48} strokeWidth={5} colorClass={pieColorClass} textSizeClass="text-xs" textColorClass="text-slate-200" bgCircleClassProp="text-white/10" />
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <h3 className={`font-bold text-md truncate ${nodeColor.text}`}>{displayName}</h3>
                                                        </div>
                                                    </button>
                                                    {/* Tooltip to show full scenario name */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-slate-800 text-white text-sm rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 shadow-lg text-center">
                                                        {node.name}
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {(() => {
                                        const checkpointsForLevel = level.map(n => n.checkpoint).filter(Boolean);
                                        if (checkpointsForLevel.length === 0) return null;
                                        return (
                                             <div className="w-full flex justify-center items-center my-6 gap-4">
                                                 <div className="flex-grow border-t border-dotted border-white/30"></div>
                                                 {checkpointsForLevel.map(cp => {
                                                    const isActive = activeNodeId === cp.id;
                                                    const isPassed = (cp.criteria || []).every(c => drillExecData[c.id]?.status === 'Pass');
                                                    const isChecked = (cp.criteria || []).every(c => drillExecData[c.id]?.status);
                                                    const isFailed = isChecked && !isChecked;
                                                    return(
                                                        <button key={cp.id} onClick={() => setActiveNodeId(cp.id)} 
                                                            className={`flex items-center gap-2 py-2 px-4 rounded-full transition-all border bg-slate-900/20 backdrop-blur-md ${isActive ? 'border-amber-300 shadow-lg shadow-amber-300/40' : 'border-amber-300/50 hover:shadow-md hover:shadow-amber-300/40'} ${isFailed ? 'animate-pulse' : ''}`}>
                                                            <CheckpointIcon className={`w-6 h-6 ${isChecked ? (isPassed ? 'text-emerald-400' : 'text-rose-400') : 'text-amber-400'}`} />
                                                            <span className="font-semibold text-amber-200">{cp.title}</span>
                                                        </button>
                                                    )
                                                 })}
                                                 <div className="flex-grow border-t border-dotted border-white/30"></div>
                                             </div>
                                        )
                                    })()}
                                    
                                    {levelIndex < workflowLevels.length - 1 && <WorkflowConnector />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Details Column (Frosted Glass) */}
                    <div className={`bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl h-fit sticky top-8 transition-all duration-300`}>
                        {!activeNode ? ( 
                            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-slate-500 mb-4"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="m12 14-4-4 4-4"/><path d="M16 10h-8"/></svg>
                                <p className="text-slate-400 font-medium">{t('selectScenarioToViewSteps')}</p>
                            </div>
                        ) : (
                            <div>
                                <h2 className={`text-xl font-bold mb-1 text-slate-200`}>{activeNode.name || activeNode.title}</h2>
                                <p className="text-sm text-slate-300 mb-4">
                                    {activeNode.type === 'scenario' ? t('stepsDetail', 'Chi tiết các bước') : t('criteriaDetail', 'Chi tiết các tiêu chí')}
                                </p>
                                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                    {(activeNode.type === 'scenario' ? (activeNode.steps || []) : (activeNode.criteria || [])).map((item) => {
                                        const isStep = activeNode.type === 'scenario';
                                        const itemId = item.id;
                                        const itemTitle = isStep ? item.title : item.criterion_text;
                                        const stats = isStep ? allStats[itemId] : null;
                                        
                                        if (isStep && !stats) return null;

                                        let statusContent;
                                        const userToDisplay = stats?.executor || stats?.assigned;
                                        const colorStyle = userToDisplay ? userColorMap[userToDisplay.id] : null;

                                        if (isStep) {
                                            statusContent = (
                                                <>
                                                    {userToDisplay && colorStyle ? (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colorStyle.bg} ${colorStyle.text}`}>
                                                            {userToDisplay.name}
                                                        </span>
                                                    ) : <span />}
                                                    <span className="font-mono text-slate-300">{stats.elapsedTime}</span>
                                                </>
                                            );
                                        } else {
                                            const state = drillExecData[itemId];
                                            const icon = state?.status === 'Pass' ? <CheckCircleIcon className="w-4 h-4 text-emerald-400"/> : (state?.status === 'Fail' ? <XCircleIcon className="w-4 h-4 text-rose-400"/> : <CheckCircleIcon className="w-4 h-4 text-slate-500"/>);
                                            const statusText = state?.status === 'Pass' ? t('passed') : (state?.status === 'Fail' ? t('failed') : t('pending'));
                                            statusContent = <span className={`flex items-center gap-1.5 font-sans font-medium ${state?.status === 'Pass' ? 'text-emerald-400' : state?.status === 'Fail' ? 'text-rose-400' : 'text-slate-400'}`}>{icon} {statusText}</span>;
                                        }

                                        return(
                                            <div key={itemId} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                <p className={`font-semibold font-sans text-slate-200`}>{isStep ? stats.statusIcon : ''} {itemTitle}</p>
                                                <div className="pl-6 mt-1.5 flex items-center justify-between text-xs text-slate-300">
                                                    {statusContent}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        )
    };
    
    // --- MAIN COMPONENT RENDER (Switches between Dark and Light themes) ---
    return (
        <div className={`min-h-screen font-sans p-4 sm:p-8 relative overflow-hidden bg-[#1D2A2E] text-gray-200`}>
            {/* Dark theme background overlays */}
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('https://s-vnba-cdn.aicms.vn/vnba-media/24/7/10/bidv_668e534202e24.jpg')` }} ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#1D2A2E]/50 to-[#1D2A2E]"></div>
            
            <header className="flex justify-between items-center mb-8 z-10 relative">
                <LogoIcon />
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setLanguage('vi')} className={`w-8 h-8 rounded-full overflow-hidden border-2 ${language === 'vi' ? 'border-amber-400' : 'border-transparent'}`}><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/1200px-Flag_of_Vietnam.svg.png" alt="Vietnamese" className="w-full h-full object-cover" /></button>
                        <button onClick={() => setLanguage('en')} className={`w-8 h-8 rounded-full overflow-hidden border-2 ${language === 'en' ? 'border-amber-400' : 'border-transparent'}`}><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg/1200px-Flag_of_the_United_Kingdom_%281-2%29.svg.png" alt="English" className="w-full h-full object-cover" /></button>
                    </div>
                    <button onClick={onLoginRequest} className={`text-white font-bold py-2 px-5 rounded-lg transition-all backdrop-blur-sm bg-gray-700/80 hover:bg-gray-600/80`}>
                        {t('loginButton')}
                    </button>
                </div>
            </header>
            <main className="relative z-10">
                {selectedDrill ? renderDrillDetails() : renderDrillList()}
            </main>
        </div>
    );
};
export default PublicDashboard;

