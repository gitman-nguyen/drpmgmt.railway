import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import DependencySelector from '../components/common/DependencySelector';

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
        } else {
            setAvailableScenarios(allScenarios);
        }
    }, [drillToEdit, db.scenarios]);

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
                                <div key={scen.id} draggable onDragStart={(e) => handleDragStart(e, scen, 'selected')} onDragOver={handleDragOver} onDrop={(e) => handleDropOnItem(e, scen.id)} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move wiggle-on-drag">
                                    <p className="font-semibold text-gray-800">{index + 1}. {scen.name}</p>
                                    <DependencySelector 
                                        item={scen}
                                        itemList={selectedScenarios}
                                        currentIndex={index}
                                        onDependencyChange={(deps) => handleDependencyChange(scen.id, deps)}
                                    />
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
    );
};
export default CreateDrillScreen;
