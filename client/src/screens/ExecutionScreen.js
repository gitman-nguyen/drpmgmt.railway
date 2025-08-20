import React, { useState, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { LockIcon, ClockIcon, ExternalLinkIcon } from '../components/icons';
import CompletionModal from '../components/common/CompletionModal';

// Hàm hỗ trợ để mở dữ liệu PDF trong một cửa sổ mới
const viewPdfInNewWindow = (pdfData, title) => {
    const newWindow = window.open("", title, "width=800,height=600,resizable,scrollbars");
    if (newWindow) {
        newWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                        iframe { border: none; }
                    </style>
                </head>
                <body>
                    <iframe src="${pdfData}" width="100%" height="100%"></iframe>
                </body>
            </html>
        `);
        newWindow.document.close();
    } else {
        alert('Vui lòng cho phép cửa sổ pop-up để xem tệp đính kèm.');
    }
};

const ScenarioDetail = ({ scenario, steps, getStepState, handleStepStart, setCompletionModal, onConfirm, drillExecData, scenarios: allScenarios }) => {
    const { t } = useTranslation();
    const scenarioSteps = scenario.steps.map(stepId => getStepState(stepId));
    const allStepsDone = scenarioSteps.every(s => s.status && s.status.startsWith('Completed'));
    const hasFailedStep = scenarioSteps.some(s => s.status === 'Completed-Failure' || s.status === 'Completed-Blocked');
    const isConfirmed = !!drillExecData[scenario.id]?.final_status;

    const [finalStatus, setFinalStatus] = useState('Failure-Confirmed');
    const [finalReason, setFinalReason] = useState('');

    const handleConfirm = () => {
        if (finalReason) {
            onConfirm(scenario.id, finalStatus, finalReason);
        } else {
            alert('Vui lòng nhập lý do xác nhận.');
        }
    };

    if (scenario.isLocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <LockIcon />
                <h3 className="text-xl font-bold text-gray-900 mt-4">{t('scenarioLocked')}</h3>
                <p className="text-gray-500">{t('scenarioLockedMessage', { scenarioName: scenario.dependsOn.map(depId => allScenarios[depId]?.name).join(', ') })}</p>
            </div>
        )
    }

    return (
        <div>
            <div className="space-y-3">
                {scenario.steps.map(stepId => {
                    const step = steps[stepId];
                    if (!step) return null;
                    const state = getStepState(stepId);
                    let statusIcon = '🕒'; let borderColor = 'border-gray-300';
                    if (state.status === 'InProgress') { statusIcon = '▶️'; borderColor = 'border-blue-500'; }
                    if (state.status === 'Completed-Success') { statusIcon = '✅'; borderColor = 'border-green-500'; }
                    if (state.status === 'Completed-Failure' || state.status === 'Completed-Blocked') { statusIcon = '❌'; borderColor = 'border-red-500'; }

                    return (
                        <div key={stepId} className={`p-4 rounded-lg border-l-4 bg-gray-50 ${borderColor} ${state.status?.includes('Failure') || state.status?.includes('Blocked') ? 'bg-red-50' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-lg text-gray-900">{statusIcon} {step.title}</h4>
                                        {step.estimated_time && <span className="text-sm text-gray-500 ml-4 flex items-center"><ClockIcon />{step.estimated_time}</span>}
                                    </div>
                                    <div className="prose prose-sm mt-2 max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: step.description }} />
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    {state.status === 'Pending' && <button onClick={() => handleStepStart(stepId)} className="bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-blue-600">{t('start')}</button>}
                                    {state.status === 'InProgress' && <button onClick={() => setCompletionModal({ stepId })} className="bg-green-500 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-green-600">{t('complete')}</button>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {allStepsDone && hasFailedStep && !isConfirmed && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-bold text-red-600">{t('confirmScenarioResult')}</h3>
                    <p className="text-sm text-gray-600 mb-2">{t('confirmScenarioResultMessage')}</p>
                     <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700">{t('finalResult')}</label>
                        <select value={finalStatus} onChange={(e) => setFinalStatus(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                            <option value="Failure-Confirmed">{t('failureConfirmed')}</option>
                            <option value="Success-Overridden">{t('successOverridden')}</option>
                        </select>
                    </div>
                    <textarea value={finalReason} onChange={(e) => setFinalReason(e.target.value)} rows="3" className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none" placeholder={t('reasonPlaceholder')}></textarea>
                    <button onClick={handleConfirm} className="mt-2 bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500">{t('confirmResult')}</button>
                </div>
            )}
            {isConfirmed && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                     <h3 className="text-lg font-bold text-green-600">{t('resultConfirmed')}</h3>
                </div>
            )}
        </div>
    );
};

const ExecutionScreen = ({ user, drill, onBack, scenarios, steps, executionData, onExecutionUpdate, onDataRefresh }) => {
    const { t } = useTranslation();
    const [activeScenarioId, setActiveScenarioId] = useState(null);
    const [completionModal, setCompletionModal] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    const handleMouseMove = (e) => {
        setTooltip(prev => ({ ...prev, x: e.clientX + 15, y: e.clientY + 15 }));
    };

    const handleMouseEnter = (content, e) => {
        setTooltip({ visible: true, content, x: e.clientX + 15, y: e.clientY + 15 });
    };

    const handleMouseLeave = () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 });
    };

    const getScenarioStatus = (scenario) => {
        if (!scenario || !scenario.steps || scenario.steps.length === 0) {
            return 'Pending';
        }
        const drillExecution = executionData[drill.id] || {};
        
        let hasInProgress = false;
        let allCompleted = true;

        for (const stepId of scenario.steps) {
            const stepState = drillExecution[stepId];
            if (stepState?.status === 'InProgress') {
                hasInProgress = true;
                break;
            }
            if (!stepState?.status?.startsWith('Completed')) {
                allCompleted = false;
            }
        }

        if (hasInProgress) return 'InProgress';
        if (allCompleted) return 'Completed';
        return 'Pending';
    };

    const areDependenciesMet = (item, execData, allItems) => {
        if (!item.dependsOn || item.dependsOn.length === 0) {
            return true;
        }
        return item.dependsOn.every(depId => {
            const dependency = allItems[depId];
            if (!dependency) return false;
            
            return dependency.steps.every(stepId => (execData[stepId]?.status?.startsWith('Completed') || execData[depId]?.final_status?.startsWith('Success-Overridden')));
        });
    };

    const scenariosWithLockStatus = useMemo(() => drill.scenarios
        .map(item => {
            const scenario = scenarios[item.id];
            if (!scenario) return null;
            const isLocked = !areDependenciesMet(item, executionData[drill.id] || {}, scenarios);
            const executionStatus = getScenarioStatus(scenario);
            return { ...scenario, dependsOn: item.dependsOn, isLocked, executionStatus };
        })
        .filter(s => s && (!user.role || user.role === 'ADMIN' || s.role === user.role)), 
    [drill.scenarios, scenarios, executionData, user.role]);

    const workflowLevels = useMemo(() => {
        if (scenariosWithLockStatus.length === 0) return [];

        const nodes = {};
        const adj = {};
        const inDegree = {};

        scenariosWithLockStatus.forEach(s => {
            nodes[s.id] = s;
            adj[s.id] = [];
            inDegree[s.id] = 0;
        });

        scenariosWithLockStatus.forEach(s => {
            s.dependsOn.forEach(depId => {
                if (adj[depId]) {
                    adj[depId].push(s.id);
                    inDegree[s.id]++;
                }
            });
        });

        const queue = Object.keys(nodes).filter(id => inDegree[id] === 0);
        const levels = [];
        let levelIndex = 1;

        while (queue.length > 0) {
            const levelSize = queue.length;
            const currentLevel = [];
            for (let i = 0; i < levelSize; i++) {
                const u = queue.shift();
                currentLevel.push({ ...nodes[u], level: levelIndex });
                adj[u].forEach(v => {
                    inDegree[v]--;
                    if (inDegree[v] === 0) {
                        queue.push(v);
                    }
                });
            }
            levels.push(currentLevel);
            levelIndex++;
        }
        return levels;
    }, [scenariosWithLockStatus]);

    const activeScenario = activeScenarioId ? scenariosWithLockStatus.find(s => s.id === activeScenarioId) : null;

    const updateExecutionStep = async (payload, isCompletion = false) => {
        try {
            const response = await fetch('/api/execution/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to update step');
            const updatedStep = await response.json();
            onExecutionUpdate(drill.id, updatedStep.step_id, updatedStep);

            if (isCompletion && updatedStep.status.startsWith('Completed')) {
                const completedStepId = updatedStep.step_id;
                const scenario = scenarios[activeScenarioId];
                if (scenario) {
                    for (const nextStepId of scenario.steps) {
                        const nextStep = steps[nextStepId];
                        const isPending = !(executionData[drill.id]?.[nextStepId]);
                        if (isPending && nextStep.dependsOn?.includes(completedStepId)) {
                            const allDepsMet = nextStep.dependsOn.every(depId => {
                                const depState = (depId === completedStepId) ? updatedStep : executionData[drill.id]?.[depId];
                                return depState?.status?.startsWith('Completed');
                            });
                            if (allDepsMet) {
                                handleStepStart(nextStepId);
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error(error);
            alert('Lỗi cập nhật bước thực thi.');
        }
    };

    const handleStepStart = (stepId) => {
        updateExecutionStep({
            drill_id: drill.id,
            step_id: stepId,
            status: 'InProgress',
            started_at: new Date().toISOString(),
            assignee: user.name
        });
    };

    const handleStepComplete = (stepId, result) => {
        const currentStepState = executionData[drill.id]?.[stepId] || {};
        updateExecutionStep({
            drill_id: drill.id,
            step_id: stepId,
            status: result.status,
            completed_at: new Date().toISOString(),
            result_text: result.text,
            started_at: currentStepState.started_at, 
            assignee: currentStepState.assignee,
        }, true);
        setCompletionModal(null);
    };
    
    const handleScenarioConfirmation = async (scenId, finalStatus, finalReason) => {
        try {
            const response = await fetch('/api/execution/scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drill_id: drill.id,
                    scenario_id: scenId,
                    final_status: finalStatus,
                    final_reason: finalReason
                })
            });
            if (!response.ok) throw new Error('Failed to confirm scenario');
            const confirmedScenario = await response.json();
            onExecutionUpdate(drill.id, confirmedScenario.scenario_id, confirmedScenario);
        } catch (error) {
            console.error(error);
            alert('Lỗi xác nhận kịch bản.');
        }
    };

    const getStepState = (stepId) => executionData[drill.id]?.[stepId] || { status: 'Pending' };

    return (
        <>
            {tooltip.visible && (
                <div
                    className="fixed bg-gray-800 text-white text-sm rounded-md p-2 z-50 pointer-events-none max-w-xs"
                    style={{ top: tooltip.y, left: tooltip.x }}
                >
                    {tooltip.content}
                </div>
            )}
            <div className="flex flex-col gap-6">
                <button onClick={onBack} className="text-[#00558F] hover:underline self-start">&larr; {t('backToDashboard')}</button>
                
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">{t('scenarios')}</h2>
                    <div className="flex items-center overflow-x-auto p-4 min-w-full">
                        {workflowLevels.map((level, levelIndex) => (
                            <React.Fragment key={levelIndex}>
                                <div className="flex flex-col items-center justify-center gap-4 flex-shrink-0 mx-6">
                                    {level.map((scen) => {
                                        const isSelected = activeScenarioId === scen.id;
                                        const isInProgress = scen.executionStatus === 'InProgress';
                                        const isCompleted = scen.executionStatus === 'Completed';
                                        let highlightClass = '';
                                        if (isSelected) highlightClass = 'bg-sky-100 border-[#00558F]';
                                        if (isInProgress) highlightClass += ' animate-pulse ring-2 ring-offset-4 ring-blue-500';

                                        return (
                                            <div key={scen.id} className="flex items-center">
                                                <div className={`flex items-center justify-center w-8 h-8 text-white font-bold rounded-full mr-2 flex-shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-gray-400'}`}>
                                                    {scen.level}
                                                </div>
                                                <button 
                                                    onClick={() => setActiveScenarioId(scen.id)} 
                                                    disabled={scen.isLocked} 
                                                    className={`w-48 h-full text-left p-2 rounded-lg border transition-all duration-200 ${highlightClass} ${isSelected ? '' : 'bg-gray-50 border-gray-200 hover:border-gray-400'} ${scen.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    onMouseEnter={(e) => handleMouseEnter(scen.name, e)}
                                                    onMouseMove={handleMouseMove}
                                                    onMouseLeave={handleMouseLeave}
                                                >
                                                    <h4 className="font-semibold text-sm text-gray-900 flex items-center truncate">
                                                        {scen.isLocked && <LockIcon />}
                                                        {isCompleted && <span className="text-green-500 mr-1">✓</span>}
                                                        {scen.name}
                                                    </h4>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${scen.role === 'TECHNICAL' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>{scen.role}</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {levelIndex < workflowLevels.length - 1 && (
                                    <div className="flex items-center h-full self-center">
                                        <svg className="w-16 h-8 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {activeScenario ? (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{activeScenario.name}</h2>
                        <div className={`grid grid-cols-1 ${activeScenario.attachment && activeScenario.attachment.data ? 'xl:grid-cols-2 gap-6' : ''}`}>
                            {activeScenario.attachment && activeScenario.attachment.data && (
                                <div className="bg-gray-100 p-4 rounded-lg flex flex-col h-[75vh]">
                                     <div className="flex justify-between items-center mb-2 flex-shrink-0">
                                        <h3 className="font-bold text-gray-800">Tài liệu đính kèm</h3>
                                        <button 
                                            onClick={() => viewPdfInNewWindow(activeScenario.attachment.data, activeScenario.attachment.name)}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <ExternalLinkIcon />
                                            <span className="ml-2">{t('viewLarger', 'Xem lớn hơn')}</span> 
                                        </button>
                                    </div>
                                    <div className="flex-grow border border-gray-300 rounded">
                                        <iframe src={activeScenario.attachment.data} width="100%" height="100%" title={activeScenario.attachment.name}></iframe>
                                    </div>
                                </div>
                            )}
                            <div>
                                <ScenarioDetail 
                                    scenario={activeScenario}
                                    steps={steps}
                                    getStepState={getStepState}
                                    handleStepStart={handleStepStart}
                                    setCompletionModal={setCompletionModal}
                                    onConfirm={handleScenarioConfirmation}
                                    drillExecData={executionData[drill.id] || {}}
                                    scenarios={scenarios}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center min-h-[200px]">
                        <p className="text-gray-500">{t('selectScenarioToViewSteps')}</p>
                    </div>
                )}
            </div>
            {completionModal && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <CompletionModal 
                        step={steps[completionModal.stepId]} 
                        onComplete={(result) => handleStepComplete(completionModal.stepId, result)}
                        onClose={() => setCompletionModal(null)}
                    />
                </div>
            )}
        </>
    );
};
export default ExecutionScreen;
