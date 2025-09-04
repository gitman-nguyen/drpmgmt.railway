import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import RichTextEditor from '../components/common/RichTextEditor';
import DependencySelector from '../components/common/DependencySelector';
import { EditIcon, CloneIcon, SubmitApprovalIcon, ApproveIcon, RejectIcon, DragHandleIcon, DownloadIcon, UploadIcon, PaperClipIcon, DeleteIcon } from '../components/icons';

const ScenarioManagementScreen = ({ db, setDb, user, onDataRefresh, isXlsxReady }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScenario, setEditingScenario] = useState(null);
    const [draggedStepIndex, setDraggedStepIndex] = useState(null);
    const [expandedStepIndex, setExpandedStepIndex] = useState(0);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });
    
    const [scenarioAttachment, setScenarioAttachment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedScenarios, setSelectedScenarios] = useState([]);

    const initialFormState = { name: '', applicationName: '', role: user.role === 'ADMIN' ? 'TECHNICAL' : user.role, basis: '', status: 'Draft' };
    const initialStepState = [{ id: `temp-${Date.now()}`, title: '', description: '', estimatedTime: '', dependsOn: [] }];

    const [formData, setFormData] = useState(initialFormState);
    const [stepInputs, setStepInputs] = useState(initialStepState);

    const handleAddStep = () => {
        setStepInputs([...stepInputs, { id: `temp-${Date.now()}`, title: '', description: '', estimatedTime: '', dependsOn: [] }]);
        setExpandedStepIndex(stepInputs.length);
    };
    
    const handleRemoveStep = (index) => {
        const removedStepId = stepInputs[index].id;
        const newSteps = stepInputs.filter((_, i) => i !== index);
        const updatedSteps = newSteps.map(step => ({
            ...step,
            dependsOn: (step.dependsOn || []).filter(id => id !== removedStepId)
        }));
        setStepInputs(updatedSteps);
    };

    const handleStepChange = (index, field, value) => {
        const newSteps = [...stepInputs];
        newSteps[index][field] = value;
        setStepInputs(newSteps);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
            alert(`Lỗi: Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 5MB.`);
            e.target.value = null;
            return;
        }

        if (file.type === "application/pdf") {
            setScenarioAttachment({
                file: file,
                name: file.name
            });
        } else {
            alert('Chỉ chấp nhận tệp định dạng PDF.');
            e.target.value = null;
        }
    };

    const handleRemoveAttachment = () => {
        setScenarioAttachment(null);
    };

    const handleOpenModal = (scenarioToEdit = null, isClone = false, importedData = null) => {
        if (importedData) {
            setEditingScenario(null);
            setFormData({ ...initialFormState, name: importedData.name });
            setStepInputs(importedData.steps);
            setScenarioAttachment(null);
        } else if (scenarioToEdit) {
            setEditingScenario(isClone ? null : scenarioToEdit);
            setFormData({ 
                name: isClone ? `${scenarioToEdit.name} (Copy)` : scenarioToEdit.name, 
                applicationName: scenarioToEdit.application_name || '', 
                role: scenarioToEdit.role, 
                basis: scenarioToEdit.basis, 
                status: scenarioToEdit.status 
            });
            setScenarioAttachment(scenarioToEdit.attachment || null);
            
            const stepsForScenario = (scenarioToEdit.steps || []).map(stepId => {
                return { ...db.steps[stepId] };
            });
            setStepInputs(stepsForScenario.length > 0 ? stepsForScenario : initialStepState);
        } else {
            setEditingScenario(null);
            setFormData(initialFormState);
            setStepInputs(initialStepState);
            setScenarioAttachment(null);
        }
        setExpandedStepIndex(0);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const trimmedName = formData.name.trim();
        const trimmedAppName = formData.applicationName.trim();

        if (!trimmedName || !trimmedAppName) {
            alert('Vui lòng nhập tên kịch bản và tên ứng dụng.');
            return;
        }

        const isDuplicate = Object.values(db.scenarios).some(
            s => s.name.toLowerCase() === trimmedName.toLowerCase() && s.id !== (editingScenario ? editingScenario.id : null)
        );

        if (isDuplicate) {
            alert('Lỗi: Tên kịch bản này đã tồn tại. Vui lòng chọn một tên khác.');
            return;
        }
        
        for (const step of stepInputs) {
            if (!step.title.trim() || !step.description.trim() || step.description.trim() === "<p><br></p>") {
                alert('Vui lòng nhập đầy đủ Tên bước và Mô tả cho tất cả các bước.');
                return;
            }
        }
        
        try {
            let finalAttachmentPayload = null;
            if (scenarioAttachment) {
                if (scenarioAttachment.file) {
                    const readFileAsDataURL = (file) => {
                         return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = (error) => reject(error);
                            reader.readAsDataURL(file);
                        });
                    };
                    const base64String = await readFileAsDataURL(scenarioAttachment.file);
                    finalAttachmentPayload = {
                        name: scenarioAttachment.name,
                        data: base64String,
                    };
                } else {
                    finalAttachmentPayload = scenarioAttachment;
                }
            }

            const payload = {
                ...formData,
                name: trimmedName,
                applicationName: trimmedAppName, 
                status: formData.basis ? formData.status : 'Draft',
                created_by: user.id,
                steps: stepInputs,
                attachment: finalAttachmentPayload,
            };

            let response;
            if (editingScenario) {
                response = await fetch(`/api/scenarios/${editingScenario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/api/scenarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
                console.error('Save error:', errorData);
                throw new Error(errorData.message || 'Failed to save scenario');
            }
            
            setIsModalOpen(false);
            onDataRefresh();
        } catch (error) {
            console.error(error);
            alert(`Lỗi lưu kịch bản: ${error.message}`);
        }
    };
    
    const handleStatusChange = async (scenarioId, newStatus) => {
        try {
            const response = await fetch(`/api/scenarios/${scenarioId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update scenario status');
            onDataRefresh();
        } catch (error) {
            console.error(error);
            alert('Lỗi cập nhật trạng thái kịch bản.');
        }
    };

    const isScenarioInUse = (scenarioId) => {
        const drillsUsingScenario = Object.values(db.drills).filter(drill => 
            drill.scenarios.some(s => s.id === scenarioId)
        );
        return drillsUsingScenario;
    };

    const handleRequestDeletion = (scenarioId) => {
        const drillsInUse = isScenarioInUse(scenarioId);
        if (drillsInUse.length > 0) {
            const drillNames = drillsInUse.map(d => d.name).join(', ');
            alert(`Không thể yêu cầu xóa. Kịch bản đang được sử dụng trong các drill sau: ${drillNames}`);
            return;
        }

        setConfirmModal({
            isOpen: true,
            message: t('requestDeleteConfirmation'),
            onConfirm: () => {
                handleStatusChange(scenarioId, 'Pending Deletion');
                setConfirmModal({ isOpen: false, message: '', onConfirm: null });
            }
        });
    };
    
    const handleApproveDeletion = (scenarioId) => {
        const drillsInUse = isScenarioInUse(scenarioId);
        if (drillsInUse.length > 0) {
            const drillNames = drillsInUse.map(d => d.name).join(', ');
            alert(`Không thể xóa. Kịch bản đang được sử dụng trong các drill sau: ${drillNames}`);
            return;
        }

        setConfirmModal({
            isOpen: true,
            message: t('deleteConfirmation'),
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/scenarios/${scenarioId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Failed to delete scenario');
                    onDataRefresh();
                } catch (error) {
                    console.error(error);
                    alert('Lỗi xóa kịch bản.');
                } finally {
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                }
            }
        });
    };
    
    const handleRejectDeletion = (scenarioId) => {
        handleStatusChange(scenarioId, 'Draft');
    };

    const filteredScenarios = useMemo(() => Object.values(db.scenarios).filter(s => {
        const userFilter = user.role === 'ADMIN' || s.created_by === user.id;
        const searchFilter = searchTerm === '' || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.application_name && s.application_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return userFilter && searchFilter;
    }), [db.scenarios, user.role, user.id, searchTerm]);

    const handleSelectScenario = (scenarioId) => {
        setSelectedScenarios(prev => 
            prev.includes(scenarioId) 
            ? prev.filter(id => id !== scenarioId)
            : [...prev, scenarioId]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedScenarios(filteredScenarios.map(s => s.id));
        } else {
            setSelectedScenarios([]);
        }
    };

    const handleDeleteSelected = () => {
        const scenariosInUse = selectedScenarios.map(id => ({ id, drills: isScenarioInUse(id) })).filter(s => s.drills.length > 0);

        if (scenariosInUse.length > 0) {
            let alertMessage = 'Không thể xóa các kịch bản sau vì chúng đang được sử dụng:\n';
            scenariosInUse.forEach(s => {
                const scenarioName = db.scenarios[s.id]?.name;
                const drillNames = s.drills.map(d => d.name).join(', ');
                alertMessage += `\n- ${scenarioName} (trong các drill: ${drillNames})`;
            });
            alert(alertMessage);
            return;
        }

        setConfirmModal({
            isOpen: true,
            message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedScenarios.length} kịch bản đã chọn không? Thao tác này không thể hoàn tác.`,
            onConfirm: async () => {
                try {
                    await Promise.all(selectedScenarios.map(id => 
                        fetch(`/api/scenarios/${id}`, { method: 'DELETE' })
                    ));
                    onDataRefresh();
                    setSelectedScenarios([]);
                } catch (error) {
                    console.error(error);
                    alert('Lỗi khi xóa các kịch bản đã chọn.');
                } finally {
                    setConfirmModal({ isOpen: false, message: '', onConfirm: null });
                }
            }
        });
    };

    const handleDragStart = (e, index) => {
        setDraggedStepIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedStepIndex === null) return;

        const newSteps = [...stepInputs];
        const draggedItem = newSteps[draggedStepIndex];
        
        newSteps.splice(draggedStepIndex, 1);
        newSteps.splice(targetIndex, 0, draggedItem);
        
        setStepInputs(newSteps);
        setDraggedStepIndex(null);
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN')}`;
    };

    const getStatusClass = (status) => {
        switch(status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Pending Approval': return 'bg-yellow-100 text-yellow-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Pending Deletion': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const handleDownloadTemplate = () => {
        if (typeof window.XLSX === 'undefined') {
            alert(t('excelLibraryNotReady'));
            return;
        }
        const headers = ['STT', 'Tên bước', 'Mô tả (HTML)', 'Thời gian dự kiến (hh:mm:ss)', 'Phụ thuộc (STT bước trước, cách nhau bởi dấu phẩy)'];
        const sampleData = [
            [1, 'Khởi động hệ thống A', 'Bước 1: Bật nguồn.\nBước 2: Kiểm tra đèn.', '00:10:00', ''],
            [2, 'Đăng nhập vào hệ thống B', 'Sử dụng tài khoản admin để đăng nhập.', '00:05:00', '1'],
        ];
        const data = [headers, ...sampleData];
        const ws = window.XLSX.utils.aoa_to_sheet(data);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Scenario Template");
        window.XLSX.writeFile(wb, "Scenario_Template.xlsx");
    };

    const handleFileImport = (e) => {
        if (typeof window.XLSX === 'undefined') {
            alert(t('excelLibraryNotReady'));
            return;
        }
        const file = e.target.files[0];
        if (!file) return;
        setIsImporting(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = window.XLSX.utils.sheet_to_json(worksheet);

                const tempSteps = json.map((row, index) => ({
                    id: `temp-import-${Date.now()}-${index}`,
                    stt: row['STT'],
                    title: row['Tên bước'] || '',
                    description: (row['Mô tả (HTML)'] || '').replace(/\r?\n/g, '<br />'),
                    estimated_time: row['Thời gian dự kiến (hh:mm:ss)'] || '',
                    dependsOnRaw: String(row['Phụ thuộc (STT bước trước, cách nhau bởi dấu phẩy)'] || '').trim(),
                }));

                const finalSteps = tempSteps.map(step => {
                    let dependsOn = [];
                    if (step.dependsOnRaw) {
                        const depNumbers = step.dependsOnRaw.split(',').map(n => parseInt(n.trim(), 10));
                        depNumbers.forEach(num => {
                            const foundDep = tempSteps.find(s => s.stt === num);
                            if (foundDep) {
                                dependsOn.push(foundDep.id);
                            }
                        });
                    }
                    return { id: step.id, title: step.title, description: step.description, estimated_time: step.estimated_time, dependsOn };
                });

                const scenarioName = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
                handleOpenModal(null, false, { name: scenarioName, steps: finalSteps });

            } catch (error) {
                console.error("Error parsing Excel file:", error);
                alert(t('importError'));
            } finally {
                setIsImporting(false);
                e.target.value = null; 
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-gray-900">{t('scenarioList')}</h2>
                    <div className="flex items-center space-x-2">
                        <input 
                            type="text"
                            placeholder="Tìm kiếm theo tên..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                        {selectedScenarios.length > 0 && user.role === 'ADMIN' ? (
                             <button onClick={handleDeleteSelected} className="flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                                <DeleteIcon /> <span className="ml-2">Xóa ({selectedScenarios.length})</span>
                            </button>
                        ) : (
                            <>
                                <button onClick={handleDownloadTemplate} disabled={!isXlsxReady || isImporting} className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <DownloadIcon /> <span className="hidden sm:inline ml-2">{t('downloadTemplate')}</span>
                                </button>
                                <button onClick={() => fileInputRef.current.click()} disabled={!isXlsxReady || isImporting} className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isImporting ? t('importing') : <><UploadIcon /> <span className="hidden sm:inline ml-2">{t('importFromExcel')}</span></>}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .xls" />
                                <button onClick={() => handleOpenModal()} className="bg-[#00558F] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#004472]">{t('createNewScenario')}</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                         <thead className="border-b border-gray-200">
                            <tr>
                                {user.role === 'ADMIN' && (
                                    <th className="py-3 px-4 w-12">
                                        <input 
                                            type="checkbox"
                                            className="rounded"
                                            onChange={handleSelectAll}
                                            checked={filteredScenarios.length > 0 && selectedScenarios.length === filteredScenarios.length}
                                        />
                                    </th>
                                )}
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('scenarioName')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('application')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('creator')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('lastUpdated')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredScenarios.map(s => {
                                const creator = db.users.find(u => u.id === s.created_by);
                                const isSelected = selectedScenarios.includes(s.id);
                                return (
                                <tr key={s.id} className={`border-b border-gray-100 ${isSelected ? 'bg-sky-50' : 'hover:bg-gray-50'}`}>
                                    {user.role === 'ADMIN' && (
                                        <td className="py-3 px-4">
                                            <input 
                                                type="checkbox"
                                                className="rounded"
                                                checked={isSelected}
                                                onChange={() => handleSelectScenario(s.id)}
                                            />
                                        </td>
                                    )}
                                    <td className="py-3 px-4 text-gray-800">{s.name}</td>
                                    <td className="py-3 px-4 text-gray-600">{s.application_name}</td>
                                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusClass(s.status)}`}>{t(s.status.toLowerCase().replace(' ', '')) || s.status}</span></td>
                                    <td className="py-3 px-4 text-gray-600">{creator ? creator.username : 'N/A'}</td>
                                    <td className="py-3 px-4 text-gray-600">{formatDate(s.last_updated_at)}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-2">
                                            {selectedScenarios.length === 0 && (
                                                <>
                                                    {(user.role === 'ADMIN' || user.id === s.created_by) && s.status !== 'Pending Deletion' && (
                                                        <>
                                                            <button onClick={() => handleOpenModal(s)} title={t('edit')} className="p-2 rounded-lg text-yellow-600 bg-yellow-100 hover:bg-yellow-200"><EditIcon /></button>
                                                            <button onClick={() => handleOpenModal(s, true)} title={t('clone')} className="p-2 rounded-lg text-purple-600 bg-purple-100 hover:bg-purple-200"><CloneIcon /></button>
                                                        </>
                                                    )}
                                                    {user.role !== 'ADMIN' && s.status === 'Draft' && s.basis && (
                                                        <button onClick={() => handleStatusChange(s.id, 'Pending Approval')} title={t('submitForApproval')} className="p-2 rounded-lg text-blue-600 bg-blue-100 hover:bg-blue-200"><SubmitApprovalIcon /></button>
                                                    )}
                                                    {user.role === 'ADMIN' && s.status === 'Pending Approval' && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(s.id, 'Active')} title={t('approve')} className="p-2 rounded-lg text-green-600 bg-green-100 hover:bg-green-200"><ApproveIcon /></button>
                                                            <button onClick={() => handleStatusChange(s.id, 'Rejected')} title={t('reject')} className="p-2 rounded-lg text-red-600 bg-red-100 hover:bg-red-200"><RejectIcon /></button>
                                                        </>
                                                    )}
                                                    {user.role !== 'ADMIN' && (user.id === s.created_by) && s.status !== 'Pending Deletion' && (
                                                        <button onClick={() => handleRequestDeletion(s.id)} title={t('requestDeletion')} className="p-2 rounded-lg text-red-600 bg-red-100 hover:bg-red-200"><DeleteIcon /></button>
                                                    )}
                                                    {user.role === 'ADMIN' && s.status !== 'Pending Deletion' && (
                                                        <button onClick={() => handleApproveDeletion(s.id)} title={t('delete')} className="p-2 rounded-lg text-red-600 bg-red-100 hover:bg-red-200"><DeleteIcon /></button>
                                                    )}
                                                    {user.role === 'ADMIN' && s.status === 'Pending Deletion' && (
                                                        <>
                                                            <button onClick={() => handleApproveDeletion(s.id)} title={t('approveDeletion')} className="p-2 rounded-lg text-green-600 bg-green-100 hover:bg-green-200"><ApproveIcon /></button>
                                                            <button onClick={() => handleRejectDeletion(s.id)} title={t('rejectDeletion')} className="p-2 rounded-lg text-red-600 bg-red-100 hover:bg-red-200"><RejectIcon /></button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex-shrink-0">{editingScenario ? t('editScenario') : t('createScenario')}</h3>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('scenarioName')}</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none" required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('applicationName')}</label>
                                    <input type="text" value={formData.applicationName} onChange={(e) => setFormData({...formData, applicationName: e.target.value})} className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none" required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('role')}</label>
                                    {user.role === 'ADMIN' ? (
                                        <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                                            <option value="TECHNICAL">TECHNICAL</option>
                                            <option value="BUSINESS">BUSINESS</option>
                                        </select>
                                    ) : (
                                        <input type="text" value={formData.role} className="mt-1 block w-full bg-gray-200 border border-gray-300 rounded-md p-2 text-gray-500" readOnly/>
                                    )}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">{t('basisForConstruction')}</label>
                                <textarea value={formData.basis} onChange={(e) => setFormData({...formData, basis: e.target.value})} rows="2" className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">{t('attachPDF', 'Đính kèm PDF cho kịch bản')}</label>
                                {scenarioAttachment && scenarioAttachment.name ? (
                                    <div className="mt-1 flex items-center justify-between bg-gray-200 p-2 rounded-md">
                                        <div className="flex items-center min-w-0">
                                            <PaperClipIcon />
                                            <span className="text-sm text-gray-800 truncate ml-2">{scenarioAttachment.name}</span>
                                        </div>
                                        <button type="button" onClick={handleRemoveAttachment} className="text-red-500 hover:text-red-700 font-bold ml-2 text-xl flex-shrink-0">&times;</button>
                                    </div>
                                ) : (
                                    <input 
                                        type="file" 
                                        accept=".pdf" 
                                        onChange={handleFileChange} 
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer" 
                                    />
                                )}
                            </div>

                            {user.role === 'ADMIN' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">{t('scenarioStatus')}</label>
                                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} disabled={!formData.basis} className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-50">
                                        <option value="Draft">{t('draft')}</option>
                                        <option value="Active">{t('active')}</option>
                                    </select>
                                    {!formData.basis && <p className="text-xs text-yellow-600 mt-1">{t('basisRequiredMessage')}</p>}
                                </div>
                            )}

                            <h4 className="font-bold text-gray-900 mt-6 mb-2">{t('steps')}</h4>
                            <div className="space-y-2">
                                {stepInputs.map((step, index) => (
                                    <div 
                                        key={step.id || index} 
                                        className={`border border-gray-200 rounded-md bg-gray-50 transition-all duration-300 ${draggedStepIndex === index ? 'opacity-50' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                    >
                                        <div className="p-2 flex items-center space-x-2">
                                            <div className="cursor-move text-gray-400 wiggle-on-drag">
                                                <DragHandleIcon />
                                            </div>
                                            <div className="flex-1 cursor-pointer" onClick={() => setExpandedStepIndex(expandedStepIndex === index ? null : index)}>
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-bold text-gray-800">{t('step')} {index + 1}: {step.title || t('noTitle')}</h4>
                                                    <div className="flex items-center space-x-4">
                                                    {stepInputs.length > 1 && (
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveStep(index); }} className="text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                                    )}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedStepIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {expandedStepIndex === index && (
                                            <div className="p-4 border-t border-gray-200 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-medium text-gray-600">{t('stepName')} <span className="text-red-500">{t('requiredField')}</span></label>
                                                        <input type="text" placeholder={t('stepTitlePlaceholder')} value={step.title} onChange={e => handleStepChange(index, 'title', e.target.value)} className="mt-1 block w-full bg-white border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600">{t('estimatedTime')}</label>
                                                        <input type="text" placeholder="hh:mm:ss" value={step.estimated_time} onChange={e => handleStepChange(index, 'estimated_time', e.target.value)} className="mt-1 block w-full bg-white border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600">{t('stepDescription')} <span className="text-red-500">{t('requiredField')}</span></label>
                                                    <RichTextEditor value={step.description} onChange={value => handleStepChange(index, 'description', value)} />
                                                </div>
                                                
                                                <DependencySelector 
                                                    item={step}
                                                    itemList={stepInputs}
                                                    currentIndex={index}
                                                    onDependencyChange={(deps) => handleStepChange(index, 'dependsOn', deps)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={handleAddStep} className="mt-4 text-[#00558F] hover:underline text-sm font-semibold">{t('addStep')}</button>
                            <div className="flex justify-end space-x-2 mt-6 border-t border-gray-200 pt-4 flex-shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 py-2 px-4 rounded-lg text-gray-800 hover:bg-gray-300">{t('cancel')}</button>
                                <button type="submit" className="bg-[#00558F] hover:bg-[#004472] text-white font-semibold py-2 px-4 rounded-lg">{editingScenario ? t('saveChanges') : t('saveScenario')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('confirm')}</h3>
                        <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })} className="bg-gray-200 py-2 px-4 rounded-lg text-gray-800 hover:bg-gray-300">{t('cancel')}</button>
                            <button onClick={confirmModal.onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">{t('confirm')}</button> 
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
export default ScenarioManagementScreen;

