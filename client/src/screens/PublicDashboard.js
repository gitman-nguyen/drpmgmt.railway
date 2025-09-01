import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { LogoIcon, UserIcon, CheckpointIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../components/icons';

const PieChart = ({ percentage, size = 80, strokeWidth = 8, colorClass = 'text-yellow-400' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox={`0 0 ${size} ${size}`}>
                <circle className="text-gray-600" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
                <circle className={colorClass} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">{`${Math.round(percentage)}%`}</span>
        </div>
    );
};

const userColorClasses = [
    { bg: 'bg-blue-200/50', text: 'text-blue-100' }, { bg: 'bg-green-200/50', text: 'text-green-100' },
    { bg: 'bg-yellow-200/50', text: 'text-yellow-100' }, { bg: 'bg-pink-200/50', text: 'text-pink-100' },
    { bg: 'bg-indigo-200/50', text: 'text-indigo-100' }, { bg: 'bg-teal-200/50', text: 'text-teal-100' },
    { bg: 'bg-red-200/50', text: 'text-red-100' }, { bg: 'bg-cyan-200/50', text: 'text-cyan-100' },
    { bg: 'bg-purple-200/50', text: 'text-purple-100' }, { bg: 'bg-orange-200/50', text: 'text-orange-100' },
];

const simpleHash = (str) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
    return Math.abs(hash);
};


const PublicDashboard = ({ drills, scenarios, steps, executionData, users, onLoginRequest }) => {
    const { t, language, setLanguage } = useTranslation();
    const [selectedDrill, setSelectedDrill] = useState(null);
    const [activeNodeId, setActiveNodeId] = useState(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const userColorMap = useMemo(() => {
        const map = {};
        if (users && users.length > 0) { users.forEach(u => { map[u.id] = userColorClasses[simpleHash(u.id) % userColorClasses.length]; }); }
        return map;
    }, [users]);
    
    const formatDuration = (ms) => {
        if (ms < 0) ms = 0;
        const s = Math.floor((ms / 1000) % 60), m = Math.floor((ms / (1000 * 60)) % 60), h = Math.floor((ms / (1000 * 60 * 60)) % 24), d = Math.floor(ms / (1000 * 60 * 60 * 24));
        const parts = [];
        if (d > 0) parts.push(`${d}d`); if (h > 0) parts.push(`${h}h`); if (m > 0) parts.push(`${m}m`); if (s >= 0) parts.push(`${s}s`);
        return parts.length > 0 ? parts.join(' ') : '0s';
    };
    
    const { workflowLevels, allNodes, allStats } = useMemo(() => {
        if (!selectedDrill) return { workflowLevels: [], allNodes: {}, allStats: {} };
    
        const drillExecData = executionData[selectedDrill.id] || {};
        const stats = {};

        Object.values(steps).forEach(step => {
            if (!step) return;
            const state = drillExecData[step.id];
            let elapsedTime = '—', executor = null, assigned = null, statusText = t('pending'), statusIcon = '🕒', statusColor = 'text-gray-400';
            
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
            
            if (state?.status === 'InProgress') { statusText = t('inProgress'); statusIcon = '▶️'; statusColor = 'text-blue-400'; }
            else if (state?.status === 'Completed-Success') { statusText = t('success'); statusIcon = '✅'; statusColor = 'text-green-400'; }
            else if (state?.status?.startsWith('Completed-')) { statusText = t('failure'); statusIcon = '❌'; statusColor = 'text-red-400'; }
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
        const allScenariosInDrill = drill.scenarios.map(s => scenarios[s.id]).filter(Boolean);
        const allCheckpointsInDrill = Object.values(drill.checkpoints || {});
        const allItems = [...allScenariosInDrill.flatMap(s => s.steps || []), ...allCheckpointsInDrill.flatMap(c => c.criteria?.map(crit => crit.id) || [])];
        if (allItems.length === 0) return 0;
        const drillExecData = executionData[drill.id] || {};
        const completedItems = allItems.filter(id => drillExecData[id]?.status?.startsWith('Completed') || drillExecData[id]?.status === 'Pass');
        return (completedItems.length / allItems.length) * 100;
    };

    const inProgressDrills = drills.filter(d => d.execution_status === 'InProgress');

    const renderDrillList = () => (
        <div className="w-full max-w-4xl mx-auto z-10 relative">
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">{t('publicDashboardTitle')}</h1>
            {inProgressDrills.length > 0 ? (
                <div className="space-y-4">
                    {inProgressDrills.map(drill => (
                        <div key={drill.id} className="bg-gradient-to-br from-[#2A3A3F]/80 to-[#1E292D]/80 p-6 rounded-2xl border border-[#3D4F56] hover:border-yellow-400/50 transition-all duration-300 backdrop-blur-sm shadow-2xl shadow-black/30">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div className="flex-grow">
                                    <h2 className="text-xl font-bold text-white">{drill.name}</h2>
                                    <p className="text-gray-400 mt-1">{drill.description}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                     <PieChart percentage={calculateOverallProgress(drill)} size={60} strokeWidth={6} />
                                    <button onClick={() => { setSelectedDrill(drill); setActiveNodeId(null); }} className="flex-shrink-0 bg-yellow-400 text-black font-bold py-2 px-5 rounded-lg hover:bg-yellow-300 transition-all">
                                        {t('viewProgress')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-[#2A3A3F]/60 rounded-2xl">
                    <p className="text-gray-400 text-lg">{t('noActiveDrills')}</p>
                </div>
            )}
        </div>
    );

    const renderDrillDetails = () => {
        const drillExecData = executionData[selectedDrill.id] || {};
        const overallProgress = calculateOverallProgress(selectedDrill);
        const activeNode = activeNodeId ? allNodes[activeNodeId] : null;
        const totalElapsedTime = selectedDrill.opened_at ? formatDuration(now - new Date(selectedDrill.opened_at).getTime()) : '—';

        return (
             <div className="w-full max-w-7xl mx-auto z-10 relative">
                <button onClick={() => setSelectedDrill(null)} className="text-yellow-300 hover:underline mb-6 text-lg">&larr; {t('backToList')}</button>
                
                <div className="bg-[#2A3A3F]/80 p-6 rounded-2xl border border-[#3D4F56] backdrop-blur-sm mb-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0"><PieChart percentage={overallProgress} size={120} strokeWidth={10}/></div>
                    <div className="flex-grow text-center md:text-left">
                         <h1 className="text-3xl font-bold text-white">{selectedDrill.name}</h1>
                         <p className="text-gray-400 mt-1">{selectedDrill.description}</p>
                         <div className="mt-2 flex items-center justify-center md:justify-start gap-2 text-gray-300">
                            <ClockIcon className="w-5 h-5" />
                            <span className="font-semibold">{t('totalTime')}:</span>
                            <span className="font-mono">{totalElapsedTime}</span>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#2A3A3F]/80 p-6 rounded-2xl border border-[#3D4F56] backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-4 text-center">{t('scenarioProgress')}</h2>
                        <div className="flex flex-col items-center gap-0 p-2">
                             {workflowLevels.map((level, levelIndex) => (
                                <React.Fragment key={levelIndex}>
                                    <div className="flex flex-row flex-wrap justify-center items-stretch gap-6">
                                        {level.map(node => {
                                            const isActive = activeNodeId === node.id;
                                            const progress = (node.steps || []).length > 0 ? (node.steps.filter(stepId => drillExecData[stepId]?.status?.startsWith('Completed')).length / node.steps.length) * 100 : 100;
                                            return (
                                                <button key={node.id} onClick={() => setActiveNodeId(node.id)} className={`w-64 p-3 rounded-lg text-left transition-all duration-200 border-2 ${isActive ? 'bg-sky-900/50 border-sky-400' : 'bg-[#3D4F56]/50 border-transparent hover:border-sky-600'}`}>
                                                    <div className="flex items-center gap-4"><div className="flex-shrink-0"><PieChart percentage={progress} size={50} strokeWidth={5} colorClass="text-sky-400" /></div><div className="flex-grow min-w-0"><h3 className="font-bold text-white text-md truncate">{node.name}</h3></div></div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {(() => {
                                        const checkpointsForLevel = level.map(n => n.checkpoint).filter(Boolean);
                                        if (checkpointsForLevel.length === 0) return null;
                                        return (
                                            <div className="w-full flex justify-center items-center my-4 gap-4">
                                                 <div className="h-px flex-grow bg-gray-600"></div>
                                                 {checkpointsForLevel.map(cp => {
                                                    const isActive = activeNodeId === cp.id;
                                                    const isPassed = (cp.criteria || []).every(c => drillExecData[c.id]?.status === 'Pass');
                                                    const isChecked = (cp.criteria || []).every(c => drillExecData[c.id]?.status);
                                                    const isFailed = isChecked && !isPassed;
                                                    return(
                                                        <button key={cp.id} onClick={() => setActiveNodeId(cp.id)} className={`flex items-center gap-2 p-2 rounded-full transition-all border-2 ${isActive ? 'bg-yellow-900/50 border-yellow-400' : 'bg-[#3D4F56]/50 border-transparent hover:border-yellow-600'} ${isFailed ? 'animate-pulse ring-2 ring-red-500 shadow-[0_0_15px_rgba(255,50,50,0.7)]' : ''}`}>
                                                            <CheckpointIcon className={`w-6 h-6 ${isChecked ? (isPassed ? 'text-green-400' : 'text-red-400') : 'text-yellow-400'}`} />
                                                            <span className="font-semibold text-yellow-300 pr-2">{cp.title}</span>
                                                        </button>
                                                    )
                                                 })}
                                                 <div className="h-px flex-grow bg-gray-600"></div>
                                             </div>
                                        )
                                    })()}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#2A3A3F]/80 p-6 rounded-2xl border border-[#3D4F56] backdrop-blur-sm">
                        {!activeNode ? ( <div className="flex items-center justify-center h-full text-center"><p className="text-gray-400">{t('selectScenarioToViewSteps')}</p></div>) : 
                        (<div>
                            <h2 className="text-xl font-bold text-yellow-300 mb-4">{activeNode.name || activeNode.title}</h2>
                            <div className="space-y-3">
                                {(activeNode.type === 'scenario' ? (activeNode.steps || []) : (activeNode.criteria || [])).map((item) => {
                                    const isStep = activeNode.type === 'scenario';
                                    const itemId = isStep ? item : item.id;
                                    const itemTitle = isStep ? steps[itemId]?.title : item.criterion_text;
                                    const stats = allStats[itemId];
                                    
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
                                                <span className="font-mono">{stats.elapsedTime}</span>
                                            </>
                                        );
                                    } else {
                                        const state = drillExecData[itemId];
                                        const icon = state?.status === 'Pass' ? <CheckCircleIcon className="w-4 h-4 text-green-400"/> : (state?.status === 'Fail' ? <XCircleIcon className="w-4 h-4 text-red-400"/> : <CheckCircleIcon className="w-4 h-4 text-gray-500"/>);
                                        const statusText = state?.status === 'Pass' ? t('passed') : (state?.status === 'Fail' ? t('failed') : t('pending'));
                                        statusContent = <span className="flex items-center gap-1.5 font-sans">{icon} {statusText}</span>;
                                    }

                                    return(
                                        <div key={itemId} className="p-3 rounded-lg bg-[#22333B]/50">
                                            <p className={`font-semibold font-sans ${isStep ? stats.statusColor : 'text-white'}`}>{isStep ? stats.statusIcon : ''} {itemTitle}</p>
                                            <div className="pl-6 mt-1 flex items-center justify-between text-xs text-gray-400">
                                                {statusContent}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>)
                        }
                    </div>
                </div>
             </div>
        )
    };

    return (
        <div className="min-h-screen bg-[#1D2A2E] text-gray-200 font-sans p-4 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url('https://www.tuv.com/content-media-files/master-content/services/management-systems/iso-22301/iso-22301-business-continuity-management-tuv-rheinland.jpg')` }} ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#1D2A2E]/50 to-[#1D2A2E]"></div>
            
            <header className="flex justify-between items-center mb-8 z-10 relative">
                <LogoIcon />
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setLanguage('vi')} className={`w-8 h-8 rounded-full overflow-hidden border-2 ${language === 'vi' ? 'border-yellow-400' : 'border-transparent'}`}><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/1200px-Flag_of_Vietnam.svg.png" alt="Vietnamese" className="w-full h-full object-cover" /></button>
                        <button onClick={() => setLanguage('en')} className={`w-8 h-8 rounded-full overflow-hidden border-2 ${language === 'en' ? 'border-yellow-400' : 'border-transparent'}`}><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg/1200px-Flag_of_the_United_Kingdom_%281-2%29.svg.png" alt="English" className="w-full h-full object-cover" /></button>
                    </div>
                    <button onClick={onLoginRequest} className="bg-gray-700 text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-600 transition-all">
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

