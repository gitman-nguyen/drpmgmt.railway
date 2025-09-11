import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { LockIcon, ClockIcon, ExternalLinkIcon, UserIcon, CheckpointIcon, CheckCircleIcon, XCircleIcon, LinkIcon } from '../components/icons';
import CompletionModal from '../components/common/CompletionModal';

// --- ICONS & HELPERS ---
const WorkflowConnector = () => (
    <div className="mx-4 self-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    </div>
);

const ScenarioSubLevelConnector = () => (
    <div className="mx-2 self-center text-sky-500/70">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
            <path d="M11 17L16 12L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 17L12 12L7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 17L8 12L3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);

const viewPdfInNewWindow = (pdfDataUri, title) => {
    if (!pdfDataUri) return;
    const newWindow = window.open("", title, "width=800,height=600,resizable,scrollbars");
    if (newWindow) {
        newWindow.document.write(`
            <html>
                <head><title>${title || 'PDF Viewer'}</title><style>body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; } iframe { border: none; }</style></head>
                <body><iframe src="${pdfDataUri}" width="100%" height="100%"></iframe></body>
            </html>
        `);
        newWindow.document.close();
    } else {
        alert('Vui lòng cho phép cửa sổ pop-up để xem tệp đính kèm.');
    }
};

const userColorClasses = [
    { bg: 'bg-blue-100', text: 'text-blue-800' }, { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800' }, { bg: 'bg-pink-100', text: 'text-pink-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' }, { bg: 'bg-teal-100', text: 'text-teal-800' },
    { bg: 'bg-red-100', text: 'text-red-800' }, { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' }, { bg: 'bg-orange-100', text: 'text-orange-800' },
];

const simpleHash = (str) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
    return Math.abs(hash);
};

// Đã thêm: Component mới cho cột mốc checkpoint
const CheckpointMilestone = ({ checkpoint, onClick, activeNodeId }) => {
    const isThisCheckpointSelected = activeNodeId === checkpoint.id;
    const isCompleted = checkpoint.executionStatus === 'Completed';
    const isPassed = isCompleted && checkpoint.isPassed;
    const isFailed = isCompleted && !isPassed;

    let lineColor = 'bg-gray-300';
    if (isPassed) lineColor = 'bg-green-400';
    if (isFailed) lineColor = 'bg-red-400';

    let iconColor = 'text-yellow-600';
    if (isPassed) iconColor = 'text-green-600';
    if (isFailed) iconColor = 'text-red-600';
    if (checkpoint.isLocked) iconColor = 'text-gray-400';

    return (
        <div className="h-full flex flex-col items-center justify-center relative w-16">
            {/* The vertical line */}
            <div className={`w-1 h-full absolute top-0 left-1/2 -translate-x-1/2 ${lineColor}`}></div>
            
            {/* The clickable icon */}
            <button
                onClick={onClick}
                disabled={checkpoint.isLocked}
                className={`relative z-10 p-2 rounded-full transition-all duration-200 shadow-md
                    ${isThisCheckpointSelected ? 'ring-4 ring-sky-500 bg-white' : 'bg-white hover:bg-yellow-100'}
                    ${checkpoint.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${isFailed ? 'animate-pulse ring-2 ring-red-500' : ''}
                `}
                title={checkpoint.title}
            >
                <CheckpointIcon className={`w-8 h-8 ${iconColor}`} />
            </button>
        </div>
    );
};

// --- DETAIL VIEW COMPONENT ---
const DetailView = ({ node, user, drill, steps, users, getStepState, handleStepStart, setCompletionModal, onConfirmScenario, drillExecData, scenarios, userColorMap, onEvaluateCriterion, onEndDrillFailed }) => {
    const { t } = useTranslation();
    const [finalStatus, setFinalStatus] = useState('Failure-Confirmed');
    const [finalReason, setFinalReason] = useState('');
    
    if (!node) return null;

    const handleConfirm = () => {
        if (finalReason) {
            onConfirmScenario(node.id, finalStatus, finalReason);
        } else {
            alert('Vui lòng nhập lý do xác nhận.');
        }
    };

    if (node.type === 'scenario') {
        const scenario = node;
        const allStepsDone = scenario.steps.every(s => getStepState(s).status?.startsWith('Completed'));
        const hasFailedStep = scenario.steps.some(s => getStepState(s).status === 'Completed-Failure' || getStepState(s).status === 'Completed-Blocked');
        const isConfirmed = !!drillExecData[scenario.id]?.final_status;
        
        if (scenario.isLocked) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <LockIcon />
                    <h3 className="text-xl font-bold text-gray-900 mt-4">{t('scenarioLocked')}</h3>
                    <p className="text-gray-500">{t('scenarioLockedMessage', { scenarioName: (scenarios[node.dependsOn[0]]?.name || Object.values(drill.checkpoints || {}).find(c => c.id === node.dependsOn[0])?.title) })}</p>
                </div>
            )
        }
        
        const hasAttachment = scenario.attachment && scenario.attachment.data;

        return (
            <div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-4">{scenario.name}</h2>
                 <div className={`grid grid-cols-1 ${hasAttachment ? 'xl:grid-cols-2 gap-6' : ''}`}>
                    {hasAttachment && (
                        <div className="bg-gray-100 p-4 rounded-lg flex flex-col h-[75vh]">
                             <div className="flex justify-between items-center mb-2 flex-shrink-0">
                                <h3 className="font-bold text-gray-800">Tài liệu đính kèm</h3>
                                <button 
                                    onClick={() => viewPdfInNewWindow(scenario.attachment.data, scenario.attachment.name)}
                                    disabled={!scenario.attachment.data}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ExternalLinkIcon />
                                    <span className="ml-2">{t('viewLarger', 'Xem lớn hơn')}</span> 
                                </button>
                            </div>
                            <div className="flex-grow border border-gray-300 rounded flex items-center justify-center bg-white">
                                <iframe
                                    src={scenario.attachment.data}
                                    width="100%"
                                    height="100%"
                                    title={scenario.attachment.name || "PDF Viewer"}
                                    className="border-0"
                                ></iframe>
                            </div>
                        </div>
                    )}

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

                                const assigneeId = state.assignee || drill.step_assignments?.[stepId];
                                const assignee = assigneeId ? users.find(u => u.id === assigneeId) : null;
                                const assigneeLabel = state.assignee ? t('executedBy') : t('assignedTo');
                                const colorStyle = assignee ? userColorMap[assignee.id] : null;

                                const isAuthorizedToExecute = user.role === 'ADMIN' || user.role === scenario.role;

                                return (
                                    <div key={stepId} className={`p-4 rounded-lg border-l-4 bg-gray-50 ${borderColor}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-lg text-gray-900">{statusIcon} {step.title}</h4>
                                                    {step.estimated_time && <span className="text-sm text-gray-500 ml-4 flex items-center"><ClockIcon />{step.estimated_time}</span>}
                                                </div>
                                                <div className="prose prose-sm mt-2 max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: step.description }} />
                                                {assignee && colorStyle && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                                        <span className="text-xs font-medium text-gray-600">{assigneeLabel}:</span>
                                                        <span className={`text-xs px-2 py-0-5 rounded-full font-semibold ${colorStyle.bg} ${colorStyle.text}`}>
                                                            {assignee.last_name && assignee.first_name ? `${assignee.last_name} ${assignee.first_name}` : (assignee.fullname || assignee.username)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                {isAuthorizedToExecute && (
                                                    <>
                                                        {state.status === 'Pending' && <button onClick={() => handleStepStart(stepId)} className="bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-blue-600">{t('start')}</button>}
                                                        {state.status === 'InProgress' && <button onClick={() => setCompletionModal({ stepId })} className="bg-green-500 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-green-600">{t('complete')}</button>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                         {user.role === 'ADMIN' && allStepsDone && hasFailedStep && !isConfirmed && (
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
                    </div>
                 </div>
            </div>
        );
    }
    
    if (node.type === 'checkpoint') {
        const checkpoint = node;
        const allCriteriaChecked = checkpoint.criteria.every(c => drillExecData[c.id]?.status);
        const hasFailedCriterion = checkpoint.criteria.some(c => drillExecData[c.id]?.status === 'Fail');

        if (checkpoint.isLocked) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <LockIcon />
                    <h3 className="text-xl font-bold text-gray-900 mt-4">{t('checkpointLocked')}</h3>
                     <p className="text-gray-500">{t('scenarioLockedMessage', { scenarioName: scenarios[checkpoint.after_scenario_id]?.name })}</p>
                </div>
            )
        }
        
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3"><CheckpointIcon className="w-8 h-8 text-yellow-500" /> {checkpoint.title}</h2>
                <p className="text-gray-600 mb-4">{t('evaluateCheckpointMessage')}</p>
                <div className="space-y-3">
                    {checkpoint.criteria.map(criterion => {
                        const state = drillExecData[criterion.id];
                        const checkedByUser = state?.checked_by ? users.find(u => u.id === state.checked_by) : null;
                        return(
                            <div key={criterion.id} className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-800">{criterion.criterion_text}</p>
                                {user.role === 'ADMIN' && !state?.status && (
                                     <div className="mt-3 flex gap-3">
                                        <button onClick={() => onEvaluateCriterion(criterion.id, 'Pass')} className="flex items-center gap-2 bg-green-100 text-green-800 font-semibold px-4 py-2 rounded-lg hover:bg-green-200"><CheckCircleIcon /> {t('pass')}</button>
                                        <button onClick={() => onEvaluateCriterion(criterion.id, 'Fail')} className="flex items-center gap-2 bg-red-100 text-red-800 font-semibold px-4 py-2 rounded-lg hover:bg-red-200"><XCircleIcon /> {t('fail')}</button>
                                     </div>
                                )}
                                {state?.status && (
                                    <div className="mt-3 flex items-center gap-3 text-sm">
                                        <span className={`font-bold ${state.status === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>{state.status === 'Pass' ? `✓ ${t('passed')}`: `✗ ${t('failed')}`}</span>
                                        <span className="text-gray-500">({t('checkedBy')}: {checkedByUser?.fullname || 'N/A'})</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {user.role === 'ADMIN' && allCriteriaChecked && hasFailedCriterion && (
                     <div className="mt-6 border-t pt-4 text-center bg-red-50 p-4 rounded-lg">
                        <h3 className="font-bold text-red-700">{t('checkpointFailedTitle')}</h3>
                        <p className="text-red-600 text-sm mb-3">{t('checkpointFailedMessage')}</p>
                        <button onClick={() => onEndDrillFailed(checkpoint)} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">{t('endDrill')}</button>
                    </div>
                )}
            </div>
        );
    }
    
    return null;
}

// --- MAIN EXECUTION SCREEN COMPONENT ---
const ExecutionScreen = ({ user, drill, onBack, scenarios, steps, users, executionData, onExecutionUpdate, onDataRefresh, setActiveScreen, setActiveDrill }) => {
    const { t } = useTranslation();
    const [activeNodeId, setActiveNodeId] = useState(null);
    const [completionModal, setCompletionModal] = useState(null);
    
    const userColorMap = useMemo(() => {
        const map = {};
        if (users && users.length > 0) { users.forEach(u => { map[u.id] = userColorClasses[simpleHash(u.id) % userColorClasses.length]; }); }
        return map;
    }, [users]);
    
    const { groupLevels, allNodes } = useMemo(() => {
        if (!drill || !drill.scenarios) return { groupLevels: [], allNodes: {} };
        
        const drillExecData = executionData[drill.id] || {};
        
        // 1. Build scenario nodes and group them
        const groups = {};
        const scenarioNodes = {};
        drill.scenarios.forEach(item => {
            const scenario = scenarios[item.id];
            if (scenario) {
                const groupName = item.group || t('defaultGroup', 'Khối mặc định');
                if (!groups[groupName]) {
                    groups[groupName] = { name: groupName, id: groupName, scenarios: [], dependsOn: [] };
                }
                const scenarioNode = { 
                    ...scenario, 
                    type: 'scenario', 
                    dependsOn: item.dependsOn || [], 
                    groupName,
                    checkpoint: Object.values(drill.checkpoints || {}).find(c => c.after_scenario_id === item.id) || null
                };
                groups[groupName].scenarios.push(scenarioNode);
                scenarioNodes[item.id] = scenarioNode;
            }
        });

        // 2. Add group dependencies
        const groupDependencies = drill.group_dependencies || [];
        groupDependencies.forEach(dep => {
            if (groups[dep.group]) groups[dep.group].dependsOn = dep.dependsOn || [];
        });

        // 3. Calculate execution status for all scenarios and checkpoints
        Object.values(scenarioNodes).forEach(node => {
            const stepStates = (node.steps || []).map(stepId => drillExecData[stepId]);
            if(stepStates.some(s => s?.status === 'InProgress')) node.executionStatus = 'InProgress';
            else if (stepStates.every(s => s?.status?.startsWith('Completed'))) node.executionStatus = 'Completed';
            else node.executionStatus = 'Pending';
            
            if (node.checkpoint) {
                const criteriaStates = (node.checkpoint.criteria || []).map(c => drillExecData[c.id]);
                if (criteriaStates.every(s => s?.status)) {
                    node.checkpoint.executionStatus = 'Completed';
                    node.checkpoint.isPassed = criteriaStates.every(s => s.status === 'Pass');
                }
                else if (criteriaStates.some(s => s?.status)) node.checkpoint.executionStatus = 'InProgress';
                else node.checkpoint.executionStatus = 'Pending';
            }
        });
        
        // 4. Calculate lock status for all scenarios and checkpoints
        Object.values(scenarioNodes).forEach(node => {
            node.isLocked = !(node.dependsOn || []).every(depId => {
                const depIsScenario = !!scenarioNodes[depId];
                if (depIsScenario) {
                    const depNode = scenarioNodes[depId];
                    if (depNode.executionStatus !== 'Completed') return false;
                    if (depNode.checkpoint && depNode.checkpoint.executionStatus === 'Completed' && !depNode.checkpoint.isPassed) return false;
                    return true;
                }
                // Check if dependency is a standalone checkpoint from another scenario
                const sourceScenario = Object.values(scenarioNodes).find(n => n.checkpoint?.id === depId);
                if (sourceScenario?.checkpoint) {
                    return sourceScenario.checkpoint.executionStatus === 'Completed' && sourceScenario.checkpoint.isPassed;
                }
                return true; 
            });

            if (node.checkpoint) {
                node.checkpoint.isLocked = node.executionStatus !== 'Completed';
            }
        });

        // 5. Topologically sort groups
        const groupAdj = {}, groupInDegree = {};
        Object.values(groups).forEach(g => { groupAdj[g.id] = []; groupInDegree[g.id] = 0; });
        Object.values(groups).forEach(group => {
            group.dependsOn.forEach(depId => {
                if (groupAdj[depId]) { groupAdj[depId].push(group.id); groupInDegree[group.id]++; }
            });
        });

        const groupQueue = Object.values(groups).filter(g => groupInDegree[g.id] === 0);
        const finalGroupLevels = [];
        while (groupQueue.length > 0) {
            const currentLevel = groupQueue.splice(0, groupQueue.length);
            finalGroupLevels.push(currentLevel);
            currentLevel.forEach(u => {
                (groupAdj[u.id] || []).forEach(vId => {
                    groupInDegree[vId]--;
                    if (groupInDegree[vId] === 0) groupQueue.push(Object.values(groups).find(group => group.id === vId));
                });
            });
        }
        
        // 6. Build final map of all nodes (scenarios + checkpoints)
        const allNodesMap = { ...scenarioNodes };
        Object.values(scenarioNodes).forEach(node => {
            if (node.checkpoint) {
                allNodesMap[node.checkpoint.id] = { ...node.checkpoint, type: 'checkpoint', isLocked: node.checkpoint.isLocked };
            }
        });

        return { groupLevels: finalGroupLevels, allNodes: allNodesMap };
    }, [drill, scenarios, executionData, t]);

    const activeNode = activeNodeId ? allNodes[activeNodeId] : null;

    const updateExecutionStep = async (payload) => {
        try {
            const response = await fetch('/api/execution/step', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(await response.text());
            const updatedStep = await response.json();
            onExecutionUpdate(drill.id, updatedStep.step_id, updatedStep);
        } catch (error) { 
            console.error("Lỗi cập nhật bước thực thi:", error);
            alert(`Lỗi cập nhật bước thực thi: ${error.message}`); 
        }
    };
    
    const handleEvaluateCriterion = async (criterionId, status) => {
        try {
            const response = await fetch('/api/execution/checkpoint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drill_id: drill.id, criterion_id: criterionId, status, checked_by: user.id }) });
            if (!response.ok) throw new Error(await response.text());
            const updatedCriterion = await response.json();
            onExecutionUpdate(drill.id, updatedCriterion.criterion_id, updatedCriterion);
        } catch (error) { 
            console.error("Lỗi đánh giá tiêu chí:", error);
            alert(`Lỗi đánh giá tiêu chí: ${error.message}`); 
        }
    };
    
    const handleEndDrillFailed = async (failedCheckpointNode) => {
        try {
            if (!failedCheckpointNode || !failedCheckpointNode.title) {
                throw new Error('Không thể kết thúc diễn tập vì thiếu thông tin checkpoint đầu vào.');
            }
            const response = await fetch(`/api/drills/${drill.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    execution_status: 'Failed',
                    timestamp: new Date().toISOString(),
                    reason: `Checkpoint "${failedCheckpointNode.title}" failed.`
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Yêu cầu server thất bại (HTTP ${response.status}): ${errorText}`);
            }
            const updatedDrill = await response.json();
            setActiveDrill(updatedDrill);
            setActiveScreen('report');

        } catch (error) {
            console.error("Lỗi kết thúc diễn tập:", error);
            alert(`Không thể cập nhật trạng thái diễn tập:\n${error.message}`);
        }
    };

    const handleStepStart = (stepId) => {
        updateExecutionStep({ drill_id: drill.id, step_id: stepId, status: 'InProgress', started_at: new Date().toISOString(), assignee: user.id });
    };
    
    const handleStepComplete = (stepId, result) => {
        updateExecutionStep({ drill_id: drill.id, step_id: stepId, status: result.status, completed_at: new Date().toISOString(), result_text: result.text, assignee: user.id});
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
            if (!response.ok) throw new Error(await response.text());
            const confirmedScenario = await response.json();
            onExecutionUpdate(drill.id, confirmedScenario.scenario_id, confirmedScenario);
        } catch (error) {
            console.error("Lỗi xác nhận kịch bản:", error);
            alert(`Lỗi xác nhận kịch bản: ${error.message}`);
        }
    };
    
    const getStepState = (stepId) => executionData[drill.id]?.[stepId] || { status: 'Pending' };

    return (
        <>
            <div className="flex flex-col gap-6">
                <button onClick={onBack} className="text-[#00558F] hover:underline self-start">&larr; {t('backToDashboard')}</button>
                
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">{t('scenarios')}</h2>
                    <div className="flex flex-row items-stretch gap-0 overflow-x-auto p-4 bg-gray-100 rounded-lg min-w-full">
                        {groupLevels.map((level, levelIndex) => {
                            const checkpointsMap = new Map();
                            level.forEach(group => {
                                (group.scenarios || []).forEach(s => {
                                    if (s.checkpoint) {
                                        checkpointsMap.set(s.checkpoint.id, s.checkpoint);
                                    }
                                });
                            });
                            const checkpointsInLevel = Array.from(checkpointsMap.values());

                            return (
                                <React.Fragment key={levelIndex}>
                                    {/* The column of groups */}
                                    <div className="flex flex-col items-stretch gap-4 py-2">
                                         {level.map(group => {
                                            const scenariosInGroup = group.scenarios;
                                            if (!scenariosInGroup || scenariosInGroup.length === 0) return null;
    
                                            const scenarioLevels = (() => {
                                                const scenariosInGroupIdSet = new Set(scenariosInGroup.map(s => s.id)), adj = {}, inDegree = {};
                                                scenariosInGroup.forEach(s => { adj[s.id] = []; inDegree[s.id] = 0; });
                                                scenariosInGroup.forEach(s => {
                                                    (s.dependsOn || []).forEach(depId => {
                                                        if (scenariosInGroupIdSet.has(depId) && adj[depId]) {
                                                            adj[depId].push(s.id); inDegree[s.id]++;
                                                        }
                                                    });
                                                });
                                                const queue = scenariosInGroup.filter(s => inDegree[s.id] === 0), levels = [];
                                                while (queue.length > 0) {
                                                    const currentLevelNodes = queue.splice(0, queue.length);
                                                    levels.push(currentLevelNodes);
                                                    currentLevelNodes.forEach(uNode => {
                                                        (adj[uNode.id] || []).forEach(vId => {
                                                            inDegree[vId]--;
                                                            if (inDegree[vId] === 0) queue.push(scenariosInGroup.find(s => s.id === vId));
                                                        });
                                                    });
                                                }
                                                return levels;
                                            })();
    
                                            return (
                                                <div key={group.id} className="bg-gray-50/50 p-3 rounded-lg border border-gray-200 flex-1 flex flex-col">
                                                    <h3 className="text-md font-bold text-sky-700 mb-1">{group.name}</h3>
                                                    {group.dependsOn && group.dependsOn.length > 0 && (
                                                        <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
                                                            <LinkIcon className="w-3 h-3" />
                                                            <span>{t('dependsOn', 'Phụ thuộc')}: {group.dependsOn.join(', ')}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-row items-start gap-2 mt-2">
                                                        {scenarioLevels.map((scenarioLevel, sLevelIndex) => (
                                                            <React.Fragment key={sLevelIndex}>
                                                                {sLevelIndex > 0 && <ScenarioSubLevelConnector />}
                                                                <div className="flex flex-col items-center gap-3">
                                                                    {scenarioLevel.map(node => {
                                                                        const isSelected = activeNodeId === node.id || activeNodeId === node.checkpoint?.id;
                                                                        const isInProgress = node.executionStatus === 'InProgress' || node.checkpoint?.executionStatus === 'InProgress';
                                                                        const isAuthorizedToView = user.role === 'ADMIN' || user.role === node.role;
                                                                        const drillExec = executionData[drill.id] || {};
                                                                        const assignedUserIds = new Set(node.steps.map(stepId => (drillExec[stepId]?.assignee || drill.step_assignments?.[stepId])).filter(Boolean));
                                                                        const assignedUsers = Array.from(assignedUserIds).map(userId => users.find(u => u.id === userId)).filter(Boolean);
                    
                                                                        return (
                                                                            <button 
                                                                                key={node.id} 
                                                                                onClick={() => setActiveNodeId(node.id)} 
                                                                                disabled={node.isLocked || !isAuthorizedToView} 
                                                                                className={`w-56 h-20 relative overflow-hidden text-left p-2 rounded-lg border transition-all duration-300 bg-white border-gray-200 hover:border-gray-400 flex flex-col justify-between
                                                                                    ${(isSelected && isAuthorizedToView) ? 'ring-2 ring-sky-500' : ''} 
                                                                                    ${node.isLocked ? 'opacity-60' : ''}
                                                                                    ${isInProgress && !isSelected ? 'animate-pulse' : ''} 
                                                                                    ${(node.isLocked || !isAuthorizedToView) ? 'cursor-not-allowed' : ''}`
                                                                                }
                                                                            >
                                                                                {node.executionStatus === 'Completed' && (
                                                                                    <CheckCircleIcon className="absolute z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-green-400 opacity-20" />
                                                                                )}
                                                                                <div className="relative z-10">
                                                                                    <h4 className="font-semibold text-xs text-gray-900 flex items-center truncate">
                                                                                        {node.isLocked && <LockIcon />}
                                                                                        {node.name}
                                                                                    </h4>
                                                                                </div>
                                                                                <div className="relative z-10 mt-2">
                                                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${node.role === 'TECHNICAL' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>{node.role}</span>
                                                                                </div>
                                                                                {assignedUsers.length > 0 && (
                                                                                    <div className="absolute z-20 bottom-2 right-2 flex flex-row-reverse items-center -space-x-2 space-x-reverse">
                                                                                        {assignedUsers.slice(0, 2).map(u => {
                                                                                            const colorStyle = userColorMap[u.id] || userColorClasses[0];
                                                                                            const fullName = u.last_name && u.first_name ? `${u.last_name} ${u.first_name}` : (u.fullname || u.username);
                                                                                            const nameParts = fullName ? fullName.split(' ').filter(p => p) : [];
                                                                                            const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
                                                                                            const avatarText = (lastName?.[0] || u.username?.[0] || 'U').toUpperCase();
                                                                                            return <div key={u.id} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white ${colorStyle.bg} ${colorStyle.text}`} title={fullName}>{avatarText}</div>;
                                                                                        })}
                                                                                        {assignedUsers.length > 2 && <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white bg-gray-200 text-gray-700" title={`${assignedUsers.length - 2} người khác`}>+{assignedUsers.length - 2}</div>}
                                                                                    </div>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                         })}
                                    </div>

                                    {/* The checkpoint milestone "wall" */}
                                    {checkpointsInLevel.length > 0 && (
                                        <div className="flex flex-col items-center justify-center self-stretch">
                                            {checkpointsInLevel.map(checkpoint => (
                                                <CheckpointMilestone
                                                    key={checkpoint.id}
                                                    checkpoint={checkpoint}
                                                    onClick={() => setActiveNodeId(checkpoint.id)}
                                                    activeNodeId={activeNodeId}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* The connector */}
                                    {levelIndex < groupLevels.length - 1 && <WorkflowConnector />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    {activeNode ? (
                        <DetailView
                            node={activeNode}
                            user={user}
                            drill={drill}
                            steps={steps}
                            users={users}
                            getStepState={getStepState}
                            handleStepStart={handleStepStart}
                            setCompletionModal={setCompletionModal}
                            onConfirmScenario={handleScenarioConfirmation}
                            drillExecData={executionData[drill.id] || {}}
                            scenarios={scenarios}
                            userColorMap={userColorMap}
                            onEvaluateCriterion={handleEvaluateCriterion}
                            onEndDrillFailed={handleEndDrillFailed}
                        />
                    ) : (
                        <div className="flex items-center justify-center min-h-[200px]">
                            <p className="text-gray-500">{t('selectScenarioToViewSteps')}</p>
                        </div>
                    )}
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

