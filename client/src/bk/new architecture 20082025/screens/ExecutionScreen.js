import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { LockIcon, ClockIcon } from '../components/icons';
import CompletionModal from '../components/common/CompletionModal';

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
        const dependencyName = scenario.dependsOn.map(depId => allScenarios[depId]?.name).join(', ');
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <LockIcon />
                <h3 className="text-xl font-bold text-gray-900 mt-4">{t('scenarioLocked')}</h3>
                <p className="text-gray-500">{t('scenarioLockedMessage', { scenarioName: dependencyName })}</p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{scenario.name}</h2>
            <div className="space-y-3">
                {scenario.steps.map(stepId => {
                    const step = steps[stepId];
                    if (!step) return null; // Guard against missing step data
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

    const areDependenciesMet = (item, execData, allItems) => {
        if (!item.dependsOn || item.dependsOn.length === 0) {
            return true;
        }
        return item.dependsOn.every(depId => {
            const dependency = allItems[depId];
            if (!dependency) return false;
            
            return dependency.steps.every(stepId => execData[stepId]?.status?.startsWith('Completed'));
        });
    };

    const userRole = user.role === 'ADMIN' ? null : user.role;
    const scenariosWithLockStatus = drill.scenarios
        .map(item => {
            const scenario = scenarios[item.id];
            if (!scenario) return null;
            const isLocked = !areDependenciesMet(item, executionData[drill.id] || {}, scenarios);
            return { ...scenario, dependsOn: item.dependsOn, isLocked };
        })
        .filter(s => s && (!userRole || s.role === userRole));

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
            <div>
                <button onClick={onBack} className="text-[#00558F] hover:underline mb-4">&larr; {t('backToDashboard')}</button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-lg">
                        <h2 className="text-lg font-bold text-gray-900 mb-3">{t('scenarios')}</h2>
                        <div className="space-y-2">
                            {scenariosWithLockStatus.map(scen => (
                                <button key={scen.id} onClick={() => setActiveScenarioId(scen.id)} disabled={scen.isLocked} className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${activeScenarioId === scen.id ? 'bg-sky-100 border-[#00558F]' : 'bg-gray-50 border-gray-200 hover:border-gray-400'} ${scen.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <h4 className="font-semibold text-gray-900 flex items-center">{scen.isLocked && <LockIcon />}{scen.name}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${scen.role === 'TECHNICAL' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>{scen.role}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                        {activeScenario ? (
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
                        ) : (
                            <div className="flex items-center justify-center h-full"><p className="text-gray-500">{t('selectScenarioToViewSteps')}</p></div>
                        )}
                    </div>
                </div>
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
