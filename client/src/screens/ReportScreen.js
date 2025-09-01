import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import KpiCard from '../components/common/KpiCard';
// BỔ SUNG: Thêm các icon cần thiết cho phần Checkpoint
import { ClockIcon, UsersIcon, CheckpointIcon, CheckCircleIcon, XCircleIcon, UserIcon } from '../components/icons';

// BỔ SUNG: Thêm prop `users` để lấy thông tin người đánh giá checkpoint
const ReportScreen = ({ drill, executionData, scenarios, steps, users, onBack }) => {
    const { t } = useTranslation();
    const [expandedScenarios, setExpandedScenarios] = useState([]);

    const drillExecData = executionData[drill.id] || {};

    const allStepStates = Object.values(drillExecData).filter(s => s.status && s.assignee);
    const participants = [...new Set(allStepStates.map(s => s.assignee))];
    const successfulSteps = allStepStates.filter(s => s.status === 'Completed-Success').length;
    const failedSteps = allStepStates.filter(s => s.status === 'Completed-Failure' || s.status === 'Completed-Blocked').length;
    const totalDuration = drill.closed_at && drill.opened_at ? ((new Date(drill.closed_at) - new Date(drill.opened_at)) / 1000).toFixed(0) + 's' : 'N/A';

    const formatStepDuration = (start, end) => {
        if (!start || !end) return 'N/A';
        const durationMs = new Date(end) - new Date(start);
        return `${(durationMs / 1000).toFixed(2)}s`;
    };
    
    const toggleScenario = (scenId) => {
        setExpandedScenarios(prev => 
            prev.includes(scenId) ? prev.filter(id => id !== scenId) : [...prev, scenId]
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <button onClick={onBack} className="text-[#00558F] hover:underline mb-4">&larr; {t('backToDashboard')}</button>
            
            {/* ============================================ */}
            {/* 1. Drill Status Header (UPDATED)             */}
            {/* ============================================ */}
            {drill.execution_status === 'Closed' && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-xl shadow-md mb-6" role="alert">
                    <h2 className="font-bold text-xl">{t('drillCompletedSuccessfully')}</h2>
                </div>
            )}
            {drill.execution_status === 'Failed' && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-xl shadow-md mb-6" role="alert">
                    <h2 className="font-bold text-xl">{t('drillEndedInFailure')}</h2>
                    {drill.failure_reason && (
                       <p className="mt-1 text-sm">{t('reason')}: {drill.failure_reason}</p>
                    )}
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('drillReportTitle', { drillName: drill.name })}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard title={t('totalTime')} value={totalDuration} icon={<ClockIcon />} iconBgColor="bg-blue-100" />
                        <KpiCard title={t('participants')} value={participants.length} icon={<UsersIcon />} iconBgColor="bg-purple-100" />
                        <KpiCard title={t('successfulSteps')} value={successfulSteps} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>} iconBgColor="bg-green-100" />
                        <KpiCard title={t('failedSteps')} value={failedSteps} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>} iconBgColor="bg-red-100" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('scenarioSummary')}</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="py-2 px-4 w-12"></th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('scenarioName')}</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('totalTime')}</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drill.scenarios.map(scenItem => {
                                    const scenId = scenItem.id;
                                    const scenario = scenarios[scenId];
                                    if (!scenario) return null;
                                    const isExpanded = expandedScenarios.includes(scenId);
                                    
                                    const scenarioStepsStates = scenario.steps.map(stepId => drillExecData[stepId] || { status: 'Pending' });
                                    const hasFailed = scenarioStepsStates.some(s => s.status === 'Completed-Failure' || s.status === 'Completed-Blocked');
                                    const allStepsDone = scenarioStepsStates.every(s => s.status && s.status.startsWith('Completed'));
                                    
                                    let scenarioStatus = t('notCompleted');
                                    if (allStepsDone) {
                                        if (hasFailed) {
                                            if (drillExecData[scenId]?.final_status === 'Success-Overridden') {
                                                scenarioStatus = t('completedWithOverride');
                                            } else {
                                                scenarioStatus = t('failure');
                                            }
                                        } else {
                                            scenarioStatus = t('complete');
                                        }
                                    }
                                    
                                    const startTimes = scenarioStepsStates.map(s => new Date(s.started_at)).filter(d => !isNaN(d));
                                    const endTimes = scenarioStepsStates.map(s => new Date(s.completed_at)).filter(d => !isNaN(d));
                                    const scenarioDuration = startTimes.length > 0 && endTimes.length > 0
                                        ? formatStepDuration(Math.min(...startTimes), Math.max(...endTimes))
                                        : 'N/A';

                                    const getScenarioStatusClass = (status) => {
                                        if (status === t('complete')) return 'bg-green-100 text-green-800';
                                        if (status.includes(t('failure'))) return 'bg-red-100 text-red-800';
                                        if (status.includes(t('completedWithOverride'))) return 'bg-yellow-100 text-yellow-800';
                                        return 'bg-gray-100 text-gray-800';
                                    }

                                    return (
                                        <React.Fragment key={scenId}>
                                            <tr className="border-t border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => toggleScenario(scenId)}>
                                                <td className="py-3 px-4 text-center"><svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></td>
                                                <td className="py-3 px-4 font-semibold text-gray-800">{scenario.name}</td>
                                                <td className="py-3 px-4">{scenarioDuration}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getScenarioStatusClass(scenarioStatus)}`}>
                                                        {scenarioStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan="4" className="p-4">
                                                        <div className="p-2 bg-white rounded-md">
                                                            {drillExecData[scenId]?.final_reason && (
                                                                <div className="mb-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                                                                    <p className="font-bold text-sm">{t('confirmationReason')}</p>
                                                                    <p className="text-sm">{drillExecData[scenId].final_reason}</p>
                                                                </div>
                                                            )}
                                                            <table className="min-w-full">
                                                                <tbody>
                                                                {scenario.steps.map(stepId => {
                                                                    const step = steps[stepId];
                                                                    if (!step) return null;
                                                                    const state = drillExecData[stepId] || {};
                                                                    return (
                                                                        <tr key={stepId}>
                                                                            <td className="py-1 pl-4 w-1/2 text-gray-600">{step.title}</td>
                                                                            <td className="py-1 text-gray-500">{state.status || 'Pending'}</td>
                                                                            <td className="py-1 text-gray-500">{formatStepDuration(state.started_at, state.completed_at)}</td>
                                                                            <td className="py-1 text-gray-500">{state.assignee || 'N/A'}</td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ============================================ */}
                {/* 2. Checkpoints Section (UPDATED)             */}
                {/* ============================================ */}
                {drill.checkpoints && Object.keys(drill.checkpoints).length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                             <CheckpointIcon className="w-6 h-6 text-yellow-500" /> {t('checkpointResults')}
                        </h3>
                        <div className="space-y-4">
                        {Object.values(drill.checkpoints).map(checkpoint => {
                            const afterScenario = scenarios[checkpoint.after_scenario_id];
                            return (
                                <div key={checkpoint.id} className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                                    <h4 className="font-bold text-lg text-gray-800">{checkpoint.title}</h4>
                                    {afterScenario && <p className="text-sm text-gray-500 mb-3">{t('evaluatedAfter')}: "{afterScenario.name}"</p>}
                                    
                                    <ul className="space-y-2">
                                        {checkpoint.criteria.map(criterion => {
                                            const state = drillExecData[criterion.id];
                                            const checkedByUser = state?.checked_by && users ? users.find(u => u.id === state.checked_by) : null;
                                            const isPass = state?.status === 'Pass';
                                            return (
                                                <li key={criterion.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white rounded-md shadow-sm gap-2">
                                                    <p className="text-gray-700 flex-1 mr-4">{criterion.criterion_text}</p>
                                                    {state ? (
                                                        <div className={`flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {isPass ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                                                            <span>{isPass ? t('pass') : t('fail')}</span>
                                                            {checkedByUser && <span className="text-gray-500 text-xs font-normal ml-2">({checkedByUser.fullname || checkedByUser.username})</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="flex-shrink-0 w-full sm:w-auto text-center text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">{t('notEvaluated')}</span>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
};
export default ReportScreen;

