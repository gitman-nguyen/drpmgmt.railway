import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import DependencySelector from '../components/common/DependencySelector';
import { UserIcon, CheckpointIcon, PlusIcon, TrashIcon, LinkIcon, MoveIcon, DotsVerticalIcon, ArrowUpIcon, ArrowDownIcon } from '../components/icons';

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
            criteria: criteria.filter(c => c.text.trim() !== '').map(c => ({ text: c.text }))
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

// Component to select group dependencies
const GroupDependencySelector = ({ t, currentGroup, allGroups, onDependencyChange }) => {
    const currentIndex = allGroups.findIndex(g => g.id === currentGroup.id);
    const availableDependencies = allGroups.slice(0, currentIndex);

    if (availableDependencies.length === 0) {
        return null;
    }

    const handleSelectChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
        onDependencyChange(currentGroup.id, selectedIds);
    };

    return (
        <div className="relative flex items-center gap-2 text-sm">
             <LinkIcon className="h-4 w-4 text-gray-500" />
            <select
                multiple
                value={currentGroup.dependsOn || []}
                onChange={handleSelectChange}
                className="w-full text-xs bg-gray-100 border-gray-300 rounded-md p-1 focus:ring-sky-500 focus:border-sky-500"
            >
                {availableDependencies.map(group => (
                    <option key={group.id} value={group.id}>
                        {group.name}
                    </option>
                ))}
            </select>
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
    const [scenarioGroups, setScenarioGroups] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [stepAssignments, setStepAssignments] = useState({});
    const [scenarioAssignments, setScenarioAssignments] = useState({});
    const [expandedScenario, setExpandedScenario] = useState(null);
    const [checkpoints, setCheckpoints] = useState({});
    const [editingCheckpointFor, setEditingCheckpointFor] = useState(null);
    const [scenarioSearchTerm, setScenarioSearchTerm] = useState('');
    const [openActionMenu, setOpenActionMenu] = useState(null); // For scenario action dropdown
    const [collapsedGroups, setCollapsedGroups] = useState([]); // To track collapsed groups

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openActionMenu && !event.target.closest(`.action-menu-container-${openActionMenu}`)) {
                setOpenActionMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openActionMenu]);

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
            setAvailableScenarios(allScenarios.filter(s => !selectedIds.has(s.id)));
            
            const groups = {};
            const scenariosWithData = drillToEdit.scenarios.map(s => ({
                ...db.scenarios[s.id],
                dependsOn: s.dependsOn || [],
                groupName: s.group 
            }));

            // First pass: create groups and add scenarios
            scenariosWithData.forEach(s => {
                const groupName = s.groupName || t('defaultGroup', 'Khối mặc định');
                if (!groups[groupName]) {
                    groups[groupName] = {
                        id: `group-${Object.keys(groups).length}-${Date.now()}`,
                        name: groupName,
                        scenarios: [],
                        dependsOn: []
                    };
                }
                groups[groupName].scenarios.push(s);
            });
            
            let finalGroups = Object.values(groups);

            // Second pass: set up group dependencies
            if (drillToEdit.group_dependencies) {
                const groupNameIdMap = Object.fromEntries(finalGroups.map(g => [g.name, g.id]));
                drillToEdit.group_dependencies.forEach(dep => {
                    const group = finalGroups.find(g => g.name === dep.group);
                    if (group) {
                        group.dependsOn = dep.dependsOn
                            .map(depName => groupNameIdMap[depName])
                            .filter(Boolean);
                    }
                });
            }
            
            if (finalGroups.length === 0) {
                 setScenarioGroups([{ id: `group-${Date.now()}`, name: t('block1', 'Khối 1'), scenarios: [], dependsOn: [] }]);
            } else {
                setScenarioGroups(finalGroups);
            }

            setStepAssignments(drillToEdit.step_assignments || {});
            
            const initialScenarioAssignments = {};
            scenariosWithData.forEach(scen => {
                const scenario = db.scenarios[scen.id];
                if (scenario?.steps?.length > 0) {
                    const firstStepAssignee = (drillToEdit.step_assignments || {})[scenario.steps[0]];
                    if (firstStepAssignee) {
                        const allSame = scenario.steps.every(stepId => (drillToEdit.step_assignments || {})[stepId] === firstStepAssignee);
                        if (allSame) initialScenarioAssignments[scen.id] = firstStepAssignee;
                    }
                }
            });
            setScenarioAssignments(initialScenarioAssignments);

            const normalizedCheckpoints = {};
            if (drillToEdit.checkpoints) {
                Object.values(drillToEdit.checkpoints).forEach(cp => {
                     if (cp?.after_scenario_id) {
                        normalizedCheckpoints[cp.after_scenario_id] = cp;
                    }
                });
            }
            setCheckpoints(normalizedCheckpoints);

        } else {
            setAvailableScenarios(allScenarios);
            setScenarioGroups([{ id: `group-${Date.now()}`, name: t('block1', 'Khối 1'), scenarios: [], dependsOn: [] }]);
        }
    }, [drillToEdit, db.scenarios, db.users, t]);

    const flatScenariosForDependencies = scenarioGroups.flatMap(g => g.scenarios);

    const getUpdatedGroupsWithValidDependencies = (groups) => {
        const flatScenarios = groups.flatMap(g => g.scenarios);
        return groups.map(g => ({
            ...g,
            scenarios: g.scenarios.map(s => {
                const currentIndex = flatScenarios.findIndex(flatS => flatS.id === s.id);
                const validDependencies = (s.dependsOn || []).filter(depId => {
                    const depIndex = flatScenarios.findIndex(dep => dep.id === depId);
                    return depIndex !== -1 && depIndex < currentIndex;
                });
                return { ...s, dependsOn: validDependencies };
            })
        }));
    };
    
    const handleAssigneeChange = (stepId, assigneeId) => {
        setStepAssignments(prev => ({ ...prev, [stepId]: assigneeId }));
    };

    const handleScenarioAssigneeChange = (scenarioId, assigneeId) => {
        setScenarioAssignments(prev => ({ ...prev, [scenarioId]: assigneeId }));

        const scenario = db.scenarios[scenarioId];
        if (scenario?.steps) {
            const newStepAssignments = { ...stepAssignments };
            scenario.steps.forEach(stepId => {
                if (assigneeId) newStepAssignments[stepId] = assigneeId;
                else delete newStepAssignments[stepId];
            });
            setStepAssignments(newStepAssignments);
        }
    };
    
    const handleSaveCheckpoint = (scenarioId, checkpointData) => {
        setCheckpoints(prev => ({ ...prev, [scenarioId]: checkpointData }));
    };

    const handleDragStart = (e, item, source, sourceGroupId = null) => {
        setDraggedItem({ ...item, source, sourceGroupId });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
    };

    const handleDragOver = (e) => e.preventDefault();
    
    const handleRemoveScenario = (scenarioToRemove, sourceGroupId) => {
        setAvailableScenarios(prev => [...prev, scenarioToRemove]);
        
        let newGroups = scenarioGroups.map(g => 
            g.id === sourceGroupId 
            ? { ...g, scenarios: g.scenarios.filter(s => s.id !== scenarioToRemove.id) } 
            : g
        );

        const newAssignments = { ...stepAssignments };
        if (scenarioToRemove.steps) {
            scenarioToRemove.steps.forEach(stepId => delete newAssignments[stepId]);
        }
        setStepAssignments(newAssignments);

        const newScenarioAssignments = { ...scenarioAssignments };
        delete newScenarioAssignments[scenarioToRemove.id];
        setScenarioAssignments(newScenarioAssignments);

        const newCheckpoints = { ...checkpoints };
        delete newCheckpoints[scenarioToRemove.id];
        setCheckpoints(newCheckpoints);

        setScenarioGroups(getUpdatedGroupsWithValidDependencies(newGroups));
    };
    
    const handleMoveScenarioToGroup = (scenarioToMove, sourceGroupId, targetGroupId) => {
        if (!scenarioToMove || !sourceGroupId || !targetGroupId || sourceGroupId === targetGroupId) {
            return;
        }

        const movedScenario = { ...scenarioToMove, dependsOn: [] };

        let newGroups = scenarioGroups.map(g => {
            if (g.id === sourceGroupId) {
                return { ...g, scenarios: g.scenarios.filter(s => s.id !== movedScenario.id) };
            }
            if (g.id === targetGroupId) {
                return { ...g, scenarios: [...g.scenarios, movedScenario] };
            }
            return g;
        });

        setScenarioGroups(getUpdatedGroupsWithValidDependencies(newGroups));
    };

    const handleDrop = (e, targetList, targetGroupId = null) => {
        e.preventDefault();
        if (!draggedItem) return;

        const { source, sourceGroupId } = draggedItem;
        if (targetList === 'selected' && source === 'available' && targetGroupId) {
            handleAddScenario(draggedItem, targetGroupId);
        } 
        else if (targetList === 'available' && source === 'selected' && sourceGroupId) {
            handleRemoveScenario(draggedItem, sourceGroupId);
        } 
        else if (targetList === 'selected' && source === 'selected' && targetGroupId && sourceGroupId && sourceGroupId !== targetGroupId) {
            handleMoveScenarioToGroup(draggedItem, sourceGroupId, targetGroupId);
        }

        setDraggedItem(null);
    };

    const handleAddScenario = (scenarioToAdd, targetGroupId) => {
        const newGroups = scenarioGroups.map(g => 
            g.id === targetGroupId 
            ? { ...g, scenarios: [...g.scenarios, { ...scenarioToAdd, dependsOn: [] }] }
            : g
        );
        setScenarioGroups(getUpdatedGroupsWithValidDependencies(newGroups));
        setAvailableScenarios(availableScenarios.filter(s => s.id !== scenarioToAdd.id));
    };

    const handleReorder = (draggedId, dropId, groupId) => {
        const groupIndex = scenarioGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const group = scenarioGroups[groupIndex];
        const scenarios = [...group.scenarios];
        const item = scenarios.find(s => s.id === draggedId);
        const fromIndex = scenarios.findIndex(s => s.id === draggedId);
        const toIndex = scenarios.findIndex(s => s.id === dropId);
        
        scenarios.splice(fromIndex, 1);
        scenarios.splice(toIndex, 0, item);
        
        const newGroups = [...scenarioGroups];
        newGroups[groupIndex] = { ...group, scenarios };
        
        setScenarioGroups(getUpdatedGroupsWithValidDependencies(newGroups));
    };

    const handleDropOnItem = (e, dropId, dropGroupId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem || draggedItem.source !== 'selected' || draggedItem.id === dropId) return;
        
        if(draggedItem.sourceGroupId === dropGroupId) {
            handleReorder(draggedItem.id, dropId, dropGroupId);
        } else {
             handleMoveScenarioToGroup(draggedItem, draggedItem.sourceGroupId, dropGroupId);
        }
        setDraggedItem(null);
    };

    const handleDependencyChange = (scenarioId, dependencyIds) => {
        setScenarioGroups(scenarioGroups.map(g => ({
            ...g,
            scenarios: g.scenarios.map(s => s.id === scenarioId ? { ...s, dependsOn: dependencyIds } : s)
        })));
    };

    const handleGroupDependencyChange = (groupId, dependencyIds) => {
        setScenarioGroups(scenarioGroups.map(g => 
            g.id === groupId ? { ...g, dependsOn: dependencyIds } : g
        ));
    };

    const handleAddGroup = () => {
        const newGroup = {
            id: `group-${Date.now()}`,
            name: `${t('block', 'Khối')} ${scenarioGroups.length + 1}`,
            scenarios: [],
            dependsOn: []
        };
        setScenarioGroups([...scenarioGroups, newGroup]);
    };

    const handleGroupNameChange = (groupId, newName) => {
        setScenarioGroups(scenarioGroups.map(g => g.id === groupId ? { ...g, name: newName } : g));
    };

    const handleRemoveGroup = (groupId) => {
        const group = scenarioGroups.find(g => g.id === groupId);
        if (group?.scenarios.length > 0) {
            alert(t('errorDeleteGroup', 'Chỉ có thể xóa khối rỗng.'));
            return;
        }
        
        // Also remove dependencies on this group from others
        const updatedGroups = scenarioGroups
            .filter(g => g.id !== groupId)
            .map(g => ({
                ...g,
                dependsOn: (g.dependsOn || []).filter(depId => depId !== groupId)
            }));

        setScenarioGroups(updatedGroups);
    };
    
    const handleToggleGroupCollapse = (groupId) => {
        setCollapsedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return alert('Vui lòng nhập tên Drill.');

        const scenariosPayload = scenarioGroups.flatMap(group =>
            group.scenarios.map(scen => ({
                id: scen.id,
                dependsOn: scen.dependsOn || [],
                group: group.name,
            }))
        );
        
        const groupDependenciesPayload = scenarioGroups
            .filter(g => g.dependsOn && g.dependsOn.length > 0)
            .map(g => ({
                group: g.name,
                dependsOn: g.dependsOn.map(depId => scenarioGroups.find(depG => depG.id === depId)?.name).filter(Boolean)
            }));

        const payload = {
            name, description, basis,
            start_date: startDate, end_date: endDate,
            status: basis ? status : 'Draft',
            scenarios: scenariosPayload,
            step_assignments: stepAssignments,
            checkpoints: checkpoints,
            group_dependencies: groupDependenciesPayload
        };

        try {
            const url = drillToEdit?.id ? `/api/drills/${drillToEdit.id}` : '/api/drills';
            const method = drillToEdit?.id ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to save drill');
            onDataRefresh();
            onDoneEditing();
        } catch (error) {
            console.error(error);
            alert('Lỗi lưu Drill.');
        }
    };
    
    const filteredAvailableScenarios = availableScenarios.filter(scen => {
        const term = scenarioSearchTerm.toLowerCase();
        return scen.name?.toLowerCase().includes(term) || String(scen.application)?.toLowerCase().includes(term);
    });

    const totalSelectedScenarios = scenarioGroups.reduce((sum, group) => sum + group.scenarios.length, 0);

    return (
        <>
            {editingCheckpointFor && (
                <CheckpointModal
                    t={t}
                    scenario={flatScenariosForDependencies.find(s => s.id === editingCheckpointFor)}
                    checkpoint={checkpoints[editingCheckpointFor]}
                    onSave={handleSaveCheckpoint}
                    onClose={() => setEditingCheckpointFor(null)}
                />
            )}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <button onClick={onDoneEditing} className="text-[#00558F] hover:underline mb-4">&larr; {t('back')}</button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{drillToEdit ? t('editDrillTitle') : t('createDrillTitle')}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Drill Info Fields */}
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

                    <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
                        {/* Available Scenarios */}
                        <div className="w-full md:w-1/3 flex flex-col">
                             <h3 className="font-bold text-gray-900 mb-2">{t('availableScenarios')}</h3>
                            <div className="relative mb-2">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                </span>
                                <input type="text" placeholder={t('searchScenarioPlaceholder', 'Tìm theo tên, ứng dụng...')} value={scenarioSearchTerm} onChange={e => setScenarioSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition" />
                            </div>
                            <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'available')} className="bg-gray-100 p-4 rounded-lg flex-grow border-dashed border-2 border-gray-300 space-y-2 overflow-y-auto min-h-[300px]">
                                {filteredAvailableScenarios.length > 0 ? filteredAvailableScenarios.map(scen => (
                                    <div key={scen.id} draggable onDragStart={(e) => handleDragStart(e, scen, 'available')} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 flex items-center justify-between gap-2 cursor-move wiggle-on-drag">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-gray-800">{scen.name}</p>
                                            <p className="text-xs text-gray-500">{scen.role}</p>
                                        </div>
                                        <button type="button" onClick={() => handleAddScenario(scen, scenarioGroups[0]?.id)} disabled={!scenarioGroups.length} onMouseDown={(e) => e.stopPropagation()} className="p-2 rounded-full text-sky-600 hover:bg-sky-100 hover:text-sky-800 transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50" title={t('addToDrill', 'Thêm vào diễn tập')}>
                                            <PlusIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                )) : <p className="text-gray-500 text-center py-10">{t('noScenariosFound', 'Không tìm thấy kịch bản nào.')}</p>}
                            </div>
                        </div>
                        {/* Scenarios in Drill (with Groups) */}
                        <div className="w-full md:w-2/3">
                            <h3 className="font-bold text-gray-900 mb-2">{t('scenariosInDrill')}</h3>
                            <div className="bg-sky-50 p-4 rounded-lg min-h-[400px] border-dashed border-2 border-sky-300 space-y-4">
                                {scenarioGroups.map((group, groupIndex) => (
                                    <div key={group.id} className="bg-white/60 p-3 rounded-lg border border-sky-200">
                                        <div className="flex items-start justify-between mb-2 gap-4">
                                            <div className="flex-grow">
                                                <div className="flex items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleGroupCollapse(group.id)}
                                                        className="p-1.5 rounded-full text-sky-700 hover:bg-sky-100 transition-colors"
                                                        title={collapsedGroups.includes(group.id) ? t('expand', 'Mở rộng') : t('collapse', 'Thu gọn')}
                                                    >
                                                        {collapsedGroups.includes(group.id) ? <ArrowDownIcon /> : <ArrowUpIcon />}
                                                    </button>
                                                    <input type="text" value={group.name} onChange={(e) => handleGroupNameChange(group.id, e.target.value)} className="font-bold text-lg text-sky-800 bg-transparent border-0 border-b-2 border-transparent focus:border-sky-500 focus:ring-0 p-1 w-full" placeholder={t('groupNamePlaceholder', 'Nhập tên khối...')} />
                                                </div>
                                                 {!collapsedGroups.includes(group.id) && (
                                                    <div className="mt-2 pl-8">
                                                        <GroupDependencySelector t={t} currentGroup={group} allGroups={scenarioGroups} onDependencyChange={handleGroupDependencyChange} />
                                                    </div>
                                                 )}
                                            </div>
                                            <button type="button" onClick={() => handleRemoveGroup(group.id)} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0" title={t('deleteGroup', 'Xóa khối')}>
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {!collapsedGroups.includes(group.id) && (
                                            <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'selected', group.id)} className="min-h-[60px] p-2 rounded-md bg-white/50 border border-transparent space-y-2">
                                                {group.scenarios.length === 0 && <p className="text-gray-400 text-sm text-center py-4">{t('dragScenarioToGroup', 'Kéo kịch bản vào đây')}</p>}
                                                {group.scenarios.map(scen => {
                                                    const globalIndex = flatScenariosForDependencies.findIndex(s => s.id === scen.id);
                                                    return (
                                                        <div key={scen.id} onDragOver={handleDragOver} onDrop={(e) => handleDropOnItem(e, scen.id, group.id)} className="relative" style={{ zIndex: totalSelectedScenarios - globalIndex }}>
                                                            <div draggable onDragStart={(e) => handleDragStart(e, scen, 'selected', group.id)} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move wiggle-on-drag">
                                                                <div className="flex justify-between items-start gap-4">
                                                                    <div className="flex-grow">
                                                                        <p className="font-semibold text-gray-800">{globalIndex + 1}. {scen.name}</p>
                                                                        <DependencySelector item={scen} itemList={flatScenariosForDependencies} currentIndex={globalIndex} onDependencyChange={(deps) => handleDependencyChange(scen.id, deps)} />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <div className={`relative action-menu-container-${scen.id}`}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setOpenActionMenu(openActionMenu === scen.id ? null : scen.id)}
                                                                                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200"
                                                                            >
                                                                                <DotsVerticalIcon className="h-5 w-5" />
                                                                            </button>
                                                                            {openActionMenu === scen.id && (
                                                                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-xl z-20 border">
                                                                                    <div className="py-1">
                                                                                        <div className="px-3 py-2 text-sm text-gray-700 border-b">
                                                                                            <label className="flex items-center gap-2 w-full">
                                                                                                <MoveIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                                                <select
                                                                                                    value={group.id}
                                                                                                    onChange={(e) => {
                                                                                                        handleMoveScenarioToGroup(scen, group.id, e.target.value);
                                                                                                        setOpenActionMenu(null);
                                                                                                    }}
                                                                                                    className="text-sm bg-white border border-gray-300 rounded-md p-1 w-full focus:ring-sky-500 focus:border-sky-500"
                                                                                                    title={t('moveToGroup', 'Chuyển tới khối...')}
                                                                                                    disabled={scenarioGroups.length <= 1}
                                                                                                >
                                                                                                    {scenarioGroups.map(targetGroup => (
                                                                                                        <option key={targetGroup.id} value={targetGroup.id}>
                                                                                                            {targetGroup.name}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            </label>
                                                                                        </div>
                                                                                        {scen.steps?.length > 0 && (
                                                                                            <>
                                                                                                <div className="px-3 py-2 text-sm text-gray-700 border-b">
                                                                                                    <label className="flex items-center gap-2 w-full">
                                                                                                        <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                                                        <select
                                                                                                            value={scenarioAssignments[scen.id] || ''}
                                                                                                            onChange={e => handleScenarioAssigneeChange(scen.id, e.target.value)}
                                                                                                            className="text-sm bg-white border border-gray-300 rounded-md p-1 w-full focus:ring-sky-500 focus:border-sky-500"
                                                                                                            aria-label={`Assign all steps for ${scen.name}`}
                                                                                                        >
                                                                                                            <option value="">{t('assignScenario', 'Giao toàn bộ')}</option>
                                                                                                            {db.users.map(u => (<option key={u.id} value={u.id}>{u.fullname || u.username}</option>))}
                                                                                                        </select>
                                                                                                    </label>
                                                                                                </div>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        setExpandedScenario(expandedScenario === scen.id ? null : scen.id);
                                                                                                        setOpenActionMenu(null);
                                                                                                    }}
                                                                                                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                                                >
                                                                                                    {expandedScenario === scen.id ? t('collapse') : t('details', 'Chi tiết')}
                                                                                                </button>
                                                                                            </>
                                                                                        )}
                                                                                        <div className="border-t">
                                                                                             <button type="button" onClick={() => {handleRemoveScenario(scen, group.id); setOpenActionMenu(null);}} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                                                                <TrashIcon className="h-4 w-4" /> {t('removeFromDrill', 'Xóa khỏi diễn tập')}
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
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
                                                                                        <select value={stepAssignments[stepId] || ''} onChange={e => handleAssigneeChange(stepId, e.target.value)} className="text-sm bg-white border border-gray-300 rounded-md p-1">
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
                                                                    <CheckpointIcon /> {checkpoints[scen.id] ? t('editCheckpoint') : t('addCheckpoint')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {totalSelectedScenarios === 0 && (
                                    <div className="flex items-center justify-center h-full min-h-[200px]" onDragOver={handleDragOver} onDrop={(e) => scenarioGroups[0] && handleDrop(e, 'selected', scenarioGroups[0].id)}>
                                        <p className="text-gray-500 text-center">{t('dragScenarioHere')}</p>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <button type="button" onClick={handleAddGroup} className="flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-800">
                                        <PlusIcon /> {t('addGroup', 'Thêm khối')}
                                    </button>
                                </div>
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

