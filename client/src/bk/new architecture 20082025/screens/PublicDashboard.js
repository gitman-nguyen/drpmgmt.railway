import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { LogoIcon } from '../components/icons';

const PublicDashboard = ({ drills, scenarios, steps, executionData, onLoginRequest }) => {
    const { t, language, setLanguage } = useTranslation();
    const [selectedDrill, setSelectedDrill] = useState(null);
    const [expandedScenarios, setExpandedScenarios] = useState([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleScenario = (scenarioId) => {
        setExpandedScenarios(prev =>
            prev.includes(scenarioId)
                ? prev.filter(id => id !== scenarioId)
                : [...prev, scenarioId]
        );
    };

    const formatDuration = (ms) => {
        if (ms < 0) ms = 0;
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds >= 0) parts.push(`${seconds}s`);
        
        return parts.length > 0 ? parts.join(' ') : '0s';
    };

    const calculateScenarioStats = (scenario, drillExecData) => {
        if (!scenario || !scenario.steps) return { status: t('pending'), elapsedTime: '0s', progress: 0 };
        const scenarioSteps = scenario.steps.map(stepId => ({ ...steps[stepId], state: drillExecData[stepId] || {} }));
        if (scenarioSteps.length === 0) {
            return { status: t('pending'), elapsedTime: '0s', progress: 0 };
        }

        const stepStates = scenarioSteps.map(s => s.state);
        const completedSteps = stepStates.filter(s => s.status?.startsWith('Completed'));
        const inProgressSteps = stepStates.filter(s => s.status === 'InProgress');
        
        const progress = (completedSteps.length / scenarioSteps.length) * 100;

        let status = t('pending');
        if (inProgressSteps.length > 0) {
            status = t('inProgress');
        } else if (completedSteps.length === scenarioSteps.length) {
            status = t('completed');
        } else if (completedSteps.length > 0) {
            status = t('inProgress');
        }

        const startTimes = stepStates.map(s => s.started_at ? new Date(s.started_at).getTime() : Infinity);
        const earliestStart = Math.min(...startTimes);

        let elapsedTime = '—';
        if (earliestStart !== Infinity) {
            if (status === t('completed')) {
                const endTimes = completedSteps.map(s => s.completed_at ? new Date(s.completed_at).getTime() : -Infinity);
                const latestEnd = Math.max(...endTimes);
                elapsedTime = formatDuration(latestEnd - earliestStart);
            } else {
                elapsedTime = formatDuration(now - earliestStart);
            }
        }

        return { status, elapsedTime, progress };
    };

    const inProgressDrills = drills.filter(d => d.execution_status === 'InProgress');

    const calculateOverallProgress = (drill) => {
        const drillExecData = executionData[drill.id] || {};
        const allStepsInDrill = drill.scenarios.flatMap(s => scenarios[s.id]?.steps || []);
        if (allStepsInDrill.length === 0) return 0;

        const completedSteps = allStepsInDrill.filter(stepId => {
            const stepState = drillExecData[stepId];
            return stepState?.status?.startsWith('Completed');
        });

        return (completedSteps.length / allStepsInDrill.length) * 100;
    };
    
    const getStepStatus = (drillExecData, stepId) => {
        const state = drillExecData[stepId];
        let elapsedTime = '—';

        if (state?.started_at) {
            const startTime = new Date(state.started_at).getTime();
            if (state.completed_at) {
                const endTime = new Date(state.completed_at).getTime();
                elapsedTime = formatDuration(endTime - startTime);
            } else {
                elapsedTime = formatDuration(now - startTime);
            }
        }

        if (!state || !state.status) return { text: t('pending'), color: 'gray-500', icon: '🕒', elapsedTime };
        if (state.status === 'InProgress') return { text: t('inProgress'), color: 'blue-500', icon: '▶️', elapsedTime };
        if (state.status === 'Completed-Success') return { text: t('success'), color: 'green-500', icon: '✅', elapsedTime };
        if (state.status.startsWith('Completed-')) return { text: t('failure'), color: 'red-500', icon: '❌', elapsedTime };
        return { text: t('pending'), color: 'gray-500', icon: '🕒', elapsedTime };
    };


    const renderDrillList = () => (
        <div className="w-full max-w-4xl mx-auto z-10 relative">
            <h1 className="text-3xl font-bold text-white text-center mb-8">{t('publicDashboardTitle')}</h1>
            {inProgressDrills.length > 0 ? (
                <div className="space-y-4">
                    {inProgressDrills.map(drill => {
                        const progress = calculateOverallProgress(drill);
                        return (
                            <div key={drill.id} className="bg-[#2A3A3F]/80 p-6 rounded-xl border border-[#3D4F56] hover:border-yellow-400/50 transition-all duration-300 backdrop-blur-sm">
                                <div className="flex flex-col md:flex-row justify-between md:items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{drill.name}</h2>
                                        <p className="text-gray-400 mt-1">{drill.description}</p>
                                    </div>
                                    <button onClick={() => setSelectedDrill(drill)} className="mt-4 md:mt-0 flex-shrink-0 bg-yellow-400 text-black font-bold py-2 px-5 rounded-lg hover:bg-yellow-300 transition-all">
                                        {t('viewProgress')}
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-300">{t('overallProgress')}</span>
                                        <span className="text-sm font-bold text-yellow-300">{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-500">{t('noActiveDrills')}</p>
            )}
        </div>
    );

    const renderDrillDetails = () => {
        const drillExecData = executionData[selectedDrill.id] || {};
        return (
             <div className="w-full max-w-5xl mx-auto z-10 relative">
                <button onClick={() => setSelectedDrill(null)} className="text-yellow-300 hover:underline mb-4">&larr; {t('backToList')}</button>
                <h1 className="text-3xl font-bold text-white mb-2">{selectedDrill.name}</h1>
                <p className="text-gray-400 mb-6">{selectedDrill.description}</p>
                <div className="space-y-4">
                    {selectedDrill.scenarios.map(scenItem => {
                        const scenario = scenarios[scenItem.id];
                        if (!scenario) return null;
                        const stats = calculateScenarioStats(scenario, drillExecData);
                        const isExpanded = expandedScenarios.includes(scenario.id);
                        return (
                            <div key={scenario.id} className="bg-[#2A3A3F]/80 rounded-xl border border-[#3D4F56] backdrop-blur-sm">
                                <div className="p-4 cursor-pointer" onClick={() => toggleScenario(scenario.id)}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <h3 className="text-xl font-bold text-yellow-300">{scenario.name}</h3>
                                            <span className="ml-4 text-sm font-bold text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded-md">{stats.progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-sm text-gray-300">{stats.status}</span>
                                            <span className="text-sm font-mono text-gray-400">{t('elapsedTime')}: {stats.elapsedTime}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                                        <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${stats.progress}%` }}></div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-[#3D4F56] p-4 space-y-2">
                                        {scenario.steps.map((stepId, index) => {
                                            const step = steps[stepId];
                                            if (!step) return null;
                                            const status = getStepStatus(drillExecData, stepId);
                                            return (
                                                <div key={stepId} className={`p-3 rounded-lg border-l-4 bg-[#22333B]/50 border-${status.color}`}>
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold text-white">{status.icon} {t('step')} {index + 1}: {step.title}</p>
                                                        <div className="flex items-center space-x-3 text-sm">
                                                            <span className={`font-semibold text-${status.color}`}>{status.text}</span>
                                                            <span className="font-mono text-gray-400">{status.elapsedTime}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
             </div>
        )
    };

    return (
        <div className="min-h-screen bg-[#1D2A2E] text-gray-200 font-sans p-4 sm:p-8 relative overflow-hidden">
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('https://bidv.com.vn/wps/wcm/connect/bbf3c0fb-f27c-4ad7-a6c5-1f79ac6651de/banner_new+dkvtt.jpg?MOD=AJPERES&CACHEID=ROOTWORKSPACE-bbf3c0fb-f27c-4ad7-a6c5-1f79ac6651de-oabZB2q')` }}
            ></div>
            <div className="absolute inset-0 bg-black/75"></div>

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
