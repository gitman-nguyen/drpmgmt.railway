import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

// --- TRANSLATION DATA ---
const translations = {
  vi: {
    loginTitle: 'Đăng nhập Hệ thống',
    loginSubtitle: 'Vui lòng nhập thông tin để tiếp tục',
    username: 'Tên đăng nhập',
    password: 'Mật khẩu',
    loginButton: 'Đăng nhập',
    invalidCredentials: 'Tên đăng nhập hoặc mật khẩu không hợp lệ.',
    welcome: 'Chào',
    logout: 'Đăng xuất',
    dashboard: 'Bảng điều khiển',
    scenarioManagement: 'Quản lý Kịch bản',
    userManagement: 'Quản lý User',
    drills: 'Các đợt diễn tập',
    createNewDrill: 'Tạo Drill Mới',
    openDrill: 'Mở Drill',
    closeDrill: 'Đóng Drill',
    execute: 'Thực thi',
    viewReport: 'Xem Báo cáo',
    edit: 'Sửa',
    clone: 'Nhân bản',
    userList: 'Danh sách Người dùng',
    addUser: 'Thêm User',
    editUser: 'Sửa User',
    createUser: 'Tạo User Mới',
    role: 'Vai trò',
    action: 'Hành động',
    cancel: 'Hủy',
    save: 'Lưu',
    saveChanges: 'Lưu thay đổi',
    backToDashboard: 'Quay lại Bảng điều khiển',
    scenarios: 'Kịch bản',
    selectScenarioToViewSteps: 'Chọn một kịch bản để xem các bước.',
    scenarioLocked: 'Kịch bản bị khóa',
    scenarioLockedMessage: 'Cần hoàn thành kịch bản "{scenarioName}" trước.',
    step: 'Bước',
    start: 'Bắt đầu',
    complete: 'Hoàn thành',
    confirmScenarioResult: 'Xác nhận Kết quả Kịch bản',
    confirmScenarioResultMessage: 'Kịch bản này có bước thất bại. Vui lòng chọn kết quả cuối cùng và nhập lý do.',
    finalResult: 'Kết quả cuối cùng',
    failureConfirmed: 'Thất bại',
    successOverridden: 'Thành công (Bỏ qua lỗi)',
    reasonPlaceholder: 'Nhập lý do...',
    confirmResult: 'Xác nhận Kết quả',
    resultConfirmed: 'Đã xác nhận kết quả',
    completeStepTitle: 'Hoàn thành: {stepTitle}',
    status: 'Trạng thái',
    success: 'Thành công',
    failure: 'Thất bại',
    blocked: 'Bị chặn',
    resultNotes: 'Ghi chú kết quả',
    submit: 'Gửi',
    drillReportTitle: 'Báo cáo Diễn tập: {drillName}',
    totalTime: 'Tổng thời gian',
    participants: 'Người tham gia',
    successfulSteps: 'Bước thành công',
    failedSteps: 'Bước thất bại',
    scenarioSummary: 'Tóm tắt Kịch bản',
    scenarioName: 'Kịch bản',
    notCompleted: 'Chưa hoàn thành',
    completedWithOverride: 'Hoàn thành (Bỏ qua lỗi)',
    confirmationReason: 'Lý do xác nhận:',
    createDrillTitle: 'Tạo Drill Diễn tập Mới',
    editDrillTitle: 'Sửa Drill',
    back: 'Quay lại',
    drillName: 'Tên Drill',
    description: 'Mô tả',
    availableScenarios: 'Kịch bản có sẵn',
    scenariosInDrill: 'Kịch bản trong Drill',
    dragScenarioHere: 'Kéo kịch bản vào đây',
    dependsOn: 'Phụ thuộc vào:',
    none: 'Không',
    createDrill: 'Tạo Drill',
    scenarioList: 'Danh sách Kịch bản',
    createNewScenario: 'Tạo Kịch bản Mới',
    documentType: 'Loại tài liệu',
    creator: 'Người tạo',
    lastUpdated: 'Cập nhật lần cuối',
    stepCount: 'Số bước',
    editScenario: 'Sửa Kịch bản',
    createScenario: 'Tạo Kịch bản Mới',
    steps: 'Các bước thực hiện',
    stepTitlePlaceholder: 'Tiêu đề bước',
    stepName: 'Tên bước',
    estimatedTime: 'Thời gian dự kiến',
    stepDescription: 'Mô tả các bước thực hiện',
    addStep: '+ Thêm bước',
    saveScenario: 'Lưu Kịch bản',
    requiredField: '*',
    noTitle: '(Chưa có tiêu đề)',
    firstName: 'Tên',
    lastName: 'Họ',
    roleDescription: 'Mô tả quyền',
    adminRoleDesc: 'Quản trị viên: Có toàn quyền quản lý hệ thống, bao gồm quản lý người dùng, kịch bản và các đợt diễn tập.',
    technicalRoleDesc: 'Kỹ thuật: Có thể tạo và quản lý các kịch bản kỹ thuật, tham gia thực thi các bước kỹ thuật trong đợt diễn tập.',
    businessRoleDesc: 'Nghiệp vụ: Có thể tạo và quản lý các kịch bản nghiệp vụ (ví dụ: truyền thông), tham gia thực thi các bước liên quan.',
    basisForConstruction: 'Căn cứ xây dựng',
    basisRequiredMessage: 'Vui lòng nhập Căn cứ xây dựng để kích hoạt.',
    draft: 'Bản nháp',
    active: 'Hoạt động',
    pendingApproval: 'Chờ duyệt',
    approve: 'Duyệt',
    reject: 'Từ chối',
    submitForApproval: 'Gửi duyệt',
    approved: 'Đã duyệt',
    rejected: 'Đã từ chối',
    drillStatus: 'Trạng thái Drill',
    scenarioStatus: 'Trạng thái Kịch bản',
    fullName: 'Họ và Tên',
    publicDashboardTitle: 'Các Đợt Diễn Tập Đang Diễn Ra',
    viewProgress: 'Xem Tiến Độ',
    overallProgress: 'Tiến độ tổng thể',
    scenarioProgress: 'Tiến độ Kịch bản',
    noActiveDrills: 'Hiện không có đợt diễn tập nào đang diễn ra.',
    backToList: 'Quay lại danh sách',
    pending: 'Chưa bắt đầu',
    inProgress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    elapsedTime: 'Thời gian thực hiện',
    dependencies: 'Các mục phụ thuộc',
    setDependencies: 'Thiết lập phụ thuộc',
    noDependencies: 'Không có mục phụ thuộc nào.',
    selectDependencies: 'Chọn các mục phụ thuộc',
    close: 'Đóng',
    closeDrillError: 'Không thể đóng Drill',
    closeDrillErrorMessage: 'Các kịch bản sau chưa hoàn thành hoặc chưa được xác nhận kết quả cuối cùng: {scenarios}',
    startDate: 'Ngày bắt đầu',
    endDate: 'Ngày kết thúc',
    notInTimeframe: 'Chưa đến thời gian diễn tập',
    executor: 'Người thực hiện',
  },
  en: {
    loginTitle: 'System Login',
    loginSubtitle: 'Please enter your credentials to continue',
    username: 'Username',
    password: 'Password',
    loginButton: 'Login',
    invalidCredentials: 'Invalid username or password.',
    welcome: 'Welcome',
    logout: 'Logout',
    dashboard: 'Dashboard',
    scenarioManagement: 'Scenario Management',
    userManagement: 'User Management',
    drills: 'Drills',
    createNewDrill: 'Create New Drill',
    openDrill: 'Open Drill',
    closeDrill: 'Close Drill',
    execute: 'Execute',
    viewReport: 'View Report',
    edit: 'Edit',
    clone: 'Clone',
    userList: 'User List',
    addUser: 'Add User',
    editUser: 'Edit User',
    createUser: 'Create New User',
    role: 'Role',
    action: 'Action',
    cancel: 'Cancel',
    save: 'Save',
    saveChanges: 'Save Changes',
    backToDashboard: 'Back to Dashboard',
    scenarios: 'Scenarios',
    selectScenarioToViewSteps: 'Select a scenario to view its steps.',
    scenarioLocked: 'Scenario Locked',
    scenarioLockedMessage: 'Scenario "{scenarioName}" must be completed first.',
    step: 'Step',
    start: 'Start',
    complete: 'Complete',
    confirmScenarioResult: 'Confirm Scenario Result',
    confirmScenarioResultMessage: 'This scenario has failed steps. Please select a final outcome and provide a reason.',
    finalResult: 'Final Result',
    failureConfirmed: 'Failure',
    successOverridden: 'Success (Overridden)',
    reasonPlaceholder: 'Enter reason...',
    confirmResult: 'Confirm Result',
    resultConfirmed: 'Result Confirmed',
    completeStepTitle: 'Complete: {stepTitle}',
    status: 'Status',
    success: 'Success',
    failure: 'Failure',
    blocked: 'Blocked',
    resultNotes: 'Result Notes',
    submit: 'Submit',
    drillReportTitle: 'Drill Report: {drillName}',
    totalTime: 'Total Time',
    participants: 'Participants',
    successfulSteps: 'Successful Steps',
    failedSteps: 'Failed Steps',
    scenarioSummary: 'Scenario Summary',
    scenarioName: 'Scenario',
    notCompleted: 'Not Completed',
    completedWithOverride: 'Completed (Overridden)',
    confirmationReason: 'Confirmation Reason:',
    createDrillTitle: 'Create New Drill',
    editDrillTitle: 'Edit Drill',
    back: 'Back',
    drillName: 'Drill Name',
    description: 'Description',
    availableScenarios: 'Available Scenarios',
    scenariosInDrill: 'Scenarios in Drill',
    dragScenarioHere: 'Drag scenarios here',
    dependsOn: 'Depends On:',
    none: 'None',
    createDrill: 'Create Drill',
    scenarioList: 'Scenario List',
    createNewScenario: 'Create New Scenario',
    documentType: 'Type',
    creator: 'Creator',
    lastUpdated: 'Last Updated',
    stepCount: 'Steps',
    editScenario: 'Edit Scenario',
    createScenario: 'Create New Scenario',
    steps: 'Execution Steps',
    stepTitlePlaceholder: 'Step title',
    stepName: 'Step Name',
    estimatedTime: 'Estimated Time',
    stepDescription: 'Step Description',
    addStep: '+ Add Step',
    saveScenario: 'Save Scenario',
    requiredField: '*',
    noTitle: '(No title)',
    firstName: 'First Name',
    lastName: 'Last Name',
    roleDescription: 'Role Description',
    adminRoleDesc: 'Administrator: Has full control over the system, including user, scenario, and drill management.',
    technicalRoleDesc: 'Technical: Can create and manage technical scenarios, and participate in executing technical steps during a drill.',
    businessRoleDesc: 'Business: Can create and manage business-related scenarios (e.g., communications), and participate in relevant steps.',
    basisForConstruction: 'Basis for Construction',
    basisRequiredMessage: 'Please provide the Basis for Construction to activate.',
    draft: 'Draft',
    active: 'Active',
    pendingApproval: 'Pending Approval',
    approve: 'Approve',
    reject: 'Reject',
    submitForApproval: 'Submit for Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    drillStatus: 'Drill Status',
    scenarioStatus: 'Scenario Status',
    fullName: 'Full Name',
    publicDashboardTitle: 'Ongoing Drills',
    viewProgress: 'View Progress',
    overallProgress: 'Overall Progress',
    scenarioProgress: 'Scenario Progress',
    noActiveDrills: 'There are currently no ongoing drills.',
    backToList: 'Back to List',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    elapsedTime: 'Elapsed Time',
    dependencies: 'Dependencies',
    setDependencies: 'Set Dependencies',
    noDependencies: 'No dependencies.',
    selectDependencies: 'Select Dependencies',
    close: 'Close',
    closeDrillError: 'Cannot Close Drill',
    closeDrillErrorMessage: 'The following scenarios are not completed or confirmed: {scenarios}',
    startDate: 'Start Date',
    endDate: 'End Date',
    notInTimeframe: 'Not within the drill timeframe',
    executor: 'Executor',
  },
};

// --- LANGUAGE CONTEXT ---
const LanguageContext = createContext();

const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('vi');
    const t = (key, params = {}) => {
        let text = translations[language][key] || key;
        Object.keys(params).forEach(pKey => {
            text = text.replace(`{${pKey}}`, params[pKey]);
        });
        return text;
    };
    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

const useTranslation = () => useContext(LanguageContext);

// --- SVG ICONS ---
const LogoIcon = () => (
    <img 
        src="https://sanfactory.vn/wp-content/uploads/2023/10/LOGO-BIDV-tren-nen-mau-ngoai-cua-thuong-hieu-1400x447.png" 
        alt="BIDV Logo" 
        className="h-8 w-auto"
    />
);
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ScenariosIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BoldIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M12.938 4.112a.5.5 0 00-.625-.437L6.5 6.125V6.5a2.5 2.5 0 000 5v.375l5.813 2.437a.5.5 0 00.625-.437V4.112zM8.5 7.625h2.75a1.5 1.5 0 110 3H8.5v-3z"></path></svg>;
const ItalicIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M12.25 4.75a.75.75 0 00-1.5 0v.5h-1.5v-.5a.75.75 0 00-1.5 0v.5h-1a.75.75 0 000 1.5h1v5h-1a.75.75 0 000 1.5h1v.5a.75.75 0 001.5 0v-.5h1.5v.5a.75.75 0 001.5 0v-.5h1a.75.75 0 000-1.5h-1v-5h1a.75.75 0 000-1.5h-1v-.5z"></path></svg>;
const UnderlineIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.25 4.75a.75.75 0 00-1.5 0v5.5a4 4 0 008 0v-5.5a.75.75 0 00-1.5 0V10.25a2.5 2.5 0 01-5 0V4.75zM4.5 15.25a.75.75 0 000 1.5h11a.75.75 0 000-1.5h-11z"></path></svg>;
const AlignLeftIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3.5 4.75a.75.75 0 000 1.5h13a.75.75 0 000-1.5h-13zM3.5 9.75a.75.75 0 000 1.5h7a.75.75 0 000-1.5h-7zM3.5 14.75a.75.75 0 000 1.5h13a.75.75 0 000-1.5h-13z"></path></svg>;
const AlignCenterIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3.5 4.75a.75.75 0 000 1.5h13a.75.75 0 000-1.5h-13zM6.5 9.75a.75.75 0 000 1.5h7a.75.75 0 000-1.5h-7zM3.5 14.75a.75.75 0 000 1.5h13a.75.75 0 000-1.5h-13z"></path></svg>;
const AlignRightIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3.5 4.75a.75.75 0 000 1.5h13a.75.75 0 000-1.5h-13zM9.5 9.75a.75.75 0 000 1.5h7a.75.75 0 000-1.5h-7zM3.5 14.75a.75.75 0 000 1.5h13a.75.75 0 000-1.5h-13z"></path></svg>;
const DragHandleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ExecuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
const OpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6-4h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const ApproveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const RejectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
const SubmitApprovalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;

// --- UI COMPONENTS ---

const DependencySelector = ({ item, itemList, currentIndex, onDependencyChange }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const getItemId = (it) => it.id || `step-${it.title || it.name}`;

    const possibleDependencies = itemList.slice(0, currentIndex);
    const dependencyNames = (item.dependsOn || [])
        .map(depId => {
            const foundItem = itemList.find(i => getItemId(i) === depId);
            return foundItem?.title || foundItem?.name;
        })
        .filter(Boolean)
        .join(', ');

    const handleCheckboxChange = (depId, checked) => {
        const currentDeps = item.dependsOn || [];
        let newDeps;
        if (checked) {
            newDeps = [...currentDeps, depId];
        } else {
            newDeps = currentDeps.filter(id => id !== depId);
        }
        onDependencyChange(newDeps);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    return (
        <div className="mt-2 relative" ref={wrapperRef}>
            <label className="text-xs text-gray-400">{t('dependencies')}</label>
            <div className="p-2 mt-1 bg-[#22333B] border border-[#506771] rounded-md text-white min-h-[40px]">
                <p className="text-sm text-gray-300">{dependencyNames || t('noDependencies')}</p>
            </div>
            {possibleDependencies.length > 0 && (
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="mt-2 text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded">
                    {t('setDependencies')}
                </button>
            )}
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-[#334A52] border border-[#506771] rounded-md shadow-lg p-4">
                    <h4 className="font-bold text-white mb-2">{t('selectDependencies')}</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {possibleDependencies.map(dep => (
                            <label key={getItemId(dep)} className="flex items-center space-x-2 text-white">
                                <input
                                    type="checkbox"
                                    className="rounded bg-gray-700 border-gray-600 text-yellow-400 focus:ring-yellow-500"
                                    checked={(item.dependsOn || []).includes(getItemId(dep))}
                                    onChange={(e) => handleCheckboxChange(getItemId(dep), e.target.checked)}
                                />
                                <span>{dep.title || dep.name}</span>
                            </label>
                        ))}
                    </div>
                    <button type="button" onClick={() => setIsOpen(false)} className="mt-3 w-full text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-1 px-3 rounded">{t('close')}</button>
                </div>
            )}
        </div>
    );
};

const LoginPage = ({ onLogin, onCancel }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const success = await onLogin(username, password);
    if (!success) {
      setError(t('invalidCredentials'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm mx-auto relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
        <div className="bg-[#2A3A3F]/90 p-8 rounded-2xl shadow-2xl shadow-black/20 border border-[#3D4F56]">
          <div className="flex justify-center mb-6">
            <LogoIcon />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-1">{t('loginTitle')}</h1>
          <p className="text-center text-sm text-[#A6B5B9] mb-6">{t('loginSubtitle')}</p>
          {error && <p className="text-yellow-400 text-sm text-center my-4">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#A6B5B9] mb-1">{t('username')}</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 bg-[#1D2A2E] border border-[#3D4F56] rounded-lg focus:ring-2 focus:ring-[#FFDE59] focus:outline-none transition text-gray-200" placeholder="admin, tech_user, biz_user"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A6B5B9] mb-1">{t('password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-[#1D2A2E] border border-[#3D4F56] rounded-lg focus:ring-2 focus:ring-[#FFDE59] focus:outline-none transition text-gray-200" placeholder="password"/>
            </div>
            <button type="submit" className="w-full bg-[#FFDE59] text-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 transition-all duration-300 shadow-lg shadow-yellow-400/20 hover:shadow-xl hover:shadow-yellow-400/30">{t('loginButton')}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AppLayout = ({ user, onLogout, children, activeScreen, setActiveScreen }) => {
  const { t, setLanguage, language } = useTranslation();
  const adminLinks = [
    { id: 'dashboard', name: t('dashboard'), icon: <DashboardIcon /> },
    { id: 'scenarios', name: t('scenarioManagement'), icon: <ScenariosIcon /> },
    { id: 'user-management', name: t('userManagement'), icon: <UsersIcon /> },
  ];

  const userLinks = [
    { id: 'dashboard', name: t('dashboard'), icon: <DashboardIcon /> },
    { id: 'scenarios', name: t('scenarioManagement'), icon: <ScenariosIcon /> },
  ];
  
  const screenTitles = {
    'dashboard': t('dashboard'),
    'scenarios': t('scenarioManagement'),
    'user-management': t('userManagement'),
    'create-drill': t('createNewDrill'),
    'execution': t('execute'),
    'report': t('viewReport'),
  };

  const navLinks = user.role === 'ADMIN' ? adminLinks : userLinks;

  return (
    <div className="flex h-screen bg-[#1D2A2E] text-[#C5D2D8] font-sans">
      <nav className="w-64 bg-[#334A52]/70 backdrop-blur-lg border-r border-[#506771] p-4 hidden md:flex md:flex-col">
        <div className="flex items-center space-x-3 mb-10">
            <LogoIcon />
        </div>
        <ul className="space-y-2">
          {navLinks.map(link => (
             <li key={link.id}>
                <button onClick={() => setActiveScreen(link.id)} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-left ${activeScreen === link.id ? 'bg-yellow-400/10 text-yellow-300 font-semibold' : 'hover:bg-gray-700/50'}`}>
                    {link.icon}
                    <span>{link.name}</span>
                </button>
             </li>
          ))}
        </ul>
        <div className="mt-auto">
          <button onClick={onLogout} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors duration-200">
            <LogoutIcon /><span>{t('logout')}</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col overflow-y-auto">
         <header className="flex-shrink-0 bg-[#334A52]/50 backdrop-blur-sm border-b border-[#506771] p-4 flex justify-between items-center z-10">
          <h1 className="text-2xl font-bold text-white capitalize">{screenTitles[activeScreen] || activeScreen}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <button onClick={() => setLanguage('vi')} className={`w-8 h-8 rounded-full overflow-hidden border-2 ${language === 'vi' ? 'border-yellow-400' : 'border-transparent'}`}><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/1200px-Flag_of_Vietnam.svg.png" alt="Vietnamese" className="w-full h-full object-cover" /></button>
                <button onClick={() => setLanguage('en')} className={`w-8 h-8 rounded-full overflow-hidden border-2 ${language === 'en' ? 'border-yellow-400' : 'border-transparent'}`}><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg/1200px-Flag_of_the_United_Kingdom_%281-2%29.svg.png" alt="English" className="w-full h-full object-cover" /></button>
            </div>
            <p className="text-gray-400 text-sm hidden sm:block">{t('welcome')}, <span className="font-semibold text-yellow-300">{user.name}</span></p>
            <button onClick={onLogout} className="md:hidden bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg">{t('logout')}</button>
          </div>
        </header>

        <nav className="bg-[#334A52]/50 border-b border-[#506771] md:hidden">
            <div className="flex justify-around">
                {navLinks.map(link => (
                    <button key={link.id} onClick={() => setActiveScreen(link.id)} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeScreen === link.id ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400'}`}>
                        {link.name}
                    </button>
                ))}
            </div>
        </nav>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
};

const DashboardScreen = ({ user, drills, setDrills, onExecuteDrill, onViewReport, onEditDrill, onCloneDrill, executionData, scenarios, onCreateDrill }) => {
  const { t } = useTranslation();
  
  const getStatusClass = (status) => {
    if (status === 'Active') return 'bg-green-500/20 text-green-300';
    return 'bg-gray-500/20 text-gray-300';
  };
  
  const getExecStatusClass = (status) => {
    if (status === 'InProgress') return 'bg-blue-500/20 text-blue-300';
    if (status === 'Closed') return 'bg-green-500/20 text-green-300';
    return 'bg-yellow-500/20 text-yellow-300';
  };

  const handleOpenDrill = (drill) => {
    const today = new Date().toISOString().split('T')[0];
    if (drill.start_date && drill.end_date && today >= drill.start_date && today <= drill.end_date) {
        // In a real app, this would be an API call
        setDrills(drills.map(d => d.id === drill.id ? { ...d, execution_status: 'InProgress', opened_at: new Date().toISOString() } : d));
    } else {
        alert(t('notInTimeframe'));
    }
  };
  
  const handleCloseDrill = (drillId) => {
    const drill = drills.find(d => d.id === drillId);
    const drillExecData = executionData[drillId] || {};
    
    const incompleteScenarios = drill.scenarios.filter(scen => {
        const scenarioInfo = scenarios[scen.id];
        if (!scenarioInfo) return true; 
        const scenarioSteps = scenarioInfo.steps.map(stepId => drillExecData[stepId] || { status: 'Pending' });
        const allStepsDone = scenarioSteps.every(s => s.status && s.status.startsWith('Completed'));
        const hasFailedStep = scenarioSteps.some(s => s.status === 'Completed-Failure' || s.status === 'Completed-Blocked');
        
        return !allStepsDone || (hasFailedStep && !drillExecData[scen.id]?.finalStatus);
    }).map(scen => scenarios[scen.id].name);

    if (incompleteScenarios.length === 0) {
        // In a real app, this would be an API call
        setDrills(drills.map(d => d.id === drillId ? { ...d, execution_status: 'Closed', closed_at: new Date().toISOString() } : d));
    } else {
        alert(`${t('closeDrillError')}: ${t('closeDrillErrorMessage', { scenarios: incompleteScenarios.join(', ') })}`);
    }
  };

  const isDrillInTimeframe = (drill) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(drill.start_date);
      const endDate = new Date(drill.end_date);
      return today >= startDate && today <= endDate;
  }

  return (
    <div className="bg-[#334A52]/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-black/20 border border-[#506771]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">{t('drills')}</h2>
        {user.role === 'ADMIN' && (
            <button onClick={onCreateDrill} className="bg-[#FFDE59] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-all duration-300 shadow-lg shadow-yellow-400/20 hover:shadow-xl hover:shadow-yellow-400/30">{t('createNewDrill')}</button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead className="border-b border-[#506771]">
                <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('drillName')}</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('status')}</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('action')}</th>
                </tr>
            </thead>
            <tbody>
                {drills.map(drill => {
                    const inTime = isDrillInTimeframe(drill);
                    return (
                        <tr key={drill.id} className="border-b border-[#334A52] hover:bg-[#334A52]/50">
                            <td className="py-3 px-4">
                                <p className="font-bold text-white">{drill.name}</p>
                                <p className="text-sm text-gray-400">{drill.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{t('startDate')}: {drill.start_date} - {t('endDate')}: {drill.end_date}</p>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex flex-col items-start space-y-1">
                                    <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${getStatusClass(drill.status)}`}>{t(drill.status.toLowerCase())}</span>
                                    <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${getExecStatusClass(drill.execution_status)}`}>{drill.execution_status}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                    {user.role === 'ADMIN' && drill.status === 'Active' && drill.execution_status === 'Scheduled' && (
                                        <button onClick={() => handleOpenDrill(drill)} disabled={!inTime} title={inTime ? t('openDrill') : t('notInTimeframe')} className="p-2 rounded-lg text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 disabled:text-gray-500 disabled:bg-gray-500/10 disabled:cursor-not-allowed"><OpenIcon /></button>
                                    )}
                                    {user.role === 'ADMIN' && drill.execution_status === 'InProgress' && (
                                        <button onClick={() => handleCloseDrill(drill.id)} title={t('closeDrill')} className="p-2 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20"><CloseIcon /></button>
                                    )}
                                    {drill.execution_status === 'InProgress' && (
                                        <button onClick={() => onExecuteDrill(drill)} title={t('execute')} className="p-2 rounded-lg text-gray-300 bg-gray-500/10 hover:bg-gray-500/20"><ExecuteIcon /></button>
                                    )}
                                    {drill.execution_status === 'Closed' && (
                                        <button onClick={() => onViewReport(drill)} title={t('viewReport')} className="p-2 rounded-lg text-gray-300 bg-gray-500/10 hover:bg-gray-500/20"><ReportIcon /></button>
                                    )}
                                    {user.role === 'ADMIN' && (
                                        <>
                                            <button onClick={() => onEditDrill(drill)} title={t('edit')} className="p-2 rounded-lg text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20"><EditIcon /></button>
                                            <button onClick={() => onCloneDrill(drill)} title={t('clone')} className="p-2 rounded-lg text-purple-300 bg-purple-500/10 hover:bg-purple-500/20"><CloneIcon /></button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

const UserManagementScreen = ({ users, setUsers }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ username: '', role: 'TECHNICAL', first_name: '', last_name: '', description: '' });
    
    const roleDescriptions = {
        ADMIN: t('adminRoleDesc'),
        TECHNICAL: t('technicalRoleDesc'),
        BUSINESS: t('businessRoleDesc'),
    };

    const openModalForCreate = () => {
        setEditingUser(null);
        setFormData({ username: '', role: 'TECHNICAL', first_name: '', last_name: '', description: '' });
        setIsModalOpen(true);
    };

    const openModalForEdit = (user) => {
        setEditingUser(user);
        setFormData({ username: user.username, role: user.role, first_name: user.first_name, last_name: user.last_name, description: user.description });
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        // In a real app, this would be an API call (POST for new, PUT for edit)
        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
        } else {
            const newUser = { ...formData, id: `user-${Date.now()}`, password: 'password' };
            setUsers([...users, newUser]);
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="bg-[#334A52]/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-black/20 border border-[#506771]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">{t('userList')}</h2>
                    <button onClick={openModalForCreate} className="bg-[#FFDE59] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-all duration-300 shadow-lg shadow-yellow-400/20 hover:shadow-xl hover:shadow-yellow-400/30">{t('addUser')}</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-[#506771]">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('username')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('fullName')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('role')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('description')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-[#334A52] hover:bg-[#334A52]/50">
                                    <td className="py-3 px-4 text-white">{u.username}</td>
                                    <td className="py-3 px-4 text-white">{`${u.last_name} ${u.first_name}`}</td>
                                    <td className="py-3 px-4 text-gray-300">{u.role}</td>
                                    <td className="py-3 px-4 text-gray-300">{u.description}</td>
                                    <td className="py-3 px-4">
                                        <button onClick={() => openModalForEdit(u)} className="text-yellow-300 hover:underline">{t('edit')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#334A52] p-8 rounded-2xl shadow-2xl shadow-black/30 border border-[#506771] w-full max-w-lg">
                        <h3 className="text-lg font-bold text-white mb-4">{editingUser ? t('editUser') : t('createUser')}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#C5D2D8]">{t('lastName')}</label>
                                    <input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#C5D2D8]">{t('firstName')}</label>
                                    <input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"/>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-[#C5D2D8]">{t('username')}</label>
                                <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#C5D2D8]">{t('description')}</label>
                                <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#C5D2D8]">{t('role')}</label>
                                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none">
                                    <option value="TECHNICAL">TECHNICAL</option>
                                    <option value="BUSINESS">BUSINESS</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-2 p-2 bg-[#22333B] rounded-md">{roleDescriptions[formData.role]}</p>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-700 py-2 px-4 rounded-lg text-gray-300 hover:bg-gray-600">{t('cancel')}</button>
                                <button type="submit" className="bg-yellow-400 text-black py-2 px-4 rounded-lg hover:bg-yellow-500 font-semibold">{t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const ExecutionScreen = ({ user, drill, onBack, scenarios, steps, executionData, setExecutionData }) => {
    const { t } = useTranslation();
    const [activeScenarioId, setActiveScenarioId] = useState(null);
    const [completionModal, setCompletionModal] = useState(null);

    const areDependenciesMet = (item, execData, allItems) => {
        if (!item.dependsOn || item.dependsOn.length === 0) {
            return true;
        }
        return item.dependsOn.every(depId => {
            const dependency = allItems[depId];
            if (!dependency) return false; // Dependency not found
            
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

    const handleStepStart = (stepId) => {
        // In a real app, this would be an API call
        setExecutionData(prev => {
            const drillData = prev[drill.id] || {};
            return { ...prev, [drill.id]: { ...drillData, [stepId]: { ...drillData[stepId], status: 'InProgress', started_at: new Date().toISOString(), assignee: user.name } } };
        });
    };

    const handleStepComplete = (stepId, result) => {
        // In a real app, this would be an API call
        setExecutionData(prev => {
            const drillData = prev[drill.id] || {};
            const newDrillData = { ...drillData };
            newDrillData[stepId] = { ...newDrillData[stepId], status: result.status, result_text: result.text, completed_at: new Date().toISOString() };
            
            const scenario = scenarios[activeScenarioId];
            if (scenario) {
                scenario.steps.forEach(nextStepId => {
                    const nextStep = steps[nextStepId];
                    const nextStepState = newDrillData[nextStepId] || { status: 'Pending' };
                    if (nextStepState.status === 'Pending' && nextStep.dependsOn && nextStep.dependsOn.length > 0) {
                        const allDepsMet = nextStep.dependsOn.every(depId => newDrillData[depId]?.status?.startsWith('Completed'));
                        if (allDepsMet) {
                             newDrillData[nextStepId] = { ...nextStepState, status: 'InProgress', started_at: new Date().toISOString(), assignee: user.name };
                        }
                    }
                });
            }

            return { ...prev, [drill.id]: newDrillData };
        });
        setCompletionModal(null);
    };
    
    const handleScenarioConfirmation = (scenId, finalStatus, finalReason) => {
        // In a real app, this would be an API call
        setExecutionData(prev => {
            const drillData = prev[drill.id] || {};
            return { ...prev, [drill.id]: { ...drillData, [scenId]: { ...drillData[scenId], finalStatus, finalReason } } };
        });
    };

    const getStepState = (stepId) => executionData[drill.id]?.[stepId] || { status: 'Pending' };

    return (
        <>
            <div>
                <button onClick={onBack} className="text-yellow-300 hover:underline mb-4">&larr; {t('backToDashboard')}</button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-[#334A52]/80 backdrop-blur-sm p-4 rounded-xl border border-[#506771]">
                        <h2 className="text-lg font-bold text-white mb-3">{t('scenarios')}</h2>
                        <div className="space-y-2">
                            {scenariosWithLockStatus.map(scen => (
                                <button key={scen.id} onClick={() => setActiveScenarioId(scen.id)} disabled={scen.isLocked} className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${activeScenarioId === scen.id ? 'bg-yellow-400/10 border-yellow-400' : 'bg-[#22333B]/50 border-[#506771] hover:border-gray-600'} ${scen.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <h4 className="font-semibold text-white flex items-center">{scen.isLocked && <LockIcon />}{scen.name}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${scen.role === 'TECHNICAL' ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'}`}>{scen.role}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-[#334A52]/80 backdrop-blur-sm p-6 rounded-xl border border-[#506771]">
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

const ScenarioDetail = ({ scenario, steps, getStepState, handleStepStart, setCompletionModal, onConfirm, drillExecData, scenarios: allScenarios }) => {
    const { t } = useTranslation();
    const scenarioSteps = scenario.steps.map(stepId => getStepState(stepId));
    const allStepsDone = scenarioSteps.every(s => s.status && s.status.startsWith('Completed'));
    const hasFailedStep = scenarioSteps.some(s => s.status === 'Completed-Failure' || s.status === 'Completed-Blocked');
    const isConfirmed = !!drillExecData[scenario.id]?.finalStatus;

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
                <h3 className="text-xl font-bold text-white mt-4">{t('scenarioLocked')}</h3>
                <p className="text-gray-400">{t('scenarioLockedMessage', { scenarioName: dependencyName })}</p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-4">{scenario.name}</h2>
            <div className="space-y-3">
                {scenario.steps.map(stepId => {
                    const step = steps[stepId];
                    if (!step) return null; // Guard against missing step data
                    const state = getStepState(stepId);
                    let statusIcon = '🕒'; let borderColor = 'border-[#506771]';
                    if (state.status === 'InProgress') { statusIcon = '▶️'; borderColor = 'border-blue-500'; }
                    if (state.status === 'Completed-Success') { statusIcon = '✅'; borderColor = 'border-green-500'; }
                    if (state.status === 'Completed-Failure' || state.status === 'Completed-Blocked') { statusIcon = '❌'; borderColor = 'border-red-500'; }

                    return (
                        <div key={stepId} className={`p-4 rounded-lg border-l-4 bg-[#22333B]/50 ${borderColor} ${state.status?.includes('Failure') || state.status?.includes('Blocked') ? 'bg-red-500/10' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-lg text-white">{statusIcon} {step.title}</h4>
                                        {step.estimated_time && <span className="text-sm text-gray-400 ml-4 flex items-center"><ClockIcon />{step.estimated_time}</span>}
                                    </div>
                                    <div className="prose prose-sm prose-invert mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: step.description }} />
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    {state.status === 'Pending' && <button onClick={() => handleStepStart(stepId)} className="bg-blue-500/80 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-blue-500">{t('start')}</button>}
                                    {state.status === 'InProgress' && <button onClick={() => setCompletionModal({ stepId })} className="bg-green-500/80 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-green-500">{t('complete')}</button>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {allStepsDone && hasFailedStep && !isConfirmed && (
                <div className="mt-6 border-t border-[#506771] pt-4">
                    <h3 className="text-lg font-bold text-red-400">{t('confirmScenarioResult')}</h3>
                    <p className="text-sm text-gray-400 mb-2">{t('confirmScenarioResultMessage')}</p>
                     <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-400">{t('finalResult')}</label>
                        <select value={finalStatus} onChange={(e) => setFinalStatus(e.target.value)} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none">
                            <option value="Failure-Confirmed">{t('failureConfirmed')}</option>
                            <option value="Success-Overridden">{t('successOverridden')}</option>
                        </select>
                    </div>
                    <textarea value={finalReason} onChange={(e) => setFinalReason(e.target.value)} rows="3" className="w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none" placeholder={t('reasonPlaceholder')}></textarea>
                    <button onClick={handleConfirm} className="mt-2 bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500">{t('confirmResult')}</button>
                </div>
            )}
            {isConfirmed && (
                <div className="mt-6 border-t border-[#506771] pt-4">
                     <h3 className="text-lg font-bold text-green-400">{t('resultConfirmed')}</h3>
                </div>
            )}
        </div>
    );
};

const CompletionModal = ({ step, onComplete, onClose }) => {
    const { t } = useTranslation();
    const [resultText, setResultText] = useState('');
    const [status, setStatus] = useState('Completed-Success');

    const handleSubmit = (e) => {
        e.preventDefault();
        onComplete({ text: resultText, status });
    };

    return (
        <div className="bg-[#334A52] p-8 rounded-2xl shadow-2xl shadow-black/30 border border-[#506771] w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">{t('completeStepTitle', { stepTitle: step.title })}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400">{t('status')}</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none">
                        <option value="Completed-Success">{t('success')}</option>
                        <option value="Completed-Failure">{t('failure')}</option>
                        <option value="Completed-Blocked">{t('blocked')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">{t('resultNotes')}</label>
                    <textarea value={resultText} onChange={(e) => setResultText(e.target.value)} rows="4" className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"/>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-700 py-2 px-4 rounded-lg text-gray-300 hover:bg-gray-600">{t('cancel')}</button>
                    <button type="submit" className="bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-500">{t('submit')}</button>
                </div>
            </form>
        </div>
    );
};

const KpiCard = ({ title, value, icon, iconBgColor }) => (
    <div className="bg-[#22333B]/50 p-4 rounded-lg border border-[#506771] flex items-center">
        <div className={`p-3 rounded-full mr-4 ${iconBgColor}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const ReportScreen = ({ drill, executionData, scenarios, steps, onBack }) => {
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
        <div>
            <button onClick={onBack} className="text-yellow-300 hover:underline mb-4">&larr; {t('backToDashboard')}</button>
            <div className="space-y-6">
                <div className="bg-[#334A52]/80 backdrop-blur-sm p-6 rounded-xl border border-[#506771]">
                    <h2 className="text-2xl font-bold text-white mb-4">{t('drillReportTitle', { drillName: drill.name })}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard title={t('totalTime')} value={totalDuration} icon={<ClockIcon />} iconBgColor="bg-blue-500/30" />
                        <KpiCard title={t('participants')} value={participants.length} icon={<UsersIcon />} iconBgColor="bg-purple-500/30" />
                        <KpiCard title={t('successfulSteps')} value={successfulSteps} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>} iconBgColor="bg-green-500/30" />
                        <KpiCard title={t('failedSteps')} value={failedSteps} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>} iconBgColor="bg-red-500/30" />
                    </div>
                </div>

                <div className="bg-[#334A52]/80 backdrop-blur-sm p-6 rounded-xl border border-[#506771]">
                    <h3 className="text-xl font-bold text-white mb-4">{t('scenarioSummary')}</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-[#506771]">
                                <tr>
                                    <th className="py-2 px-4 w-12"></th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('scenarioName')}</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('totalTime')}</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('status')}</th>
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
                                            if (drillExecData[scenId]?.finalStatus === 'Success-Overridden') {
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
                                        if (status === t('complete')) return 'bg-green-500/20 text-green-300';
                                        if (status.includes(t('failure'))) return 'bg-red-500/20 text-red-300';
                                        if (status.includes(t('completedWithOverride'))) return 'bg-yellow-500/20 text-yellow-300';
                                        return 'bg-gray-700 text-gray-300';
                                    }

                                    return (
                                        <React.Fragment key={scenId}>
                                            <tr className="border-t border-[#506771] cursor-pointer hover:bg-[#334A52]/50" onClick={() => toggleScenario(scenId)}>
                                                <td className="py-3 px-4 text-center"><svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></td>
                                                <td className="py-3 px-4 font-semibold text-white">{scenario.name}</td>
                                                <td className="py-3 px-4">{scenarioDuration}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getScenarioStatusClass(scenarioStatus)}`}>
                                                        {scenarioStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-[#22333B]/50">
                                                    <td colSpan="4" className="p-4">
                                                        <div className="p-2 bg-[#334A52] rounded-md">
                                                            {drillExecData[scenId]?.finalReason && (
                                                                <div className="mb-2 p-2 bg-yellow-500/10 border-l-4 border-yellow-400 text-yellow-300">
                                                                    <p className="font-bold text-sm">{t('confirmationReason')}</p>
                                                                    <p className="text-sm">{drillExecData[scenId].finalReason}</p>
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
                                                                            <td className="py-1 pl-4 w-1/2 text-gray-300">{step.title}</td>
                                                                            <td className="py-1 text-gray-400">{state.status || 'Pending'}</td>
                                                                            <td className="py-1 text-gray-400">{formatStepDuration(state.started_at, state.completed_at)}</td>
                                                                            <td className="py-1 text-gray-400">{state.assignee || 'N/A'}</td>
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
            </div>
        </div>
    )
};

const CreateDrillScreen = ({ setActiveScreen, setDb, db, user, drillToEdit, onDoneEditing }) => {
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
            setStartDate(drillToEdit.start_date || new Date().toISOString().split('T')[0]);
            setEndDate(drillToEdit.end_date || new Date().toISOString().split('T')[0]);
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
                const newDependsOn = s.dependsOn.filter(depId => depId !== draggedItem.id);
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) {
            alert('Vui lòng nhập tên Drill.');
            return;
        }

        const drillData = {
            name,
            description,
            basis,
            start_date: startDate,
            end_date: endDate,
            status: basis ? status : 'Draft',
            execution_status: drillToEdit ? drillToEdit.execution_status : 'Scheduled',
            scenarios: selectedScenarios.map(({ id, dependsOn }) => ({ id, dependsOn })),
            opened_at: drillToEdit ? drillToEdit.opened_at : null,
            closed_at: drillToEdit ? drillToEdit.closed_at : null,
        };
        
        // In a real app, this would be a POST/PUT API call
        if (drillToEdit && drillToEdit.id) {
            setDb(prevDb => ({
                ...prevDb,
                drills: prevDb.drills.map(d => d.id === drillToEdit.id ? { ...d, ...drillData } : d)
            }));
        } else {
            const newDrill = { ...drillData, id: `drill-${Date.now()}` };
            setDb(prevDb => ({
                ...prevDb,
                drills: [...prevDb.drills, newDrill]
            }));
        }
        
        onDoneEditing();
    };

    return (
        <div className="bg-[#334A52]/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-black/20 border border-[#506771]">
            <button onClick={onDoneEditing} className="text-yellow-300 hover:underline mb-4">&larr; {t('back')}</button>
            <h2 className="text-2xl font-bold text-white mb-6">{drillToEdit ? t('editDrillTitle') : t('createDrillTitle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[#C5D2D8] mb-1">{t('drillName')}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-[#22333B] border border-[#506771] rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#C5D2D8] mb-1">{t('drillStatus')}</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} disabled={!basis} className="w-full px-4 py-2 bg-[#22333B] border border-[#506771] rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none transition disabled:opacity-50">
                            <option value="Draft">{t('draft')}</option>
                            <option value="Active">{t('active')}</option>
                        </select>
                         {!basis && <p className="text-xs text-yellow-400 mt-1">{t('basisRequiredMessage')}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[#C5D2D8] mb-1">{t('startDate')}</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 bg-[#22333B] border border-[#506771] rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#C5D2D8] mb-1">{t('endDate')}</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 bg-[#22333B] border border-[#506771] rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#C5D2D8] mb-1">{t('description')}</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" className="w-full px-4 py-2 bg-[#22333B] border border-[#506771] rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#C5D2D8] mb-1">{t('basisForConstruction')}</label>
                    <textarea value={basis} onChange={e => setBasis(e.target.value)} rows="2" className="w-full px-4 py-2 bg-[#22333B] border border-[#506771] rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" />
                </div>


                <div className="flex space-x-6">
                    <div className="w-1/3">
                        <h3 className="font-bold text-white mb-2">{t('availableScenarios')}</h3>
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'available')} className="bg-[#22333B]/50 p-4 rounded-lg min-h-[300px] border-dashed border-2 border-gray-700 space-y-2">
                            {availableScenarios.map(scen => (
                                <div key={scen.id} draggable onDragStart={(e) => handleDragStart(e, scen, 'available')} className="p-3 bg-[#334A52] border border-[#506771] rounded-md cursor-move shadow-sm hover:bg-gray-700/50 wiggle-on-drag">
                                    <p className="font-semibold text-white">{scen.name}</p>
                                    <p className="text-xs text-gray-400">{scen.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-2/3">
                        <h3 className="font-bold text-white mb-2">{t('scenariosInDrill')}</h3>
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'selected')} className="bg-yellow-900/10 p-4 rounded-lg min-h-[300px] border-dashed border-2 border-yellow-400/50 space-y-2">
                            {selectedScenarios.length === 0 && <p className="text-gray-500 text-center pt-16">{t('dragScenarioHere')}</p>}
                            {selectedScenarios.map((scen, index) => (
                                <div key={scen.id} draggable onDragStart={(e) => handleDragStart(e, scen, 'selected')} onDragOver={handleDragOver} onDrop={(e) => handleDropOnItem(e, scen.id)} className="p-3 bg-[#334A52] border border-[#506771] rounded-md shadow-sm cursor-move wiggle-on-drag">
                                    <p className="font-semibold text-white">{index + 1}. {scen.name}</p>
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
                    <button type="submit" className="bg-[#FFDE59] text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-300 transition-all duration-300 shadow-lg shadow-yellow-400/20 hover:shadow-xl hover:shadow-yellow-400/30">{drillToEdit ? t('saveChanges') : t('createDrill')}</button>
                </div>
            </form>
        </div>
    );
};

const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '<p><br></p>';
        }
    }, [value]);

    const handleInput = (e) => {
        onChange(e.target.innerHTML);
    };
    
    const handleCommand = (command, arg = null) => {
        document.execCommand(command, false, arg);
        editorRef.current.focus();
        onChange(editorRef.current.innerHTML);
    };

    return (
        <div className="border border-[#506771] rounded-md bg-[#22333B] text-gray-300">
            <div className="flex items-center p-1 border-b border-[#506771] space-x-1">
                <select onChange={(e) => handleCommand('fontName', e.target.value)} className="text-xs bg-[#334A52] border-[#506771] rounded-md p-1 focus:ring-yellow-400 focus:outline-none">
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                </select>
                <button type="button" onClick={() => handleCommand('bold')} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-gray-300"><BoldIcon /></button>
                <button type="button" onClick={() => handleCommand('italic')} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-gray-300"><ItalicIcon /></button>
                <button type="button" onClick={() => handleCommand('underline')} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-gray-300"><UnderlineIcon /></button>
                <button type="button" onClick={() => handleCommand('justifyLeft')} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-gray-300"><AlignLeftIcon /></button>
                <button type="button" onClick={() => handleCommand('justifyCenter')} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-gray-300"><AlignCenterIcon /></button>
                <button type="button" onClick={() => handleCommand('justifyRight')} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-gray-300"><AlignRightIcon /></button>
            </div>
            <div
                ref={editorRef}
                onInput={handleInput}
                contentEditable={true}
                className="p-2 min-h-[100px] focus:outline-none prose prose-sm prose-invert max-w-none"
            />
        </div>
    );
};


const ScenarioManagementScreen = ({ db, setDb, user }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScenario, setEditingScenario] = useState(null);
    const [draggedStepIndex, setDraggedStepIndex] = useState(null);
    const [expandedStepIndex, setExpandedStepIndex] = useState(0);
    
    const initialFormState = { name: '', role: user.role === 'ADMIN' ? 'TECHNICAL' : user.role, basis: '', status: 'Draft' };
    const initialStepState = [{ title: '', description: '', estimatedTime: '', dependsOn: [] }];

    const [formData, setFormData] = useState(initialFormState);
    const [stepInputs, setStepInputs] = useState(initialStepState);

    const handleAddStep = () => {
        setStepInputs([...stepInputs, { title: '', description: '', estimatedTime: '', dependsOn: [] }]);
        setExpandedStepIndex(stepInputs.length); // Expand the new step
    };
    
    const handleRemoveStep = (index) => {
        const removedStepId = stepInputs[index].id;
        const newSteps = stepInputs.filter((_, i) => i !== index);
        // Remove dependency from other steps
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

    const handleOpenModal = (scenarioToEdit = null, isClone = false) => {
        if (scenarioToEdit) {
            setEditingScenario(isClone ? null : scenarioToEdit);
            setFormData({ 
                name: isClone ? `${scenarioToEdit.name} (Copy)` : scenarioToEdit.name, 
                role: scenarioToEdit.role, 
                basis: scenarioToEdit.basis, 
                status: 'Draft' 
            });
            const stepsForScenario = (scenarioToEdit.steps || []).map(stepId => {
                const newStep = {...db.steps[stepId]};
                delete newStep.id; // Remove old ID for cloning
                return newStep;
            });
            setStepInputs(stepsForScenario.length > 0 ? stepsForScenario : initialStepState);
        } else {
            setEditingScenario(null);
            setFormData(initialFormState);
            setStepInputs(initialStepState);
        }
        setExpandedStepIndex(0);
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        // This would be an API call in a real app
        for (const step of stepInputs) {
            if (!step.title.trim() || !step.description.trim() || step.description.trim() === "<p><br></p>") {
                alert('Vui lòng nhập đầy đủ Tên bước và Mô tả cho tất cả các bước.');
                return;
            }
        }
        
        let finalStatus = formData.status;
        if (!formData.basis) {
            finalStatus = 'Draft';
        }

        if (editingScenario) {
            const updatedSteps = {};
            const updatedStepIds = stepInputs.map((step, index) => {
                const stepId = step.id || `step-${Date.now()}-${index}`;
                updatedSteps[stepId] = { ...step, id: stepId };
                return stepId;
            });

            const updatedScenario = {
                ...editingScenario,
                name: formData.name,
                role: formData.role,
                basis: formData.basis,
                status: finalStatus,
                steps: updatedStepIds,
                last_updated_at: new Date().toISOString(),
            };

            setDb(prevDb => ({
                ...prevDb,
                scenarios: { ...prevDb.scenarios, [editingScenario.id]: updatedScenario },
                steps: { ...prevDb.steps, ...updatedSteps }
            }));

        } else { // New or Cloned
            const newStepIds = [];
            const newStepsData = {};
            stepInputs.forEach((stepInput, index) => {
                if (stepInput.title) {
                    const stepId = `step-${Date.now()}-${index}`;
                    newStepIds.push(stepId);
                    newStepsData[stepId] = { id: stepId, ...stepInput };
                }
            });

            const newScenarioId = `scen-${Date.now()}`;
            const newScenario = {
                id: newScenarioId,
                name: formData.name,
                role: formData.role,
                basis: formData.basis,
                status: finalStatus,
                steps: newStepIds,
                created_by: user.id,
                created_at: new Date().toISOString(),
                last_updated_at: new Date().toISOString(),
            };

            setDb(prevDb => ({
                ...prevDb,
                scenarios: { ...prevDb.scenarios, [newScenarioId]: newScenario },
                steps: { ...prevDb.steps, ...newStepsData }
            }));
        }

        setIsModalOpen(false);
    };
    
    const handleStatusChange = (scenarioId, newStatus) => {
        // This would be an API call
        setDb(prevDb => {
            const newScenarios = { ...prevDb.scenarios };
            newScenarios[scenarioId].status = newStatus;
            newScenarios[scenarioId].last_updated_at = new Date().toISOString();
            return { ...prevDb, scenarios: newScenarios };
        });
    };

    const filteredScenarios = Object.values(db.scenarios).filter(s => {
        if (user.role === 'ADMIN') return true;
        return s.created_by === user.id;
    });

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
            case 'Active': return 'bg-green-500/20 text-green-300';
            case 'Pending Approval': return 'bg-yellow-500/20 text-yellow-300';
            case 'Rejected': return 'bg-red-500/20 text-red-300';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    return (
        <>
            <div className="bg-[#334A52]/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-black/20 border border-[#506771]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">{t('scenarioList')}</h2>
                    <button onClick={() => handleOpenModal()} className="bg-[#FFDE59] text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-all duration-300 shadow-lg shadow-yellow-400/20 hover:shadow-xl hover:shadow-yellow-400/30">{t('createNewScenario')}</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                         <thead className="border-b border-[#506771]">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('scenarioName')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('status')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('creator')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('lastUpdated')}</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-[#C5D2D8] uppercase tracking-wider">{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredScenarios.map(s => {
                                const creator = db.users.find(u => u.id === s.created_by);
                                return (
                                <tr key={s.id} className="border-b border-[#334A52] hover:bg-[#334A52]/50">
                                    <td className="py-3 px-4 text-white">{s.name}</td>
                                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusClass(s.status)}`}>{s.status}</span></td>
                                    <td className="py-3 px-4 text-gray-300">{creator ? creator.username : 'N/A'}</td>
                                    <td className="py-3 px-4 text-gray-300">{formatDate(s.last_updated_at)}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-2">
                                            {(user.role === 'ADMIN' || user.id === s.created_by) && (
                                                <>
                                                    <button onClick={() => handleOpenModal(s)} title={t('edit')} className="p-2 rounded-lg text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20"><EditIcon /></button>
                                                    <button onClick={() => handleOpenModal(s, true)} title={t('clone')} className="p-2 rounded-lg text-purple-300 bg-purple-500/10 hover:bg-purple-500/20"><CloneIcon /></button>
                                                </>
                                            )}
                                            {user.role !== 'ADMIN' && s.status === 'Draft' && s.basis && (
                                                <button onClick={() => handleStatusChange(s.id, 'Pending Approval')} title={t('submitForApproval')} className="p-2 rounded-lg text-blue-300 bg-blue-500/10 hover:bg-blue-500/20"><SubmitApprovalIcon /></button>
                                            )}
                                            {user.role === 'ADMIN' && s.status === 'Pending Approval' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(s.id, 'Active')} title={t('approve')} className="p-2 rounded-lg text-green-300 bg-green-500/10 hover:bg-green-500/20"><ApproveIcon /></button>
                                                    <button onClick={() => handleStatusChange(s.id, 'Rejected')} title={t('reject')} className="p-2 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20"><RejectIcon /></button>
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
                    <div className="bg-[#334A52] p-6 rounded-2xl shadow-2xl shadow-black/30 border border-[#506771] w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-4 flex-shrink-0">{editingScenario ? t('editScenario') : t('createScenario')}</h3>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#C5D2D8]">{t('scenarioName')}</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none" required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#C5D2D8]">{t('role')}</label>
                                    {user.role === 'ADMIN' ? (
                                        <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none">
                                            <option value="TECHNICAL">TECHNICAL</option>
                                            <option value="BUSINESS">BUSINESS</option>
                                        </select>
                                    ) : (
                                        <input type="text" value={formData.role} className="mt-1 block w-full bg-[#22333B]/50 border border-[#506771] rounded-md p-2 text-gray-400" readOnly/>
                                    )}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[#C5D2D8]">{t('basisForConstruction')}</label>
                                <textarea value={formData.basis} onChange={(e) => setFormData({...formData, basis: e.target.value})} rows="2" className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                            </div>
                            {user.role === 'ADMIN' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[#C5D2D8]">{t('scenarioStatus')}</label>
                                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} disabled={!formData.basis} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none disabled:opacity-50">
                                        <option value="Draft">{t('draft')}</option>
                                        <option value="Active">{t('active')}</option>
                                    </select>
                                    {!formData.basis && <p className="text-xs text-yellow-400 mt-1">{t('basisRequiredMessage')}</p>}
                                </div>
                            )}

                            <h4 className="font-bold text-white mt-6 mb-2">{t('steps')}</h4>
                            <div className="space-y-2">
                                {stepInputs.map((step, index) => (
                                    <div 
                                        key={index} 
                                        className={`border border-[#506771] rounded-md bg-[#22333B]/50 transition-all duration-300 ${draggedStepIndex === index ? 'opacity-50' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                    >
                                        <div className="p-2 flex items-center space-x-2">
                                            <div className="cursor-move text-gray-500 wiggle-on-drag">
                                                <DragHandleIcon />
                                            </div>
                                            <div className="flex-1 cursor-pointer" onClick={() => setExpandedStepIndex(expandedStepIndex === index ? null : index)}>
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-bold text-white">{t('step')} {index + 1}: {step.title || t('noTitle')}</h4>
                                                    <div className="flex items-center space-x-4">
                                                    {stepInputs.length > 1 && (
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveStep(index); }} className="text-red-400 hover:text-red-300 font-bold text-xl">&times;</button>
                                                    )}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedStepIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {expandedStepIndex === index && (
                                            <div className="p-4 border-t border-[#506771] space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-medium text-[#C5D2D8]">{t('stepName')} <span className="text-red-400">{t('requiredField')}</span></label>
                                                        <input type="text" placeholder={t('stepTitlePlaceholder')} value={step.title} onChange={e => handleStepChange(index, 'title', e.target.value)} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-[#C5D2D8]">{t('estimatedTime')}</label>
                                                        <input type="text" placeholder="hh:mm:ss" value={step.estimatedTime} onChange={e => handleStepChange(index, 'estimatedTime', e.target.value)} className="mt-1 block w-full bg-[#22333B] border border-[#506771] rounded-md p-2 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-[#C5D2D8]">{t('stepDescription')} <span className="text-red-400">{t('requiredField')}</span></label>
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
                            <button type="button" onClick={handleAddStep} className="mt-4 text-yellow-300 hover:underline text-sm font-semibold">{t('addStep')}</button>
                            <div className="flex justify-end space-x-2 mt-6 border-t border-[#506771] pt-4 flex-shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-700 py-2 px-4 rounded-lg text-gray-300 hover:bg-gray-600">{t('cancel')}</button>
                                <button type="submit" className="bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-500">{editingScenario ? t('saveChanges') : t('saveScenario')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

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
                                        <h3 className="text-xl font-bold text-yellow-300">{scenario.name}</h3>
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


// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [activeDrill, setActiveDrill] = useState(null);
  const [editingDrill, setEditingDrill] = useState(null);
  
  const [db, setDb] = useState({
    users: [],
    drills: [],
    scenarios: {},
    steps: {},
    executionData: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      body { font-family: 'Inter', sans-serif; }
      .prose-invert {
        --tw-prose-body: #C5D2D8;
        --tw-prose-headings: #fff;
        --tw-prose-bold: #fff;
        --tw-prose-bullets: #C5D2D8;
      }
      @keyframes wiggle {
        0%, 100% { transform: rotate(-0.5deg); }
        50% { transform: rotate(0.5deg); }
      }
      .wiggle-on-drag:active {
        animation: wiggle 0.2s linear infinite;
        cursor: grabbing !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
        if(document.head.contains(link)) document.head.removeChild(link);
        if(document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  // Fetch data from backend on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDb(data);
      } catch (e) {
        console.error("Failed to fetch data:", e);
        setError("Không thể tải dữ liệu từ server. Vui lòng kiểm tra lại backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (activeScreen !== 'create-drill') {
        setEditingDrill(null);
    }
  }, [activeScreen]);

  const handleLogin = async (username, password) => {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            return false; // Login failed
        }
        const foundUser = await response.json();
        setUser(foundUser);
        setShowLogin(false);
        return true;
    } catch (e) {
        console.error("Login error:", e);
        return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveScreen('dashboard');
    setActiveDrill(null);
  };
  
  const handleExecuteDrill = (drill) => {
    setActiveDrill(drill);
    setActiveScreen('execution');
  };
  
  const handleViewReport = (drill) => {
    setActiveDrill(drill);
    setActiveScreen('report');
  };
  
  const handleEditDrill = (drill) => {
      setEditingDrill(drill);
      setActiveScreen('create-drill');
  };

  const handleCloneDrill = (drillToClone) => {
      const clonedDrill = {
          ...drillToClone,
          name: `${drillToClone.name} (Copy)`,
          execution_status: 'Scheduled',
          opened_at: null,
          closed_at: null,
          status: 'Draft',
      };
      delete clonedDrill.id; // Let the creation screen handle it as a new drill
      setEditingDrill(clonedDrill);
      setActiveScreen('create-drill');
  };

  const handleBackToDashboard = () => {
      setActiveDrill(null);
      setActiveScreen('dashboard');
  }

  const handleSetExecutionData = (updater) => {
    // In a real app, updates to execution data would also be API calls.
    // For now, we'll update the local state to keep the UI interactive.
    setDb(prevDb => {
        const newExecutionData = typeof updater === 'function' 
            ? updater(prevDb.executionData) 
            : updater;
        return { ...prevDb, executionData: newExecutionData };
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-[#1D2A2E] text-white">Đang tải dữ liệu...</div>;
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-screen bg-[#1D2A2E] text-yellow-400 p-8 text-center">{error}</div>;
  }

  if (!user) {
    return (
        <LanguageProvider>
            <PublicDashboard 
                drills={db.drills}
                scenarios={db.scenarios}
                steps={db.steps}
                executionData={db.executionData}
                onLoginRequest={() => setShowLogin(true)}
            />
            {showLogin && <LoginPage onLogin={handleLogin} onCancel={() => setShowLogin(false)} />}
        </LanguageProvider>
    );
  }

  const renderScreen = () => {
    switch(activeScreen) {
        case 'dashboard':
            return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} />;
        case 'execution':
            if (!activeDrill) return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} />;
            return <ExecutionScreen 
                user={user} 
                drill={activeDrill} 
                onBack={handleBackToDashboard} 
                scenarios={db.scenarios} 
                steps={db.steps}
                executionData={db.executionData}
                setExecutionData={handleSetExecutionData}
              />;
        case 'report':
            if (!activeDrill) return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} />;
            return <ReportScreen 
                drill={activeDrill} 
                onBack={handleBackToDashboard} 
                scenarios={db.scenarios} 
                steps={db.steps}
                executionData={db.executionData}
              />;
        case 'user-management':
             if (user.role !== 'ADMIN') return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} />;
            return <UserManagementScreen users={db.users} setUsers={(newUsers) => setDb({...db, users: newUsers})} />;
        case 'scenarios':
            return <ScenarioManagementScreen db={db} setDb={setDb} user={user} />;
        case 'create-drill':
             if (user.role !== 'ADMIN') return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios} onCreateDrill={() => setActiveScreen('create-drill')} />;
            return <CreateDrillScreen setActiveScreen={setActiveScreen} setDb={setDb} db={db} user={user} drillToEdit={editingDrill} onDoneEditing={() => setActiveScreen('dashboard')} />;
        default:
            return <DashboardScreen user={user} drills={db.drills} setDrills={(newDrills) => setDb({...db, drills: newDrills})} onExecuteDrill={handleExecuteDrill} onViewReport={handleViewReport} onEditDrill={handleEditDrill} onCloneDrill={handleCloneDrill} executionData={db.executionData} scenarios={db.scenarios}/>;
    }
  }

  return (
    <LanguageProvider>
        <AppLayout user={user} onLogout={handleLogout} activeScreen={activeScreen} setActiveScreen={setActiveScreen}>
        {renderScreen()}
        </AppLayout>
    </LanguageProvider>
  );
}

