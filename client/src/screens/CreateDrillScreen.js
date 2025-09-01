import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import DependencySelector from '../components/common/DependencySelector';
import { UserIcon, CheckpointIcon, PlusIcon, TrashIcon } from '../components/icons';

// Component Modal để chỉnh sửa Checkpoint
const CheckpointModal = ({ t, scenario, checkpoint, onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [criteria, setCriteria] = useState([]);

    useEffect(() => {
        if (checkpoint) {
            setTitle(checkpoint.title || '');
            const initialCriteria = checkpoint.criteria?.map((c, index) => ({
                id: c.id || `temp-${index}`,
                text: c.criterion_text || c.text || ''
            })) || [];
            setCriteria(initialCriteria);
        } else {
             setTitle(t('checkpointFor', {scenarioName: scenario.name}));
             setCriteria([{id: `temp-${Date.now()}`, text: ''}]);
        }
    }, [checkpoint, scenario, t]);

    const handleAddCriterion = () => {
        setCriteria([...criteria, { id: `temp-${Date.now()}`, text: '' }]);
    };

    const handleRemoveCriterion = (id) => {
        setCriteria(criteria.filter(c => c.id !== id));
    };

    const handleCriterionChange = (id, newText) => {
        setCriteria(criteria.map(c => (c.id === id ? { ...c, text: newText } : c)));
    };

    const handleSave = () => {
        const finalCheckpoint = {
            id: checkpoint?.id || `cp-new-${Date.now()}`,
            title,
            after_scenario_id: scenario.id,
            criteria: criteria.filter(c => c.text.trim() !== '')
        };
        onSave(scenario.id, finalCheckpoint);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">{t('editCheckpoint')}</h2>
                    <p className="text-sm text-gray-500">{t('checkpointDescription')}</p>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkpointTitle')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('evaluationCriteria')}</label>
                        <div className="space-y-2">
                            {criteria.map((criterion, index) => (
                                <div key={criterion.id} className="flex items-center gap-2">
                                    <span className="text-gray-500 font-semibold">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={criterion.text}
                                        onChange={e => handleCriterionChange(criterion.id, e.target.value)}
                                        placeholder={t('criterionPlaceholder')}
                                        className="flex-grow px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                                    />
                                    <button onClick={() => handleRemoveCriterion(criterion.id)} className="p-2 text-gray-400 hover:text-red-600">
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAddCriterion} className="mt-2 flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-800">
                            <PlusIcon /> {t('addCriterion')}
                        </button>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="bg-white text-gray-700 border border-gray-300 font-bold py-2 px-6 rounded-lg hover:bg-gray-100">{t('cancel')}</button>
                    <button onClick={handleSave} className="bg-[#00558F] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#004472]">{t('saveChanges')}</button>
                </div>
            </div>
        </div>
    );
};


const CreateDrillScreen = ({ setActiveScreen, onDataRefresh, db, user, drillToEdit, onDoneEditing }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [basis, setBasis] = useState('');
    const [status, setStatus] = useState('Draft');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableScenarios, setAvailableScenarios] = useState([]);
    const [selectedScenarios, setSelectedScenarios] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [stepAssignments, setStepAssignments] = useState({});
    const [expandedScenario, setExpandedScenario] = useState(null);
    const [checkpoints, setCheckpoints] = useState({});
    const [editingCheckpointFor, setEditingCheckpointFor] = useState(null);

    useEffect(() => {
        const allScenarios = Object.values(db.scenarios).filter(s => s.status === 'Active');
        if (drillToEdit) {
            setName(drillToEdit.name);
            setDescription(drillToEdit.description);
            setBasis(drillToEdit.basis);
            setStatus(drillToEdit.status);
            setStartDate(new Date(drillToEdit.start_date).toISOString().split('T')[0]);
            setEndDate(new Date(drillToEdit.end_date).toISOString().split('T')[0]);
            const selectedIds = new Set(drillToEdit.scenarios.map(s => s.id));
            const selected = drillToEdit.scenarios.map(s => ({ ...db.scenarios[s.id], dependsOn: s.dependsOn }));
            setSelectedScenarios(selected);
            setAvailableScenarios(allScenarios.filter(s => !selectedIds.has(s.id)));
            setStepAssignments(drillToEdit.step_assignments || {});
            
            // SỬA ĐỔI: Chuẩn hóa cấu trúc dữ liệu checkpoint khi tải
            const normalizedCheckpoints = {};
            if (drillToEdit.checkpoints) {
                for (const scenarioId in drillToEdit.checkpoints) {
                    const cp = drillToEdit.checkpoints[scenarioId];
                    if (cp) {
                        normalizedCheckpoints[scenarioId] = {
                            ...cp,
                            criteria: (cp.criteria || []).map(c => ({
                                id: c.id,
                                text: c.criterion_text || c.text || '' // Luôn chuyển đổi về thuộc tính 'text'
                            }))
                        };
                    }
                }
            }
            setCheckpoints(normalizedCheckpoints);

        } else {
            setAvailableScenarios(allScenarios);
        }
    }, [drillToEdit, db.scenarios]);

    const handleAssigneeChange = (stepId, assigneeId) => {
        setStepAssignments(prev => ({ ...prev, [stepId]: assigneeId }));
    };
    
    const handleSaveCheckpoint = (scenarioId, checkpointData) => {
        setCheckpoints(prev => ({
            ...prev,
            [scenarioId]: checkpointData
        }));
    };

    const handleDragStart = (e, item, source) => {
        setDraggedItem({ ...item, source });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetList) => {
        e.preventDefault();
        if (!draggedItem) return;

        if (targetList === 'selected' && draggedItem.source === 'available') {
            const newSelected = [...selectedScenarios, { ...draggedItem, dependsOn: [] }];
            setSelectedScenarios(newSelected);
            setAvailableScenarios(availableScenarios.filter(s => s.id !== draggedItem.id));
        }
        else if (targetList === 'available' && draggedItem.source === 'selected') {
            setAvailableScenarios([...availableScenarios, { ...draggedItem }]);
            const newSelected = selectedScenarios.filter(s => s.id !== draggedItem.id);
            
            const newAssignments = { ...stepAssignments };
            const removedScenario = db.scenarios[draggedItem.id];
            if(removedScenario && removedScenario.steps) {
                removedScenario.steps.forEach(stepId => {
                    delete newAssignments[stepId];
                });
            }
            setStepAssignments(newAssignments);

            const newCheckpoints = { ...checkpoints };
            delete newCheckpoints[draggedItem.id];
            setCheckpoints(newCheckpoints);

            const updatedSelected = newSelected.map(s => {
                const newDependsOn = (s.dependsOn || []).filter(depId => depId !== draggedItem.id);
                return { ...s, dependsOn: newDependsOn };
            });
            setSelectedScenarios(updatedSelected);
        }
        setDraggedItem(null);
    };

    const handleReorder = (draggedId, dropId) => {
        const item = selectedScenarios.find(s => s.id === draggedId);
        const fromIndex = selectedScenarios.findIndex(s => s.id === draggedId);
        const toIndex = selectedScenarios.findIndex(s => s.id === dropId);
        
        const newSelected = [...selectedScenarios];
        newSelected.splice(fromIndex, 1);
        newSelected.splice(toIndex, 0, item);

        const updatedSelected = newSelected.map((s, index) => {
            const validDependencies = (s.dependsOn || []).filter(depId => {
                const depIndex = newSelected.findIndex(dep => dep.id === depId);
                return depIndex < index;
            });
            return { ...s, dependsOn: validDependencies };
        });
        
        setSelectedScenarios(updatedSelected);
    };

    const handleDropOnItem = (e, dropId) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.source !== 'selected' || draggedItem.id === dropId) return;
        handleReorder(draggedItem.id, dropId);
        setDraggedItem(null);
    };

    const handleDependencyChange = (scenarioId, dependencyIds) => {
        setSelectedScenarios(selectedScenarios.map(s => s.id === scenarioId ? { ...s, dependsOn: dependencyIds } : s));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) {
            alert('Vui lòng nhập tên Drill.');
            return;
        }

        const payload = {
            name,
            description,
            basis,
            start_date: startDate,
            end_date: endDate,
            status: basis ? status : 'Draft',
            scenarios: selectedScenarios.map(({ id, dependsOn }) => ({ id, dependsOn })),
            step_assignments: stepAssignments,
            checkpoints: checkpoints
        };

        try {
            let response;
            if (drillToEdit && drillToEdit.id) {
                response = await fetch(`/api/drills/${drillToEdit.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                 response = await fetch('/api/drills', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            if (!response.ok) throw new Error('Failed to save drill');
            onDataRefresh();
            onDoneEditing();
        } catch (error) {
            console.error(error);
            alert('Lỗi lưu Drill.');
        }
    };

    return (
        <>
            {editingCheckpointFor && (
                <CheckpointModal
                    t={t}
                    scenario={selectedScenarios.find(s => s.id === editingCheckpointFor)}
                    checkpoint={checkpoints[editingCheckpointFor]}
                    onSave={handleSaveCheckpoint}
                    onClose={() => setEditingCheckpointFor(null)}
                />
            )}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <button onClick={onDoneEditing} className="text-[#00558F] hover:underline mb-4">&larr; {t('back')}</button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{drillToEdit ? t('editDrillTitle') : t('createDrillTitle')}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('drillName')}</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('drillStatus')}</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} disabled={!basis} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:opacity-50">
                                <option value="Draft">{t('draft')}</option>
                                <option value="Active">{t('active')}</option>
                            </select>
                             {!basis && <p className="text-xs text-yellow-600 mt-1">{t('basisRequiredMessage')}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('startDate')}</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate')}</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('basisForConstruction')}</label>
                        <textarea value={basis} onChange={e => setBasis(e.target.value)} rows="2" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition" />
                    </div>

                    <div className="flex space-x-6">
                        <div className="w-1/3">
                            <h3 className="font-bold text-gray-900 mb-2">{t('availableScenarios')}</h3>
                            <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'available')} className="bg-gray-100 p-4 rounded-lg min-h-[300px] border-dashed border-2 border-gray-300 space-y-2">
                                {availableScenarios.map(scen => (
                                    <div key={scen.id} draggable onDragStart={(e) => handleDragStart(e, scen, 'available')} className="p-3 bg-white border border-gray-200 rounded-md cursor-move shadow-sm hover:bg-gray-50 wiggle-on-drag">
                                        <p className="font-semibold text-gray-800">{scen.name}</p>
                                        <p className="text-xs text-gray-500">{scen.role}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-2/3">
                            <h3 className="font-bold text-gray-900 mb-2">{t('scenariosInDrill')}</h3>
                            <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'selected')} className="bg-sky-50 p-4 rounded-lg min-h-[300px] border-dashed border-2 border-sky-300 space-y-2">
                                {selectedScenarios.length === 0 && <p className="text-gray-500 text-center pt-16">{t('dragScenarioHere')}</p>}
                                {selectedScenarios.map((scen, index) => (
                                    <div key={scen.id} className="relative">
                                        <div draggable onDragStart={(e) => handleDragStart(e, scen, 'selected')} onDragOver={handleDragOver} onDrop={(e) => handleDropOnItem(e, scen.id)} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move wiggle-on-drag">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-gray-800">{index + 1}. {scen.name}</p>
                                                {scen.steps && scen.steps.length > 0 && (
                                                     <button type="button" onClick={() => setExpandedScenario(expandedScenario === scen.id ? null : scen.id)} className="text-sm font-semibold text-sky-600 hover:text-sky-800 bg-sky-100 px-3 py-1 rounded-md">
                                                        {expandedScenario === scen.id ? t('collapse') : t('assign')}
                                                    </button>
                                                )}
                                            </div>
                                            <DependencySelector item={scen} itemList={selectedScenarios} currentIndex={index} onDependencyChange={(deps) => handleDependencyChange(scen.id, deps)} />
                                            {expandedScenario === scen.id && (
                                                <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                                                    <h4 className="text-sm font-semibold text-gray-600 mb-2">{t('assignSteps')}</h4>
                                                    {scen.steps.map(stepId => {
                                                        const step = db.steps[stepId];
                                                        if (!step) return null;
                                                        return (
                                                            <div key={stepId} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                                                <span className="text-sm text-gray-800">{step.title}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <UserIcon className="h-4 w-4 text-gray-400" />
                                                                    <select value={stepAssignments[stepId] || ''} onChange={e => handleAssigneeChange(stepId, e.target.value)} className="text-sm bg-white border border-gray-300 rounded-md p-1 focus:ring-sky-500 focus:border-sky-500">
                                                                        <option value="">{t('unassigned')}</option>
                                                                        {db.users.map(u => (<option key={u.id} value={u.id}>{u.fullname || u.username}</option>))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <button type="button" onClick={() => setEditingCheckpointFor(scen.id)} className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${checkpoints[scen.id] ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}>
                                                <CheckpointIcon />
                                                {checkpoints[scen.id] ? t('editCheckpoint') : t('addCheckpoint')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="bg-[#00558F] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#004472] transition-all duration-300 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-800/30">{drillToEdit ? t('saveChanges') : t('createDrill')}</button>
                    </div>
                </form>
            </div>
        </>
    );
};
export default CreateDrillScreen;

